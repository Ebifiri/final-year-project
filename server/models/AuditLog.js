import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    action: {
      type: String,
      required: true,
      enum: [
        'LOGIN_SUCCESS',
        'LOGIN_FAILURE',
        'REGISTER',
        'OAUTH_LOGIN',
        'FILE_UPLOAD',
        'FILE_DELETE',
        'GRADE_CHANGE',
        'ROLE_CHANGE',
        'USER_CREATE',
        'USER_UPDATE',
        'USER_DELETE',
        'COURSE_CREATE',
        'COURSE_UPDATE',
        'COURSE_DELETE',
        'QUIZ_CREATE',
        'QUIZ_ATTEMPT',
        'ASSIGNMENT_SUBMIT',
        'PASSWORD_CHANGE',
      ],
    },
    target: {
      type: String, // e.g. 'User', 'Course', 'Resource'
      default: '',
    },
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    ip: {
      type: String,
      default: '',
    },
    userAgent: {
      type: String,
      default: '',
    },
    details: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

// Index for efficient querying
auditLogSchema.index({ action: 1, createdAt: -1 });
auditLogSchema.index({ userId: 1, createdAt: -1 });

const AuditLog = mongoose.model('AuditLog', auditLogSchema);
export default AuditLog;
