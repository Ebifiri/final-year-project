/**
 * Seed a test user into the database.
 *
 * Usage (from project root):
 *   node server/scripts/seedUser.js
 *
 * Make sure server/.env exists with a valid MONGODB_URI before running.
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '../.env') });

import mongoose from 'mongoose';
import User from '../models/User.js';

async function seedUser() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const existing = await User.findOne({ email: 'student@pau.edu.ng' });
    if (existing) {
      console.log('ℹ️  Test user already exists — skipping');
      await mongoose.disconnect();
      return;
    }

    await User.create({
      name:     'Test Student',
      email:    'student@pau.edu.ng',
      password: 'password123',
      role:     'student',
    });

    console.log('🌱 Created test user:');
    console.log('   Email:    student@pau.edu.ng');
    console.log('   Password: password123');

    await mongoose.disconnect();
    console.log('✅ Done');
  } catch (err) {
    console.error('❌ Failed:', err.message);
    process.exit(1);
  }
}

seedUser();
