import express from 'express';
import protect from '../middleware/auth.js';
import Enrollment from '../models/Enrollment.js';
import Course from '../models/Course.js';
import Assignment from '../models/Assignment.js';
import Quiz from '../models/Quiz.js';

const router = express.Router();

// ── GET /api/users/me ─────────────────────────────────────────────────────────
router.get('/me', protect, (req, res) => {
  res.json({ user: req.user });
});

// ── PATCH /api/users/me ───────────────────────────────────────────────────────
// Update display name or avatar
router.patch('/me', protect, async (req, res) => {
  try {
    const { name, avatar } = req.body;
    const user = req.user;

    if (name)   user.name   = name;
    if (avatar) user.avatar = avatar;

    await user.save();
    res.json({ user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── GET /api/users/deadlines ─────────────────────────────────────────────────
// Get all deadlines (assignments & quizzes) for the user's courses
router.get('/deadlines', protect, async (req, res) => {
  try {
    let courseIds = [];
    let courses = [];
    if (['lecturer', 'admin'].includes(req.user.role)) {
      courses = await Course.find({ lecturers: req.user._id });
      courseIds = courses.map(c => c._id);
    } else {
      const enrollments = await Enrollment.find({ user: req.user._id }).populate('course');
      courses = enrollments.map(e => e.course).filter(Boolean);
      courseIds = courses.map(c => c._id);
    }

    const courseMap = {};
    courses.forEach(c => {
      courseMap[c._id.toString()] = {
        code: c.code,
        title: c.title,
        color: c.color,
      };
    });

    // Query assignments and quizzes for these courses
    const [assignments, quizzes] = await Promise.all([
      Assignment.find({ courseId: { $in: courseIds } }),
      Quiz.find({ courseId: { $in: courseIds } }),
    ]);

    const deadlines = [];

    // Helper to calculate urgency
    const getUrgency = (type, dueDate) => {
      if (type === 'quiz') return 'high';
      if (!dueDate) return 'low';
      const hoursLeft = (new Date(dueDate) - new Date()) / (1000 * 60 * 60);
      if (hoursLeft <= 24) return 'high';
      if (hoursLeft <= 72) return 'medium';
      return 'low';
    };

    assignments.forEach(a => {
      const c = courseMap[a.courseId.toString()] || {};
      const due = a.closesAt || a.dueDate;
      deadlines.push({
        _id: a._id,
        title: a.title,
        type: 'assignment',
        opensAt: a.opensAt,
        closesAt: a.closesAt,
        dueDate: due,
        totalPoints: a.totalPoints,
        courseCode: c.code || '',
        courseTitle: c.title || '',
        courseColor: c.color || 'bg-blue-500',
        urgency: getUrgency('assignment', due),
      });
    });

    quizzes.forEach(q => {
      const c = courseMap[q.courseId.toString()] || {};
      const due = q.closesAt || q.dueDate;
      deadlines.push({
        _id: q._id,
        title: q.title,
        type: 'quiz',
        opensAt: q.opensAt,
        closesAt: q.closesAt,
        dueDate: due,
        courseCode: c.code || '',
        courseTitle: c.title || '',
        courseColor: c.color || 'bg-indigo-500',
        urgency: getUrgency('quiz', due),
      });
    });

    // Sort by dueDate ascending (earliest deadline first)
    deadlines.sort((a, b) => {
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return new Date(a.dueDate) - new Date(b.dueDate);
    });

    res.json({ deadlines });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
