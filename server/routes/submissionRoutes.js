import express    from 'express';
import Submission  from '../models/Submission.js';
import Assignment  from '../models/Assignment.js';
import Enrollment  from '../models/Enrollment.js';
import protect     from '../middleware/auth.js';
import upload      from '../middleware/upload.js';

const router = express.Router();

// ── POST /api/submissions  — student submits files ────────────────────────────
router.post('/', protect, upload.array('files', 20), async (req, res) => {
  try {
    const { assignmentId } = req.body;
    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) return res.status(404).json({ message: 'Assignment not found' });

    // Verify enrollment
    const enrolled = await Enrollment.findOne({
      student: req.user._id, course: assignment.courseId,
    });
    if (!enrolled && req.user.role === 'student') {
      return res.status(403).json({ message: 'Enroll in this course first' });
    }

    // Check if already submitted → update instead of create
    const files = (req.files || []).map(f => ({
      name:     f.originalname,
      url:      f.path,         // Cloudinary URL (or local path in dev)
      publicId: f.filename,
      size:     f.size,
    }));

    const existing = await Submission.findOne({
      assignmentId, studentId: req.user._id,
    });

    let submission;
    if (existing) {
      existing.files = [...existing.files, ...files];
      submission = await existing.save();
    } else {
      submission = await Submission.create({
        assignmentId, studentId: req.user._id, files,
      });
    }

    res.status(201).json({ submission });
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
