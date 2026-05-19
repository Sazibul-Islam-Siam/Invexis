/**
 * Seed Super Admin Account
 * 
 * Usage: node scripts/seedSuperAdmin.js
 * 
 * This script creates a super_admin user in both Firebase and MongoDB.
 * The super_admin has NO company — they manage companies at the platform level.
 * 
 * ⚠️  Run this only ONCE. If the account already exists, the script will skip creation.
 */

require('dotenv').config();
const mongoose = require('mongoose');
const admin = require('../config/firebaseAdmin');
const User = require('../models/User');
const connectDB = require('../config/db');

// ─── Configure these values ────────────────────────────────────
const SUPER_ADMIN_EMAIL = 'superadmin@invexis.com';
const SUPER_ADMIN_PASSWORD = '123456';
const SUPER_ADMIN_NAME = 'Sazzad Hossain Siam';
// ────────────────────────────────────────────────────────────────

const seed = async () => {
  try {
    await connectDB();

    // Check if super admin already exists in MongoDB
    const existing = await User.findOne({ role: 'super_admin' });
    if (existing) {
      console.log('⚠️  Super Admin already exists in MongoDB:');
      console.log(`   Name:  ${existing.name}`);
      console.log(`   Email: ${existing.email}`);
      console.log('   Skipping creation.');
      process.exit(0);
    }

    // 1. Create Firebase user
    let firebaseUser;
    try {
      firebaseUser = await admin.auth().getUserByEmail(SUPER_ADMIN_EMAIL);
      console.log('ℹ️  Firebase user already exists, reusing...');
    } catch {
      firebaseUser = await admin.auth().createUser({
        email: SUPER_ADMIN_EMAIL,
        password: SUPER_ADMIN_PASSWORD,
        displayName: SUPER_ADMIN_NAME,
        emailVerified: true, // Super admin is pre-verified
      });
      console.log('✅ Firebase user created');
    }

    // 2. Create MongoDB user (no company)
    const user = await User.create({
      name: SUPER_ADMIN_NAME,
      email: SUPER_ADMIN_EMAIL,
      firebaseUid: firebaseUser.uid,
      role: 'super_admin',
      // company is intentionally omitted — super_admin has no company
    });

    console.log('✅ Super Admin created successfully!');
    console.log('──────────────────────────────────');
    console.log(`   Name:     ${user.name}`);
    console.log(`   Email:    ${SUPER_ADMIN_EMAIL}`);
    console.log(`   Password: ${SUPER_ADMIN_PASSWORD}`);
    console.log(`   Role:     ${user.role}`);
    console.log('──────────────────────────────────');
    console.log('🔒 Please change the password after first login.');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seed failed:', error.message);
    process.exit(1);
  }
};

seed();
