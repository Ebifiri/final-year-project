/**
 * Seeds a test lecturer account and assigns them to every course.
 *
 * Usage (from project root):
 *   node server/scripts/seedLecturer.js
 *
 * Credentials:
 *   Email:    lecturer@pau.edu.ng
 *   Password: lecturer123
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '../.env') });

import mongoose from 'mongoose';
import User     from '../models/User.js';
import Course   from '../models/Course.js';

async function seedLecturer() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Create or fetch lecturer account
    let lecturer = await User.findOne({ email: 'lecturer@pau.edu.ng' });

    if (lecturer) {
      console.log('ℹ️  Lecturer account already exists — updating course assignments');
    } else {
      lecturer = await User.create({
        name:     'Dr. Amara Okonkwo',
        email:    'lecturer@pau.edu.ng',
        password: 'lecturer123',
        role:     'lecturer',
      });
      console.log('🌱 Created lecturer account:');
      console.log('   Name:     Dr. Amara Okonkwo');
      console.log('   Email:    lecturer@pau.edu.ng');
      console.log('   Password: lecturer123');
    }

    // Assign lecturer to every course
    const result = await Course.updateMany(
      {},
      { $addToSet: { lecturers: lecturer._id } }
    );

    console.log(`📚 Assigned lecturer to ${result.modifiedCount} course(s) (${result.matchedCount} total)`);

    await mongoose.disconnect();
    console.log('✅ Done');
  } catch (err) {
    console.error('❌ Failed:', err.message);
    process.exit(1);
  }
}

seedLecturer();
