import express from 'express';
import Course from '../models/Course.js';
import Enrollment from '../models/Enrollment.js';
import Quiz from '../models/Quiz.js';
import QuizAttempt from '../models/QuizAttempt.js';
import Assignment from '../models/Assignment.js';
import Submission from '../models/Submission.js';
import protect from '../middleware/auth.js';
import { notifySpecificStudents } from '../utils/notifyEnrolledStudents.js';

const router = express.Router();

// ── GET /api/progress/:courseId ───────────────────────────────────────────────
// Returns full class performance data for a course (lecturer/admin only)
router.get('/:courseId', protect, async (req, res) => {
  try {
    if (!['lecturer', 'admin'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Not authorised' });
    }

    const course = await Course.findById(req.params.courseId).lean();
    if (!course) return res.status(404).json({ message: 'Course not found' });

    // Verify lecturer owns this course
    if (!course.lecturers.map(l => l.toString()).includes(req.user._id.toString()) && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'You are not a lecturer for this course' });
    }

    // Fetch all enrolled students
    const enrollments = await Enrollment.find({ course: course._id }).populate('user', 'name email').lean();
    const students = enrollments.map(e => e.user).filter(Boolean);

    // Fetch all quizzes, assignments, attempts, and submissions for this course
    const [quizzes, assignments, allAttempts, allSubmissions] = await Promise.all([
      Quiz.find({ courseId: course._id }).lean(),
      Assignment.find({ courseId: course._id }).lean(),
      QuizAttempt.find({ quizId: { $in: (await Quiz.find({ courseId: course._id }).select('_id').lean()).map(q => q._id) } }).lean(),
      Submission.find({ assignmentId: { $in: (await Assignment.find({ courseId: course._id }).select('_id').lean()).map(a => a._id) } }).lean(),
    ]);

    // Build per-student performance data
    const studentData = students.map(student => {
      const studentQuizzes = quizzes.map(quiz => {
        const attempt = allAttempts.find(
          a => a.studentId.toString() === student._id.toString() && a.quizId.toString() === quiz._id.toString()
        );
        return {
          quizId: quiz._id,
          title: quiz.title,
          score: attempt ? attempt.score : null,
          totalPoints: attempt ? attempt.totalPoints : quiz.questions.reduce((sum, q) => sum + (q.points || 1), 0),
          attempted: !!attempt,
          answers: attempt ? attempt.answers : [],
          questions: quiz.questions.map(q => ({
            text: q.text,
            type: q.type,
            correctAnswer: q.correctAnswer,
            points: q.points || 1,
          })),
        };
      });

      const studentAssignments = assignments.map(assign => {
        const sub = allSubmissions.find(
          s => s.studentId.toString() === student._id.toString() && s.assignmentId.toString() === assign._id.toString()
        );
        return {
          assignmentId: assign._id,
          title: assign.title,
          grade: sub ? sub.grade : null,
          totalPoints: assign.totalPoints || 100,
          submitted: !!sub,
          feedback: sub ? sub.feedback : '',
        };
      });

      // Calculate overall percentage
      let totalPossible = 0;
      let totalEarned = 0;
      studentQuizzes.forEach(q => {
        if (q.score != null) {
          totalPossible += q.totalPoints;
          totalEarned += q.score;
        }
      });
      studentAssignments.forEach(a => {
        if (a.grade != null) {
          totalPossible += a.totalPoints;
          totalEarned += a.grade;
        }
      });

      const overallPercentage = totalPossible > 0 ? Math.round((totalEarned / totalPossible) * 100) : null;

      return {
        user: { _id: student._id, name: student.name, email: student.email },
        quizzes: studentQuizzes,
        assignments: studentAssignments,
        overallPercentage,
        totalEarned,
        totalPossible,
      };
    });

    res.json({
      course: { _id: course._id, code: course.code, title: course.title, color: course.color },
      students: studentData,
    });
  } catch (err) {
    console.error('Progress route error:', err);
    res.status(500).json({ message: err.message });
  }
});

// ── POST /api/progress/:courseId/insights ─────────────────────────────────────
// AI-generated weakness analysis for a specific student
router.post('/:courseId/insights', protect, async (req, res) => {
  try {
    if (!['lecturer', 'admin'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Not authorised' });
    }

    const { studentId, studentName, quizzes, assignments } = req.body;
    if (!studentId) return res.status(400).json({ message: 'studentId is required' });

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(503).json({ message: 'AI service not configured' });
    }

    // Build context about incorrect answers
    let analysisContext = `Student: ${studentName || 'Unknown'}\n\n`;

    // Quiz data
    if (quizzes && quizzes.length > 0) {
      analysisContext += '=== QUIZ PERFORMANCE ===\n';
      quizzes.forEach(q => {
        if (!q.attempted) {
          analysisContext += `\nQuiz: "${q.title}" — NOT ATTEMPTED\n`;
          return;
        }
        analysisContext += `\nQuiz: "${q.title}" — Score: ${q.score}/${q.totalPoints}\n`;
        if (q.answers && q.questions) {
          q.answers.forEach(ans => {
            const question = q.questions[ans.questionIndex];
            if (question && !ans.isCorrect) {
              analysisContext += `  ✗ Question: "${question.text}"\n`;
              analysisContext += `    Student answered: "${ans.answer}"\n`;
              analysisContext += `    Correct answer: "${question.correctAnswer}"\n`;
            }
          });
        }
      });
    }

    // Assignment data
    if (assignments && assignments.length > 0) {
      analysisContext += '\n=== ASSIGNMENT PERFORMANCE ===\n';
      assignments.forEach(a => {
        if (!a.submitted) {
          analysisContext += `Assignment: "${a.title}" — NOT SUBMITTED\n`;
        } else if (a.grade != null) {
          analysisContext += `Assignment: "${a.title}" — Grade: ${a.grade}/${a.totalPoints}\n`;
          if (a.feedback) analysisContext += `  Feedback: ${a.feedback}\n`;
        } else {
          analysisContext += `Assignment: "${a.title}" — NOT GRADED YET\n`;
        }
      });
    }

    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-flash-latest' });

    const prompt = `You are an academic advisor analyzing a student's performance. Based on the following data about their quiz answers and assignment grades, provide a concise diagnostic summary.

${analysisContext}

Please provide:
1. **Key Weak Areas**: Identify 2-4 specific topics or concepts where the student consistently struggles, based on the questions they got wrong.
2. **Strength Areas**: Briefly note what they seem to understand well.
3. **Recommended Actions**: 2-3 specific, actionable study recommendations for improvement.

Keep your response concise (under 200 words), practical, and encouraging. Use markdown formatting.`;

    const result = await model.generateContent(prompt);
    const insights = result.response.text();

    res.json({ insights });
  } catch (err) {
    console.error('Progress insights error:', err);
    res.status(500).json({ message: err.message });
  }
});

// ── POST /api/progress/:courseId/guidance ─────────────────────────────────────
// Send a guidance message to a student
router.post('/:courseId/guidance', protect, async (req, res) => {
  try {
    if (!['lecturer', 'admin'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Not authorised' });
    }

    const { studentId, message } = req.body;
    if (!studentId || !message) {
      return res.status(400).json({ message: 'studentId and message are required' });
    }

    const course = await Course.findById(req.params.courseId).lean();
    if (!course) return res.status(404).json({ message: 'Course not found' });

    await notifySpecificStudents({
      courseId: course._id,
      courseCode: course.code,
      courseName: course.title,
      type: 'feedback',
      title: `Study Guidance from ${req.user.name}`,
      body: message,
      userIds: [studentId],
    });

    res.json({ success: true });
  } catch (err) {
    console.error('Guidance send error:', err);
    res.status(500).json({ message: err.message });
  }
});

export default router;
