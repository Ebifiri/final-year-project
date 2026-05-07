import express from 'express';
import Course from '../models/Course.js';
import protect from '../middleware/auth.js';

const router = express.Router();

// ── GET /api/courses ──────────────────────────────────────────────────────────
// Supports ?search=, ?dept=, ?year= query params
router.get('/', protect, async (req, res) => {
  try {
    const { search, dept, year } = req.query;
    const filter = {};

    if (dept)   filter.dept = { $regex: dept,   $options: 'i' };
    if (year)   filter.year = { $regex: year,   $options: 'i' };
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { code:  { $regex: search, $options: 'i' } },
        { dept:  { $regex: search, $options: 'i' } },
      ];
    }

    const courses = await Course.find(filter).sort({ code: 1 });
    res.json({ courses });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── GET /api/courses/:code ────────────────────────────────────────────────────
router.get('/:code', protect, async (req, res) => {
  try {
    const course = await Course.findOne({ code: req.params.code.toUpperCase() });
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    res.json({ course });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
