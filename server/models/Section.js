import mongoose from 'mongoose';

const sectionSchema = new mongoose.Schema(
  {
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
    title:    { type: String, required: true, trim: true },
    type:     { type: String, enum: ['general', 'week', 'module', 'announcement'], default: 'week' },
    order:    { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.model('Section', sectionSchema);
