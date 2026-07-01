import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '.env') });

import express from 'express';
import cors from 'cors';
import passport from 'passport';
import connectDB from './config/db.js';

// Security middleware
import {
  helmetMiddleware,
  globalLimiter,
  mongoSanitizeMiddleware,
  xssMiddleware,
  hppMiddleware,
} from './middleware/security.js';
import errorHandler from './middleware/errorHandler.js';

// Route handlers
import authRoutes        from './routes/authRoutes.js';
import courseRoutes      from './routes/courseRoutes.js';
import enrollmentRoutes  from './routes/enrollmentRoutes.js';
import userRoutes        from './routes/userRoutes.js';
import contentRoutes     from './routes/contentRoutes.js';
import assignmentRoutes  from './routes/assignmentRoutes.js';
import submissionRoutes  from './routes/submissionRoutes.js';
import quizRoutes        from './routes/quizRoutes.js';
import aiRoutes          from './routes/aiRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import progressRoutes    from './routes/progressRoutes.js';
import adminRoutes       from './routes/adminRoutes.js';
import auditRoutes       from './routes/auditRoutes.js';

import { startReminderCron } from './utils/reminders.js';

// Connect to MongoDB
connectDB();
startReminderCron();

const app = express();

// ── Security Middleware ───────────────────────────────────────────────────────
app.use(helmetMiddleware);                     // Secure HTTP headers
app.use(globalLimiter);                        // Rate limit: 100 req / 15 min per IP
app.use(cors({
  origin: [
    'http://localhost:5173',   // Vite dev server
    'http://localhost:4173',   // Vite preview
    process.env.FRONTEND_URL, // production frontend URL (Netlify — set in Render env vars)
  ].filter(Boolean),
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));      // Body parser with size limit
app.use(mongoSanitizeMiddleware);              // Prevent NoSQL injection
app.use(xssMiddleware);                        // Sanitise input against XSS
app.use(hppMiddleware);                        // Prevent HTTP parameter pollution
app.use(passport.initialize());                // stateless — no sessions

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/auth',        authRoutes);
app.use('/api/courses',     courseRoutes);
app.use('/api/enrollments', enrollmentRoutes);
app.use('/api/users',       userRoutes);
app.use('/api/content',     contentRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/submissions', submissionRoutes);
app.use('/api/quizzes',     quizRoutes);
app.use('/api/ai',            aiRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/progress',      progressRoutes);
app.use('/api/admin',         adminRoutes);
app.use('/api/admin/audit-logs', auditRoutes);

// ── Health check ─────────────────────────────────────────────────────────────
app.get('/api/health', (_, res) => res.json({
  status: 'ok',
  timestamp: new Date(),
  config: {
    EMAIL_USER: process.env.EMAIL_USER ? 'SET' : 'MISSING',
    EMAIL_PASS: process.env.EMAIL_PASS ? 'SET' : 'MISSING',
    FRONTEND_URL: process.env.FRONTEND_URL || 'NOT SET',
    BACKEND_URL: process.env.BACKEND_URL || 'NOT SET',
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID ? 'SET' : 'MISSING',
    MICROSOFT_CLIENT_ID: process.env.MICROSOFT_CLIENT_ID ? 'SET' : 'MISSING',
  }
}));

// ── 404 fallback ──────────────────────────────────────────────────────────────
app.use((_, res) => res.status(404).json({ message: 'Route not found' }));

// ── Global Error Handler ─────────────────────────────────────────────────────
// Must be registered AFTER all routes
app.use(errorHandler);

// ── Start server ──────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
