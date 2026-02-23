import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env.local') });

const User = (await import('../models/User.js')).default;
const Department = (await import('../models/Department.js')).default;
const RoleDefinition = (await import('../models/RoleDefinition.js')).default;

const DEPARTMENTS = [
  'Human Resources',
  'Information Technology',
  'Finance',
  'Operations',
  'Customer Service',
  'Quality Assurance',
  'Sales & Marketing',
  'Legal & Compliance',
];

const ROLE_DEFINITIONS = [
  { name: 'Process Owner', description: 'Owns and maintains the SOP' },
  { name: 'Department Head', description: 'Oversees department SOPs' },
  { name: 'Quality Manager', description: 'Ensures quality compliance' },
  { name: 'Training Coordinator', description: 'Manages SOP training' },
  { name: 'Compliance Officer', description: 'Ensures regulatory compliance' },
  { name: 'Operations Manager', description: 'Manages operational procedures' },
  { name: 'IT Administrator', description: 'Manages technical procedures' },
  { name: 'Safety Officer', description: 'Manages safety procedures' },
];

async function seed() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/sop-manager';
  console.log('Connecting to MongoDB...');
  await mongoose.connect(uri);
  console.log('Connected.');

  try {
    const userCount = await User.countDocuments();
    if (userCount > 0) {
      console.log('Database already has data. Skipping seed.');
      return;
    }

    console.log('Seeding departments...');
    const departments = await Department.insertMany(
      DEPARTMENTS.map((name) => ({ name, description: '' }))
    );
    console.log(`Created ${departments.length} departments.`);

    console.log('Seeding role definitions...');
    const roles = await RoleDefinition.insertMany(ROLE_DEFINITIONS);
    console.log(`Created ${roles.length} role definitions.`);

    console.log('Seeding admin user...');
    const passwordHash = await bcrypt.hash('admin', 12);
    const admin = await User.create({
      username: 'admin',
      email: 'admin@sopmanager.com',
      passwordHash,
      roles: ['super_admin', 'sop_writer', 'sop_approver'],
      departments: departments.map((d) => d._id),
      isActive: true,
    });
    console.log(`Created admin user: ${admin.username}`);

    console.log('Seed completed successfully.');
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
  }
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
