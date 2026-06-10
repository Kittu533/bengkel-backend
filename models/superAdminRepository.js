const { getPrisma } = require("./prismaClient");

function serialize(value) {
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.map(serialize);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, serialize(item)])
    );
  }
  return value;
}

function normalizePagination(query = {}) {
  const page = Math.max(Number(query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(query.limit) || 12, 1), 50);
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}

function paginated(data, total, page, limit) {
  return {
    data,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
}

function slugify(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function tenantInclude() {
  return {
    branches: { orderBy: { createdAt: "asc" } },
    subscriptions: {
      include: { plan: true },
      orderBy: { createdAt: "desc" },
      take: 1,
    },
    _count: {
      select: {
        branches: true,
        users: true,
        customers: true,
        serviceOrders: true,
        invoices: true,
      },
    },
  };
}

async function listTenants(query = {}) {
  const prisma = getPrisma();
  const { page, limit, skip } = normalizePagination(query);
  const where = {
    ...(query.status ? { status: query.status } : {}),
    ...(query.search
      ? {
          OR: [
            { name: { contains: query.search, mode: "insensitive" } },
            { slug: { contains: query.search, mode: "insensitive" } },
            { billingEmail: { contains: query.search, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [tenants, total] = await Promise.all([
    prisma.tenant.findMany({
      where,
      include: tenantInclude(),
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
    }),
    prisma.tenant.count({ where }),
  ]);

  return paginated(serialize(tenants), total, page, limit);
}

async function getTenant(id) {
  const prisma = getPrisma();
  const tenant = await prisma.tenant.findUnique({
    where: { id },
    include: tenantInclude(),
  });
  return tenant ? serialize(tenant) : null;
}

async function findTenantBySlug(slug) {
  const prisma = getPrisma();
  return prisma.tenant.findUnique({ where: { slug } });
}

async function createTenant(payload) {
  const prisma = getPrisma();
  const slug = payload.slug || slugify(payload.name);
  const tenant = await prisma.$transaction(async (tx) => {
    const created = await tx.tenant.create({
      data: {
        name: payload.name,
        slug,
        status: payload.status || "ACTIVE",
        billingEmail: payload.billingEmail || null,
        phone: payload.phone || null,
        address: payload.address || null,
      },
    });

    await tx.branch.create({
      data: {
        tenantId: created.id,
        name: payload.branchName || "Main Branch",
        code: payload.branchCode || "MAIN",
        status: "ACTIVE",
        address: payload.address || null,
        phone: payload.phone || null,
      },
    });

    if (payload.planId) {
      await tx.tenantSubscription.create({
        data: {
          tenantId: created.id,
          planId: payload.planId,
          status: payload.subscriptionStatus || "TRIAL",
        },
      });
    }

    return tx.tenant.findUnique({
      where: { id: created.id },
      include: tenantInclude(),
    });
  });

  return serialize(tenant);
}

async function updateTenant(id, payload) {
  const prisma = getPrisma();
  const tenant = await prisma.tenant.update({
    where: { id },
    data: {
      ...(payload.name ? { name: payload.name } : {}),
      ...(payload.slug ? { slug: payload.slug } : {}),
      ...(payload.status ? { status: payload.status } : {}),
      ...(payload.billingEmail !== undefined
        ? { billingEmail: payload.billingEmail || null }
        : {}),
      ...(payload.phone !== undefined ? { phone: payload.phone || null } : {}),
      ...(payload.address !== undefined ? { address: payload.address || null } : {}),
    },
    include: tenantInclude(),
  });
  return serialize(tenant);
}

async function deactivateTenant(id) {
  return updateTenant(id, { status: "INACTIVE" });
}

async function listPlans(query = {}) {
  const prisma = getPrisma();
  const where = {
    ...(query.isActive === undefined
      ? {}
      : { isActive: query.isActive === "true" || query.isActive === true }),
  };
  const plans = await prisma.subscriptionPlan.findMany({
    where,
    include: { _count: { select: { subscriptions: true } } },
    orderBy: { priceMonthly: "asc" },
  });
  return serialize(plans);
}

async function getPlan(id) {
  const prisma = getPrisma();
  const plan = await prisma.subscriptionPlan.findUnique({ where: { id } });
  return plan ? serialize(plan) : null;
}

async function createPlan(payload) {
  const prisma = getPrisma();
  const plan = await prisma.subscriptionPlan.create({
    data: {
      name: payload.name,
      code: payload.code || slugify(payload.name).toUpperCase().replace(/-/g, "_"),
      priceMonthly: payload.priceMonthly,
      maxBranches: payload.maxBranches || null,
      maxUsers: payload.maxUsers || null,
      features: payload.features || null,
      isActive: payload.isActive ?? true,
    },
  });
  return serialize(plan);
}

async function updatePlan(id, payload) {
  const prisma = getPrisma();
  const plan = await prisma.subscriptionPlan.update({
    where: { id },
    data: {
      ...(payload.name ? { name: payload.name } : {}),
      ...(payload.code ? { code: payload.code } : {}),
      ...(payload.priceMonthly !== undefined
        ? { priceMonthly: payload.priceMonthly }
        : {}),
      ...(payload.maxBranches !== undefined
        ? { maxBranches: payload.maxBranches || null }
        : {}),
      ...(payload.maxUsers !== undefined ? { maxUsers: payload.maxUsers || null } : {}),
      ...(payload.features !== undefined
        ? { features: payload.features || null }
        : {}),
      ...(payload.isActive !== undefined ? { isActive: payload.isActive } : {}),
    },
  });
  return serialize(plan);
}

async function deactivatePlan(id) {
  return updatePlan(id, { isActive: false });
}

module.exports = {
  listTenants,
  getTenant,
  findTenantBySlug,
  createTenant,
  updateTenant,
  deactivateTenant,
  listPlans,
  getPlan,
  createPlan,
  updatePlan,
  deactivatePlan,
};
