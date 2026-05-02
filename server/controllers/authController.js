const admin = require('../config/firebaseAdmin');
const User = require('../models/User');
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

    // Find or recognize the user in MongoDB
    let user = await User.findOne({ firebaseUid: decoded.uid });

    if (!user) {
      res.status(404);
      throw new Error('Account not found. Please contact admin to create your account.');
    }

    if (!user.isActive) {
      res.status(401);
      throw new Error('Account has been deactivated. Contact an administrator.');
    }

    logAudit(user._id, 'LOGIN', 'Auth', user._id, `${user.name} logged in (${user.role})`);

    res.json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        profilePicture: user.profilePicture || '',
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current logged-in user
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  syncUser,
  getMe,
};
