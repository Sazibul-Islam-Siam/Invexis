const admin = require('../config/firebaseAdmin');
const User = require('../models/User');
const Company = require('../models/Company');
const logAudit = require('../utils/logger');
const sendEmail = require('../utils/sendEmail');

// @desc    Sync Firebase user with MongoDB (called after frontend login)
// @route   POST /api/auth/sync
// @access  Public (but requires valid Firebase token)
const syncUser = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer')) {
      res.status(401);
      throw new Error('No token provided');
    }

    const token = authHeader.split(' ')[1];
    const decoded = await admin.auth().verifyIdToken(token);

    let user = await User.findOne({ firebaseUid: decoded.uid }).populate('company', 'name slug');

    if (!user) {
      res.status(404);
      throw new Error('Account not found. Please contact admin to create your account.');
    }

    if (!user.isActive) {
      res.status(401);
      throw new Error('Account has been deactivated. Contact an administrator.');
    }

    logAudit(user._id, 'LOGIN', 'Auth', user._id, `${user.name} logged in (${user.role})`, user.company._id || user.company);

    res.json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        profilePicture: user.profilePicture || '',
        company: user.company,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Register a new company + admin user
// @route   POST /api/auth/register-company
// @access  Public
const registerCompany = async (req, res, next) => {
  try {
    const { companyName, name, email, password } = req.body;

    if (!companyName || !name || !email || !password) {
      res.status(400);
      throw new Error('Please provide company name, your name, email, and password');
    }

    // Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.status(400);
      throw new Error('A user with this email already exists');
    }

    // Check if company name already exists
    const existingCompany = await Company.findOne({
      slug: companyName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
    });
    if (existingCompany) {
      res.status(400);
      throw new Error('A company with this name already exists');
    }

    // 1. Create Firebase user
    const firebaseUser = await admin.auth().createUser({
      email,
      password,
      displayName: name,
      emailVerified: false,
    });

    // 2. Create company in MongoDB
    const company = await Company.create({ name: companyName });

    // 3. Create admin user in MongoDB
    const user = await User.create({
      name,
      email,
      firebaseUid: firebaseUser.uid,
      role: 'admin',
      company: company._id,
    });

    // 4. Set company owner
    company.owner = user._id;
    await company.save();

    // 5. Send verification email
    const verificationLink = await admin.auth().generateEmailVerificationLink(email);
    await sendEmail({
      to: email,
      subject: 'Verify Your Email — Invexis',
      html: `
        <!DOCTYPE html>
        <html>
        <body style="margin:0;padding:0;background:#0f172a;font-family:Arial,sans-serif;">
          <div style="max-width:500px;margin:40px auto;background:#1e293b;border-radius:16px;overflow:hidden;border:1px solid #334155;">
            <div style="padding:32px 24px;text-align:center;background:linear-gradient(135deg,#4f46e5,#7c3aed);">
              <h1 style="color:#fff;margin:0;font-size:24px;">Welcome to Invexis</h1>
              <p style="color:#c7d2fe;margin:8px 0 0;font-size:14px;">Your company "${companyName}" has been created!</p>
            </div>
            <div style="padding:32px 24px;">
              <p style="color:#e2e8f0;font-size:16px;margin:0 0 16px;">Hi <strong>${name}</strong>,</p>
              <p style="color:#94a3b8;font-size:14px;line-height:1.6;margin:0 0 24px;">
                Please verify your email to activate your account and start managing your inventory:
              </p>
              <div style="text-align:center;margin:24px 0;">
                <a href="${verificationLink}" style="display:inline-block;background:#4f46e5;color:#fff;text-decoration:none;padding:12px 32px;border-radius:8px;font-weight:600;font-size:14px;">
                  Verify Email
                </a>
              </div>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    res.status(201).json({
      success: true,
      message: `Company "${companyName}" created! Please check ${email} to verify your account.`,
      data: {
        company: { _id: company._id, name: company.name, slug: company.slug },
        user: { _id: user._id, name: user.name, email: user.email, role: user.role },
      },
    });
  } catch (error) {
    // Cleanup on failure
    try {
      const fbUser = await admin.auth().getUserByEmail(req.body.email).catch(() => null);
      if (fbUser) await admin.auth().deleteUser(fbUser.uid);
    } catch { /* ignore */ }
    next(error);
  }
};

// @desc    Get current logged-in user
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).populate('company', 'name slug');
    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

module.exports = { syncUser, registerCompany, getMe };
