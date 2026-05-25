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
    const { courseCode, title, description, dueDate, durationMinutes, questions, opensAt, closesAt } = req.body;
    const course = await Course.findOne({ code: courseCode?.toUpperCase() });
    if (!course) return res.status(404).json({ message: 'Course not found' });

    const quiz = await Quiz.create({
      courseId: course._id, title, description, dueDate, durationMinutes,
      opensAt: opensAt || undefined, closesAt: closesAt || undefined,
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

// ── POST /api/quizzes/generate-from-material  — students/lecturers generate quiz ─
router.post('/generate-from-material', protect, async (req, res) => {
  try {
    const { resourceId } = req.body;
    const resource = await Resource.findById(resourceId).populate('sectionId');
    if (!resource) return res.status(404).json({ message: 'Resource not found' });

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(503).json({ message: 'AI service not configured — add GEMINI_API_KEY to server/.env' });
    }

    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    const { fetchResourceBuffer } = await import('../utils/fileAccess.js');
    const officeParser = (await import('officeparser')).default;

    const mimeType = resource.mimeType || 'application/pdf';
    const isOffice = mimeType.includes('officedocument') || mimeType.includes('ms-word') || mimeType.includes('ms-powerpoint') || resource.title.endsWith('.docx') || resource.title.endsWith('.pptx');

    let buffer;
    try {
      buffer = await fetchResourceBuffer(resource);
    } catch (fetchErr) {
      return res.status(502).json({ message: 'Failed to fetch resource file: ' + fetchErr.message });
    }

    const fileParts = [];
    if (isOffice) {
      try {
        const ast = await officeParser.parseOffice(buffer);
        const textContent = ast.toText();
        fileParts.push({ text: `Study material document (name: "${resource.title}") text content:\n---\n${textContent}\n---\n` });
      } catch (parseErr) {
        console.error('Office parsing error:', parseErr);
        return res.status(500).json({ message: 'Failed to parse office document text' });
      }
    } else {
      fileParts.push({ inlineData: { mimeType, data: buffer.toString('base64') } });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-flash-latest' });

    const prompt = `You are a helpful academic assistant. Based on the uploaded study materials, generate a comprehensive quiz for students.
The quiz should contain EXACTLY 8 questions:
- 5 multiple-choice questions (type: "mcq")
- 3 short-answer questions (type: "short_answer")

For MCQ questions:
- Provide 4 options (A, B, C, D) in the "options" array.
- The "correctAnswer" should be the exact text of the correct choice.
- "type" must be "mcq".

For short_answer questions:
- The "options" array must be empty.
- The "correctAnswer" should be a detailed, high-quality reference answer/criteria that the grading model will use to evaluate student submissions.
- "type" must be "short_answer".

All questions must include:
- "text": The question prompt/text.
- "points": Point value for this question (default 5 for mcq, 10 for short_answer).
- "explanation": A brief explanation of what makes a good answer.

Return ONLY a valid JSON array — no explanation, no markdown code fences, just the raw JSON array. Format matching this schema:
[
  {
    "text": "...",
    "type": "mcq",
    "options": ["...", "...", "...", "..."],
    "correctAnswer": "...",
    "points": 5,
    "explanation": "..."
  },
  {
    "text": "...",
    "type": "short_answer",
    "options": [],
    "correctAnswer": "...",
    "points": 10,
    "explanation": "..."
  }
]
Generate EXACTLY 8 questions.`;

    const result = await model.generateContent([...fileParts, prompt]);
    const text = result.response.text();
    let questions = [];
    try {
      const clean = text.replace(/```json|```/g, '').trim();
      questions = JSON.parse(clean);
    } catch (err) {
      console.error('Failed to parse AI quiz JSON:', text);
      return res.status(500).json({ message: 'AI generated quiz in invalid format. Please try again.' });
    }

    // Save as a Course Quiz under the same section
    const quiz = await Quiz.create({
      courseId: resource.courseId,
      title: `AI Practice: ${resource.title}`,
      description: `Practice quiz generated by AI from the material "${resource.title}".`,
      questions,
      createdBy: req.user._id,
    });

    // Create a Resource linking to this Quiz in the same section
    const Resource = (await import('../models/Resource.js')).default;
    const count = await Resource.countDocuments({ sectionId: resource.sectionId._id });
    await Resource.create({
      sectionId: resource.sectionId._id,
      courseId: resource.courseId,
      title: quiz.title,
      type: 'quiz',
      quizRef: quiz._id,
      uploadedBy: req.user._id,
      order: count,
    });

    res.status(201).json({ quiz });
  } catch (err) {
    console.error('generate-from-material error:', err);
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
    const totalPoints = quiz.questions.reduce((s, q) => s + (q.points || 5), 0);
    const answersWithGrades = [];
    const shortAnswerGradesToEvaluate = [];

    quiz.questions.forEach((q, idx) => {
      const studentAnsObj = answers.find(a => a.questionIndex === idx);
      const studentAnswer = studentAnsObj?.answer || '';

      if (q.type === 'mcq' || q.type === 'true_false') {
        const isMatch = studentAnswer.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase();
        const pointsEarned = isMatch ? (q.points || 5) : 0;
        score += pointsEarned;
        answersWithGrades.push({
          questionIndex: idx,
          answer: studentAnswer,
          isCorrect: isMatch,
          pointsEarned,
          feedback: isMatch ? 'Correct!' : `Incorrect. The correct answer was: ${q.correctAnswer}`
        });
      } else if (q.type === 'short_answer') {
        if (!studentAnswer.trim()) {
          answersWithGrades.push({
            questionIndex: idx,
            answer: '',
            isCorrect: false,
            pointsEarned: 0,
            feedback: 'No answer provided.'
          });
        } else {
          shortAnswerGradesToEvaluate.push({
            index: idx,
            questionText: q.text,
            maxPoints: q.points || 10,
            correctAnswer: q.correctAnswer,
            studentAnswer: studentAnswer
          });
        }
      }
    });

    if (shortAnswerGradesToEvaluate.length > 0) {
      const apiKey = process.env.GEMINI_API_KEY;
      if (apiKey) {
        try {
          const { GoogleGenerativeAI } = await import('@google/generative-ai');
          const genAI = new GoogleGenerativeAI(apiKey);
          const model = genAI.getGenerativeModel({ model: 'gemini-flash-latest' });

          const gradingPrompt = `You are an academic grader. Evaluate the student's answers for the following written short-answer questions against their respective reference answers.

Questions to evaluate:
${shortAnswerGradesToEvaluate.map((q) => `
Index: ${q.index}
Question: "${q.questionText}"
Max Points: ${q.maxPoints}
Reference Answer: "${q.correctAnswer}"
Student's Answer: "${q.studentAnswer}"
`).join('\n---\n')}

Provide your grading evaluation for each question.
Return ONLY a valid JSON array of objects (one for each input question in order) — no explanation, no markdown code fences, just the raw JSON array matching this schema:
[
  {
    "index": number, // matching the input question Index
    "isCorrect": true/false, // set to true if mostly/fully correct, false if incorrect or poor
    "feedback": "Brief feedback explanation showing what they did well and what they missed...",
    "scoreEarned": number // integer between 0 and Max Points
  }
]
`;
          const gradingResult = await model.generateContent(gradingPrompt);
          const gradingText = gradingResult.response.text();
          try {
            const cleanGrading = gradingText.replace(/```json|```/g, '').trim();
            const evaluatedList = JSON.parse(cleanGrading);

            evaluatedList.forEach(item => {
              const qEval = shortAnswerGradesToEvaluate.find(sa => sa.index === item.index);
              if (qEval) {
                const pointsEarned = Math.min(qEval.maxPoints, Math.max(0, parseInt(item.scoreEarned) || 0));
                score += pointsEarned;
                answersWithGrades.push({
                  questionIndex: item.index,
                  answer: qEval.studentAnswer,
                  isCorrect: !!item.isCorrect,
                  pointsEarned,
                  feedback: item.feedback || ''
                });
              }
            });
          } catch (jsonErr) {
            console.error('Failed to parse AI grading results:', jsonErr, gradingText);
            // Fallback for each
            shortAnswerGradesToEvaluate.forEach(qEval => {
              answersWithGrades.push({
                questionIndex: qEval.index,
                answer: qEval.studentAnswer,
                isCorrect: true, // assume correct as fallback
                pointsEarned: qEval.maxPoints,
                feedback: 'Self-graded fallback (evaluation service returned malformed grading data).'
              });
              score += qEval.maxPoints;
            });
          }
        } catch (apiErr) {
          console.error('Gemini grading API error:', apiErr);
          // Fallback
          shortAnswerGradesToEvaluate.forEach(qEval => {
            answersWithGrades.push({
              questionIndex: qEval.index,
              answer: qEval.studentAnswer,
              isCorrect: true,
              pointsEarned: qEval.maxPoints,
              feedback: 'Self-graded fallback (evaluation service was unavailable).'
            });
            score += qEval.maxPoints;
          });
        }
      } else {
        // No API key - local default grading fallback
        shortAnswerGradesToEvaluate.forEach(qEval => {
          answersWithGrades.push({
            questionIndex: qEval.index,
            answer: qEval.studentAnswer,
            isCorrect: true,
            pointsEarned: qEval.maxPoints,
            feedback: 'Graded full marks automatically (AI evaluation not configured).'
          });
          score += qEval.maxPoints;
        });
      }
    }

    const attempt = await QuizAttempt.create({
      quizId,
      studentId: req.user._id,
      answers: answersWithGrades,
      score,
      totalPoints,
    });

    res.status(201).json({ attempt, score, totalPoints });
  } catch (err) {
    console.error('Attempt submission error:', err);
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
