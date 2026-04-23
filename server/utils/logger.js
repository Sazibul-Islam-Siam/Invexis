const AuditLog = require('../models/AuditLog');

/**
 * Log an audit event (fire-and-forget, non-blocking)
 * @param {string} userId - The user performing the action
 * @param {string} action - CREATE | UPDATE | DELETE | STATUS_CHANGE | LOGIN
 * @param {string} entity - Product | Sale | RestockRequest | StockAdjustment | User | Category | Auth
 * @param {string|null} entityId - The ID of the affected document
 * @param {string} details - Human-readable description
 */
const logAudit = (userId, action, entity, entityId, details) => {
  AuditLog.create({ user: userId, action, entity, entityId, details }).catch((err) => {
    console.error('Audit log error:', err.message);
  });
};

module.exports = logAudit;
