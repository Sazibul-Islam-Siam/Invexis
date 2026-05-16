const express = require('express');
const router = express.Router();
const {
  getRestockRequests,
  createRestockRequest,
  approveStaffRequest,
  updateRestockRequest,
  deleteRestockRequest,
} = require('../controllers/restockController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

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
