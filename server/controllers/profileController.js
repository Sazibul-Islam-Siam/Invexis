const User = require('../models/User');
const fs = require('fs');
const path = require('path');

// @desc    Get my profile
// @route   GET /api/profile
// @access  Private
const getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

// @desc    Update my profile
// @route   PUT /api/profile
// @access  Private
const updateProfile = async (req, res, next) => {
  try {
    const { name, email, currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select('+password');

    if (email && email !== user.email) {
      const exists = await User.findOne({ email });
      if (exists) {
        res.status(400);
        throw new Error('Email already in use');
      }
    }

    if (newPassword) {
      if (!currentPassword) {
        res.status(400);
        throw new Error('Please provide current password');
      }
      const bcrypt = require('bcryptjs');
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        res.status(400);
        throw new Error('Current password is incorrect');
      }
      user.password = newPassword;
    }

    if (name) user.name = name;
    if (email) user.email = email;

    await user.save();

    res.json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        profilePicture: user.profilePicture,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Upload profile picture
// @route   POST /api/profile/avatar
// @access  Private
const uploadAvatar = async (req, res, next) => {
  try {
    if (!req.file) {
      res.status(400);
      throw new Error('Please upload an image');
    }

    const user = await User.findById(req.user._id);

    // Delete old avatar if exists
    if (user.profilePicture) {
      const oldPath = path.join(__dirname, '..', user.profilePicture);
      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
      }
    }

    user.profilePicture = `/uploads/${req.file.filename}`;
    await user.save();

    res.json({
      success: true,
      data: { profilePicture: user.profilePicture },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getProfile, updateProfile, uploadAvatar };
