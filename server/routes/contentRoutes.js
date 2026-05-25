import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import officeParser from 'officeparser';
import Course      from '../models/Course.js';
import Section     from '../models/Section.js';
import Resource    from '../models/Resource.js';
import Assignment  from '../models/Assignment.js';
import Quiz        from '../models/Quiz.js';
import protect     from '../middleware/auth.js';
import upload      from '../middleware/upload.js';
import { getServerFetchUrl, fetchResourceStream, fetchResourceBuffer } from '../utils/fileAccess.js';
import { notifyEnrolledStudents } from '../utils/notifyEnrolledStudents.js';

function isOfficeFile(mimeType, filename) {
  const m = mimeType?.toLowerCase() || '';
  const f = filename?.toLowerCase() || '';
  return m.includes('officedocument') || m.includes('ms-word') || m.includes('ms-powerpoint') || f.endsWith('.docx') || f.endsWith('.pptx');
}

const router = express.Router();

// ── Helper: check lecturer/admin rights for a course ─────────────────────────
async function canManageCourse(userId, userRole, courseCode) {
  if (userRole === 'admin') return true;
  if (userRole !== 'lecturer') return false;
  const course = await Course.findOne({ code: courseCode.toUpperCase() });
  return course?.lecturers?.some(id => id.equals(userId)) ?? false;
}

// ── GET /api/content/download/:resourceId  ────────────────────────────────────
// MUST be before /:courseCode to prevent Express treating "download" as a code.
// Handles both Cloudinary HTTP URLs and local filesystem paths (dev / no Cloudinary).
router.get('/download/:resourceId', async (req, res) => {
  try {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');

    const resource = await Resource.findById(req.params.resourceId);
    if (!resource || !resource.fileUrl) {
      return res.status(404).json({ message: 'Resource not found or has no file' });
    }

    console.log(`[download] Resource "${resource.title}" | fileUrl: ${resource.fileUrl} | publicId: ${resource.filePublicId || 'NONE'}`);

    // Build filename: "<resource title>.<original extension>"
    const basename = resource.fileUrl.split('?')[0].split(/[\\/]/).pop() ?? '';
    const ext      = basename.includes('.') ? basename.split('.').pop() : '';
    const safeName = resource.title + (ext ? `.${ext}` : '');

    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(safeName)}`);
    res.setHeader('Content-Type', resource.mimeType || 'application/octet-stream');

    const result = await fetchResourceStream(resource);

    if (result.size) res.setHeader('Content-Length', result.size);

    if (result.isWeb) {
      // Cloudinary response — web ReadableStream needs conversion
      const { Readable } = await import('stream');
      Readable.fromWeb(result.stream).pipe(res);
    } else {
      // Local fs.createReadStream
      result.stream.pipe(res);
    }

  } catch (err) {
    console.error('Download proxy error:', err);
    if (!res.headersSent) res.status(502).json({ message: err.message });
  }
});

// ── GET /api/content/debug/:resourceId  — diagnostic endpoint ─────────────────
// Tests all 3 download strategies and reports which ones succeed.
router.get('/debug/:resourceId', async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.resourceId);
    if (!resource) return res.status(404).json({ message: 'Not found' });

    const { getAllUrls } = await import('../utils/fileAccess.js');
    const urls = getAllUrls(resource);

    const info = {
      title: resource.title,
      mimeType: resource.mimeType,
      filePublicId: resource.filePublicId || 'NOT SET',
      strategies: {},
      recommendation: '',
    };

    // Test each strategy with HEAD request
    const strategies = [
      { key: 'directUrl',          label: 'Direct secure_url',       url: urls.directUrl },
      { key: 'signedDeliveryUrl',  label: 'Signed delivery URL',     url: urls.signedDeliveryUrl },
      { key: 'privateDownloadUrl', label: 'Private download URL',    url: urls.privateDownloadUrl },
    ];

    let workingCount = 0;
    for (const { key, label, url } of strategies) {
      if (!url) {
        info.strategies[key] = { url: null, status: 'N/A', note: 'No URL available (missing publicId?)' };
        continue;
      }
      try {
        const resp = await fetch(url, { method: 'HEAD' });
        const ok = resp.ok;
        if (ok) workingCount++;
        info.strategies[key] = {
          url: url.substring(0, 120) + (url.length > 120 ? '…' : ''),
          status: resp.status,
          ok,
          label,
        };
      } catch (e) {
        info.strategies[key] = { url: url.substring(0, 120), status: 'ERROR', error: e.message, label };
      }
    }

    if (workingCount > 0) {
      info.recommendation = `✅ ${workingCount}/3 strategies work. Downloads should succeed.`;
    } else {
      info.recommendation =
        '❌ NO strategies work. Possible causes:\n' +
        '1. CLOUDINARY_URL env var missing or wrong on Render\n' +
        '2. Cloudinary Settings → Security → "Restricted media types" includes this file type\n' +
        '3. The file was deleted from Cloudinary\n' +
        '4. Free-tier Cloudinary blocks raw file delivery — try upgrading or re-uploading as image';
    }

    res.json(info);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── GET /api/content/:courseCode  — public ────────────────────────────────────
router.get('/:courseCode', async (req, res) => {
  try {
    const course = await Course.findOne({ code: req.params.courseCode.toUpperCase() });
    if (!course) return res.status(404).json({ message: 'Course not found' });

    const sections = await Section.find({ courseId: course._id }).sort({ order: 1 });

    const sectionsWithResources = await Promise.all(
      sections.map(async (sec) => {
        const resources = await Resource.find({ sectionId: sec._id })
          .sort({ order: 1 })
          .populate('uploadedBy', 'name')
          .populate('assignmentRef', 'title dueDate totalPoints opensAt closesAt description')
          .populate('quizRef', 'title dueDate durationMinutes opensAt closesAt');
        return { ...sec.toObject(), resources };
      })
    );

    res.json({ sections: sectionsWithResources });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── POST /api/content/:courseCode/sections  — lecturer/admin only ─────────────
router.post('/:courseCode/sections', protect, async (req, res) => {
  try {
    const course = await Course.findOne({ code: req.params.courseCode.toUpperCase() });
    if (!course) return res.status(404).json({ message: 'Course not found' });

    const allowed = await canManageCourse(req.user._id, req.user.role, req.params.courseCode);
    if (!allowed) return res.status(403).json({ message: 'Not authorised' });

    const { title, type } = req.body;
    const count   = await Section.countDocuments({ courseId: course._id });
    const section = await Section.create({ courseId: course._id, title, type: type || 'week', order: count });

    res.status(201).json({ section });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── POST /api/content/sections/:sectionId/resources  — lecturer/admin only ────
router.post('/sections/:sectionId/resources',
  protect,
  (req, res, next) => {
    upload.fields([
      { name: 'file', maxCount: 1 },
      { name: 'quizFiles', maxCount: 10 }
    ])(req, res, (err) => {
      if (err) return res.status(400).json({ message: err.message || 'File upload failed' });
      next();
    });
  },
  async (req, res) => {
    try {
      const section = await Section.findById(req.params.sectionId).populate('courseId');
      if (!section) return res.status(404).json({ message: 'Section not found' });

      const allowed = await canManageCourse(req.user._id, req.user.role, section.courseId.code);
      if (!allowed) return res.status(403).json({ message: 'Not authorised' });

      const { title, type, externalUrl, description, assignmentRef, quizRef, opensAt, closesAt, totalPoints, generateAI, questionCount, durationMinutes } = req.body;
      const count = await Resource.countDocuments({ sectionId: section._id });

      const resourceData = {
        sectionId:     section._id,
        courseId:      section.courseId._id,
        title,
        type,
        externalUrl:   externalUrl   || undefined,
        description:   description   || undefined,
        assignmentRef: assignmentRef || undefined,
        quizRef:       quizRef       || undefined,
        uploadedBy:    req.user._id,
        order:         count,
      };

      const file = req.files?.['file']?.[0] || null;
      if (file) {
        resourceData.fileUrl      = file.path;
        resourceData.filePublicId = file.filename;
        resourceData.mimeType     = file.mimetype;
      }

      // Auto-create Assignment/Quiz document if type matches and no ref provided
      if (type === 'assignment' && !assignmentRef) {
        const assignment = await Assignment.create({
          courseId: section.courseId._id,
          title,
          description: description || '',
          dueDate: closesAt || undefined,
          opensAt: opensAt || undefined,
          closesAt: closesAt || undefined,
          totalPoints: totalPoints || 100,
          createdBy: req.user._id,
        });
        resourceData.assignmentRef = assignment._id;
      }

      if (type === 'quiz' && !quizRef) {
        let questions = [];
        const quizFiles = req.files?.['quizFiles'];
        
        if (generateAI === 'true' && quizFiles?.length) {
          const apiKey = process.env.GEMINI_API_KEY;
          if (!apiKey) {
            return res.status(503).json({ message: 'AI service not configured — add GEMINI_API_KEY to server/.env' });
          }

          // Extract content from all uploaded files
          const fileParts = [];
          for (const quizFile of quizFiles) {
            const mimeType = quizFile.mimetype || 'application/pdf';
            const isOffice = isOfficeFile(mimeType, quizFile.originalname);
            
            const { readFile } = await import('fs/promises');
            const { existsSync } = await import('fs');
            let buffer;
            if (quizFile.path.startsWith('http')) {
              const resp = await fetch(quizFile.path);
              if (!resp.ok) throw new Error(`Failed to fetch Cloudinary file: ${resp.statusText}`);
              buffer = Buffer.from(await resp.arrayBuffer());
            } else {
              if (!existsSync(quizFile.path)) throw new Error(`File not found: ${quizFile.path}`);
              buffer = await readFile(quizFile.path);
            }

            if (isOffice) {
              try {
                const ast = await officeParser.parseOffice(buffer);
                const textContent = ast.toText();
                fileParts.push({ text: `Study material document (name: "${quizFile.originalname}") text content:\n---\n${textContent}\n---\n` });
              } catch (parseErr) {
                console.warn(`[generate-quiz] Failed to parse Office file ${quizFile.originalname}:`, parseErr.message);
              }
            } else {
              fileParts.push({ inlineData: { mimeType, data: buffer.toString('base64') } });
            }
          }

          if (fileParts.length > 0) {
            const genAI = new GoogleGenerativeAI(apiKey);
            const model = genAI.getGenerativeModel({ model: 'gemini-flash-latest' });

            const qCount = Math.min(20, Math.max(3, parseInt(questionCount) || 8));
            const mcqCount = Math.max(1, Math.round(qCount * 0.6));
            const saCount = qCount - mcqCount;

            const prompt = `You are a helpful academic assistant. Based on the uploaded study materials, generate a comprehensive quiz for students.
The quiz should contain EXACTLY ${qCount} questions:
- ${mcqCount} multiple-choice questions (type: "mcq")
- ${saCount} short-answer questions (type: "short_answer")

For MCQ questions:
- Provide 4 options (A, B, C, D) in the "options" array.
- The "correctAnswer" should be the exact text of the correct choice.
- "type" must be "mcq".

For short_answer questions:
- The "options" array must be empty.
- The "correctAnswer" should be a detailed, high-quality reference answer/criteria that the grading model will use to evaluate student submissions.
- "type" must be "short_answer".

All questions must include:
- "text": The question prompt/text.
- "points": Point value for this question (default 5 for mcq, 10 for short_answer).
- "explanation": A brief explanation of what makes a good answer.

Return ONLY a valid JSON array — no explanation, no markdown code fences, just the raw JSON array. Format matching this schema:
[
  {
    "text": "...",
    "type": "mcq",
    "options": ["...", "...", "...", "..."],
    "correctAnswer": "...",
    "points": 5,
    "explanation": "..."
  },
  {
    "text": "...",
    "type": "short_answer",
    "options": [],
    "correctAnswer": "...",
    "points": 10,
    "explanation": "..."
  }
]
Generate EXACTLY ${qCount} questions.`;

            const result = await model.generateContent([...fileParts, prompt]);
            const text = result.response.text();
            
            try {
              const clean = text.replace(/```json|```/g, '').trim();
              questions = JSON.parse(clean);
            } catch (err) {
              console.error('Failed to parse AI quiz generation JSON:', text);
              throw new Error('AI generated quiz in invalid format. Please try again.');
            }
          }
        }

        const showCorrectAnswers = req.body.showCorrectAnswers !== 'false';
        const quiz = await Quiz.create({
          courseId: section.courseId._id,
          title,
          description: description || '',
          dueDate: closesAt || undefined,
          opensAt: opensAt || undefined,
          closesAt: closesAt || undefined,
          durationMinutes: parseInt(durationMinutes) || 20,
          showCorrectAnswers,
          questions,
          createdBy: req.user._id,
        });
        resourceData.quizRef = quiz._id;
      }

      const resource = await Resource.create(resourceData);

      // ── Notify enrolled students ──────────────────────────────────────────
      const notifType = ['announcement', 'assignment', 'quiz'].includes(type) ? type : 'resource';
      const notifDueDate = (type === 'assignment' || type === 'quiz') ? (closesAt || req.body.dueDate) : null;
      notifyEnrolledStudents({
        courseId:   section.courseId._id,
        courseCode: section.courseId.code,
        courseName: section.courseId.title,
        type:       notifType,
        title:      notifType === 'announcement'
          ? `New announcement: ${title} from ${section.courseId.code}`
          : `New ${type}: ${title} from ${section.courseId.code}`,
        body:       description || '',
        resourceId: resource._id,
        dueDate:    notifDueDate || undefined,
      });

      res.status(201).json({ resource });
    } catch (err) {
      console.error('Resource creation error:', err);
      res.status(500).json({ message: err.message });
    }
  }
);

// ── DELETE /api/content/sections/:sectionId  — lecturer/admin only ────────────
router.delete('/sections/:sectionId', protect, async (req, res) => {
  try {
    const section = await Section.findById(req.params.sectionId).populate('courseId');
    if (!section) return res.status(404).json({ message: 'Section not found' });

    const allowed = await canManageCourse(req.user._id, req.user.role, section.courseId.code);
    if (!allowed) return res.status(403).json({ message: 'Not authorised' });

    await Resource.deleteMany({ sectionId: section._id });
    await section.deleteOne();
    res.json({ message: 'Section deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── DELETE /api/content/resources/:resourceId  — lecturer/admin only ──────────
router.delete('/resources/:resourceId', protect, async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.resourceId).populate({
      path: 'sectionId',
      populate: { path: 'courseId' },
    });
    if (!resource) return res.status(404).json({ message: 'Resource not found' });

    const allowed = await canManageCourse(req.user._id, req.user.role, resource.sectionId.courseId.code);
    if (!allowed) return res.status(403).json({ message: 'Not authorised' });

    await resource.deleteOne();
    res.json({ message: 'Resource deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── POST /api/content/download-zip  — public, CORS wildcard ─────────────────
// Accepts { resourceIds: [id, id, ...] }, creates a ZIP archive on the fly,
// and streams it to the browser as a single file download.
// Using a server-side ZIP avoids ALL browser multi-download restrictions
// (popup blockers, Chrome cross-origin iframe download policy, etc.)
router.post('/download-zip', async (req, res) => {
  try {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    const { resourceIds } = req.body;
    if (!Array.isArray(resourceIds) || resourceIds.length === 0) {
      return res.status(400).json({ message: 'Provide a non-empty resourceIds array' });
    }

    const resources = await Resource.find({ _id: { $in: resourceIds } });
    if (!resources.length) {
      return res.status(404).json({ message: 'No matching resources found' });
    }

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', 'attachment; filename="course-materials.zip"');

    const archiver = (await import('archiver')).default;
    const archive  = archiver('zip', { zlib: { level: 6 } });
    archive.pipe(res);

    for (const resource of resources) {
      if (!resource.fileUrl) continue;

      // Build filename: "<title>.<ext>"
      const basename = resource.fileUrl.split('?')[0].split(/[\\/\\]/).pop() ?? '';
      const ext      = basename.includes('.') ? basename.split('.').pop() : '';
      const filename = resource.title + (ext ? `.${ext}` : '');

      try {
        const result = await fetchResourceStream(resource);
        if (result.isWeb) {
          const { Readable } = await import('stream');
          archive.append(Readable.fromWeb(result.stream), { name: filename });
        } else {
          archive.append(result.stream, { name: filename });
        }
      } catch (fetchErr) {
        console.warn(`ZIP: skipping "${filename}" — ${fetchErr.message}`);
        continue;
      }
    }

    await archive.finalize();
  } catch (err) {
    console.error('ZIP download error:', err);
    if (!res.headersSent) res.status(500).json({ message: err.message });
  }
});

// Handle CORS preflight for the ZIP endpoint
router.options('/download-zip', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.sendStatus(204);
});

export default router;
