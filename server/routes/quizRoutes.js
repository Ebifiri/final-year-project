import express     from 'express';
import Quiz         from '../models/Quiz.js';
import QuizAttempt  from '../models/QuizAttempt.js';
import Course       from '../models/Course.js';
import Enrollment   from '../models/Enrollment.js';
import protect      from '../middleware/auth.js';
import { notifyEnrolledStudents } from '../utils/notifyEnrolledStudents.js';

const router = express.Router();

// ── GET /api/quizzes/:id ──────────────────────────────────────────────────────
// Returns quiz without correctAnswer exposed to students
router.get('/:id', protect, async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id)
      .populate('courseId', 'code title color')
      .populate('createdBy', 'name');
    if (!quiz) return res.status(404).json({ message: 'Quiz not found' });

    // Check enrollment
    if (req.user.role === 'student') {
      const enrolled = await Enrollment.findOne({
        student: req.user._id, course: quiz.courseId._id,
      });
      if (!enrolled) return res.status(403).json({ message: 'Enroll in this course first' });
    }

    // Strip correct answers for students
    const quizData = quiz.toObject();
    if (req.user.role === 'student') {
      quizData.questions = quizData.questions.map(q => {
        const { correctAnswer, ...rest } = q;
        return rest;
      });
    }

    // Attach attempt if already taken
    const attempt = await QuizAttempt.findOne({
      quizId: quiz._id, studentId: req.user._id,
    });

    res.json({ quiz: quizData, attempt: attempt || null });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── POST /api/quizzes ─────────────────────────────────────────────────────────
// Lecturer/admin creates a quiz
router.post('/', protect, async (req, res) => {
  try {
    if (!['lecturer', 'admin'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Not authorised' });
    }
    const { courseCode, title, description, dueDate, durationMinutes, questions } = req.body;
    const course = await Course.findOne({ code: courseCode?.toUpperCase() });
    if (!course) return res.status(404).json({ message: 'Course not found' });

    const quiz = await Quiz.create({
      courseId: course._id, title, description, dueDate, durationMinutes,
      questions, createdBy: req.user._id,
    });

    // Notify enrolled students
    notifyEnrolledStudents({
      courseId:   course._id,
      courseCode: course.code,
      courseName: course.name,
      type:       'quiz',
      title:      `New quiz: ${title}`,
      body:       dueDate ? `Due: ${new Date(dueDate).toLocaleDateString()}` : '',
    });

    res.status(201).json({ quiz });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── POST /api/quiz-attempts  — student submits answers ───────────────────────
router.post('/attempts', protect, async (req, res) => {
  try {
    const { quizId, answers } = req.body;

    // Prevent re-attempts
    const existing = await QuizAttempt.findOne({ quizId, studentId: req.user._id });
    if (existing) return res.status(409).json({ message: 'You have already attempted this quiz', attempt: existing });

    const quiz = await Quiz.findById(quizId);
    if (!quiz) return res.status(404).json({ message: 'Quiz not found' });

    // Auto-grade
    let score = 0;
    const totalPoints = quiz.questions.reduce((s, q) => s + (q.points || 1), 0);

    answers.forEach(({ questionIndex, answer }) => {
      const q = quiz.questions[questionIndex];
      if (q && answer?.toLowerCase() === q.correctAnswer?.toLowerCase()) {
        score += q.points || 1;
      }
    });

    const attempt = await QuizAttempt.create({
      quizId, studentId: req.user._id, answers, score, totalPoints,
    });

    res.status(201).json({ attempt, score, totalPoints });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── GET /api/quizzes/attempts?quizId=X  — get own attempt ────────────────────
router.get('/attempts/mine', protect, async (req, res) => {
  try {
    const attempt = await QuizAttempt.findOne({
      quizId: req.query.quizId, studentId: req.user._id,
    });
    res.json({ attempt: attempt || null });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
