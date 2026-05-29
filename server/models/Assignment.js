import mongoose from 'mongoose';

const assignmentSchema = new mongoose.Schema(
  {
    courseId:    { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
    title:       { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    dueDate:     Date,
    opensAt:     Date,
    closesAt:    Date,
    totalPoints: { type: Number, default: 100 },
    createdBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    remindersSent: {
      threeDays: { type: Boolean, default: false },
      twentyFourHours: { type: Boolean, default: false },
      sixHours: { type: Boolean, default: false },
      oneHour: { type: Boolean, default: false },
    },
  },
  { timestamps: true }
);

export default mongoose.model('Assignment', assignmentSchema);
