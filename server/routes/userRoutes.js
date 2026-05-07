import express from 'express';
import protect from '../middleware/auth.js';

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

export default router;
