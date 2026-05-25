import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
    },
    resourceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Resource',
    },
    type: {
      type: String,
      enum: ['resource', 'assignment', 'quiz', 'announcement'],
      required: true,
    },
    title:     { type: String, required: true },
    body:      { type: String, default: '' },
    link:      { type: String, default: '' },   // frontend route, e.g. /courses/CSC101
    read:      { type: Boolean, default: false },
    emailSent: { type: Boolean, default: false },
    dueDate:   Date,
  },
  { timestamps: true }
);

// Fast queries: "get my unread notifications, newest first"
notificationSchema.index({ userId: 1, read: 1, createdAt: -1 });

export default mongoose.model('Notification', notificationSchema);
