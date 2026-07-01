import express from 'express';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import Course from '../models/Course.js';
import Enrollment from '../models/Enrollment.js';
import Submission from '../models/Submission.js';
import QuizAttempt from '../models/QuizAttempt.js';
import protect from '../middleware/auth.js';
import { logAudit } from '../middleware/auditLogger.js';

const router = express.Router();

// Middleware to ensure user is admin
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied: Admin privileges required' });
  }
  next();
};

router.use(protect, requireAdmin);

// ── GET /api/admin/stats ──────────────────────────────────────────────────────
router.get('/stats', async (req, res) => {
  try {
    const [totalUsers, students, lecturers, admins, courses, enrollments] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'student' }),
      User.countDocuments({ role: 'lecturer' }),
      User.countDocuments({ role: 'admin' }),
      Course.countDocuments(),
      Enrollment.countDocuments(),
    ]);

    res.json({
      stats: { totalUsers, students, lecturers, admins, courses, enrollments }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── GET /api/admin/users ──────────────────────────────────────────────────────
router.get('/users', async (req, res) => {
  try {
    const users = await User.find().select('-password').lean();
    
    // Attach course context
    const enrollments = await Enrollment.find().populate('course', 'code title').lean();
    const courses = await Course.find().lean();

    const usersWithContext = users.map(user => {
      let activeCourses = [];
      if (user.role === 'student') {
        activeCourses = enrollments
          .filter(e => e.user.toString() === user._id.toString() && e.course)
          .map(e => e.course);
      } else if (user.role === 'lecturer') {
        activeCourses = courses
          .filter(c => c.lecturers.some(l => l.toString() === user._id.toString()))
          .map(c => ({ _id: c._id, code: c.code, title: c.title }));
      }
      return { ...user, activeCourses };
    });

    res.json({ users: usersWithContext });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── POST /api/admin/users ─────────────────────────────────────────────────────
router.post('/users', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    
    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already in use' });
    }

    const newUser = await User.create({ name, email, password, role });
    const userResponse = newUser.toObject();
    delete userResponse.password;

    await logAudit({ action: 'USER_CREATE', req, target: 'User', targetId: newUser._id, details: `Admin created user: ${email} (${role})` });
    
    res.status(201).json({ user: userResponse });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── PUT /api/admin/users/:id ──────────────────────────────────────────────────
router.put('/users/:id', async (req, res) => {
  try {
    const { name, email, role, activeCourses, password } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Update user info
    user.name = name || user.name;
    user.email = email || user.email;
    if (password) {
      user.password = password;
    }
    
    // Changing roles is complicated because of related data, but we can allow it if needed,
    // though for safety we might just update course associations based on their current role.
    const oldRole = user.role;
    user.role = role || user.role;
    await user.save();

    // Log role change specifically
    if (oldRole !== user.role) {
      await logAudit({ action: 'ROLE_CHANGE', req, target: 'User', targetId: user._id, details: `Role changed from ${oldRole} to ${user.role} for ${user.email}` });
    }
    await logAudit({ action: 'USER_UPDATE', req, target: 'User', targetId: user._id, details: `Admin updated user: ${user.email}` });

    // Update course associations
    if (activeCourses && Array.isArray(activeCourses)) {
      if (user.role === 'student') {
        // Sync enrollments
        await Enrollment.deleteMany({ user: user._id });
        const enrollments = activeCourses.map(courseId => ({
          user: user._id,
          course: courseId
        }));
        if (enrollments.length > 0) {
          await Enrollment.insertMany(enrollments);
        }
      } else if (user.role === 'lecturer') {
        // Sync course lecturer assignments
        // Remove from all courses first
        await Course.updateMany(
          { lecturers: user._id },
          { $pull: { lecturers: user._id } }
        );
        // Add to selected courses
        if (activeCourses.length > 0) {
          await Course.updateMany(
            { _id: { $in: activeCourses } },
            { $addToSet: { lecturers: user._id } }
          );
        }
      }
    }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── DELETE /api/admin/users/:id ───────────────────────────────────────────────
router.delete('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    if (user.role === 'admin' && user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'You cannot delete yourself' });
    }

    // Clean up related data if student
    if (user.role === 'student') {
      await Promise.all([
        Enrollment.deleteMany({ user: user._id }),
        Submission.deleteMany({ studentId: user._id }),
        QuizAttempt.deleteMany({ studentId: user._id })
      ]);
    } else if (user.role === 'lecturer') {
      // Remove from courses
      await Course.updateMany(
        { lecturers: user._id },
        { $pull: { lecturers: user._id } }
      );
    }

    await User.findByIdAndDelete(user._id);

    await logAudit({ action: 'USER_DELETE', req, target: 'User', targetId: user._id, details: `Admin deleted user: ${user.email} (${user.role})` });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── GET /api/admin/courses ────────────────────────────────────────────────────
router.get('/courses', async (req, res) => {
  try {
    const courses = await Course.find().populate('lecturers', 'name email').lean();
    res.json({ courses });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── POST /api/admin/courses ───────────────────────────────────────────────────
router.post('/courses', async (req, res) => {
  try {
    const { code, title, dept, year, credits, description, color, lecturers } = req.body;
    
    const existing = await Course.findOne({ code: code.toUpperCase() });
    if (existing) {
      return res.status(400).json({ message: 'Course code already exists' });
    }

    const course = await Course.create({
      code, title, dept, year, credits, description, color, lecturers: lecturers || []
    });

    const populated = await Course.findById(course._id).populate('lecturers', 'name email').lean();

    await logAudit({ action: 'COURSE_CREATE', req, target: 'Course', targetId: course._id, details: `Admin created course: ${code}` });

    res.status(201).json({ course: populated });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── PUT /api/admin/courses/:id ────────────────────────────────────────────────
router.put('/courses/:id', async (req, res) => {
  try {
    const course = await Course.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
      .populate('lecturers', 'name email').lean();
    if (!course) return res.status(404).json({ message: 'Course not found' });

    await logAudit({ action: 'COURSE_UPDATE', req, target: 'Course', targetId: course._id, details: `Admin updated course: ${course.code}` });
    
    res.json({ course });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── DELETE /api/admin/courses/:id ─────────────────────────────────────────────
router.delete('/courses/:id', async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: 'Course not found' });

    // Clean up enrollments
    await Enrollment.deleteMany({ course: course._id });
    // Note: We'd normally also delete Resources, Quizzes, Assignments here
    
    await Course.findByIdAndDelete(course._id);

    await logAudit({ action: 'COURSE_DELETE', req, target: 'Course', targetId: course._id, details: `Admin deleted course: ${course.code}` });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
