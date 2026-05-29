/**
 * notifyEnrolledStudents.js
 *
 * Given a course, creates an in-app notification for every enrolled student
 * and sends each an email notification (if EMAIL_USER / EMAIL_PASS are set).
 *
 * Usage:
 *   await notifyEnrolledStudents({
 *     courseId,
 *     courseCode: 'CSC101',
 *     courseName: 'Intro to CS',
 *     type: 'resource',
 *     title: 'New lecture slides uploaded',
 *     body: 'Week 5 — Data Structures',
 *   });
 */

import Notification from '../models/Notification.js';
import Enrollment   from '../models/Enrollment.js';
import nodemailer   from 'nodemailer';

// ── Email transporter (created lazily, cached) ──────────────────────────────
let _transporter = null;

function getTransporter() {
  if (_transporter) return _transporter;

  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;
  if (!user || !pass) {
    console.log('📧 EMAIL_USER / EMAIL_PASS not set — email notifications disabled');
    return null;
  }

  _transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass },
  });

  console.log(`📧 Email transport ready (${user})`);
  return _transporter;
}

// ── Main function ──────────────────────────────────────────────────────────
export async function notifyEnrolledStudents({
  courseId,
  courseCode,
  courseName,
  type,
  title,
  body = '',
  resourceId = null,
  dueDate = null,
}) {
  try {
    // 1. Find all students enrolled in this course
    const enrollments = await Enrollment.find({ course: courseId }).populate('user', 'name email');
    if (!enrollments.length) return;

    const link = resourceId
      ? `/courses/${courseCode}#resource-${resourceId}`
      : `/courses/${courseCode}`;

    // 2. Bulk-create in-app notifications
    const validEnrollments = enrollments.filter(e => e.user && e.user._id);
    if (!validEnrollments.length) return;

    const notifDocs = validEnrollments.map(e => ({
      userId:   e.user._id,
      courseId,
      resourceId: resourceId || undefined,
      type,
      title,
      body,
      link,
      read:      false,
      emailSent: false,
      dueDate:   dueDate || undefined,
    }));

    const inserted = await Notification.insertMany(notifDocs);
    console.log(`🔔 Created ${inserted.length} notifications for ${courseCode} (${type})`);

    // 3. Send emails (fire-and-forget — don't block the request)
    const transporter = getTransporter();
    if (!transporter) return;

    const emailPromises = validEnrollments.map(async (enrollment, idx) => {
      const student = enrollment.user;
      if (!student?.email) return;

      try {
        await transporter.sendMail({
          from: `"PAU LMS" <${process.env.EMAIL_USER}>`,
          to: student.email,
          subject: `${courseCode}: ${title}`,
          html: buildEmailHtml({
            studentName: student.name,
            courseCode,
            courseName,
            type,
            title,
            body,
            link: `${process.env.FRONTEND_URL || 'http://localhost:5173'}${link}`,
          }),
        });

        // Mark emailSent on the notification we just created
        if (inserted[idx]) {
          await Notification.updateOne({ _id: inserted[idx]._id }, { emailSent: true });
        }
      } catch (emailErr) {
        console.warn(`📧 Failed to email ${student.email}:`, emailErr.message);
      }
    });

    // Don't await — let emails send in background
    Promise.allSettled(emailPromises).then(results => {
      const sent = results.filter(r => r.status === 'fulfilled').length;
      console.log(`📧 Sent ${sent}/${enrollments.length} emails for ${courseCode}`);
    });

  } catch (err) {
    // Never let notification failures break the main request
    console.error('🔔 Notification error (non-fatal):', err.message);
  }
}

export async function notifySpecificStudents({
  courseId,
  courseCode,
  courseName,
  type,
  title,
  body = '',
  resourceId = null,
  dueDate = null,
  userIds = [],
}) {
  try {
    if (!userIds || !userIds.length) return;
    
    // Lazy import User model
    const User = (await import('../models/User.js')).default;
    const students = await User.find({ _id: { $in: userIds } }).select('name email');
    
    if (!students.length) return;

    const link = resourceId
      ? `/courses/${courseCode}#resource-${resourceId}`
      : `/courses/${courseCode}`;

    const notifDocs = students.map(student => ({
      userId:   student._id,
      courseId,
      resourceId: resourceId || undefined,
      type,
      title,
      body,
      link,
      read:      false,
      emailSent: false,
      dueDate:   dueDate || undefined,
    }));

    const inserted = await Notification.insertMany(notifDocs);
    console.log(`🔔 Created ${inserted.length} reminder notifications for ${courseCode}`);

    const transporter = getTransporter();
    if (!transporter) return;

    const emailPromises = students.map(async (student, idx) => {
      if (!student.email) return;
      try {
        await transporter.sendMail({
          from: `"PAU LMS" <${process.env.EMAIL_USER}>`,
          to: student.email,
          subject: `${courseCode}: ${title}`,
          html: buildEmailHtml({
            studentName: student.name,
            courseCode,
            courseName,
            type,
            title,
            body,
            link: `${process.env.FRONTEND_URL || 'http://localhost:5173'}${link}`,
          }),
        });
        if (inserted[idx]) {
          await Notification.updateOne({ _id: inserted[idx]._id }, { emailSent: true });
        }
      } catch (emailErr) {
        console.warn(`📧 Failed to email ${student.email}:`, emailErr.message);
      }
    });

    Promise.allSettled(emailPromises).then(results => {
      const sent = results.filter(r => r.status === 'fulfilled').length;
      console.log(`📧 Sent ${sent}/${students.length} reminder emails for ${courseCode}`);
    });

  } catch (err) {
    console.error('🔔 Specific Notification error (non-fatal):', err.message);
  }
}

// ── Email HTML template ──────────────────────────────────────────────────────
function buildEmailHtml({ studentName, courseCode, courseName, type, title, body, link }) {
  const typeLabel = {
    resource:     '📄 New Material',
    assignment:   '📝 New Assignment',
    quiz:         '❓ New Quiz',
    announcement: '📢 Announcement',
  }[type] || '🔔 Update';

  return `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 560px; margin: 0 auto; background: #f8fafc; padding: 32px 0;">
      <div style="background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #1e293b 0%, #334155 100%); padding: 24px 28px;">
          <h1 style="color: white; margin: 0; font-size: 18px; font-weight: 700;">PAU LMS</h1>
          <p style="color: #94a3b8; margin: 4px 0 0; font-size: 13px;">${typeLabel}</p>
        </div>

        <!-- Body -->
        <div style="padding: 28px;">
          <p style="color: #475569; font-size: 14px; margin: 0 0 16px;">Hi <strong>${studentName}</strong>,</p>

          <div style="background: #f1f5f9; border-left: 4px solid #6366f1; border-radius: 0 8px 8px 0; padding: 16px; margin-bottom: 24px;">
            <p style="font-size: 13px; color: #6366f1; font-weight: 600; margin: 0 0 4px;">${courseCode} — ${courseName || ''}</p>
            <p style="font-size: 15px; font-weight: 700; color: #1e293b; margin: 0;">${title}</p>
            ${body ? `<p style="font-size: 13px; color: #64748b; margin: 8px 0 0;">${body}</p>` : ''}
          </div>

          ${link ? `
            <div style="text-align: center; margin-bottom: 24px;">
              <a href="${link}" style="display: inline-block; background: #6366f1; color: white; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-size: 14px; font-weight: 600; box-shadow: 0 2px 4px rgba(99,102,241,0.3);">
                View Details
              </a>
            </div>
          ` : ''}

          <p style="color: #64748b; font-size: 13px; margin: 0; text-align: center;">
            Log in to your LMS dashboard to view your course updates.
          </p>
        </div>

        <!-- Footer -->
        <div style="border-top: 1px solid #e2e8f0; padding: 16px 28px; background: #f8fafc;">
          <p style="color: #94a3b8; font-size: 11px; margin: 0;">
            This is an automated notification from PAU LMS. Do not reply to this email.
          </p>
        </div>
      </div>
    </div>
  `;
}
