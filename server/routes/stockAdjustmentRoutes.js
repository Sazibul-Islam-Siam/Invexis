const express = require('express');
const router = express.Router();
const {
  getStockAdjustments,
  createStockAdjustment,
} = require('../controllers/stockAdjustmentController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);
router.use(authorize('admin'));

router.route('/').get(getStockAdjustments).post(createStockAdjustment);

module.exports = router;
