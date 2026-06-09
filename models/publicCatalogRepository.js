const { getPrisma } = require("./prismaClient");
const memoryStore = require("./publicCatalogStore");

function useMemoryStore() {
  return process.env.NODE_ENV === "test" || !process.env.DATABASE_URL;
}

function normalizePagination(query) {
  const page = Math.max(Number(query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(query.limit) || 12, 1), 50);
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}

function paginate(items, query) {
  const { page, limit, skip } = normalizePagination(query);
  const total = items.length;
  return {
    data: items.slice(skip, skip + limit),
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
}

function matchesSearch(item, search) {
  if (!search) return true;
  const value = search.toLowerCase();
  return [item.name, item.description, item.brand, item.sku]
    .filter(Boolean)
    .some((field) => field.toLowerCase().includes(value));
}

function publicSparepart(sparepart) {
  const { costPrice: _costPrice, ...safeSparepart } = sparepart;
  return safeSparepart;
}

async function seedPublicCatalogs() {
  if (useMemoryStore()) return memoryStore.seedPublicCatalogs();

  const prisma = getPrisma();
  const existingService = await prisma.serviceCatalog.findFirst();
  const existingSparepart = await prisma.sparepart.findFirst();
  if (existingService || existingSparepart) return;

  await prisma.serviceCategory.createMany({
    data: [
      { id: "cat-service-motor", name: "Service Motor", isActive: true },
      { id: "cat-service-mobil", name: "Service Mobil", isActive: true },
    ],
    skipDuplicates: true,
  });
  await prisma.sparepartCategory.createMany({
    data: [
      { id: "cat-sparepart-electric", name: "Kelistrikan", isActive: true },
      { id: "cat-sparepart-filter", name: "Filter", isActive: true },
    ],
    skipDuplicates: true,
  });
  await prisma.serviceCatalog.createMany({
    data: [
      {
        id: "svc-motor-oil",
        categoryId: "cat-service-motor",
        name: "Ganti Oli Motor",
        slug: "ganti-oli-motor",
        description: "Penggantian oli mesin motor dengan pengecekan ringan.",
        vehicleType: "MOTOR",
        price: 75000,
        estimatedDurationMinutes: 30,
        isActive: true,
      },
      {
        id: "svc-car-tune-up",
        categoryId: "cat-service-mobil",
        name: "Tune Up Mobil",
        slug: "tune-up-mobil",
        description: "Tune up mobil berkala untuk menjaga performa mesin.",
        vehicleType: "MOBIL",
        price: 350000,
        estimatedDurationMinutes: 120,
        isActive: true,
      },
      {
        id: "svc-inactive",
        categoryId: "cat-service-motor",
        name: "Service Nonaktif",
        slug: "service-nonaktif",
        description: "Data tidak boleh tampil di public catalog.",
        vehicleType: "MOTOR",
        price: 10000,
        estimatedDurationMinutes: 15,
        isActive: false,
      },
    ],
    skipDuplicates: true,
  });
  await prisma.sparepart.createMany({
    data: [
      {
        id: "sp-aki-gs",
        categoryId: "cat-sparepart-electric",
        name: "Aki GS Motor",
        sku: "AKI-GS-MTR",
        brand: "GS",
        description: "Aki motor GS untuk kebutuhan kelistrikan harian.",
        vehicleType: "MOTOR",
        stock: 8,
        minStock: 2,
        sellPrice: 320000,
        costPrice: 240000,
        isActive: true,
      },
      {
        id: "sp-filter-sakura",
        categoryId: "cat-sparepart-filter",
        name: "Filter Oli Sakura",
        sku: "FLT-SAKURA",
        brand: "Sakura",
        description: "Filter oli mobil Sakura untuk perawatan berkala.",
        vehicleType: "MOBIL",
        stock: 15,
        minStock: 5,
        sellPrice: 85000,
        costPrice: 52000,
        isActive: true,
      },
      {
        id: "sp-inactive",
        categoryId: "cat-sparepart-electric",
        name: "Sparepart Nonaktif",
        sku: "SP-INACTIVE",
        brand: "GS",
        description: "Data tidak boleh tampil di public catalog.",
        vehicleType: "MOTOR",
        stock: 1,
        minStock: 1,
        sellPrice: 1000,
        costPrice: 500,
        isActive: false,
      },
    ],
    skipDuplicates: true,
  });
}

async function listServiceCatalogs(query) {
  if (useMemoryStore()) {
    const items = memoryStore
      .getServiceCatalogs()
      .filter((item) => item.isActive)
      .filter((item) => matchesSearch(item, query.search))
      .filter((item) => !query.categoryId || item.categoryId === query.categoryId)
      .filter((item) => !query.vehicleType || item.vehicleType === query.vehicleType);
    return paginate(items, query);
  }

  const prisma = getPrisma();
  const where = {
    isActive: true,
    ...(query.categoryId ? { categoryId: query.categoryId } : {}),
    ...(query.vehicleType ? { vehicleType: query.vehicleType } : {}),
    ...(query.search
      ? {
          OR: [
            { name: { contains: query.search, mode: "insensitive" } },
            { description: { contains: query.search, mode: "insensitive" } },
          ],
        }
      : {}),
  };
  const { page, limit, skip } = normalizePagination(query);
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
  return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 } };
}

async function getServiceCatalogById(id) {
  if (useMemoryStore()) {
    return (
      memoryStore
        .getServiceCatalogs()
        .find((item) => item.id === id && item.isActive) || null
    );
  }

  const prisma = getPrisma();
  return prisma.serviceCatalog.findFirst({
    where: { id, isActive: true },
    include: { category: true },
  });
}

async function listSpareparts(query) {
  if (useMemoryStore()) {
    const items = memoryStore
      .getSpareparts()
      .filter((item) => item.isActive)
      .filter((item) => matchesSearch(item, query.search))
      .filter((item) => !query.categoryId || item.categoryId === query.categoryId)
      .filter((item) => !query.brand || item.brand === query.brand)
      .filter((item) => !query.vehicleType || item.vehicleType === query.vehicleType)
      .map(publicSparepart);
    return paginate(items, query);
  }

  const prisma = getPrisma();
  const where = {
    isActive: true,
    ...(query.categoryId ? { categoryId: query.categoryId } : {}),
    ...(query.brand ? { brand: query.brand } : {}),
    ...(query.vehicleType ? { vehicleType: query.vehicleType } : {}),
    ...(query.search
      ? {
          OR: [
            { name: { contains: query.search, mode: "insensitive" } },
            { description: { contains: query.search, mode: "insensitive" } },
            { sku: { contains: query.search, mode: "insensitive" } },
          ],
        }
      : {}),
  };
  const { page, limit, skip } = normalizePagination(query);
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
  return {
    data: data.map(publicSparepart),
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
  };
}

async function getSparepartById(id) {
  if (useMemoryStore()) {
    const sparepart = memoryStore
      .getSpareparts()
      .find((item) => item.id === id && item.isActive);
    return sparepart ? publicSparepart(sparepart) : null;
  }

  const prisma = getPrisma();
  const sparepart = await prisma.sparepart.findFirst({
    where: { id, isActive: true },
    include: { category: true },
  });
  return sparepart ? publicSparepart(sparepart) : null;
}

module.exports = {
  seedPublicCatalogs,
  listServiceCatalogs,
  getServiceCatalogById,
  listSpareparts,
  getSparepartById,
};
