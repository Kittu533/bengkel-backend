function getTenantContext(req) {
  return req.tenantContext || {
    tenantId: req.user?.tenantId || null,
    branchId: req.user?.branchId || null,
    isSuperAdmin: req.user?.roles?.includes("SUPER_ADMIN") || false,
    source: "token",
  };
}

function withTenantWhere(req, where = {}) {
  const context = getTenantContext(req);
  if (context.isSuperAdmin && !context.tenantId) return where;
  if (!context.tenantId) return where;
  return { ...where, tenantId: context.tenantId };
}

function withBranchWhere(req, where = {}) {
  const context = getTenantContext(req);
  if (!context.branchId) return where;
  return { ...withTenantWhere(req, where), branchId: context.branchId };
}

function withTenantCreateData(req, data = {}) {
  const context = getTenantContext(req);
  return {
    ...data,
    ...(context.tenantId ? { tenantId: context.tenantId } : {}),
    ...(context.branchId ? { branchId: context.branchId } : {}),
  };
}

module.exports = {
  getTenantContext,
  withBranchWhere,
  withTenantCreateData,
  withTenantWhere,
};
