import express from 'express';
import Course   from '../models/Course.js';
import Section  from '../models/Section.js';
import Resource from '../models/Resource.js';
import protect  from '../middleware/auth.js';
import upload   from '../middleware/upload.js';

const router = express.Router();

// ── Helper: check lecturer/admin rights for a course ─────────────────────────
async function canManageCourse(userId, userRole, courseCode) {
  if (userRole === 'admin') return true;
  if (userRole !== 'lecturer') return false;
  const course = await Course.findOne({ code: courseCode.toUpperCase() });
  return course?.lecturers?.some(id => id.equals(userId)) ?? false;
}

// ── GET /api/content/:courseCode  — public ────────────────────────────────────
// Returns all sections with their resources, sorted by order
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
    const count  = await Section.countDocuments({ courseId: course._id });
    const section = await Section.create({ courseId: course._id, title, type: type || 'week', order: count });

    res.status(201).json({ section });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── POST /api/content/sections/:sectionId/resources  — lecturer/admin only ────
router.post('/sections/:sectionId/resources',
  protect,
  // Run multer manually so upload errors surface as JSON responses
  (req, res, next) => {
    upload.single('file')(req, res, (err) => {
      if (err) {
        return res.status(400).json({ message: err.message || 'File upload failed' });
      }
      next();
    });
  },
  async (req, res) => {
    try {
      const section = await Section.findById(req.params.sectionId).populate('courseId');
      if (!section) return res.status(404).json({ message: 'Section not found' });

      const allowed = await canManageCourse(req.user._id, req.user.role, section.courseId.code);
      if (!allowed) return res.status(403).json({ message: 'Not authorised' });

      const { title, type, externalUrl, assignmentRef, quizRef } = req.body;
      const count = await Resource.countDocuments({ sectionId: section._id });

      const resourceData = {
        sectionId:  section._id,
        courseId:   section.courseId._id,
        title,
        type,
        externalUrl:   externalUrl   || undefined,
        assignmentRef: assignmentRef || undefined,
        quizRef:       quizRef       || undefined,
        uploadedBy:    req.user._id,
        order:         count,
      };

      if (req.file) {
        resourceData.fileUrl      = req.file.path;      // Cloudinary secure URL
        resourceData.filePublicId = req.file.filename;  // Cloudinary public_id
        resourceData.mimeType     = req.file.mimetype;  // e.g. application/vnd.ms-powerpoint
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

    // Remove all resources in this section first
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

// ── GET /api/content/download/:resourceId  — proxy file download ──────────────
// Fetches the file from Cloudinary and streams it to the browser with a proper
// Content-Disposition: attachment header, avoiding the fl_attachment
// transformation which corrupts binary files (pptx, docx, xlsx, etc.)
router.get('/download/:resourceId', protect, async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.resourceId);
    if (!resource || !resource.fileUrl) {
      return res.status(404).json({ message: 'Resource not found or has no file' });
    }

    // Fetch the raw file from its storage URL (Cloudinary or local)
    const upstream = await fetch(resource.fileUrl);
    if (!upstream.ok) {
      return res.status(502).json({ message: 'Failed to fetch file from storage' });
    }

    // Derive a clean filename
    const urlFilename = resource.fileUrl.split('?')[0].split('/').pop() ?? '';
    const filename    = urlFilename || `${resource.title}`;

    // Set download headers
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`);
    res.setHeader('Content-Type', resource.mimeType || upstream.headers.get('content-type') || 'application/octet-stream');
    const contentLength = upstream.headers.get('content-length');
    if (contentLength) res.setHeader('Content-Length', contentLength);

    // Stream the file body — no modification to the binary
    const { Readable } = await import('stream');
    Readable.fromWeb(upstream.body).pipe(res);

  } catch (err) {
    console.error('Download proxy error:', err);
    res.status(500).json({ message: err.message });
  }
});

export default router;
