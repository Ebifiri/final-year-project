import express      from 'express';
import Notification from '../models/Notification.js';
import protect      from '../middleware/auth.js';

const router = express.Router();

// ── GET /api/notifications ────────────────────────────────────────────────────
// Returns the logged-in user's notifications, newest first (max 50).
router.get('/', protect, async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50)
      .populate('courseId', 'code title');
    res.json({ notifications });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── GET /api/notifications/unread-count ───────────────────────────────────────
// Returns { count: N } — used by the navbar badge.
router.get('/unread-count', protect, async (req, res) => {
  try {
    const unreadAlerts = await Notification.countDocuments({ userId: req.user._id, read: false, type: { $ne: 'feedback' } });
    const unreadMessages = await Notification.countDocuments({ userId: req.user._id, read: false, type: 'feedback' });
    res.json({ unreadAlerts, unreadMessages });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── PATCH /api/notifications/:id/read ─────────────────────────────────────────
// Mark a single notification as read.
router.patch('/:id/read', protect, async (req, res) => {
  try {
    const notif = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { read: true },
      { new: true }
    );
    if (!notif) return res.status(404).json({ message: 'Notification not found' });
    res.json({ notification: notif });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── PATCH /api/notifications/read-all ─────────────────────────────────────────
// Mark all of the user's notifications as read.
router.patch('/read-all', protect, async (req, res) => {
  try {
    await Notification.updateMany(
      { userId: req.user._id, read: false },
      { read: true }
    );
    res.json({ message: 'All notifications marked as read' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── DELETE /api/notifications ──────────────────────────────────────────────────
// Clear all notifications for the user. Optionally filter by type.
router.delete('/', protect, async (req, res) => {
  try {
    const filter = { userId: req.user._id };
    if (req.query.type) {
      filter.type = req.query.type;
    } else if (req.query.excludeType) {
      filter.type = { $ne: req.query.excludeType };
    }
    
    await Notification.deleteMany(filter);
    res.json({ message: 'Notifications cleared successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
