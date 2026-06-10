const auditLogRepository = require("../models/auditLogRepository");

function listAuditLogs(query) {
  return auditLogRepository.listAuditLogs(query);
}

function exportAuditLogs(query) {
  return auditLogRepository.exportAuditLogs(query);
}

async function recordAuditLog(req, payload) {
  try {
    return await auditLogRepository.createAuditLog({
      actorId: req.user?.id || null,
      action: payload.action,
      entityType: payload.entityType,
      entityId: payload.entityId || null,
      metadata: payload.metadata || null,
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"] || null,
      requestId: req.requestId || null,
    });
  } catch (error) {
    console.error("Audit log write failed", {
      action: payload.action,
      entityType: payload.entityType,
      entityId: payload.entityId || null,
      error: error.message,
    });
    return null;
  }
}

module.exports = {
  exportAuditLogs,
  listAuditLogs,
  recordAuditLog,
};
