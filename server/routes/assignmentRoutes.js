import express    from 'express';
import Assignment  from '../models/Assignment.js';
import Course      from '../models/Course.js';
import Submission  from '../models/Submission.js';
import Enrollment  from '../models/Enrollment.js';
import protect     from '../middleware/auth.js';
import { notifyEnrolledStudents, notifySpecificStudents } from '../utils/notifyEnrolledStudents.js';

const router = express.Router();

// ── GET /api/assignments/:id ──────────────────────────────────────────────────
// Enrolled students and course lecturers/admin can view
router.get('/:id', protect, async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id)
      .populate('courseId', 'code title color')
      .populate('createdBy', 'name');
    if (!assignment) return res.status(404).json({ message: 'Assignment not found' });

    // Check enrollment (students) or role (lecturer/admin)
    if (req.user.role === 'student') {
      const enrolled = await Enrollment.findOne({
        user: req.user._id, course: assignment.courseId._id,
      });
      if (!enrolled) return res.status(403).json({ message: 'Enroll in this course first' });
    }

    // Attach student's own submission if any
    const submission = await Submission.findOne({
      assignmentId: assignment._id, studentId: req.user._id,
    });

    res.json({ assignment, submission: submission || null });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── POST /api/assignments ─────────────────────────────────────────────────────
// Lecturer/admin only
router.post('/', protect, async (req, res) => {
  try {
    if (!['lecturer', 'admin'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Not authorised' });
    }
    const { courseCode, title, description, dueDate, totalPoints, opensAt, closesAt } = req.body;
    const course = await Course.findOne({ code: courseCode?.toUpperCase() });
    if (!course) return res.status(404).json({ message: 'Course not found' });

    if (req.user.role !== 'admin' && !course.lecturers?.some(id => id.toString() === req.user._id.toString())) {
      return res.status(403).json({ message: 'You are not assigned to this course' });
    }

    const assignment = await Assignment.create({
      courseId: course._id, title, description, dueDate, totalPoints,
      opensAt: opensAt || undefined, closesAt: closesAt || undefined,
      createdBy: req.user._id,
    });

    // Notify enrolled students
    notifyEnrolledStudents({
      courseId:   course._id,
      courseCode: course.code,
      courseName: course.name,
      type:       'assignment',
      title:      `New assignment: ${title}`,
      body:       dueDate ? `Due: ${new Date(dueDate).toLocaleDateString()}` : '',
      dueDate:    closesAt || dueDate || undefined,
    });

    res.status(201).json({ assignment });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── GET /api/assignments/:id/submissions  — lecturer/admin ────────────────────
router.get('/:id/submissions', protect, async (req, res) => {
  try {
    if (!['lecturer', 'admin'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Not authorised' });
    }
    const assignment = await Assignment.findById(req.params.id).populate('courseId');
    if (!assignment) return res.status(404).json({ message: 'Assignment not found' });

    if (req.user.role !== 'admin' && !assignment.courseId.lecturers?.some(id => id.toString() === req.user._id.toString())) {
      return res.status(403).json({ message: 'You are not assigned to this course' });
    }

    // Fetch all students enrolled in the course
    const enrollments = await Enrollment.find({ course: assignment.courseId }).populate('user', 'name email');
    const enrolledStudents = enrollments.map(e => e.user);

    const submissions = await Submission.find({ assignmentId: req.params.id });

    const result = enrolledStudents.map(student => {
      const sub = submissions.find(s => s.studentId.toString() === student._id.toString());
      if (sub) {
        const subObj = sub.toObject();
        subObj.studentId = student;
        return subObj;
      }
      // Dummy object for students without a submission
      return {
        _id: 'no_submission_' + student._id,
        assignmentId: assignment._id,
        studentId: student,
        files: [],
        grade: null,
        feedback: '',
        createdAt: null,
      };
    });

    res.json({ submissions: result });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── PATCH /api/assignments/:id/submissions/:subId  — grade ───────────────────
router.patch('/:id/submissions/:subId', protect, async (req, res) => {
  try {
    if (!['lecturer', 'admin'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Not authorised' });
    }

    const assignment = await Assignment.findById(req.params.id).populate('courseId');
    if (!assignment) return res.status(404).json({ message: 'Assignment not found' });

    if (req.user.role !== 'admin' && !assignment.courseId.lecturers?.some(id => id.toString() === req.user._id.toString())) {
      return res.status(403).json({ message: 'You are not assigned to this course' });
    }

    let submission;
    if (req.params.subId.startsWith('no_submission_')) {
      const studentId = req.params.subId.replace('no_submission_', '');
      submission = await Submission.create({
        assignmentId: req.params.id,
        studentId,
        files: [],
        grade: req.body.grade,
        feedback: req.body.feedback,
        gradedBy: req.user._id
      });
    } else {
      submission = await Submission.findByIdAndUpdate(
        req.params.subId,
        { grade: req.body.grade, feedback: req.body.feedback, gradedBy: req.user._id },
        { new: true }
      );
    }

    if (submission) {
      submission = await Submission.findById(submission._id).populate('studentId', 'name email');
      const assignment = await Assignment.findById(submission.assignmentId).populate('courseId');
      if (assignment) {
        let notificationBody = `Your assignment "${assignment.title}" has been graded.`;
        if (req.body.feedback) {
          notificationBody += `\nFeedback: ${req.body.feedback}`;
        }

        // We use type 'feedback' so the frontend can route it to the mail icon
        await notifySpecificStudents({
          courseId: assignment.courseId._id,
          courseCode: assignment.courseId.code,
          courseName: assignment.courseId.title,
          type: 'feedback',
          title: 'Assignment Graded',
          body: notificationBody,
          userIds: [submission.studentId],
        });
      }
    }

    res.json({ submission });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
