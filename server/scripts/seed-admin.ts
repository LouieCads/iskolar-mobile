import dotenv from 'dotenv';
import { resolve } from 'path';
dotenv.config({ path: resolve(process.cwd(), '.env') });

import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import sequelize from '../config/database';
import User from '../models/Users';

const EMAIL = process.env.EMAIL || 'admin@gmail.com';
const PASSWORD = process.env.PASSWORD || 'Password123@';

export async function seedAdmin() {
  const existing = await User.findOne({ where: { email: EMAIL } });
  if (existing) {
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

// Allow running as standalone script
if (process.argv[1]?.includes('seed-admin')) {
  sequelize.authenticate()
    .then(() => seedAdmin())
    .catch((err) => {
      console.error('❌ Failed:', err.message);
      process.exit(1);
    })
    .finally(() => sequelize.close());
}