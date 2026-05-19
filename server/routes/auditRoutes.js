const express = require('express');
const router = express.Router();
const { getAuditLogs } = require('../controllers/auditController');
const { protect, authorize, blockSuperAdmin } = require('../middleware/auth');

router.use(protect);
router.use(blockSuperAdmin);
router.use(authorize('admin'));

router.get('/', getAuditLogs);

module.exports = router;
