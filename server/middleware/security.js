import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import hpp from 'hpp';

// ── Helmet — secure HTTP headers ──────────────────────────────────────────────
export const helmetMiddleware = helmet();

// ── Rate Limiters ─────────────────────────────────────────────────────────────
// Global: 150 requests per 15 minutes per IP
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 150,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests from this IP, please try again after 15 minutes' },
});

// Strict: 20 requests per 15 minutes — for auth endpoints
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
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

// Helper function to recursively sanitise keys starting with $ or containing . (NoSQL injection prevention)
function sanitizeMongoKeys(val) {
  if (val !== null && typeof val === 'object') {
    for (const key in val) {
      if (Object.prototype.hasOwnProperty.call(val, key)) {
        if (key.startsWith('$') || key.includes('.')) {
          delete val[key];
        } else {
          sanitizeMongoKeys(val[key]);
        }
      }
    }
  }
  return val;
}

// ── MongoDB Query Sanitisation — prevents NoSQL injection (Express 5 compatible) ─
export const mongoSanitizeMiddleware = (req, res, next) => {
  if (req.body) {
    sanitizeMongoKeys(req.body);
  }
  if (req.query) {
    sanitizeMongoKeys(req.query);
  }
  if (req.params) {
    sanitizeMongoKeys(req.params);
  }
  next();
};

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
    sanitizeInput(req.query);
  }
  if (req.params) {
    sanitizeInput(req.params);
  }
  next();
};

// ── HPP — prevent HTTP parameter pollution ────────────────────────────────────
export const hppMiddleware = hpp();


