const { ROLES } = require("../config/auth");
const { HttpError } = require("../utils/httpError");

function normalizeHeader(value) {
  if (Array.isArray(value)) return value[0] || null;
  return value || null;
}

function buildTenantContext(req) {
  const roles = req.user?.roles || [];
  const isSuperAdmin = roles.includes(ROLES.SUPER_ADMIN);
  const requestedTenantId = normalizeHeader(req.headers["x-tenant-id"]);
  const requestedBranchId = normalizeHeader(req.headers["x-branch-id"]);
  const tokenTenantId = req.user?.tenantId || null;
  const tokenBranchId = req.user?.branchId || null;

  return {
    tenantId: isSuperAdmin ? requestedTenantId || tokenTenantId : tokenTenantId,
    branchId: isSuperAdmin ? requestedBranchId || tokenBranchId : tokenBranchId,
    isSuperAdmin,
    source: requestedTenantId || requestedBranchId ? "header" : "token",
  };
}

function tenantContextMiddleware(req, _res, next) {
  req.tenantContext = buildTenantContext(req);
  return next();
}

function requireTenantContext(req, _res, next) {
  req.tenantContext = req.tenantContext || buildTenantContext(req);

  if (!req.tenantContext.tenantId) {
    return next(new HttpError(403, "Tenant context wajib tersedia"));
  }

  return next();
}

module.exports = {
  buildTenantContext,
  requireTenantContext,
  tenantContextMiddleware,
};
