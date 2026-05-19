const express = require('express');
const router = express.Router();
const {
  getPlatformStats,
  getCompanies,
  toggleCompanyStatus,
  deleteCompany,
} = require('../controllers/superAdminController');
const { protect, authorize } = require('../middleware/auth');

// All routes require super_admin
router.use(protect);
router.use(authorize('super_admin'));

router.get('/stats', getPlatformStats);
router.get('/companies', getCompanies);
router.put('/companies/:id/toggle-status', toggleCompanyStatus);
router.delete('/companies/:id', deleteCompany);

module.exports = router;
