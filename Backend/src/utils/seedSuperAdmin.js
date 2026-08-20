import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from '../models/User.js';
import hashPassword from './hashPassword.js';

dotenv.config();

const MONGO = process.env.MONGO_URI || process.env.MONGO || process.env.DB_URI || 'mongodb://localhost:27017/myapp';

async function run() {
  await mongoose.connect(MONGO, { serverSelectionTimeoutMS: 5000 });
  const email = 'darshh399.com';
  const name = 'Sudarshan Shinde';
  const plain = 'Darshh@123';
  const role = 'super_admin';

  let user = await User.findOne({ email });
  if (user) {
    console.log('Super admin already exists:', email);
    process.exit(0);
  }
  const hashed = await hashPassword(plain);
  user = new User({ name, email, password: hashed, role, isVerified: true });
  await user.save();
  console.log('Created super admin:', email);
  process.exit(0);
}

run().catch(err => { console.error(err); process.exit(1); });
