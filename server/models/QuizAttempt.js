import mongoose from 'mongoose';

const quizAttemptSchema = new mongoose.Schema(
  {
    quizId:      { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz', required: true },
    studentId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    answers:     [
      {
        questionIndex: Number,
        answer:        String,
        isCorrect:     Boolean,
        feedback:      String,
        pointsEarned:  { type: Number, default: 0 },
      }
    ],
    score:       Number,
    totalPoints: Number,
  },
  { timestamps: true }
);

// One attempt per student per quiz
quizAttemptSchema.index({ quizId: 1, studentId: 1 }, { unique: true });

export default mongoose.model('QuizAttempt', quizAttemptSchema);
