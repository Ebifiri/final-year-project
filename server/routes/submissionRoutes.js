import express    from 'express';
import Submission  from '../models/Submission.js';
import Assignment  from '../models/Assignment.js';
import Enrollment  from '../models/Enrollment.js';
import protect     from '../middleware/auth.js';
import upload      from '../middleware/upload.js';
import { logAudit } from '../middleware/auditLogger.js';

const router = express.Router();

// ── POST /api/submissions  — student submits files ────────────────────────────
router.post('/', protect, upload.array('files', 20), async (req, res) => {
  try {
    const { assignmentId } = req.body;
    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) return res.status(404).json({ message: 'Assignment not found' });

    // Check portal open/close dates
    const now = new Date();
    if (assignment.opensAt && now < new Date(assignment.opensAt)) {
      return res.status(403).json({ message: 'Submissions not open yet' });
    }
    if (assignment.closesAt && now > new Date(assignment.closesAt)) {
      return res.status(403).json({ message: 'Submissions are closed' });
    }

    // Verify enrollment
    const enrolled = await Enrollment.findOne({
      user: req.user._id, course: assignment.courseId,
    });
    if (!enrolled && req.user.role === 'student') {
      return res.status(403).json({ message: 'Enroll in this course first' });
    }

    // Parse files to keep (if any)
    let keptFiles = [];
    if (req.body.keepFiles) {
      try {
        keptFiles = JSON.parse(req.body.keepFiles);
      } catch (e) {
        if (typeof req.body.keepFiles === 'string') {
          try {
            keptFiles = [JSON.parse(req.body.keepFiles)];
          } catch (_) {}
        }
      }
    }

    const files = (req.files || []).map(f => ({
      name:     f.originalname,
      url:      f.path,         // Cloudinary URL (or local path in dev)
      publicId: f.filename,
      size:     f.size,
    }));

    const existing = await Submission.findOne({
      assignmentId, studentId: req.user._id,
    });

    const allFiles = [...keptFiles, ...files];

    if (allFiles.length === 0) {
      if (existing) {
        await existing.deleteOne();
        return res.status(200).json({ message: 'Submission removed successfully', submission: null });
      } else {
        return res.status(400).json({ message: 'Please attach at least one file to submit' });
      }
    }

    let submission;
    if (existing) {
      existing.files = allFiles;
      existing.grade = null;  // Reset grade on re-submission
      existing.feedback = '';
      submission = await existing.save();
    } else {
      submission = await Submission.create({
        assignmentId, studentId: req.user._id, files: allFiles,
      });
    }

    await logAudit({
      action: 'ASSIGNMENT_SUBMIT', req, target: 'Submission', targetId: submission._id,
      details: `Student submitted ${allFiles.length} file(s) for assignment: ${assignment.title}`,
    });

    res.status(201).json({ submission });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── GET /api/submissions/assignment/:assignmentId/mine  — student's submission ─
router.get('/assignment/:assignmentId/mine', protect, async (req, res) => {
  try {
    const submission = await Submission.findOne({
      assignmentId: req.params.assignmentId, studentId: req.user._id,
    });
    res.json({ submission: submission || null });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── GET /api/submissions?assignmentId=X  — own submission ─────────────────────
router.get('/', protect, async (req, res) => {
  try {
    const { assignmentId } = req.query;
    const submission = await Submission.findOne({
      assignmentId, studentId: req.user._id,
    });
    res.json({ submission: submission || null });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
