const bcrypt = require("bcryptjs");
const { ROLES } = require("../config/auth");
const { getPrisma } = require("./prismaClient");

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

function slugify(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function useVehicleType(value) {
  return value === "CAR" ? "MOBIL" : value;
}

async function listCustomers(query) {
  const prisma = getPrisma();
  const { page, limit, skip } = normalizePagination(query);
  const where = query.search
    ? {
        OR: [
          { name: { contains: query.search, mode: "insensitive" } },
          { email: { contains: query.search, mode: "insensitive" } },
          { phone: { contains: query.search, mode: "insensitive" } },
        ],
      }
    : {};
  const [data, total] = await Promise.all([
    prisma.customer.findMany({
      where,
      include: { user: true, vehicles: { where: { isActive: true } } },
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
    }),
    prisma.customer.count({ where }),
  ]);

  return paginated(serialize(data), total, page, limit);
}

async function getCustomer(id) {
  const prisma = getPrisma();
  const customer = await prisma.customer.findUnique({
    where: { id },
    include: { user: true, vehicles: { where: { isActive: true } } },
  });
  return customer ? serialize(customer) : null;
}

async function createCustomer(payload) {
  const prisma = getPrisma();
  const customerRole = await prisma.role.upsert({
    where: { name: ROLES.CUSTOMER },
    update: {},
    create: { name: ROLES.CUSTOMER },
  });

  const user = await prisma.user.create({
    data: {
      name: payload.name,
      email: payload.email.toLowerCase(),
      phone: payload.phone,
      passwordHash: await bcrypt.hash(payload.password, 10),
      status: payload.status || "ACTIVE",
      userRoles: { create: { roleId: customerRole.id } },
      customer: {
        create: {
          name: payload.name,
          email: payload.email.toLowerCase(),
          phone: payload.phone,
        },
      },
    },
    include: { customer: true, userRoles: { include: { role: true } } },
  });

  return getCustomer(user.customer.id);
}

async function updateCustomer(id, payload) {
  const prisma = getPrisma();
  const existing = await prisma.customer.findUnique({ where: { id } });
  if (!existing) return null;

  await prisma.$transaction(async (tx) => {
    await tx.customer.update({
      where: { id },
      data: {
        ...(payload.name ? { name: payload.name } : {}),
        ...(payload.email ? { email: payload.email.toLowerCase() } : {}),
        ...(payload.phone ? { phone: payload.phone } : {}),
      },
    });
    await tx.user.update({
      where: { id: existing.userId },
      data: {
        ...(payload.name ? { name: payload.name } : {}),
        ...(payload.email ? { email: payload.email.toLowerCase() } : {}),
        ...(payload.phone ? { phone: payload.phone } : {}),
        ...(payload.status ? { status: payload.status } : {}),
        ...(payload.password
          ? { passwordHash: await bcrypt.hash(payload.password, 10) }
          : {}),
      },
    });
  });

  return getCustomer(id);
}

async function deleteCustomer(id) {
  const prisma = getPrisma();
  const existing = await prisma.customer.findUnique({ where: { id } });
  if (!existing) return null;

  await prisma.user.update({
    where: { id: existing.userId },
    data: { status: "INACTIVE" },
  });
  return getCustomer(id);
}

async function listVehicles(query) {
  const prisma = getPrisma();
  const { page, limit, skip } = normalizePagination(query);
  const where = {
    isActive: true,
    ...(query.customerId ? { customerId: query.customerId } : {}),
    ...(query.vehicleType ? { vehicleType: useVehicleType(query.vehicleType) } : {}),
    ...(query.search
      ? {
          OR: [
            { plateNumber: { contains: query.search, mode: "insensitive" } },
            { brand: { contains: query.search, mode: "insensitive" } },
            { model: { contains: query.search, mode: "insensitive" } },
            { customer: { name: { contains: query.search, mode: "insensitive" } } },
          ],
        }
      : {}),
  };
  const [data, total] = await Promise.all([
    prisma.customerVehicle.findMany({
      where,
      include: { customer: true },
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
    }),
    prisma.customerVehicle.count({ where }),
  ]);
  return paginated(serialize(data), total, page, limit);
}

async function getVehicle(id) {
  const prisma = getPrisma();
  const vehicle = await prisma.customerVehicle.findFirst({
    where: { id, isActive: true },
    include: { customer: true },
  });
  return vehicle ? serialize(vehicle) : null;
}

async function createVehicle(payload) {
  const prisma = getPrisma();
  const vehicle = await prisma.customerVehicle.create({
    data: {
      customerId: payload.customerId,
      plateNumber: payload.plateNumber.toUpperCase(),
      brand: payload.brand,
      model: payload.model,
      vehicleType: useVehicleType(payload.vehicleType),
      year: payload.year || null,
      color: payload.color || null,
      notes: payload.notes || null,
    },
    include: { customer: true },
  });
  return serialize(vehicle);
}

async function updateVehicle(id, payload) {
  const prisma = getPrisma();
  const existing = await getVehicle(id);
  if (!existing) return null;
  const vehicle = await prisma.customerVehicle.update({
    where: { id },
    data: {
      ...payload,
      ...(payload.plateNumber
        ? { plateNumber: payload.plateNumber.toUpperCase() }
        : {}),
      ...(payload.vehicleType
        ? { vehicleType: useVehicleType(payload.vehicleType) }
        : {}),
      ...(Object.prototype.hasOwnProperty.call(payload, "year")
        ? { year: payload.year || null }
        : {}),
      ...(Object.prototype.hasOwnProperty.call(payload, "color")
        ? { color: payload.color || null }
        : {}),
      ...(Object.prototype.hasOwnProperty.call(payload, "notes")
        ? { notes: payload.notes || null }
        : {}),
    },
    include: { customer: true },
  });
  return serialize(vehicle);
}

async function deleteVehicle(id) {
  const prisma = getPrisma();
  const existing = await getVehicle(id);
  if (!existing) return null;
  const vehicle = await prisma.customerVehicle.update({
    where: { id },
    data: { isActive: false },
    include: { customer: true },
  });
  return serialize(vehicle);
}

async function listServiceCategories(query) {
  return listCategories("serviceCategory", query);
}

async function createServiceCategory(payload) {
  return createCategory("serviceCategory", payload);
}

async function updateServiceCategory(id, payload) {
  return updateCategory("serviceCategory", id, payload);
}

async function deleteServiceCategory(id) {
  return updateCategory("serviceCategory", id, { isActive: false });
}

async function listSparepartCategories(query) {
  return listCategories("sparepartCategory", query);
}

async function createSparepartCategory(payload) {
  return createCategory("sparepartCategory", payload);
}

async function updateSparepartCategory(id, payload) {
  return updateCategory("sparepartCategory", id, payload);
}

async function deleteSparepartCategory(id) {
  return updateCategory("sparepartCategory", id, { isActive: false });
}

async function listCategories(model, query) {
  const prisma = getPrisma();
  const { page, limit, skip } = normalizePagination(query);
  const where = query.search
    ? { name: { contains: query.search, mode: "insensitive" } }
    : {};
  const [data, total] = await Promise.all([
    prisma[model].findMany({
      where,
      skip,
      take: limit,
      orderBy: { name: "asc" },
    }),
    prisma[model].count({ where }),
  ]);
  return paginated(serialize(data), total, page, limit);
}

async function createCategory(model, payload) {
  const prisma = getPrisma();
  const category = await prisma[model].create({
    data: { name: payload.name, isActive: payload.isActive ?? true },
  });
  return serialize(category);
}

async function updateCategory(model, id, payload) {
  const prisma = getPrisma();
  const existing = await prisma[model].findUnique({ where: { id } });
  if (!existing) return null;
  const category = await prisma[model].update({
    where: { id },
    data: payload,
  });
  return serialize(category);
}

async function listServiceCatalogs(query) {
  const prisma = getPrisma();
  const { page, limit, skip } = normalizePagination(query);
  const where = {
    ...(query.categoryId ? { categoryId: query.categoryId } : {}),
    ...(query.vehicleType ? { vehicleType: useVehicleType(query.vehicleType) } : {}),
    ...(query.search
      ? {
          OR: [
            { name: { contains: query.search, mode: "insensitive" } },
            { description: { contains: query.search, mode: "insensitive" } },
          ],
        }
      : {}),
  };
  const [data, total] = await Promise.all([
    prisma.serviceCatalog.findMany({
      where,
      include: { category: true },
      skip,
      take: limit,
      orderBy: { name: "asc" },
    }),
    prisma.serviceCatalog.count({ where }),
  ]);
  return paginated(serialize(data), total, page, limit);
}

async function getServiceCatalog(id) {
  const prisma = getPrisma();
  const service = await prisma.serviceCatalog.findUnique({
    where: { id },
    include: { category: true },
  });
  return service ? serialize(service) : null;
}

async function createServiceCatalog(payload) {
  const prisma = getPrisma();
  const service = await prisma.serviceCatalog.create({
    data: {
      categoryId: payload.categoryId,
      name: payload.name,
      slug: payload.slug ? slugify(payload.slug) : slugify(payload.name),
      description: payload.description,
      vehicleType: useVehicleType(payload.vehicleType),
      price: payload.price,
      estimatedDurationMinutes: payload.estimatedDurationMinutes,
      isActive: payload.isActive ?? true,
    },
    include: { category: true },
  });
  return serialize(service);
}

async function updateServiceCatalog(id, payload) {
  const prisma = getPrisma();
  const existing = await getServiceCatalog(id);
  if (!existing) return null;
  const service = await prisma.serviceCatalog.update({
    where: { id },
    data: {
      ...payload,
      ...(payload.slug ? { slug: slugify(payload.slug) } : {}),
      ...(payload.vehicleType
        ? { vehicleType: useVehicleType(payload.vehicleType) }
        : {}),
    },
    include: { category: true },
  });
  return serialize(service);
}

async function deleteServiceCatalog(id) {
  return updateServiceCatalog(id, { isActive: false });
}

async function listSpareparts(query) {
  const prisma = getPrisma();
  const { page, limit, skip } = normalizePagination(query);
  const where = {
    ...(query.categoryId ? { categoryId: query.categoryId } : {}),
    ...(query.brand ? { brand: query.brand } : {}),
    ...(query.vehicleType ? { vehicleType: useVehicleType(query.vehicleType) } : {}),
    ...(query.search
      ? {
          OR: [
            { name: { contains: query.search, mode: "insensitive" } },
            { sku: { contains: query.search, mode: "insensitive" } },
            { brand: { contains: query.search, mode: "insensitive" } },
            { description: { contains: query.search, mode: "insensitive" } },
          ],
        }
      : {}),
  };
  const [data, total] = await Promise.all([
    prisma.sparepart.findMany({
      where,
      include: { category: true },
      skip,
      take: limit,
      orderBy: { name: "asc" },
    }),
    prisma.sparepart.count({ where }),
  ]);
  return paginated(serialize(data), total, page, limit);
}

async function getSparepart(id) {
  const prisma = getPrisma();
  const sparepart = await prisma.sparepart.findUnique({
    where: { id },
    include: { category: true },
  });
  return sparepart ? serialize(sparepart) : null;
}

async function createSparepart(payload) {
  const prisma = getPrisma();
  const sparepart = await prisma.sparepart.create({
    data: {
      ...payload,
      vehicleType: useVehicleType(payload.vehicleType),
      isActive: payload.isActive ?? true,
    },
    include: { category: true },
  });
  return serialize(sparepart);
}

async function updateSparepart(id, payload) {
  const prisma = getPrisma();
  const existing = await getSparepart(id);
  if (!existing) return null;
  const sparepart = await prisma.sparepart.update({
    where: { id },
    data: {
      ...payload,
      ...(payload.vehicleType
        ? { vehicleType: useVehicleType(payload.vehicleType) }
        : {}),
    },
    include: { category: true },
  });
  return serialize(sparepart);
}

async function deleteSparepart(id) {
  return updateSparepart(id, { isActive: false });
}

module.exports = {
  listCustomers,
  getCustomer,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  listVehicles,
  getVehicle,
  createVehicle,
  updateVehicle,
  deleteVehicle,
  listServiceCategories,
  createServiceCategory,
  updateServiceCategory,
  deleteServiceCategory,
  listServiceCatalogs,
  getServiceCatalog,
  createServiceCatalog,
  updateServiceCatalog,
  deleteServiceCatalog,
  listSparepartCategories,
  createSparepartCategory,
  updateSparepartCategory,
  deleteSparepartCategory,
  listSpareparts,
  getSparepart,
  createSparepart,
  updateSparepart,
  deleteSparepart,
};
