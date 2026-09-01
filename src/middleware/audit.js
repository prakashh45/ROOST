const { prisma } = require('../config/db');

/**
 * Audit logging middleware factory.
 * Usage: router.post('/path', authenticate, audit('CREATE', 'entity_type'), controller)
 */
function audit(action, entityType, getEntityId = null) {
  return async (req, _res, next) => {
    // Store original json to capture entity id after response
    req._audit = { action, entityType, getEntityId };
    next();
  };
}

/**
 * Write an audit log entry directly (call from service/controller).
 */
async function writeAuditLog({ tenantId, userId, action, entityType, entityId, oldValues, newValues, req }) {
  try {
    await prisma.audit_logs.create({
      data: {
        tenant_id  : tenantId ? BigInt(tenantId) : null,
        user_id    : userId   ? BigInt(userId)   : null,
        action,
        entity_type: entityType,
        entity_id  : entityId ? String(entityId) : null,
        old_values : oldValues || undefined,
        new_values : newValues || undefined,
        ip_address : req?.ip || null,
        user_agent : req?.headers?.['user-agent'] || null,
      },
    });
  } catch (err) {
    // Audit failures should never crash the request
    console.error('[AUDIT ERROR]', err.message);
  }
}

module.exports = { audit, writeAuditLog };
