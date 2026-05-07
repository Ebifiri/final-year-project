import mongoose from 'mongoose';

const courseSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: [true, 'Course code is required'],
      unique: true,
      uppercase: true,
      trim: true,
    },
    title: {
      type: String,
      required: [true, 'Course title is required'],
      trim: true,
    },
    dept: {
      type: String,
      required: true,
      trim: true,
    },
    year: {
      type: String,
      required: true,
    },
    credits: {
      type: Number,
      required: true,
      min: 1,
    },
    color: {
      type: String,
      default: 'bg-blue-500',
    },
    description: {
      type: String,
      default: '',
    },
    lecturers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  },
  { timestamps: true }
);

// Text index for search
courseSchema.index({ title: 'text', code: 'text', dept: 'text' });

const Course = mongoose.model('Course', courseSchema);
export default Course;
