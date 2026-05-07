import mongoose from 'mongoose';

const resourceSchema = new mongoose.Schema(
  {
    sectionId:    { type: mongoose.Schema.Types.ObjectId, ref: 'Section', required: true, index: true },
    courseId:     { type: mongoose.Schema.Types.ObjectId, ref: 'Course',  required: true },
    title:        { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: ['slides', 'lab', 'video', 'reading', 'assignment', 'quiz', 'announcement', 'link', 'document'],
      required: true,
    },
    fileUrl:      String,
    filePublicId: String,   // Cloudinary public_id for deletion
    externalUrl:  String,   // for 'link' resources
    assignmentRef: { type: mongoose.Schema.Types.ObjectId, ref: 'Assignment' },
    quizRef:       { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz' },
    order:         { type: Number, default: 0 },
    uploadedBy:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export default mongoose.model('Resource', resourceSchema);
