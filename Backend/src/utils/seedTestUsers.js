import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

import User from '../models/User.js';
import Company from '../models/Company.js';
import hashPassword from './hashPassword.js';
import createToken from './createToken.js';

async function main() {
  const MONGO_URI = process.env.MONGO_URI || process.env.MONGO || 'mongodb://127.0.0.1:27017/testdb';
  await mongoose.connect(MONGO_URI);
  console.log('Connected to', MONGO_URI);

  const company = await Company.findOneAndUpdate(
    { companyName: 'TestCorp' },
    { $setOnInsert: { companyName: 'TestCorp', status: 'ACTIVE' } },
    { new: true, upsert: true }
  );

  const users = [
    { name: 'Test Company Owner', email: 'owner@test.local', role: 'company_owner', mobile: '9999999911' },
    { name: 'Test MR Employee', email: 'mr@test.local', role: 'mr', mobile: '9999999912' }
  ];
  const created = [];
  for (const details of users) {
    const password = details.role === 'company_owner' ? 'Owner@123' : 'Mr@123';
    const u = await User.findOneAndUpdate(
      { email: details.email },
      { ...details, password: await hashPassword(password), companyId: company._id, isVerified: true, active: true, blocked: false },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    );
    const token = createToken({ id: u._id, email: u.email, role: u.role, companyId: u.companyId });
    created.push({ role: u.role, email: u.email, password, token });

    if (u.role === 'company_owner') {
      company.ownerId = u._id;
      await company.save();
    }
  }

  console.log('Test company:', company.companyName);
  console.log('Seeded test users (credentials):');
  console.table(created);
  process.exit(0);
}

main().catch((err) => { console.error(err); process.exit(1); });
