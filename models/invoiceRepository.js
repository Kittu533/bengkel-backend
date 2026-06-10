const { getPrisma } = require("./prismaClient");

function normalizePagination(query = {}) {
  const page = Math.max(Number(query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(query.limit) || 12, 1), 100);
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

function includeInvoice() {
  return {
    customer: true,
    serviceOrder: { include: { vehicle: true } },
    items: { orderBy: { createdAt: "asc" } },
    payments: { orderBy: { createdAt: "desc" } },
  };
}

function invoiceWhere(query = {}) {
  return {
    ...(query.status ? { status: query.status } : {}),
    ...(query.customerId ? { customerId: query.customerId } : {}),
    ...(query.search
      ? {
          OR: [
            { invoiceNumber: { contains: query.search, mode: "insensitive" } },
            { customer: { name: { contains: query.search, mode: "insensitive" } } },
            { customer: { phone: { contains: query.search, mode: "insensitive" } } },
            { serviceOrder: { code: { contains: query.search, mode: "insensitive" } } },
          ],
        }
      : {}),
  };
}

async function listInvoices(query = {}) {
  const prisma = getPrisma();
  const { page, limit, skip } = normalizePagination(query);
  const where = invoiceWhere(query);
  const [data, total] = await Promise.all([
    prisma.invoice.findMany({
      where,
      include: includeInvoice(),
      skip,
      take: limit,
      orderBy: { issuedAt: "desc" },
    }),
    prisma.invoice.count({ where }),
  ]);
  return paginated(serialize(data), total, page, limit);
}

async function getInvoice(id) {
  const prisma = getPrisma();
  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: includeInvoice(),
  });
  return invoice ? serialize(invoice) : null;
}

async function findCompletedServiceOrder(id) {
  const prisma = getPrisma();
  return prisma.serviceOrder.findFirst({
    where: { id, status: "COMPLETED" },
    include: {
      customer: true,
      vehicle: true,
      serviceItems: true,
      sparepartItems: true,
    },
  });
}

async function createInvoiceFromServiceOrder(serviceOrder, payload = {}) {
  const prisma = getPrisma();
  const invoice = await prisma.$transaction(async (tx) => {
    const existing = await tx.invoice.findUnique({
      where: { serviceOrderId: serviceOrder.id },
      include: includeInvoice(),
    });
    if (existing) return existing;

    const invoiceNumber = await nextInvoiceNumber(tx);
    const issuedAt = payload.issuedAt ? new Date(payload.issuedAt) : new Date();
    const dueAt = payload.dueAt
      ? new Date(payload.dueAt)
      : new Date(issuedAt.getTime() + 7 * 24 * 60 * 60 * 1000);
    const items = [
      ...serviceOrder.serviceItems.map((item) => ({
        type: "SERVICE",
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        subtotal: item.subtotal,
      })),
      ...serviceOrder.sparepartItems.map((item) => ({
        type: "SPAREPART",
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        subtotal: item.subtotal,
      })),
    ];
    const totalAmount =
      payload.totalAmount ||
      items.reduce((sum, item) => sum + item.subtotal, serviceOrder.grandTotal ? 0 : 0) ||
      serviceOrder.grandTotal;

    const created = await tx.invoice.create({
      data: {
        customerId: serviceOrder.customerId,
        serviceOrderId: serviceOrder.id,
        invoiceNumber,
        status: "UNPAID",
        issuedAt,
        dueAt,
        totalAmount,
        items: { create: items },
      },
    });

    return tx.invoice.findUnique({
      where: { id: created.id },
      include: includeInvoice(),
    });
  });

  return serialize(invoice);
}

async function updateInvoice(id, payload) {
  const prisma = getPrisma();
  const existing = await prisma.invoice.findUnique({ where: { id } });
  if (!existing) return null;

  const invoice = await prisma.invoice.update({
    where: { id },
    data: {
      ...(payload.status ? { status: payload.status } : {}),
      ...(Object.prototype.hasOwnProperty.call(payload, "dueAt")
        ? { dueAt: payload.dueAt ? new Date(payload.dueAt) : null }
        : {}),
      ...(Object.prototype.hasOwnProperty.call(payload, "pdfUrl")
        ? { pdfUrl: payload.pdfUrl || null }
        : {}),
    },
    include: includeInvoice(),
  });
  return serialize(invoice);
}

async function generatePdf(id) {
  const prisma = getPrisma();
  const existing = await prisma.invoice.findUnique({ where: { id } });
  if (!existing) return null;

  const invoice = await prisma.invoice.update({
    where: { id },
    data: { pdfUrl: `/api/invoices/${id}/printable` },
    include: includeInvoice(),
  });
  return serialize(invoice);
}

async function listPayments(query = {}) {
  const prisma = getPrisma();
  const { page, limit, skip } = normalizePagination(query);
  const where = {
    ...(query.invoiceId ? { invoiceId: query.invoiceId } : {}),
    ...(query.status ? { status: query.status } : {}),
    ...(query.method ? { method: query.method } : {}),
  };
  const [data, total] = await Promise.all([
    prisma.payment.findMany({
      where,
      include: { invoice: { include: { customer: true } } },
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
    }),
    prisma.payment.count({ where }),
  ]);
  return paginated(serialize(data), total, page, limit);
}

async function getPayment(id) {
  const prisma = getPrisma();
  const payment = await prisma.payment.findUnique({
    where: { id },
    include: { invoice: { include: { customer: true } } },
  });
  return payment ? serialize(payment) : null;
}

async function createPayment(payload) {
  const prisma = getPrisma();
  const payment = await prisma.$transaction(async (tx) => {
    const invoice = await tx.invoice.findUnique({
      where: { id: payload.invoiceId },
      include: { payments: true },
    });
    if (!invoice) return null;
    if (["CANCELLED", "REFUNDED"].includes(invoice.status)) {
      return { blocked: "Invoice tidak bisa dibayar" };
    }

    const paymentNumber = await nextPaymentNumber(tx);
    const created = await tx.payment.create({
      data: {
        invoiceId: payload.invoiceId,
        paymentNumber,
        amount: payload.amount,
        method: payload.method,
        status: payload.status || "CONFIRMED",
        paidAt: payload.paidAt ? new Date(payload.paidAt) : new Date(),
        referenceNumber: payload.referenceNumber || null,
        note: payload.note || null,
      },
    });
    await refreshInvoicePaymentStatus(tx, payload.invoiceId);
    return tx.payment.findUnique({
      where: { id: created.id },
      include: { invoice: { include: { customer: true } } },
    });
  });

  return payment ? serialize(payment) : null;
}

async function updatePayment(id, payload) {
  const prisma = getPrisma();
  const payment = await prisma.$transaction(async (tx) => {
    const existing = await tx.payment.findUnique({ where: { id } });
    if (!existing) return null;
    const updated = await tx.payment.update({
      where: { id },
      data: {
        ...(payload.status ? { status: payload.status } : {}),
        ...(payload.amount ? { amount: payload.amount } : {}),
        ...(payload.method ? { method: payload.method } : {}),
        ...(payload.referenceNumber ? { referenceNumber: payload.referenceNumber } : {}),
        ...(payload.note ? { note: payload.note } : {}),
        ...(payload.paidAt ? { paidAt: new Date(payload.paidAt) } : {}),
      },
    });
    await refreshInvoicePaymentStatus(tx, updated.invoiceId);
    return tx.payment.findUnique({
      where: { id },
      include: { invoice: { include: { customer: true } } },
    });
  });

  return payment ? serialize(payment) : null;
}

async function refreshInvoicePaymentStatus(tx, invoiceId) {
  const invoice = await tx.invoice.findUnique({
    where: { id: invoiceId },
    include: { payments: true },
  });
  const paidAmount = invoice.payments
    .filter((payment) => payment.status === "CONFIRMED")
    .reduce((sum, payment) => sum + payment.amount, 0);
  const status =
    paidAmount <= 0
      ? "UNPAID"
      : paidAmount < invoice.totalAmount
        ? "PARTIAL"
        : "PAID";

  await tx.invoice.update({
    where: { id: invoiceId },
    data: {
      paidAmount,
      status,
      paidAt: status === "PAID" ? new Date() : null,
    },
  });
}

async function nextInvoiceNumber(tx) {
  const today = new Date();
  const date = today.toISOString().slice(0, 10).replace(/-/g, "");
  const count = await tx.invoice.count({
    where: { invoiceNumber: { startsWith: `INV-${date}` } },
  });
  return `INV-${date}-${String(count + 1).padStart(4, "0")}`;
}

async function nextPaymentNumber(tx) {
  const today = new Date();
  const date = today.toISOString().slice(0, 10).replace(/-/g, "");
  const count = await tx.payment.count({
    where: { paymentNumber: { startsWith: `PAY-${date}` } },
  });
  return `PAY-${date}-${String(count + 1).padStart(4, "0")}`;
}

module.exports = {
  createInvoiceFromServiceOrder,
  createPayment,
  findCompletedServiceOrder,
  generatePdf,
  getInvoice,
  getPayment,
  listInvoices,
  listPayments,
  updateInvoice,
  updatePayment,
};
