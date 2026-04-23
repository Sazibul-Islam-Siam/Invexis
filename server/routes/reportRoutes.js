const express = require('express');
const router = express.Router();
const {
  getSalesReport,
  getInventoryReport,
  getStockMovementReport,
} = require('../controllers/reportController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);
router.use(authorize('admin'));

router.get('/sales', getSalesReport);
router.get('/inventory', getInventoryReport);
router.get('/stock-movements', getStockMovementReport);

module.exports = router;
