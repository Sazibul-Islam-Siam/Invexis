const express = require('express');
const router = express.Router();
const {
  getRestockRequests,
  createRestockRequest,
  approveStaffRequest,
  updateRestockRequest,
  deleteRestockRequest,
  getSupplierCrossCompanyAlerts,
} = require('../controllers/restockController');
const { protect, authorize, blockSuperAdmin, resolveSupplierCompany } = require('../middleware/auth');

router.use(protect);
router.use(blockSuperAdmin);

// Cross-company alerts — runs BEFORE resolveSupplierCompany (no active company needed)
router.get('/cross-company-alerts', authorize('supplier'), getSupplierCrossCompanyAlerts);

// All routes below require supplier company context
router.use(resolveSupplierCompany);

router
  .route('/')
  .get(getRestockRequests)
  .post(authorize('admin', 'staff'), createRestockRequest);

router
  .route('/:id/approve')
  .put(authorize('admin'), approveStaffRequest);

router
  .route('/:id')
  .put(authorize('admin', 'supplier'), updateRestockRequest)
  .delete(authorize('admin'), deleteRestockRequest);

module.exports = router;
