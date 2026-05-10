const express = require('express');
const router = express.Router();
const { syncUser, registerCompany, getMe } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

router.post('/sync', syncUser);
router.post('/register-company', registerCompany);
router.get('/me', protect, getMe);

module.exports = router;
