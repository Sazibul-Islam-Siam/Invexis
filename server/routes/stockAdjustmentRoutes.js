const express = require('express');
const router = express.Router();
const {
  getStockAdjustments,
  createStockAdjustment,
} = require('../controllers/stockAdjustmentController');
const { protect, authorize, blockSuperAdmin } = require('../middleware/auth');

router.use(protect);
router.use(blockSuperAdmin);

// Staff can view and create stock adjustments
router.get('/', authorize('admin', 'staff'), getStockAdjustments);
router.post('/', authorize('admin', 'staff'), createStockAdjustment);

module.exports = router;
