const admin = require('../config/firebaseAdmin');
const User = require('../models/User');
const logAudit = require('../utils/logger');
const sendEmail = require('../utils/sendEmail');

// @desc    Get all users (within same company)
// @route   GET /api/users
// @access  Private (Admin)
const getUsers = async (req, res, next) => {
  try {
    const { role, search, page = 1, limit = 20 } = req.query;
    const query = { company: req.user.company };

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

// @desc    Get single user (within same company)
const getUser = async (req, res, next) => {
  try {
    const user = await User.findOne({ _id: req.params.id, company: req.user.company });
    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }
    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new user within the admin's company
const createUser = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    const exists = await User.findOne({ email });
    if (exists) {
      res.status(400);
      throw new Error('A user with this email already exists');
    }

    // 1. Create user in Firebase (Unverified)
    const firebaseUser = await admin.auth().createUser({
      email,
      password,
      displayName: name,
      emailVerified: false,
    });

    // 2. Create user in MongoDB under the admin's company
    const user = await User.create({
      name,
      email,
      role,
      firebaseUid: firebaseUser.uid,
      company: req.user.company,
    });

    logAudit(req.user._id, 'CREATE', 'User', user._id, `Created ${role} account for "${name}"`, req.user.company);

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
      message: `User created! Tell them to log in at invexis.com to receive their verification email.`,
    });
  } catch (error) {
    if (error.message !== 'A user with this email already exists') {
      try {
        const fbUser = await admin.auth().getUserByEmail(req.body.email);
        if (fbUser) await admin.auth().deleteUser(fbUser.uid);
      } catch { /* ignore cleanup errors */ }
    }
    next(error);
  }
};

// @desc    Update user (within same company)
const updateUser = async (req, res, next) => {
  try {
    const { name, email, role, isActive, password } = req.body;
    const user = await User.findOne({ _id: req.params.id, company: req.user.company });

    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }

    if (req.user._id.toString() === user._id.toString() && isActive === false) {
      res.status(400);
      throw new Error('You cannot deactivate your own account');
    }

    if (email && email !== user.email) {
      const emailExists = await User.findOne({ email });
      if (emailExists) {
        res.status(400);
        throw new Error('A user with this email already exists');
      }
    }

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

    logAudit(req.user._id, 'UPDATE', 'User', user._id, `Updated user "${user.name}"`, req.user.company);

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

// @desc    Delete user (within same company)
const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findOne({ _id: req.params.id, company: req.user.company });

    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }

    if (req.user._id.toString() === user._id.toString()) {
      res.status(400);
      throw new Error('You cannot delete your own account');
    }

    if (user.firebaseUid) {
      try {
        await admin.auth().deleteUser(user.firebaseUid);
      } catch { /* ignore */ }
    }

    const userName = user.name;
    await user.deleteOne();
    logAudit(req.user._id, 'DELETE', 'User', req.params.id, `Deleted user "${userName}"`, req.user.company);
    res.json({ success: true, data: {} });
  } catch (error) {
    next(error);
  }
};

module.exports = { getUsers, getUser, createUser, updateUser, deleteUser };
