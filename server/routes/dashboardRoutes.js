const express = require('express');
const router = express.Router();
const {
  getStats,
  getSalesChart,
  getRecentActivity,
  getSupplierStats,
  getStaffStats,
} = require('../controllers/dashboardController');
const { protect, blockSuperAdmin, resolveSupplierCompany } = require('../middleware/auth');

// All routes require authentication and block super_admin
router.use(protect);
router.use(blockSuperAdmin);
router.use(resolveSupplierCompany);

router.get('/stats', getStats);
router.get('/sales-chart', getSalesChart);
router.get('/recent-activity', getRecentActivity);
router.get('/supplier-stats', getSupplierStats);
router.get('/staff-stats', getStaffStats);

module.exports = router;
