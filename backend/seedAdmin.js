// backend/seedAdmin.js
// ─────────────────────────────────────────────────────────────
// Run this script ONE TIME to create the first admin account.
// Usage:  node seedAdmin.js
//
// IMPORTANT:
//   - Change the credentials below before running in production.
//   - Never commit real passwords to version control.
// ─────────────────────────────────────────────────────────────

require('dotenv').config();

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

const ADMIN_NAME = 'Admin';
const ADMIN_EMAIL = 'admin@threadly.com';
const ADMIN_PASSWORD = 'admin123456'; // Change this before going live!

async function seedAdmin() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB...');

    // Check if admin already exists
    const existing = await User.findOne({ email: ADMIN_EMAIL });
    if (existing) {
      console.log('Admin account already exists. No changes made.');
      process.exit(0);
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, salt);

    // Create admin user
    await User.create({
      name: ADMIN_NAME,
      email: ADMIN_EMAIL,
      password: hashedPassword,
      role: 'admin',
    });

    console.log('✅ Admin account created successfully!');
    console.log('   Email   :', ADMIN_EMAIL);
    console.log('   Password:', ADMIN_PASSWORD);
    console.log('');
    console.log('⚠️  IMPORTANT: Change the admin password after your first login!');
    process.exit(0);

  } catch (error) {
    console.error('Seed error:', error.message);
    process.exit(1);
  }
}

seedAdmin();
