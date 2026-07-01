import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
import hpp from 'hpp';

// ── Helmet — secure HTTP headers ──────────────────────────────────────────────
export const helmetMiddleware = helmet();

// ── Rate Limiters ─────────────────────────────────────────────────────────────
// Global: 100 requests per 15 minutes per IP
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests from this IP, please try again after 15 minutes' },
});

// Strict: 10 requests per 15 minutes — for auth endpoints (login, register)
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many authentication attempts, please try again after 15 minutes' },
});

// AI endpoints: 30 requests per 15 minutes
export const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many AI requests, please try again after 15 minutes' },
});

// ── MongoDB Query Sanitisation — prevents NoSQL injection ─────────────────────
export const mongoSanitizeMiddleware = mongoSanitize({
  replaceWith: '_',
});

// Helper function to recursively sanitise strings against basic XSS vectors
function sanitizeInput(val) {
  if (typeof val === 'string') {
    return val
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  }
  if (Array.isArray(val)) {
    return val.map(sanitizeInput);
  }
  if (val !== null && typeof val === 'object') {
    for (const key in val) {
      if (Object.prototype.hasOwnProperty.call(val, key)) {
        val[key] = sanitizeInput(val[key]);
      }
    }
  }
  return val;
}

// ── XSS Clean — sanitises user input against XSS (Express 5 compatible) ──────
export const xssMiddleware = (req, res, next) => {
  if (req.body) {
    sanitizeInput(req.body);
  }
  if (req.query) {
    // Mutate the query keys instead of assigning to the read-only req.query getter
    sanitizeInput(req.query);
  }
  if (req.params) {
    sanitizeInput(req.params);
  }
  next();
};

// ── HPP — prevent HTTP parameter pollution ────────────────────────────────────
export const hppMiddleware = hpp();

