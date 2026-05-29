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
    try {
      const now = new Date();
      // Look for any assignment that is due in the future
      const upcomingAssignments = await Assignment.find({
        dueDate: { $gte: now }
      }).populate('courseId', 'code name');

      for (const assignment of upcomingAssignments) {
        const hoursLeft = (assignment.dueDate - now) / (1000 * 60 * 60);
        
        let reminderType = null;
        let title = '';
        let body = '';

        // Check which reminder window we are in. We check if the threshold is reached AND we haven't sent it yet.
        // We use the optional chaining operator in case the remindersSent object is missing on older documents.
        if (hoursLeft <= 1 && !assignment.remindersSent?.oneHour) {
          reminderType = 'oneHour';
          title = `URGENT: ${assignment.title} is due in 1 HOUR!`;
          body = `Final reminder! You have less than 1 hour to submit this assignment.`;
        } else if (hoursLeft <= 6 && hoursLeft > 1 && !assignment.remindersSent?.sixHours) {
          reminderType = 'sixHours';
          title = `Reminder: ${assignment.title} is due in 6 hours`;
          body = `This assignment is due in a few hours. Make sure you submit it on time.`;
        } else if (hoursLeft <= 24 && hoursLeft > 6 && !assignment.remindersSent?.twentyFourHours) {
          reminderType = 'twentyFourHours';
          title = `Reminder: ${assignment.title} is due tomorrow`;
          body = `This assignment is due in less than 24 hours.`;
        } else if (hoursLeft <= 72 && hoursLeft > 24 && !assignment.remindersSent?.threeDays) {
          reminderType = 'threeDays';
          title = `Upcoming: ${assignment.title} is due in 3 days`;
          body = `Just a heads-up! This assignment is due in 3 days.`;
        }

        if (reminderType) {
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
            console.log(`⏰ Sending ${reminderType} reminder for '${assignment.title}' to ${studentsToRemind.length} students...`);
            
            await notifySpecificStudents({
              courseId: assignment.courseId._id,
              courseCode: assignment.courseId.code,
              courseName: assignment.courseId.name,
              type: 'assignment',
              title,
              body,
              resourceId: assignment._id,
              dueDate: assignment.dueDate,
              userIds: studentsToRemind,
            });
          }

          // Mark this reminder as sent for this assignment
          const updateKey = `remindersSent.${reminderType}`;
          await Assignment.findByIdAndUpdate(assignment._id, {
             $set: { [updateKey]: true }
          });
        }
      }
    } catch (err) {
      console.error('⏰ Error running assignment reminder cron:', err.message);
    }
  });
}
