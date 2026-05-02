const User = require('../models/User');
const admin = require('../config/firebaseAdmin');
const fs = require('fs');
const path = require('path');
const cloudinary = require('../config/cloudinary');
const streamifier = require('streamifier');

// @desc    Get my profile
// @route   GET /api/profile
// @access  Private
const getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

// @desc    Update my profile (name, email only — password changes handled by Firebase)
// @route   PUT /api/profile
// @access  Private
const updateProfile = async (req, res, next) => {
  try {
    const { name, email } = req.body;
    const user = await User.findById(req.user._id);

    if (email && email !== user.email) {
      const exists = await User.findOne({ email });
      if (exists) {
        res.status(400);
        throw new Error('Email already in use');
      }
      // Update email in Firebase too
      if (user.firebaseUid) {
        await admin.auth().updateUser(user.firebaseUid, { email });
      }
    }

    if (name) {
      user.name = name;
      // Sync display name to Firebase
      if (user.firebaseUid) {
        await admin.auth().updateUser(user.firebaseUid, { displayName: name });
      }
    }
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

    // Delete old avatar if exists (only local ones)
    if (user.profilePicture && !user.profilePicture.startsWith('http')) {
      const oldPath = path.join(__dirname, '..', user.profilePicture);
      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
      }
    }

    // Upload to Cloudinary
    const streamUpload = (req) => {
      return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: 'invexis_avatars',
            transformation: [{ width: 300, height: 300, crop: 'fill' }],
          },
          (error, result) => {
            if (result) {
              resolve(result);
            } else {
              reject(error);
            }
          }
        );
        streamifier.createReadStream(req.file.buffer).pipe(stream);
      });
    };

    const result = await streamUpload(req);

    user.profilePicture = result.secure_url;
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
