import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from '../models/User.js';
import hashPassword from '../utils/hashPassword.js';

dotenv.config();

const MONGO = process.env.MONGO_URI || process.env.MONGO || process.env.DB_URI || process.env.DB_URL || 'mongodb://127.0.0.1:27017/myapp';

async function run() {
  await mongoose.connect(MONGO, { serverSelectionTimeoutMS: 5000 });

  const name = process.env.SUPER_ADMIN_NAME;
  const email = process.env.SUPER_ADMIN_EMAIL;
  const plain = process.env.SUPER_ADMIN_PASSWORD;

  if (!name || !email || !plain) {
    console.error('Please set SUPER_ADMIN_NAME, SUPER_ADMIN_EMAIL and SUPER_ADMIN_PASSWORD in environment variables');
    process.exit(1);
  }

  const existing = await User.findOne({ email, role: 'super_admin' });
  if (existing) {
    console.log('Super admin already exists:', email);
    process.exit(0);
  }

  const hashed = await hashPassword(plain);
  const user = new User({ name, email, password: hashed, role: 'super_admin', isVerified: true });
  await user.save();
  console.log('Created super admin:', email);
  process.exit(0);
}

run().catch(err => { console.error(err); process.exit(1); });
