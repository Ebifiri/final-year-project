import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
import xss from 'xss-clean';
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

// ── XSS Clean — sanitises user input against XSS ─────────────────────────────
export const xssMiddleware = xss();

// ── HPP — prevent HTTP parameter pollution ────────────────────────────────────
export const hppMiddleware = hpp();
