const { getPrisma } = require("./prismaClient");

const ACTIVE_BOOKING_EXCLUDED_STATUSES = ["CANCELLED", "CONVERTED"];
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

function getTodayRange() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  return { start, end };
}

function getLastSixMonths() {
  const months = [];
  const current = new Date();
  current.setDate(1);
  current.setHours(0, 0, 0, 0);

  for (let index = 5; index >= 0; index -= 1) {
    const month = new Date(current);
    month.setMonth(current.getMonth() - index);
    const nextMonth = new Date(month);
    nextMonth.setMonth(month.getMonth() + 1);
    months.push({ month, nextMonth });
  }

  return months;
}

function monthLabel(date) {
  return new Intl.DateTimeFormat("id-ID", {
    month: "short",
    year: "2-digit",
  }).format(date);
}

async function getSummary() {
  if (useMemoryStore()) {
    return {
      todayBookings: 0,
      activeServiceOrders: 0,
      unpaidInvoices: 0,
      lowStockItems: 0,
      totalCustomers: 0,
      totalVehicles: 0,
      monthlyRevenue: 0,
    };
  }

  const prisma = getPrisma();
  const { start, end } = getTodayRange();
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const [
    todayBookings,
    activeServiceOrders,
    unpaidInvoices,
    lowStockItems,
    totalCustomers,
    totalVehicles,
    monthlyRevenue,
  ] = await Promise.all([
    prisma.booking.count({
      where: { scheduleAt: { gte: start, lt: end } },
    }),
    prisma.serviceOrder.count({
      where: { status: { notIn: ACTIVE_SERVICE_ORDER_EXCLUDED_STATUSES } },
    }),
    prisma.invoice.count({ where: { status: { not: "PAID" } } }),
    prisma.sparepart.findMany({
      where: { isActive: true },
      select: { stock: true, minStock: true },
    }),
    prisma.customer.count(),
    prisma.customerVehicle.count({ where: { isActive: true } }),
    prisma.invoice.aggregate({
      _sum: { totalAmount: true },
      where: {
        status: "PAID",
        paidAt: { gte: monthStart },
      },
    }),
  ]);

  return {
    todayBookings,
    activeServiceOrders,
    unpaidInvoices,
    lowStockItems: lowStockItems.filter(
      (sparepart) => sparepart.stock <= sparepart.minStock
    ).length,
    totalCustomers,
    totalVehicles,
    monthlyRevenue: monthlyRevenue._sum.totalAmount || 0,
  };
}

async function listTodayBookings() {
  if (useMemoryStore()) return [];

  const prisma = getPrisma();
  const { start, end } = getTodayRange();
  const bookings = await prisma.booking.findMany({
    where: { scheduleAt: { gte: start, lt: end } },
    include: { customer: true, vehicle: true },
    orderBy: { scheduleAt: "asc" },
    take: 10,
  });
  return serialize(bookings);
}

async function listActiveServiceOrders() {
  if (useMemoryStore()) return [];

  const prisma = getPrisma();
  const serviceOrders = await prisma.serviceOrder.findMany({
    where: { status: { notIn: ACTIVE_SERVICE_ORDER_EXCLUDED_STATUSES } },
    include: { customer: true, vehicle: true },
    orderBy: { updatedAt: "desc" },
    take: 10,
  });
  return serialize(serviceOrders);
}

async function listLowStockSpareparts() {
  if (useMemoryStore()) return [];

  const prisma = getPrisma();
  const spareparts = await prisma.sparepart.findMany({
    where: { isActive: true },
    include: { category: true },
    orderBy: [{ stock: "asc" }, { name: "asc" }],
  });
  return serialize(
    spareparts
      .filter((sparepart) => sparepart.stock <= sparepart.minStock)
      .slice(0, 10)
  );
}

async function getRevenueChart() {
  if (useMemoryStore()) {
    return getLastSixMonths().map(({ month }) => ({
      label: monthLabel(month),
      revenue: 0,
    }));
  }

  const prisma = getPrisma();
  const months = getLastSixMonths();
  const rows = await Promise.all(
    months.map(async ({ month, nextMonth }) => {
      const result = await prisma.invoice.aggregate({
        _sum: { totalAmount: true },
        where: {
          status: "PAID",
          paidAt: { gte: month, lt: nextMonth },
        },
      });

      return {
        label: monthLabel(month),
        revenue: result._sum.totalAmount || 0,
      };
    })
  );

  return rows;
}

module.exports = {
  getSummary,
  listTodayBookings,
  listActiveServiceOrders,
  listLowStockSpareparts,
  getRevenueChart,
};
