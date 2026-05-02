const express = require('express');
const router = express.Router();
const { getProfile, updateProfile, uploadAvatar } = require('../controllers/profileController');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.use(protect);
router.route('/').get(getProfile).put(updateProfile);
router.post('/avatar', upload.single('avatar'), uploadAvatar);

module.exports = router;
