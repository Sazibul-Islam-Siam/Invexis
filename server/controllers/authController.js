const admin = require('../config/firebaseAdmin');
const User = require('../models/User');
const Company = require('../models/Company');
const logAudit = require('../utils/logger');

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

    let userQuery = User.findOne({ firebaseUid: decoded.uid });
    // Only populate company for non-super_admin users
    // We need to check after fetching, so always try populate (it will be null for super_admin)
    userQuery = userQuery.populate('company', 'name slug');

    let user = await userQuery;

    if (!user) {
      res.status(404);
      throw new Error('Account not found. Please contact admin to create your account.');
    }

    if (!user.isActive) {
      res.status(401);
      throw new Error('Account has been deactivated. Contact an administrator.');
    }

    const companyId = user.company?._id || user.company || null;
    logAudit(user._id, 'LOGIN', 'Auth', user._id, `${user.name} logged in (${user.role})`, companyId);

    res.json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        profilePicture: user.profilePicture || '',
        company: user.company || null,
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

    // 5. Verification email is now sent from the FRONTEND using Firebase's
    //    built-in sendEmailVerification() — no SMTP needed on the server.

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
