const superAdminService = require("../services/superAdminService");
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
    return sendSuccess(res, 200, "Tenant berhasil diperbarui", data);
  } catch (error) {
    return next(error);
  }
}

async function deleteTenant(req, res, next) {
  try {
    const data = await superAdminService.deactivateTenant(req.params.id);
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
    return sendSuccess(res, 201, "Plan berhasil dibuat", data);
  } catch (error) {
    return next(error);
  }
}

async function updatePlan(req, res, next) {
  try {
    const payload = validateUpdatePlan(req.body);
    const data = await superAdminService.updatePlan(req.params.id, payload);
    return sendSuccess(res, 200, "Plan berhasil diperbarui", data);
  } catch (error) {
    return next(error);
  }
}

async function deletePlan(req, res, next) {
  try {
    const data = await superAdminService.deactivatePlan(req.params.id);
    return sendSuccess(res, 200, "Plan berhasil dinonaktifkan", data);
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
};
