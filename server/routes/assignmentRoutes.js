import express    from 'express';
import Assignment  from '../models/Assignment.js';
import Course      from '../models/Course.js';
import Submission  from '../models/Submission.js';
import Enrollment  from '../models/Enrollment.js';
import protect     from '../middleware/auth.js';
import { notifyEnrolledStudents } from '../utils/notifyEnrolledStudents.js';

const router = express.Router();

// ── GET /api/assignments/:id ──────────────────────────────────────────────────
// Enrolled students and course lecturers/admin can view
router.get('/:id', protect, async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id)
      .populate('courseId', 'code title color')
      .populate('createdBy', 'name');
    if (!assignment) return res.status(404).json({ message: 'Assignment not found' });

    // Check enrollment (students) or role (lecturer/admin)
    if (req.user.role === 'student') {
      const enrolled = await Enrollment.findOne({
        student: req.user._id, course: assignment.courseId._id,
      });
      if (!enrolled) return res.status(403).json({ message: 'Enroll in this course first' });
    }

    // Attach student's own submission if any
    const submission = await Submission.findOne({
      assignmentId: assignment._id, studentId: req.user._id,
    });

    res.json({ assignment, submission: submission || null });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── POST /api/assignments ─────────────────────────────────────────────────────
// Lecturer/admin only
router.post('/', protect, async (req, res) => {
  try {
    if (!['lecturer', 'admin'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Not authorised' });
    }
    const { courseCode, title, description, dueDate, totalPoints, opensAt, closesAt } = req.body;
    const course = await Course.findOne({ code: courseCode?.toUpperCase() });
    if (!course) return res.status(404).json({ message: 'Course not found' });

    const assignment = await Assignment.create({
      courseId: course._id, title, description, dueDate, totalPoints,
      opensAt: opensAt || undefined, closesAt: closesAt || undefined,
      createdBy: req.user._id,
    });

    // Notify enrolled students
    notifyEnrolledStudents({
      courseId:   course._id,
      courseCode: course.code,
      courseName: course.name,
      type:       'assignment',
      title:      `New assignment: ${title}`,
      body:       dueDate ? `Due: ${new Date(dueDate).toLocaleDateString()}` : '',
      dueDate:    closesAt || dueDate || undefined,
    });

    res.status(201).json({ assignment });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── GET /api/assignments/:id/submissions  — lecturer/admin ────────────────────
router.get('/:id/submissions', protect, async (req, res) => {
  try {
    if (!['lecturer', 'admin'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Not authorised' });
    }
    const submissions = await Submission.find({ assignmentId: req.params.id })
      .populate('studentId', 'name email');
    res.json({ submissions });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── PATCH /api/assignments/:id/submissions/:subId  — grade ───────────────────
router.patch('/:id/submissions/:subId', protect, async (req, res) => {
  try {
    if (!['lecturer', 'admin'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Not authorised' });
    }
    const submission = await Submission.findByIdAndUpdate(
      req.params.subId,
      { grade: req.body.grade, feedback: req.body.feedback, gradedBy: req.user._id },
      { new: true }
    );
    res.json({ submission });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
