const { getPrisma } = require("./prismaClient");

const ACTIVE_SLOT_STATUSES = ["PENDING", "ACCEPTED", "RESCHEDULED"];

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

function bookingInclude() {
  return {
    customer: true,
    vehicle: true,
  };
}

async function getCustomerByUserId(userId) {
  const prisma = getPrisma();
  return prisma.customer.findUnique({ where: { userId } });
}

async function getActiveVehicleForCustomer(customerId, vehicleId) {
  const prisma = getPrisma();
  return prisma.customerVehicle.findFirst({
    where: { id: vehicleId, customerId, isActive: true },
  });
}

async function getActiveServiceCatalog(serviceCatalogId) {
  const prisma = getPrisma();
  return prisma.serviceCatalog.findFirst({
    where: { id: serviceCatalogId, isActive: true },
  });
}

async function findSlotConflict(scheduleAt, ignoreBookingId) {
  const prisma = getPrisma();
  return prisma.booking.findFirst({
    where: {
      scheduleAt,
      status: { in: ACTIVE_SLOT_STATUSES },
      ...(ignoreBookingId ? { id: { not: ignoreBookingId } } : {}),
    },
  });
}

async function createBooking(customerId, payload, service) {
  const prisma = getPrisma();
  const booking = await prisma.booking.create({
    data: {
      customerId,
      vehicleId: payload.vehicleId,
      code: makeCode("BKG"),
      serviceName: service.name,
      scheduleAt: payload.scheduleAt,
      status: "PENDING",
      notes: payload.complaint,
    },
    include: bookingInclude(),
  });
  return serialize(booking);
}

async function listAdminBookings(query) {
  const prisma = getPrisma();
  const { page, limit, skip } = normalizePagination(query);
  const where = {
    ...(query.status ? { status: query.status } : {}),
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
    prisma.booking.findMany({
      where,
      include: bookingInclude(),
      skip,
      take: limit,
      orderBy: { scheduleAt: "desc" },
    }),
    prisma.booking.count({ where }),
  ]);

  return paginated(serialize(data), total, page, limit);
}

async function listCustomerBookings(userId) {
  const customer = await getCustomerByUserId(userId);
  if (!customer) return null;

  const prisma = getPrisma();
  const bookings = await prisma.booking.findMany({
    where: { customerId: customer.id },
    include: { vehicle: true },
    orderBy: { scheduleAt: "desc" },
  });
  return serialize(bookings);
}

async function getBookingById(id) {
  const prisma = getPrisma();
  const booking = await prisma.booking.findUnique({
    where: { id },
    include: bookingInclude(),
  });
  return booking ? serialize(booking) : null;
}

async function getCustomerBookingById(userId, id) {
  const customer = await getCustomerByUserId(userId);
  if (!customer) return null;

  const prisma = getPrisma();
  const booking = await prisma.booking.findFirst({
    where: { id, customerId: customer.id },
    include: { vehicle: true },
  });
  return booking ? serialize(booking) : null;
}

async function updateBooking(id, data) {
  const prisma = getPrisma();
  const booking = await prisma.booking.update({
    where: { id },
    data,
    include: bookingInclude(),
  });
  return serialize(booking);
}

async function convertBookingToServiceOrder(id) {
  const prisma = getPrisma();
  const result = await prisma.$transaction(async (tx) => {
    const booking = await tx.booking.findUnique({ where: { id } });
    if (!booking) return null;

    const serviceOrder = await tx.serviceOrder.create({
      data: {
        customerId: booking.customerId,
        vehicleId: booking.vehicleId,
        code: makeCode("SO"),
        serviceName: booking.serviceName,
        status: "IN_PROGRESS",
        currentStep: "Menunggu pengerjaan",
        startedAt: new Date(),
      },
      include: { customer: true, vehicle: true },
    });

    const updatedBooking = await tx.booking.update({
      where: { id },
      data: { status: "CONVERTED" },
      include: bookingInclude(),
    });

    return { booking: updatedBooking, serviceOrder };
  });

  return result ? serialize(result) : null;
}

module.exports = {
  getCustomerByUserId,
  getActiveVehicleForCustomer,
  getActiveServiceCatalog,
  findSlotConflict,
  createBooking,
  listAdminBookings,
  listCustomerBookings,
  getBookingById,
  getCustomerBookingById,
  updateBooking,
  convertBookingToServiceOrder,
};
