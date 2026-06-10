const superAdminService = require("../services/superAdminService");
const {
  exportAuditLogs,
  listAuditLogs,
  recordAuditLog,
} = require("../services/auditLogService");
const { sendSuccess } = require("../utils/response");
const {
  validateCreatePlan,
  validateCreateTenant,
  validateUpdatePlan,
  validateUpdateTenant,
} = require("../validators/superAdminValidator");

function sendPaginated(res, message, result) {
  return res.status(200).json({
    success: true,
    message,
    data: result.data,
    meta: result.meta,
  });
}

function csvValue(value) {
  if (value === null || value === undefined) return "";
  const stringValue =
    typeof value === "object" ? JSON.stringify(value) : String(value);
  return `"${stringValue.replaceAll('"', '""')}"`;
}

function auditLogsToCsv(logs) {
  const headers = [
    "createdAt",
    "action",
    "entityType",
    "entityId",
    "actorName",
    "actorEmail",
    "ipAddress",
    "requestId",
    "metadata",
  ];
  const rows = logs.map((log) => [
    log.createdAt,
    log.action,
    log.entityType,
    log.entityId,
    log.actor?.name,
    log.actor?.email,
    log.ipAddress,
    log.requestId,
    log.metadata,
  ]);

  return [
    headers.map(csvValue).join(","),
    ...rows.map((row) => row.map(csvValue).join(",")),
  ].join("\n");
}

async function listTenants(req, res, next) {
  try {
    const result = await superAdminService.listTenants(req.query);
    return sendPaginated(res, "Tenant berhasil diambil", result);
  } catch (error) {
    return next(error);
  }
}

async function createTenant(req, res, next) {
  try {
    const payload = validateCreateTenant(req.body);
    const data = await superAdminService.createTenant(payload);
    await recordAuditLog(req, {
      action: "tenant.create",
      entityType: "Tenant",
      entityId: data.id,
      metadata: { name: data.name, slug: data.slug, planId: payload.planId || null },
    });
    return sendSuccess(res, 201, "Tenant berhasil dibuat", data);
  } catch (error) {
    return next(error);
  }
}

async function getTenant(req, res, next) {
  try {
    const data = await superAdminService.getTenant(req.params.id);
    return sendSuccess(res, 200, "Detail tenant berhasil diambil", data);
  } catch (error) {
    return next(error);
  }
}

async function updateTenant(req, res, next) {
  try {
    const payload = validateUpdateTenant(req.body);
    const data = await superAdminService.updateTenant(req.params.id, payload);
    await recordAuditLog(req, {
      action: "tenant.update",
      entityType: "Tenant",
      entityId: data.id,
      metadata: { changedFields: Object.keys(payload), status: data.status },
    });
    return sendSuccess(res, 200, "Tenant berhasil diperbarui", data);
  } catch (error) {
    return next(error);
  }
}

async function deleteTenant(req, res, next) {
  try {
    const data = await superAdminService.deactivateTenant(req.params.id);
    await recordAuditLog(req, {
      action: "tenant.deactivate",
      entityType: "Tenant",
      entityId: data.id,
      metadata: { status: data.status },
    });
    return sendSuccess(res, 200, "Tenant berhasil dinonaktifkan", data);
  } catch (error) {
    return next(error);
  }
}

async function listPlans(req, res, next) {
  try {
    const data = await superAdminService.listPlans(req.query);
    return sendSuccess(res, 200, "Plan berhasil diambil", data);
  } catch (error) {
    return next(error);
  }
}

async function createPlan(req, res, next) {
  try {
    const payload = validateCreatePlan(req.body);
    const data = await superAdminService.createPlan(payload);
    await recordAuditLog(req, {
      action: "subscription_plan.create",
      entityType: "SubscriptionPlan",
      entityId: data.id,
      metadata: { name: data.name, code: data.code, priceMonthly: data.priceMonthly },
    });
    return sendSuccess(res, 201, "Plan berhasil dibuat", data);
  } catch (error) {
    return next(error);
  }
}

async function updatePlan(req, res, next) {
  try {
    const payload = validateUpdatePlan(req.body);
    const data = await superAdminService.updatePlan(req.params.id, payload);
    await recordAuditLog(req, {
      action: "subscription_plan.update",
      entityType: "SubscriptionPlan",
      entityId: data.id,
      metadata: { changedFields: Object.keys(payload), isActive: data.isActive },
    });
    return sendSuccess(res, 200, "Plan berhasil diperbarui", data);
  } catch (error) {
    return next(error);
  }
}

async function deletePlan(req, res, next) {
  try {
    const data = await superAdminService.deactivatePlan(req.params.id);
    await recordAuditLog(req, {
      action: "subscription_plan.deactivate",
      entityType: "SubscriptionPlan",
      entityId: data.id,
      metadata: { isActive: data.isActive },
    });
    return sendSuccess(res, 200, "Plan berhasil dinonaktifkan", data);
  } catch (error) {
    return next(error);
  }
}

async function auditLogs(req, res, next) {
  try {
    const result = await listAuditLogs(req.query);
    return sendPaginated(res, "Audit log berhasil diambil", result);
  } catch (error) {
    return next(error);
  }
}

async function exportAuditLogsCsv(req, res, next) {
  try {
    const logs = await exportAuditLogs(req.query);
    const csv = auditLogsToCsv(logs);
    const filename = `audit-logs-${new Date().toISOString().slice(0, 10)}.csv`;

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    return res.status(200).send(csv);
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  listTenants,
  createTenant,
  getTenant,
  updateTenant,
  deleteTenant,
  listPlans,
  createPlan,
  updatePlan,
  deletePlan,
  auditLogs,
  exportAuditLogsCsv,
};
