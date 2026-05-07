const User = require('../models/User');
const admin = require('../config/firebaseAdmin');
const fs = require('fs');
const path = require('path');
const cloudinary = require('../config/cloudinary');
const streamifier = require('streamifier');
const sendEmail = require('../utils/sendEmail');

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
        await admin.auth().updateUser(user.firebaseUid, { email, emailVerified: false });
        
        // Send email verification link via Firebase
        const verificationLink = await admin.auth().generateEmailVerificationLink(email);
        
        await sendEmail({
          to: email,
          subject: 'Verify Your New Email — Invexis',
          html: `
            <!DOCTYPE html>
            <html>
            <body style="margin:0;padding:0;background:#0f172a;font-family:Arial,sans-serif;">
              <div style="max-width:500px;margin:40px auto;background:#1e293b;border-radius:16px;overflow:hidden;border:1px solid #334155;">
                <div style="padding:32px 24px;text-align:center;background:linear-gradient(135deg,#4f46e5,#7c3aed);">
                  <h1 style="color:#fff;margin:0;font-size:24px;">Email Change Verification</h1>
                </div>
                <div style="padding:32px 24px;">
                  <p style="color:#e2e8f0;font-size:16px;margin:0 0 16px;">Hi <strong>${user.name}</strong>,</p>
                  <p style="color:#94a3b8;font-size:14px;line-height:1.6;margin:0 0 24px;">
                    You recently requested to change your email address. Please verify your new email to continue using your account:
                  </p>
                  <div style="text-align:center;margin:24px 0;">
                    <a href="${verificationLink}" style="display:inline-block;background:#4f46e5;color:#fff;text-decoration:none;padding:12px 32px;border-radius:8px;font-weight:600;font-size:14px;">
                      Verify New Email
                    </a>
                  </div>
                </div>
              </div>
            </body>
            </html>
          `,
        });
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
