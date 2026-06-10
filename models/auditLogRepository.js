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
  const limit = Math.min(Math.max(Number(query.limit) || 20, 1), 100);
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

function parseDate(value, endOfDay = false) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  if (endOfDay && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    date.setHours(23, 59, 59, 999);
  }
  return date;
}

function buildAuditLogWhere(query = {}) {
  const dateFrom = parseDate(query.dateFrom);
  const dateTo = parseDate(query.dateTo, true);

  return {
    ...(query.action ? { action: query.action } : {}),
    ...(query.entityType ? { entityType: query.entityType } : {}),
    ...(query.actorId ? { actorId: query.actorId } : {}),
    ...(dateFrom || dateTo
      ? {
          createdAt: {
            ...(dateFrom ? { gte: dateFrom } : {}),
            ...(dateTo ? { lte: dateTo } : {}),
          },
        }
      : {}),
    ...(query.search
      ? {
          OR: [
            { action: { contains: query.search, mode: "insensitive" } },
            { entityType: { contains: query.search, mode: "insensitive" } },
            { entityId: { contains: query.search, mode: "insensitive" } },
            { actor: { name: { contains: query.search, mode: "insensitive" } } },
            { actor: { email: { contains: query.search, mode: "insensitive" } } },
          ],
        }
      : {}),
  };
}

async function createAuditLog(payload) {
  const prisma = getPrisma();
  const log = await prisma.auditLog.create({
    data: {
      actorId: payload.actorId || null,
      action: payload.action,
      entityType: payload.entityType,
      entityId: payload.entityId || null,
      metadata: payload.metadata || undefined,
      ipAddress: payload.ipAddress || null,
      userAgent: payload.userAgent || null,
      requestId: payload.requestId || null,
    },
    include: { actor: true },
  });
  return serialize(log);
}

async function listAuditLogs(query = {}) {
  const prisma = getPrisma();
  const { page, limit, skip } = normalizePagination(query);
  const where = buildAuditLogWhere(query);

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      include: { actor: true },
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
    }),
    prisma.auditLog.count({ where }),
  ]);

  return paginated(serialize(logs), total, page, limit);
}

async function exportAuditLogs(query = {}) {
  const prisma = getPrisma();
  const where = buildAuditLogWhere(query);
  const limit = Math.min(Math.max(Number(query.limit) || 1000, 1), 5000);
  const logs = await prisma.auditLog.findMany({
    where,
    include: { actor: true },
    take: limit,
    orderBy: { createdAt: "desc" },
  });

  return serialize(logs);
}

module.exports = {
  createAuditLog,
  exportAuditLogs,
  listAuditLogs,
};
