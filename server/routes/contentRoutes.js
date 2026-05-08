import express from 'express';
import Course   from '../models/Course.js';
import Section  from '../models/Section.js';
import Resource from '../models/Resource.js';
import protect  from '../middleware/auth.js';
import upload   from '../middleware/upload.js';
import { getServerFetchUrl } from '../utils/fileAccess.js';

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

    // Build filename: "<resource title>.<original extension>"
    const basename = resource.fileUrl.split('?')[0].split(/[\\/]/).pop() ?? '';
    const ext      = basename.includes('.') ? basename.split('.').pop() : '';
    const safeName = resource.title + (ext ? `.${ext}` : '');

    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(safeName)}`);
    res.setHeader('Content-Type', resource.mimeType || 'application/octet-stream');

    if (resource.fileUrl.startsWith('http')) {
      // ── Cloudinary URL — fetch the secure_url directly (no signing needed) ───
      const fetchUrl = resource.fileUrl; // already the Cloudinary secure_url
      console.log(`[download] Fetching: ${fetchUrl}`);
      const upstream = await fetch(fetchUrl);
      if (!upstream.ok) {
        console.error(`[download] Cloudinary returned ${upstream.status} for ${fetchUrl}`);
        return res.status(502).json({ message: `Failed to fetch file (HTTP ${upstream.status})` });
      }
      const len = upstream.headers.get('content-length');
      if (len) res.setHeader('Content-Length', len);

      const { Readable } = await import('stream');
      Readable.fromWeb(upstream.body).pipe(res);


    } else {
      // ── Local filesystem path (CLOUDINARY_URL not set) ───────────────────
      const { createReadStream, existsSync, statSync } = await import('fs');

      if (!existsSync(resource.fileUrl)) {
        return res.status(404).json({
          message:
            'File not found on disk. Set CLOUDINARY_URL in your Render environment ' +
            'variables so files are stored persistently, then re-upload.',
        });
      }

      res.setHeader('Content-Length', statSync(resource.fileUrl).size);
      createReadStream(resource.fileUrl).pipe(res);
    }

  } catch (err) {
    console.error('Download proxy error:', err);
    if (!res.headersSent) res.status(500).json({ message: err.message });
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

      const { title, type, externalUrl, description, assignmentRef, quizRef } = req.body;
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
        resourceData.fileUrl      = req.file.path;     // Cloudinary URL or local path
        resourceData.filePublicId = req.file.filename; // Cloudinary public_id
        resourceData.mimeType     = req.file.mimetype;
      }

      const resource = await Resource.create(resourceData);
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
      const basename = resource.fileUrl.split('?')[0].split(/[\/\\]/).pop() ?? '';
      const ext      = basename.includes('.') ? basename.split('.').pop() : '';
      const filename = resource.title + (ext ? `.${ext}` : '');

      if (resource.fileUrl.startsWith('http')) {
        // Remote (Cloudinary) — fetch secure_url directly
        const upstream  = await fetch(resource.fileUrl);
        if (!upstream.ok) {
          console.warn(`ZIP: skipping "${filename}" — HTTP ${upstream.status}`);
          continue;
        }
        const { Readable } = await import('stream');
        archive.append(Readable.fromWeb(upstream.body), { name: filename });
      } else {
        // Local filesystem path
        const { existsSync } = await import('fs');
        if (!existsSync(resource.fileUrl)) {
          console.warn(`ZIP: skipping "${filename}" — file not found on disk`);
          continue;
        }
        archive.file(resource.fileUrl, { name: filename });
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
