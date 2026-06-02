const express = require('express');
const router = express.Router();
const {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  checkSupplierEmail,
} = require('../controllers/userController');
const { protect, authorize, blockSuperAdmin } = require('../middleware/auth');

// All routes require admin and block super_admin
router.use(protect);
router.use(blockSuperAdmin);
router.use(authorize('admin'));

router.post('/check-email', checkSupplierEmail);

router.route('/').get(getUsers).post(createUser);
router.route('/:id').get(getUser).put(updateUser).delete(deleteUser);

module.exports = router;
