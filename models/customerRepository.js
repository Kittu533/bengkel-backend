const { getPrisma } = require("./prismaClient");
const memoryStore = require("./customerStore");

const ACTIVE_SERVICE_ORDER_EXCLUDED_STATUSES = ["COMPLETED", "CANCELLED"];

function useMemoryStore() {
  return process.env.NODE_ENV === "test" || !process.env.DATABASE_URL;
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

async function getCustomerByUserId(userId) {
  if (useMemoryStore()) return memoryStore.findCustomerByUserId(userId);

  const prisma = getPrisma();
  return prisma.customer.findUnique({ where: { userId } });
}

async function requireCustomer(userId) {
  const customer = await getCustomerByUserId(userId);
  if (!customer) return null;
  return customer;
}

async function getDashboardSummary(userId) {
  const customer = await requireCustomer(userId);
  if (!customer) return null;

  if (useMemoryStore()) {
    return {
      totalVehicles: memoryStore.listActiveVehicles(customer.id).length,
      activeBookings: memoryStore
        .listBookings(customer.id)
        .filter((booking) => booking.status !== "CANCELLED").length,
      activeServiceOrders: memoryStore.listActiveServiceOrders(customer.id).length,
      serviceHistory: memoryStore.listServiceHistory(customer.id).length,
      unpaidInvoices: memoryStore
        .listInvoices(customer.id)
        .filter((invoice) => invoice.status !== "PAID").length,
    };
  }

  const prisma = getPrisma();
  const [
    totalVehicles,
    activeBookings,
    activeServiceOrders,
    serviceHistory,
    unpaidInvoices,
  ] = await Promise.all([
    prisma.customerVehicle.count({
      where: { customerId: customer.id, isActive: true },
    }),
    prisma.booking.count({
      where: { customerId: customer.id, status: { not: "CANCELLED" } },
    }),
    prisma.serviceOrder.count({
      where: {
        customerId: customer.id,
        status: { notIn: ACTIVE_SERVICE_ORDER_EXCLUDED_STATUSES },
      },
    }),
    prisma.serviceHistory.count({ where: { customerId: customer.id } }),
    prisma.invoice.count({
      where: { customerId: customer.id, status: { not: "PAID" } },
    }),
  ]);

  return {
    totalVehicles,
    activeBookings,
    activeServiceOrders,
    serviceHistory,
    unpaidInvoices,
  };
}

async function listVehicles(userId) {
  const customer = await requireCustomer(userId);
  if (!customer) return null;

  if (useMemoryStore()) return memoryStore.listActiveVehicles(customer.id);

  const prisma = getPrisma();
  const vehicles = await prisma.customerVehicle.findMany({
    where: { customerId: customer.id, isActive: true },
    orderBy: { createdAt: "desc" },
  });
  return serialize(vehicles);
}

async function createVehicle(userId, payload) {
  const customer = await requireCustomer(userId);
  if (!customer) return null;

  if (useMemoryStore()) return memoryStore.createVehicle(customer.id, payload);

  const prisma = getPrisma();
  const vehicle = await prisma.customerVehicle.create({
    data: {
      customerId: customer.id,
      plateNumber: payload.plateNumber.toUpperCase(),
      brand: payload.brand,
      model: payload.model,
      vehicleType: payload.vehicleType,
      year: payload.year || null,
      color: payload.color || null,
      notes: payload.notes || null,
    },
  });
  return serialize(vehicle);
}

async function getVehicle(userId, vehicleId) {
  const customer = await requireCustomer(userId);
  if (!customer) return null;

  if (useMemoryStore()) {
    return memoryStore.findActiveVehicle(customer.id, vehicleId);
  }

  const prisma = getPrisma();
  const vehicle = await prisma.customerVehicle.findFirst({
    where: { id: vehicleId, customerId: customer.id, isActive: true },
  });
  return vehicle ? serialize(vehicle) : null;
}

async function updateVehicle(userId, vehicleId, payload) {
  const customer = await requireCustomer(userId);
  if (!customer) return null;

  if (useMemoryStore()) {
    return memoryStore.updateVehicle(customer.id, vehicleId, payload);
  }

  const existingVehicle = await getVehicle(userId, vehicleId);
  if (!existingVehicle) return null;

  const prisma = getPrisma();
  const vehicle = await prisma.customerVehicle.update({
    where: { id: vehicleId },
    data: {
      ...payload,
      ...(payload.plateNumber
        ? { plateNumber: payload.plateNumber.toUpperCase() }
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
  });
  return serialize(vehicle);
}

async function deleteVehicle(userId, vehicleId) {
  const customer = await requireCustomer(userId);
  if (!customer) return null;

  if (useMemoryStore()) {
    return memoryStore.deleteVehicle(customer.id, vehicleId);
  }

  const existingVehicle = await getVehicle(userId, vehicleId);
  if (!existingVehicle) return null;

  const prisma = getPrisma();
  const vehicle = await prisma.customerVehicle.update({
    where: { id: vehicleId },
    data: { isActive: false },
  });
  return serialize(vehicle);
}

async function listBookings(userId) {
  const customer = await requireCustomer(userId);
  if (!customer) return null;

  if (useMemoryStore()) return memoryStore.listBookings(customer.id);

  const prisma = getPrisma();
  const bookings = await prisma.booking.findMany({
    where: { customerId: customer.id },
    include: { vehicle: true },
    orderBy: { scheduleAt: "desc" },
  });
  return serialize(bookings);
}

async function listActiveServiceOrders(userId) {
  const customer = await requireCustomer(userId);
  if (!customer) return null;

  if (useMemoryStore()) return memoryStore.listActiveServiceOrders(customer.id);

  const prisma = getPrisma();
  const serviceOrders = await prisma.serviceOrder.findMany({
    where: {
      customerId: customer.id,
      status: { notIn: ACTIVE_SERVICE_ORDER_EXCLUDED_STATUSES },
    },
    include: { vehicle: true },
    orderBy: { createdAt: "desc" },
  });
  return serialize(serviceOrders);
}

async function listServiceHistory(userId) {
  const customer = await requireCustomer(userId);
  if (!customer) return null;

  if (useMemoryStore()) return memoryStore.listServiceHistory(customer.id);

  const prisma = getPrisma();
  const histories = await prisma.serviceHistory.findMany({
    where: { customerId: customer.id },
    include: { vehicle: true },
    orderBy: { serviceDate: "desc" },
  });
  return serialize(histories);
}

async function listInvoices(userId) {
  const customer = await requireCustomer(userId);
  if (!customer) return null;

  if (useMemoryStore()) return memoryStore.listInvoices(customer.id);

  const prisma = getPrisma();
  const invoices = await prisma.invoice.findMany({
    where: { customerId: customer.id },
    include: {
      serviceOrder: { include: { vehicle: true } },
      items: true,
      payments: { orderBy: { createdAt: "desc" } },
    },
    orderBy: { issuedAt: "desc" },
  });
  return serialize(invoices);
}

async function getInvoice(userId, invoiceId) {
  const customer = await requireCustomer(userId);
  if (!customer) return null;

  if (useMemoryStore()) return memoryStore.findInvoice(customer.id, invoiceId);

  const prisma = getPrisma();
  const invoice = await prisma.invoice.findFirst({
    where: { id: invoiceId, customerId: customer.id },
    include: {
      serviceOrder: { include: { vehicle: true } },
      items: true,
      payments: { orderBy: { createdAt: "desc" } },
    },
  });
  return invoice ? serialize(invoice) : null;
}

module.exports = {
  getDashboardSummary,
  listVehicles,
  createVehicle,
  getVehicle,
  updateVehicle,
  deleteVehicle,
  listBookings,
  listActiveServiceOrders,
  listServiceHistory,
  listInvoices,
  getInvoice,
};
