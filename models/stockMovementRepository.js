const { getPrisma } = require("./prismaClient");
const { HttpError } = require("../utils/httpError");

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

function includeMovement() {
  return {
    sparepart: { include: { category: true } },
    createdBy: { select: { id: true, name: true, email: true } },
  };
}

function buildMovementWhere(query = {}) {
  return {
    ...(query.sparepartId ? { sparepartId: query.sparepartId } : {}),
    ...(query.type ? { type: query.type } : {}),
    ...(query.referenceType ? { referenceType: query.referenceType } : {}),
    ...(query.search
      ? {
          sparepart: {
            OR: [
              { name: { contains: query.search, mode: "insensitive" } },
              { sku: { contains: query.search, mode: "insensitive" } },
              { brand: { contains: query.search, mode: "insensitive" } },
            ],
          },
        }
      : {}),
  };
}

async function listLowStockSpareparts(query = {}) {
  const prisma = getPrisma();
  const { page, limit, skip } = normalizePagination(query);
  const where = {
    isActive: true,
    ...(query.categoryId ? { categoryId: query.categoryId } : {}),
    ...(query.brand ? { brand: { contains: query.brand, mode: "insensitive" } } : {}),
    ...(query.search
      ? {
          OR: [
            { name: { contains: query.search, mode: "insensitive" } },
            { sku: { contains: query.search, mode: "insensitive" } },
            { brand: { contains: query.search, mode: "insensitive" } },
          ],
        }
      : {}),
  };
  const items = await prisma.sparepart.findMany({
    where,
    include: { category: true },
    orderBy: [{ stock: "asc" }, { name: "asc" }],
  });
  const lowStockItems = items.filter((item) => item.stock <= item.minStock);
  return paginated(
    serialize(lowStockItems.slice(skip, skip + limit)),
    lowStockItems.length,
    page,
    limit
  );
}

async function listStockMovements(query = {}) {
  const prisma = getPrisma();
  const { page, limit, skip } = normalizePagination(query);
  const where = buildMovementWhere(query);
  const [data, total] = await Promise.all([
    prisma.stockMovement.findMany({
      where,
      include: includeMovement(),
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
    }),
    prisma.stockMovement.count({ where }),
  ]);
  return paginated(serialize(data), total, page, limit);
}

async function listSparepartStockMovements(sparepartId, query = {}) {
  return listStockMovements({ ...query, sparepartId });
}

async function adjustStock(sparepartId, userId, payload) {
  const prisma = getPrisma();
  const result = await prisma.$transaction(async (tx) => {
    const sparepart = await tx.sparepart.findFirst({
      where: { id: sparepartId, isActive: true },
    });
    if (!sparepart) return null;

    const beforeStock = sparepart.stock;
    const afterStock = beforeStock + payload.quantity;
    if (afterStock < 0) {
      throw new HttpError(409, "Stok sparepart tidak boleh negatif");
    }

    await tx.sparepart.update({
      where: { id: sparepartId },
      data: { stock: afterStock },
    });

    await tx.stockMovement.create({
      data: {
        sparepartId,
        type: payload.type,
        quantity: payload.quantity,
        beforeStock,
        afterStock,
        note: payload.note || null,
        referenceType: payload.referenceType || "MANUAL_ADJUSTMENT",
        referenceId: payload.referenceId || null,
        createdById: userId,
      },
    });

    return tx.sparepart.findUnique({
      where: { id: sparepartId },
      include: { category: true },
    });
  });

  return result ? serialize(result) : null;
}

async function createStockMovement(tx, payload) {
  return tx.stockMovement.create({
    data: {
      sparepartId: payload.sparepartId,
      type: payload.type,
      quantity: payload.quantity,
      beforeStock: payload.beforeStock,
      afterStock: payload.afterStock,
      note: payload.note || null,
      referenceType: payload.referenceType || null,
      referenceId: payload.referenceId || null,
      createdById: payload.createdById || null,
    },
  });
}

module.exports = {
  adjustStock,
  createStockMovement,
  listLowStockSpareparts,
  listSparepartStockMovements,
  listStockMovements,
};
