const express = require('express');
const router = express.Router();
const {
  getSalesReport,
  getInventoryReport,
  getStockMovementReport,
} = require('../controllers/reportController');
const { protect, authorize, blockSuperAdmin } = require('../middleware/auth');

router.use(protect);
router.use(blockSuperAdmin);

// Sales report: admin sees all, staff sees their own (scoped in controller)
router.get('/sales', authorize('admin', 'staff'), getSalesReport);

// Inventory report: admin and staff can view
router.get('/inventory', authorize('admin', 'staff'), getInventoryReport);

// Stock movements: admin only
router.get('/stock-movements', authorize('admin'), getStockMovementReport);

module.exports = router;
