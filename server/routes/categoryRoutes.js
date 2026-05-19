const express = require('express');
const router = express.Router();
const {
  getCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
} = require('../controllers/categoryController');
const { protect, authorize, blockSuperAdmin } = require('../middleware/auth');

// All routes require authentication and block super_admin
router.use(protect);
router.use(blockSuperAdmin);

router
  .route('/')
  .get(getCategories)
  .post(authorize('admin'), createCategory);

router
  .route('/:id')
  .get(getCategory)
  .put(authorize('admin'), updateCategory)
  .delete(authorize('admin'), deleteCategory);

module.exports = router;
