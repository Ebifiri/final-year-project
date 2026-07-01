import AuditLog from '../models/AuditLog.js';

/**
 * Log an audit event to the database.
 *
 * @param {object}  opts
 * @param {string}  opts.action     - One of the AuditLog action enum values
 * @param {object}  [opts.req]      - Express request (auto-extracts userId, ip, userAgent)
 * @param {string}  [opts.userId]   - Override userId (for failed logins where req.user is null)
 * @param {string}  [opts.target]   - Target model name (e.g. 'User', 'Course')
 * @param {string}  [opts.targetId] - Target document ID
 * @param {string}  [opts.details]  - Human-readable description
 */
export async function logAudit({ action, req, userId, target, targetId, details }) {
  try {
    await AuditLog.create({
      userId:    userId || req?.user?._id || null,
      action,
      target:    target || '',
      targetId:  targetId || null,
      ip:        req?.ip || req?.headers?.['x-forwarded-for'] || '',
      userAgent: req?.headers?.['user-agent'] || '',
      details:   details || '',
    });
  } catch (err) {
    // Audit logging should never crash the request
    console.error('[AuditLog] Failed to write audit log:', err.message);
  }
}
