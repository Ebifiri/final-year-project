import Course from '../models/Course.js';
import Enrollment from '../models/Enrollment.js';

/**
 * Restrict access to specific roles.
 * Usage: router.get('/path', protect, requireRole('lecturer', 'admin'), handler)
 */
export const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied: insufficient permissions' });
    }
    next();
  };
};

/**
 * Ensure that a student is enrolled in the course identified by req.params.courseId
 * or req.body.courseId. Lecturers must be assigned to the course. Admins pass through.
 */
export const requireCourseAccess = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    // Admin bypasses all checks
    if (req.user.role === 'admin') return next();

    const courseId = req.params.courseId || req.body.courseId;
    if (!courseId) return next(); // No course context — skip

    if (req.user.role === 'student') {
      const enrolled = await Enrollment.findOne({
        user: req.user._id,
        course: courseId,
      });
      if (!enrolled) {
        return res.status(403).json({ message: 'You are not enrolled in this course' });
      }
    }

    if (req.user.role === 'lecturer') {
      const course = await Course.findById(courseId).lean();
      if (!course || !course.lecturers?.some(id => id.toString() === req.user._id.toString())) {
        return res.status(403).json({ message: 'You are not assigned to this course' });
      }
    }

    next();
  } catch (err) {
    res.status(500).json({ message: 'Access check failed' });
  }
};
