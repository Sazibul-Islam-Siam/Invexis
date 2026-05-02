const express = require('express');
const router = express.Router();
const { syncUser, getMe } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

router.post('/sync', syncUser);
router.get('/me', protect, getMe);

module.exports = router;
