const { getPrisma } = require("./prismaClient");
const stockMovementRepository = require("./stockMovementRepository");

const ACTIVE_SERVICE_ORDER_EXCLUDED_STATUSES = ["COMPLETED", "CANCELLED"];

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

function makeCode(prefix) {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const suffix = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `${prefix}-${date}-${suffix}`;
}

function includeDetail(customerVisibleOnly = false) {
  return {
    customer: true,
    mechanic: true,
    vehicle: true,
    serviceItems: { orderBy: { createdAt: "asc" } },
    sparepartItems: { orderBy: { createdAt: "asc" } },
    notes: {
      where: customerVisibleOnly ? { visibility: "CUSTOMER_VISIBLE" } : {},
      include: { user: true },
      orderBy: { createdAt: "asc" },
    },
    photos: {
      where: customerVisibleOnly ? { visibility: "CUSTOMER_VISIBLE" } : {},
      orderBy: { createdAt: "asc" },
    },
    checklists: {
      include: { user: true },
      orderBy: { createdAt: "asc" },
    },
  };
}

async function findCustomer(id) {
  const prisma = getPrisma();
  return prisma.customer.findUnique({ where: { id } });
}

async function findVehicleForCustomer(customerId, vehicleId) {
  const prisma = getPrisma();
  return prisma.customerVehicle.findFirst({
    where: { id: vehicleId, customerId, isActive: true },
  });
}

async function findServiceCatalog(id) {
  const prisma = getPrisma();
  return prisma.serviceCatalog.findFirst({ where: { id, isActive: true } });
}

async function findMechanic(id) {
  const prisma = getPrisma();
  return prisma.user.findFirst({
    where: {
      id,
      status: "ACTIVE",
      userRoles: { some: { role: { name: "MECHANIC" } } },
    },
  });
}

async function createServiceOrder(payload) {
  const prisma = getPrisma();
  const service = payload.serviceCatalogId
    ? await findServiceCatalog(payload.serviceCatalogId)
    : null;
  const servicePrice = service ? service.price : 0;
  const serviceName = service ? service.name : payload.serviceName;

  const order = await prisma.$transaction(async (tx) => {
    const created = await tx.serviceOrder.create({
      data: {
        customerId: payload.customerId,
        vehicleId: payload.vehicleId,
        mechanicId: payload.mechanicId || null,
        code: makeCode("SO"),
        serviceName,
        status: "WAITING",
        currentStep: "Menunggu check-in",
        checkInAt: new Date(),
        startedAt: new Date(),
        estimatedFinishedAt: payload.estimatedFinishedAt || null,
        mileageIn: payload.mileageIn || null,
        customerComplaint: payload.customerComplaint,
        initialDiagnosis: payload.initialDiagnosis || null,
        totalServicePrice: servicePrice,
        grandTotal: servicePrice,
      },
    });

    if (service) {
      await tx.serviceOrderServiceItem.create({
        data: {
          serviceOrderId: created.id,
          serviceCatalogId: service.id,
          name: service.name,
          price: service.price,
          quantity: 1,
          subtotal: service.price,
        },
      });
    }

    return tx.serviceOrder.findUnique({
      where: { id: created.id },
      include: includeDetail(),
    });
  });

  return serialize(order);
}

async function listServiceOrders(query) {
  const prisma = getPrisma();
  const { page, limit, skip } = normalizePagination(query);
  const where = {
    ...(query.status ? { status: query.status } : {}),
    ...(query.mechanicId ? { mechanicId: query.mechanicId } : {}),
    ...(query.search
      ? {
          OR: [
            { code: { contains: query.search, mode: "insensitive" } },
            { serviceName: { contains: query.search, mode: "insensitive" } },
            { customer: { name: { contains: query.search, mode: "insensitive" } } },
            {
              vehicle: {
                plateNumber: { contains: query.search, mode: "insensitive" },
              },
            },
          ],
        }
      : {}),
  };

  const [data, total] = await Promise.all([
    prisma.serviceOrder.findMany({
      where,
      include: { customer: true, mechanic: true, vehicle: true },
      skip,
      take: limit,
      orderBy: { updatedAt: "desc" },
    }),
    prisma.serviceOrder.count({ where }),
  ]);

  return paginated(serialize(data), total, page, limit);
}

async function getServiceOrder(id) {
  const prisma = getPrisma();
  const order = await prisma.serviceOrder.findUnique({
    where: { id },
    include: includeDetail(),
  });
  return order ? serialize(order) : null;
}

async function updateServiceOrder(id, payload) {
  const prisma = getPrisma();
  const order = await prisma.serviceOrder.update({
    where: { id },
    data: payload,
    include: includeDetail(),
  });
  return serialize(order);
}

async function assignMechanic(id, mechanicId) {
  return updateServiceOrder(id, { mechanicId });
}

async function addServiceItem(id, service, quantity) {
  const prisma = getPrisma();
  const subtotal = service.price * quantity;
  const order = await prisma.$transaction(async (tx) => {
    await tx.serviceOrderServiceItem.create({
      data: {
        serviceOrderId: id,
        serviceCatalogId: service.id,
        name: service.name,
        price: service.price,
        quantity,
        subtotal,
      },
    });
    return recalculateTotals(tx, id);
  });
  return serialize(order);
}

async function addSparepartItem(id, sparepart, quantity, userId) {
  const prisma = getPrisma();
  const subtotal = sparepart.sellPrice * quantity;
  const order = await prisma.$transaction(async (tx) => {
    const beforeStock = sparepart.stock;
    const afterStock = beforeStock - quantity;
    await tx.sparepart.update({
      where: { id: sparepart.id },
      data: { stock: { decrement: quantity } },
    });
    await tx.serviceOrderSparepartItem.create({
      data: {
        serviceOrderId: id,
        sparepartId: sparepart.id,
        name: sparepart.name,
        price: sparepart.sellPrice,
        quantity,
        subtotal,
      },
    });
    await stockMovementRepository.createStockMovement(tx, {
      sparepartId: sparepart.id,
      type: "OUT",
      quantity,
      beforeStock,
      afterStock,
      note: `Pemakaian sparepart untuk service order ${id}`,
      referenceType: "SERVICE_ORDER",
      referenceId: id,
      createdById: userId,
    });
    return recalculateTotals(tx, id);
  });
  return serialize(order);
}

async function addNote(id, userId, payload) {
  const prisma = getPrisma();
  const note = await prisma.serviceOrderNote.create({
    data: {
      serviceOrderId: id,
      userId,
      note: payload.note,
      visibility: payload.visibility,
    },
    include: { user: true },
  });
  return serialize(note);
}

async function addPhoto(id, payload) {
  const prisma = getPrisma();
  const photo = await prisma.serviceOrderPhoto.create({
    data: {
      serviceOrderId: id,
      url: payload.url,
      caption: payload.caption || null,
      visibility: payload.visibility,
    },
  });
  return serialize(photo);
}

async function addChecklist(id, userId, payload) {
  const prisma = getPrisma();
  const checklist = await prisma.serviceOrderChecklist.create({
    data: {
      serviceOrderId: id,
      userId,
      title: payload.title,
      isDone: payload.isDone,
      note: payload.note || null,
    },
    include: { user: true },
  });
  return serialize(checklist);
}

async function findSparepart(id) {
  const prisma = getPrisma();
  return prisma.sparepart.findFirst({ where: { id, isActive: true } });
}

async function recalculateTotals(tx, id) {
  const [serviceItems, sparepartItems] = await Promise.all([
    tx.serviceOrderServiceItem.findMany({ where: { serviceOrderId: id } }),
    tx.serviceOrderSparepartItem.findMany({ where: { serviceOrderId: id } }),
  ]);
  const totalServicePrice = serviceItems.reduce(
    (sum, item) => sum + item.subtotal,
    0
  );
  const totalSparepartPrice = sparepartItems.reduce(
    (sum, item) => sum + item.subtotal,
    0
  );

  return tx.serviceOrder.update({
    where: { id },
    data: {
      totalServicePrice,
      totalSparepartPrice,
      grandTotal: totalServicePrice + totalSparepartPrice,
    },
    include: includeDetail(),
  });
}

async function completeServiceOrder(id) {
  const prisma = getPrisma();
  const order = await prisma.$transaction(async (tx) => {
    const completed = await tx.serviceOrder.update({
      where: { id },
      data: {
        status: "COMPLETED",
        currentStep: "Selesai",
        finishedAt: new Date(),
      },
      include: includeDetail(),
    });

    await tx.serviceHistory.create({
      data: {
        customerId: completed.customerId,
        vehicleId: completed.vehicleId,
        serviceName: completed.serviceName,
        serviceDate: new Date(),
        odometer: completed.mileageIn,
        totalPrice: completed.grandTotal,
        notes: completed.initialDiagnosis || completed.customerComplaint,
      },
    });

    return completed;
  });
  return serialize(order);
}

async function getCustomerTracking(userId, id) {
  const prisma = getPrisma();
  const customer = await prisma.customer.findUnique({ where: { userId } });
  if (!customer) return null;

  const order = await prisma.serviceOrder.findFirst({
    where: { id, customerId: customer.id },
    include: includeDetail(true),
  });
  return order ? serialize(order) : null;
}

module.exports = {
  ACTIVE_SERVICE_ORDER_EXCLUDED_STATUSES,
  findCustomer,
  findVehicleForCustomer,
  findServiceCatalog,
  findMechanic,
  findSparepart,
  createServiceOrder,
  listServiceOrders,
  getServiceOrder,
  updateServiceOrder,
  assignMechanic,
  addServiceItem,
  addSparepartItem,
  addNote,
  addPhoto,
  addChecklist,
  completeServiceOrder,
  getCustomerTracking,
};
