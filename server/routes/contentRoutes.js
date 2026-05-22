import express from 'express';
import Course      from '../models/Course.js';
import Section     from '../models/Section.js';
import Resource    from '../models/Resource.js';
import Assignment  from '../models/Assignment.js';
import Quiz        from '../models/Quiz.js';
import protect     from '../middleware/auth.js';
import upload      from '../middleware/upload.js';
import { getServerFetchUrl, fetchResourceStream } from '../utils/fileAccess.js';
import { notifyEnrolledStudents } from '../utils/notifyEnrolledStudents.js';

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
          .populate('assignmentRef', 'title dueDate totalPoints')
          .populate('quizRef', 'title dueDate durationMinutes');
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
    upload.single('file')(req, res, (err) => {
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

      const { title, type, externalUrl, description, assignmentRef, quizRef, opensAt, closesAt } = req.body;
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

      if (req.file) {
        resourceData.fileUrl      = req.file.path;
        resourceData.filePublicId = req.file.filename;
        resourceData.mimeType     = req.file.mimetype;
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
          createdBy: req.user._id,
        });
        resourceData.assignmentRef = assignment._id;
      }

      if (type === 'quiz' && !quizRef) {
        const quiz = await Quiz.create({
          courseId: section.courseId._id,
          title,
          description: description || '',
          dueDate: closesAt || undefined,
          opensAt: opensAt || undefined,
          closesAt: closesAt || undefined,
          questions: [],
          createdBy: req.user._id,
        });
        resourceData.quizRef = quiz._id;
      }

      const resource = await Resource.create(resourceData);

      // ── Notify enrolled students ──────────────────────────────────────────
      const notifType = type === 'announcement' ? 'announcement' : 'resource';
      notifyEnrolledStudents({
        courseId:   section.courseId._id,
        courseCode: section.courseId.code,
        courseName: section.courseId.name,
        type:       notifType,
        title:      notifType === 'announcement'
          ? `New announcement: ${title}`
          : `New ${type}: ${title}`,
        body:       description || '',
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
