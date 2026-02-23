#!/usr/bin/env node
/**
 * Create or reset admin user (username: admin, password: admin)
 * Usage: node scripts/create-admin.mjs
 */

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import User from '../models/User';
import Department from '../models/Department';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env.local') });

async function createAdmin() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/sop-manager';
  console.log('Connecting to MongoDB...');
  await mongoose.connect(uri);

  try {
    const departments = await Department.find().lean();
    const deptIds = departments.map((d) => d._id);
    const passwordHash = await bcrypt.hash('admin', 12);

    let admin = await User.findOne({ username: 'admin' });
    if (admin) {
      admin.passwordHash = passwordHash;
      admin.email = 'admin@sopmanager.com';
      admin.roles = ['super_admin', 'sop_writer', 'sop_approver'];
      admin.departments = deptIds;
      admin.isActive = true;
      await admin.save();
      console.log('Admin user password reset successfully.');
    } else {
      admin = await User.create({
        username: 'admin',
        email: 'admin@sopmanager.com',
        passwordHash,
        roles: ['super_admin', 'sop_writer', 'sop_approver'],
        departments: deptIds,
        isActive: true,
      });
      console.log('Admin user created successfully.');
    }
    console.log('Username: admin');
    console.log('Password: admin');
  } finally {
    await mongoose.disconnect();
    console.log('Done.');
  }
}

createAdmin().catch((err) => {
  console.error('Failed:', err);
  process.exit(1);
});
