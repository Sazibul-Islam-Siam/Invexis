const admin = require('../config/firebaseAdmin');
const User = require('../models/User');
const logAudit = require('../utils/logger');
const sendEmail = require('../utils/sendEmail');

// @desc    Get all users
// @route   GET /api/users
// @access  Private (Admin)
const getUsers = async (req, res, next) => {
  try {
    const { role, search, page = 1, limit = 20 } = req.query;
    const query = {};

    if (role) query.role = role;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [users, total] = await Promise.all([
      User.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      User.countDocuments(query),
    ]);

    res.json({
      success: true,
      count: users.length,
      total,
      pages: Math.ceil(total / parseInt(limit)),
      currentPage: parseInt(page),
      data: users,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single user
// @route   GET /api/users/:id
// @access  Private (Admin)
const getUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }
    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new user (creates in Firebase + MongoDB)
// @route   POST /api/users
// @access  Private (Admin)
const createUser = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    // Check if user already exists in MongoDB
    const exists = await User.findOne({ email });
    if (exists) {
      res.status(400);
      throw new Error('A user with this email already exists');
    }

    // Create user in Firebase Auth
    const firebaseUser = await admin.auth().createUser({
      email,
      password,
      displayName: name,
      emailVerified: false,
    });

    // Send email verification link via Firebase
    const verificationLink = await admin.auth().generateEmailVerificationLink(email);
    
    // Send custom styled verification email
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
              <p style="color:#c7d2fe;margin:8px 0 0;font-size:14px;">Smart Inventory Management System</p>
            </div>
            <div style="padding:32px 24px;">
              <p style="color:#e2e8f0;font-size:16px;margin:0 0 16px;">Hi <strong>${name}</strong>,</p>
              <p style="color:#94a3b8;font-size:14px;line-height:1.6;margin:0 0 24px;">
                Your account has been created as <strong>${role}</strong>. Please verify your email to activate your account:
              </p>
              <div style="text-align:center;margin:24px 0;">
                <a href="${verificationLink}" style="display:inline-block;background:#4f46e5;color:#fff;text-decoration:none;padding:12px 32px;border-radius:8px;font-weight:600;font-size:14px;">
                  Verify Email
                </a>
              </div>
              <p style="color:#64748b;font-size:12px;text-align:center;margin:24px 0 0;">
                After verification, log in with your email and the password provided by your admin.
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    // Create user in MongoDB
    const user = await User.create({
      name,
      email,
      role,
      firebaseUid: firebaseUser.uid,
    });

    logAudit(req.user._id, 'CREATE', 'User', user._id, `Created ${role} account for "${name}"`);

    res.status(201).json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt,
      },
      message: `Verification email sent to ${email}`,
    });
  } catch (error) {
    // If Firebase user was created but MongoDB failed, clean up
    if (error.message !== 'A user with this email already exists') {
      try {
        const fbUser = await admin.auth().getUserByEmail(req.body.email);
        if (fbUser) await admin.auth().deleteUser(fbUser.uid);
      } catch { /* ignore cleanup errors */ }
    }
    next(error);
  }
};

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private (Admin)
const updateUser = async (req, res, next) => {
  try {
    const { name, email, role, isActive, password } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }

    // Prevent admin from deactivating themselves
    if (req.user._id.toString() === user._id.toString() && isActive === false) {
      res.status(400);
      throw new Error('You cannot deactivate your own account');
    }

    // Check email uniqueness if changed
    if (email && email !== user.email) {
      const emailExists = await User.findOne({ email });
      if (emailExists) {
        res.status(400);
        throw new Error('A user with this email already exists');
      }
    }

    // Update Firebase user too
    const fbUpdate = {};
    if (name) fbUpdate.displayName = name;
    if (email && email !== user.email) fbUpdate.email = email;
    if (password) fbUpdate.password = password;
    if (typeof isActive === 'boolean') fbUpdate.disabled = !isActive;

    if (Object.keys(fbUpdate).length > 0 && user.firebaseUid) {
      await admin.auth().updateUser(user.firebaseUid, fbUpdate);
    }

    if (name) user.name = name;
    if (email) user.email = email;
    if (role) user.role = role;
    if (typeof isActive === 'boolean') user.isActive = isActive;

    await user.save();

    logAudit(req.user._id, 'UPDATE', 'User', user._id, `Updated user "${user.name}"`);

    res.json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private (Admin)
const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }

    // Prevent admin from deleting themselves
    if (req.user._id.toString() === user._id.toString()) {
      res.status(400);
      throw new Error('You cannot delete your own account');
    }

    // Delete from Firebase too
    if (user.firebaseUid) {
      try {
        await admin.auth().deleteUser(user.firebaseUid);
      } catch { /* ignore if already deleted in Firebase */ }
    }

    const userName = user.name;
    await user.deleteOne();
    logAudit(req.user._id, 'DELETE', 'User', req.params.id, `Deleted user "${userName}"`);
    res.json({ success: true, data: {} });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
};
