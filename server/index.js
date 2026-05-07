import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '.env') });

import express from 'express';
import cors from 'cors';
import passport from 'passport';
import connectDB from './config/db.js';

// Route handlers
import authRoutes        from './routes/authRoutes.js';
import courseRoutes      from './routes/courseRoutes.js';
import enrollmentRoutes  from './routes/enrollmentRoutes.js';
import userRoutes        from './routes/userRoutes.js';
import contentRoutes     from './routes/contentRoutes.js';
import assignmentRoutes  from './routes/assignmentRoutes.js';
import submissionRoutes  from './routes/submissionRoutes.js';
import quizRoutes        from './routes/quizRoutes.js';

// Connect to MongoDB
connectDB();

const app = express();

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors({
  origin: [
    'http://localhost:5173',   // Vite dev server
    'http://localhost:4173',   // Vite preview
    process.env.FRONTEND_URL, // production frontend URL (set in .env)
  ].filter(Boolean),
  credentials: true,
}));
app.use(express.json());
app.use(passport.initialize()); // stateless — no sessions

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/auth',        authRoutes);
app.use('/api/courses',     courseRoutes);
app.use('/api/enrollments', enrollmentRoutes);
app.use('/api/users',       userRoutes);
app.use('/api/content',     contentRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/submissions', submissionRoutes);
app.use('/api/quizzes',     quizRoutes);

// ── Health check ─────────────────────────────────────────────────────────────
app.get('/api/health', (_, res) => res.json({ status: 'ok', timestamp: new Date() }));

// ── 404 fallback ──────────────────────────────────────────────────────────────
app.use((_, res) => res.status(404).json({ message: 'Route not found' }));

// ── Start server ──────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
