import express from 'express';
import Course from '../models/Course.js';
import protect from '../middleware/auth.js';

const router = express.Router();

// ── GET /api/courses ──────────────────────────────────────────────────────────
// Public — no auth required to browse courses
router.get('/', async (req, res) => {
  try {
    const { search, dept, year } = req.query;
    const filter = {};

    // Escape regex special characters so dept names like "School of Science & Tech (SST)" work correctly
    const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    if (dept)   filter.dept = { $regex: escape(dept), $options: 'i' };
    if (year)   filter.year = { $regex: escape(year), $options: 'i' };
    if (search) {
      const s = escape(search);
      filter.$or = [
        { title: { $regex: s, $options: 'i' } },
        { code:  { $regex: s, $options: 'i' } },
        { dept:  { $regex: s, $options: 'i' } },
      ];
    }

    const courses = await Course.find(filter).sort({ code: 1 });
    res.json({ courses });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── GET /api/courses/:code ────────────────────────────────────────────────────
// Public — no auth required to view a single course
router.get('/:code', async (req, res) => {
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
