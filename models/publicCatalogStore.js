const serviceCategories = new Map();
const serviceCatalogs = new Map();
const sparepartCategories = new Map();
const spareparts = new Map();

function seedPublicCatalogs() {
  if (serviceCatalogs.size || spareparts.size) return;

  serviceCategories.set("cat-service-motor", {
    id: "cat-service-motor",
    name: "Service Motor",
    isActive: true,
  });
  serviceCategories.set("cat-service-mobil", {
    id: "cat-service-mobil",
    name: "Service Mobil",
    isActive: true,
  });
  sparepartCategories.set("cat-sparepart-electric", {
    id: "cat-sparepart-electric",
    name: "Kelistrikan",
    isActive: true,
  });
  sparepartCategories.set("cat-sparepart-filter", {
    id: "cat-sparepart-filter",
    name: "Filter",
    isActive: true,
  });

  serviceCatalogs.set("svc-motor-oil", {
    id: "svc-motor-oil",
    categoryId: "cat-service-motor",
    name: "Ganti Oli Motor",
    slug: "ganti-oli-motor",
    description: "Penggantian oli mesin motor dengan pengecekan ringan.",
    vehicleType: "MOTOR",
    price: 75000,
    estimatedDurationMinutes: 30,
    isActive: true,
  });
  serviceCatalogs.set("svc-car-tune-up", {
    id: "svc-car-tune-up",
    categoryId: "cat-service-mobil",
    name: "Tune Up Mobil",
    slug: "tune-up-mobil",
    description: "Tune up mobil berkala untuk menjaga performa mesin.",
    vehicleType: "MOBIL",
    price: 350000,
    estimatedDurationMinutes: 120,
    isActive: true,
  });
  serviceCatalogs.set("svc-inactive", {
    id: "svc-inactive",
    categoryId: "cat-service-motor",
    name: "Service Nonaktif",
    slug: "service-nonaktif",
    description: "Data tidak boleh tampil di public catalog.",
    vehicleType: "MOTOR",
    price: 10000,
    estimatedDurationMinutes: 15,
    isActive: false,
  });

  spareparts.set("sp-aki-gs", {
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
  });
  spareparts.set("sp-filter-sakura", {
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
  });
  spareparts.set("sp-inactive", {
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
  });
}

function getServiceCategories() {
  return [...serviceCategories.values()];
}

function getSparepartCategories() {
  return [...sparepartCategories.values()];
}

function getServiceCatalogs() {
  return [...serviceCatalogs.values()].map((service) => ({
    ...service,
    category: serviceCategories.get(service.categoryId) || null,
  }));
}

function getSpareparts() {
  return [...spareparts.values()].map((sparepart) => ({
    ...sparepart,
    category: sparepartCategories.get(sparepart.categoryId) || null,
  }));
}

module.exports = {
  seedPublicCatalogs,
  getServiceCategories,
  getSparepartCategories,
  getServiceCatalogs,
  getSpareparts,
};
