import express from 'express';
import AuditLog from '../models/AuditLog.js';
import protect from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';

const router = express.Router();

// All audit routes require admin
router.use(protect, requireRole('admin'));

// ── GET /api/admin/audit-logs ─────────────────────────────────────────────────
// Query params: ?action=LOGIN_SUCCESS&limit=50&page=1
router.get('/', async (req, res) => {
  try {
    const { action, userId, limit: rawLimit, page: rawPage } = req.query;
    const limit = Math.min(parseInt(rawLimit) || 50, 200);
    const page  = Math.max(parseInt(rawPage) || 1, 1);
    const skip  = (page - 1) * limit;

    const filter = {};
    if (action) filter.action = action;
    if (userId) filter.userId = userId;

    const [logs, total] = await Promise.all([
      AuditLog.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('userId', 'name email')
        .lean(),
      AuditLog.countDocuments(filter),
    ]);

    res.json({
      logs,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
