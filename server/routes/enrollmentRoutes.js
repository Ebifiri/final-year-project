import express from 'express';
import Enrollment from '../models/Enrollment.js';
import Course from '../models/Course.js';
import protect from '../middleware/auth.js';

const router = express.Router();

// ── GET /api/enrollments ──────────────────────────────────────────────────────
// Returns current user's enrollments, with course details populated
router.get('/', protect, async (req, res) => {
  try {
    const enrollments = await Enrollment.find({ user: req.user._id })
      .populate('course')
      .sort({ lastAccessed: -1 });

    res.json({ enrollments });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── POST /api/enrollments ─────────────────────────────────────────────────────
// Enroll the current user in a course by course code
router.post('/', protect, async (req, res) => {
  try {
    const { courseCode } = req.body;

    if (!courseCode) {
      return res.status(400).json({ message: 'courseCode is required' });
    }

    // Look up the course
    const course = await Course.findOne({ code: courseCode.toUpperCase() });
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Check if already enrolled
    const existing = await Enrollment.findOne({
      user:   req.user._id,
      course: course._id,
    });
    if (existing) {
      return res.status(409).json({ message: 'Already enrolled in this course' });
    }

    const enrollment = await Enrollment.create({
      user:   req.user._id,
      course: course._id,
    });

    // Return with course details populated
    await enrollment.populate('course');

    res.status(201).json({ enrollment });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── PATCH /api/enrollments/:id ────────────────────────────────────────────────
// Update progress and lastAccessed timestamp
router.patch('/:id', protect, async (req, res) => {
  try {
    const { progress } = req.body;

    const enrollment = await Enrollment.findOne({
      _id:  req.params.id,
      user: req.user._id,         // ensure ownership
    });

    if (!enrollment) {
      return res.status(404).json({ message: 'Enrollment not found' });
    }

    if (progress !== undefined) {
      enrollment.progress = Math.min(100, Math.max(0, progress));
    }
    enrollment.lastAccessed = new Date();
    await enrollment.save();

    await enrollment.populate('course');
    res.json({ enrollment });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── DELETE /api/enrollments/:id ───────────────────────────────────────────────
// Unenroll — removes the enrollment record entirely
router.delete('/:id', protect, async (req, res) => {
  try {
    const enrollment = await Enrollment.findOne({
      _id:  req.params.id,
      user: req.user._id,         // ensure ownership — users can only unenroll themselves
    });

    if (!enrollment) {
      return res.status(404).json({ message: 'Enrollment not found' });
    }

    await enrollment.deleteOne();
    res.json({ message: 'Successfully unenrolled from course' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
