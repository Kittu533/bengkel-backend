const { getPrisma } = require("./prismaClient");

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

function getDateRange(query = {}) {
  const now = new Date();
  const start = query.startDate ? new Date(query.startDate) : new Date(now);
  if (!query.startDate) {
    start.setDate(1);
  }
  start.setHours(0, 0, 0, 0);

  const end = query.endDate ? new Date(query.endDate) : new Date(now);
  end.setHours(23, 59, 59, 999);

  return { start, end };
}

function getTodayRange() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start, end };
}

function dateKey(date) {
  return date.toISOString().slice(0, 10);
}

function dateLabel(date) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
  }).format(date);
}

function emptySummary() {
  return {
    todayRevenue: 0,
    monthlyRevenue: 0,
    todayServices: 0,
    activeCustomers: 0,
    unpaidInvoices: 0,
    lowStockItems: 0,
  };
}

async function getDashboardSummary() {
  if (useMemoryStore()) return emptySummary();

  const prisma = getPrisma();
  const { start: todayStart, end: todayEnd } = getTodayRange();
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const [
    todayRevenue,
    monthlyRevenue,
    todayServices,
    activeCustomers,
    unpaidInvoices,
    lowStock,
  ] = await Promise.all([
    prisma.payment.aggregate({
      _sum: { amount: true },
      where: { status: "CONFIRMED", paidAt: { gte: todayStart, lt: todayEnd } },
    }),
    prisma.payment.aggregate({
      _sum: { amount: true },
      where: { status: "CONFIRMED", paidAt: { gte: monthStart } },
    }),
    prisma.serviceOrder.count({
      where: { checkInAt: { gte: todayStart, lt: todayEnd } },
    }),
    prisma.customer.count(),
    prisma.invoice.count({ where: { status: { in: ["UNPAID", "PARTIAL"] } } }),
    prisma.sparepart.findMany({
      where: { isActive: true },
      select: { stock: true, minStock: true },
    }),
  ]);

  return {
    todayRevenue: todayRevenue._sum.amount || 0,
    monthlyRevenue: monthlyRevenue._sum.amount || 0,
    todayServices,
    activeCustomers,
    unpaidInvoices,
    lowStockItems: lowStock.filter((item) => item.stock <= item.minStock).length,
  };
}

async function getRevenueReport(query) {
  if (useMemoryStore()) return [];

  const prisma = getPrisma();
  const { start, end } = getDateRange(query);
  const invoices = await prisma.invoice.findMany({
    where: { issuedAt: { gte: start, lte: end } },
    orderBy: { issuedAt: "asc" },
  });

  const rows = new Map();
  invoices.forEach((invoice) => {
    const key = dateKey(invoice.issuedAt);
    const current = rows.get(key) || {
      date: key,
      label: dateLabel(invoice.issuedAt),
      totalInvoice: 0,
      totalPaid: 0,
      totalUnpaid: 0,
      revenue: 0,
    };
    current.totalInvoice += invoice.totalAmount;
    current.totalPaid += invoice.paidAmount;
    current.totalUnpaid += Math.max(invoice.totalAmount - invoice.paidAmount, 0);
    current.revenue += invoice.paidAmount;
    rows.set(key, current);
  });

  return Array.from(rows.values());
}

async function getServiceReport(query) {
  if (useMemoryStore()) return [];

  const prisma = getPrisma();
  const { start, end } = getDateRange(query);
  const rows = await prisma.serviceOrderServiceItem.groupBy({
    by: ["name"],
    where: { serviceOrder: { createdAt: { gte: start, lte: end } } },
    _sum: { quantity: true, subtotal: true },
    orderBy: { _sum: { subtotal: "desc" } },
    take: 10,
  });

  return rows.map((row) => ({
    serviceName: row.name,
    totalUsed: row._sum.quantity || 0,
    totalRevenue: row._sum.subtotal || 0,
  }));
}

async function getSparepartReport(query) {
  if (useMemoryStore()) return [];

  const prisma = getPrisma();
  const { start, end } = getDateRange(query);
  const rows = await prisma.serviceOrderSparepartItem.groupBy({
    by: ["name"],
    where: { serviceOrder: { createdAt: { gte: start, lte: end } } },
    _sum: { quantity: true, subtotal: true },
    orderBy: { _sum: { subtotal: "desc" } },
    take: 10,
  });

  return rows.map((row) => ({
    sparepartName: row.name,
    quantitySold: row._sum.quantity || 0,
    totalRevenue: row._sum.subtotal || 0,
  }));
}

async function getMechanicPerformance(query) {
  if (useMemoryStore()) return [];

  const prisma = getPrisma();
  const { start, end } = getDateRange(query);
  const serviceOrders = await prisma.serviceOrder.findMany({
    where: {
      mechanicId: { not: null },
      createdAt: { gte: start, lte: end },
    },
    include: { mechanic: true },
  });

  const grouped = new Map();
  serviceOrders.forEach((order) => {
    const key = order.mechanicId;
    const current = grouped.get(key) || {
      mechanicId: key,
      mechanicName: order.mechanic?.name || "-",
      totalServiceOrder: 0,
      completedServiceOrder: 0,
      completionMinutes: 0,
    };

    current.totalServiceOrder += 1;
    if (order.status === "COMPLETED") {
      current.completedServiceOrder += 1;
      if (order.startedAt && order.finishedAt) {
        current.completionMinutes += Math.max(
          Math.round((order.finishedAt.getTime() - order.startedAt.getTime()) / 60000),
          0
        );
      }
    }
    grouped.set(key, current);
  });

  return Array.from(grouped.values())
    .map((row) => ({
      mechanicId: row.mechanicId,
      mechanicName: row.mechanicName,
      totalServiceOrder: row.totalServiceOrder,
      completedServiceOrder: row.completedServiceOrder,
      averageCompletionTime:
        row.completedServiceOrder > 0
          ? Math.round(row.completionMinutes / row.completedServiceOrder)
          : 0,
    }))
    .sort((a, b) => b.totalServiceOrder - a.totalServiceOrder)
    .slice(0, 10);
}

async function listUnpaidInvoices() {
  if (useMemoryStore()) return [];

  const prisma = getPrisma();
  const invoices = await prisma.invoice.findMany({
    where: { status: { in: ["UNPAID", "PARTIAL"] } },
    include: { customer: true, serviceOrder: true },
    orderBy: { issuedAt: "desc" },
    take: 10,
  });
  return serialize(invoices);
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

module.exports = {
  getDashboardSummary,
  getRevenueReport,
  getServiceReport,
  getSparepartReport,
  getMechanicPerformance,
  listUnpaidInvoices,
  listLowStockSpareparts,
};
