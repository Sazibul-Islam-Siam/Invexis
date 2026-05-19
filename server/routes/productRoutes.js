const express = require('express');
const router = express.Router();
const {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
} = require('../controllers/productController');
const { protect, authorize, blockSuperAdmin } = require('../middleware/auth');

// All routes require authentication and block super_admin
router.use(protect);
router.use(blockSuperAdmin);

router
  .route('/')
  .get(getProducts)
  .post(authorize('admin'), createProduct);

router
  .route('/:id')
  .get(getProduct)
  .put(authorize('admin'), updateProduct)
  .delete(authorize('admin'), deleteProduct);

module.exports = router;
