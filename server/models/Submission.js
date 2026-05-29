import mongoose from 'mongoose';

const submissionSchema = new mongoose.Schema(
  {
    assignmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Assignment', required: true },
    studentId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User',       required: true, index: true },
    files: [
      {
        name:     String,
        url:      String,
        publicId: String,  // Cloudinary public_id for deletion
        size:     Number,  // bytes
      },
    ],
    grade:    { type: Number, default: null },
    feedback: { type: String, default: '' },
    gradedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

// One submission per student per assignment
submissionSchema.index({ assignmentId: 1, studentId: 1 }, { unique: true });

export default mongoose.model('Submission', submissionSchema);
