const express = require('express');
const router = express.Router();
const {
  getSales,
  getSale,
  createSale,
  deleteSale,
} = require('../controllers/saleController');
const { protect, authorize, blockSuperAdmin } = require('../middleware/auth');

// All routes require authentication and block super_admin
router.use(protect);
router.use(blockSuperAdmin);

router
  .route('/')
  .get(getSales)
  .post(authorize('admin', 'staff'), createSale);

router
  .route('/:id')
  .get(getSale)
  .delete(authorize('admin'), deleteSale);

module.exports = router;
