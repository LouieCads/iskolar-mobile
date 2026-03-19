import dotenv from 'dotenv';
import { resolve } from 'path';
dotenv.config({ path: resolve(process.cwd(), '.env') });

import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import sequelize from '../config/database.js';
import User from '../models/Users.js';

const EMAIL = process.env.EMAIL || 'admin@gmail.com';
const PASSWORD = process.env.PASSWORD || 'Password123@';

async function seedAdmin() {
  await sequelize.authenticate();

  const existing = await User.findOne({ where: { email: EMAIL } });
  if (existing) {
    // Ensure it has admin role
    await existing.update({ role: 'admin', has_selected_role: true });
    console.log('✅ Existing user updated to admin role.');
    return;
  }

  const hashed = await bcrypt.hash(PASSWORD, 15);
  await User.create({
    user_id: uuidv4(),
    email: EMAIL,
    password: hashed,
    role: 'admin',
    has_selected_role: true,
  });

  console.log('✅ Admin account created:', EMAIL);
}

seedAdmin()
  .catch((err) => {
    console.error('❌ Failed:', err.message);
    process.exit(1);
  })
  .finally(() => sequelize.close());