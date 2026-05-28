import cron from 'node-cron';
import Assignment from '../models/Assignment.js';
import Enrollment from '../models/Enrollment.js';
import Submission from '../models/Submission.js';
import { notifySpecificStudents } from './notifyEnrolledStudents.js';

/**
 * Starts the background cron job to send reminders for assignments.
 * Default runs every hour at the top of the hour.
 */
export function startReminderCron() {
  console.log('⏰ Initializing Assignment Reminder Cron Job...');
  
  // Run every hour: '0 * * * *'
  cron.schedule('0 * * * *', async () => {
    console.log('⏰ Running hourly assignment reminder check...');
    try {
      const now = new Date();
      // Look for assignments due within the next 24 hours, but not yet due.
      const twentyFourHoursFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      const upcomingAssignments = await Assignment.find({
        dueDate: {
          $gte: now,
          $lte: twentyFourHoursFromNow
        }
      }).populate('courseId', 'code name');

      for (const assignment of upcomingAssignments) {
        // Find all students enrolled in the course
        const enrollments = await Enrollment.find({ course: assignment.courseId._id }).select('user');
        const enrolledStudentIds = enrollments.map(e => e.user);

        // Find students who have already submitted
        const submissions = await Submission.find({
          assignmentId: assignment._id,
          studentId: { $in: enrolledStudentIds }
        }).select('studentId');

        const submittedStudentIds = submissions.map(s => s.studentId.toString());

        // Filter out those who have submitted
        const studentsToRemind = enrolledStudentIds.filter(
          studentId => !submittedStudentIds.includes(studentId.toString())
        );

        if (studentsToRemind.length > 0) {
          console.log(`⏰ Sending reminders for assignment '${assignment.title}' to ${studentsToRemind.length} students...`);
          
          await notifySpecificStudents({
            courseId: assignment.courseId._id,
            courseCode: assignment.courseId.code,
            courseName: assignment.courseId.name,
            type: 'assignment',
            title: `Reminder: ${assignment.title} is due soon!`,
            body: `This assignment is due in less than 24 hours. Don't forget to submit it on time!`,
            resourceId: assignment._id,
            dueDate: assignment.dueDate,
            userIds: studentsToRemind,
          });
        }
      }
    } catch (err) {
      console.error('⏰ Error running assignment reminder cron:', err.message);
    }
  });
}
