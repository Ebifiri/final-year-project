import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema({
  text:          { type: String, required: true },
  type:          { type: String, enum: ['mcq', 'true_false', 'short_answer'], required: true },
  options:       [String],         // ['A', 'B', 'C', 'D'] for MCQ; empty for T/F or short_answer
  correctAnswer: { type: String, required: true },
  points:        { type: Number, default: 1 },
});

const quizSchema = new mongoose.Schema(
  {
    courseId:        { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
    title:           { type: String, required: true, trim: true },
    description:     { type: String, default: '' },
    dueDate:         Date,
    opensAt:         Date,
    closesAt:        Date,
    durationMinutes: { type: Number, default: 20 },
    showCorrectAnswers: { type: Boolean, default: true },
    questions:       [questionSchema],
    createdBy:       { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export default mongoose.model('Quiz', quizSchema);
