const adminMasterRepository = require("../models/adminMasterRepository");
const { HttpError } = require("../utils/httpError");

function ensureFound(value, message) {
  if (!value) throw new HttpError(404, message);
  return value;
}

module.exports = {
  listCustomers: adminMasterRepository.listCustomers,
  getCustomer: async (id) =>
    ensureFound(await adminMasterRepository.getCustomer(id), "Customer tidak ditemukan"),
  createCustomer: adminMasterRepository.createCustomer,
  updateCustomer: async (id, payload) =>
    ensureFound(
      await adminMasterRepository.updateCustomer(id, payload),
      "Customer tidak ditemukan"
    ),
  deleteCustomer: async (id) =>
    ensureFound(
      await adminMasterRepository.deleteCustomer(id),
      "Customer tidak ditemukan"
    ),

  listVehicles: adminMasterRepository.listVehicles,
  getVehicle: async (id) =>
    ensureFound(await adminMasterRepository.getVehicle(id), "Kendaraan tidak ditemukan"),
  createVehicle: adminMasterRepository.createVehicle,
  updateVehicle: async (id, payload) =>
    ensureFound(
      await adminMasterRepository.updateVehicle(id, payload),
      "Kendaraan tidak ditemukan"
    ),
  deleteVehicle: async (id) =>
    ensureFound(
      await adminMasterRepository.deleteVehicle(id),
      "Kendaraan tidak ditemukan"
    ),

  listServiceCategories: adminMasterRepository.listServiceCategories,
  createServiceCategory: adminMasterRepository.createServiceCategory,
  updateServiceCategory: async (id, payload) =>
    ensureFound(
      await adminMasterRepository.updateServiceCategory(id, payload),
      "Kategori service tidak ditemukan"
    ),
  deleteServiceCategory: async (id) =>
    ensureFound(
      await adminMasterRepository.deleteServiceCategory(id),
      "Kategori service tidak ditemukan"
    ),

  listServiceCatalogs: adminMasterRepository.listServiceCatalogs,
  getServiceCatalog: async (id) =>
    ensureFound(
      await adminMasterRepository.getServiceCatalog(id),
      "Service catalog tidak ditemukan"
    ),
  createServiceCatalog: adminMasterRepository.createServiceCatalog,
  updateServiceCatalog: async (id, payload) =>
    ensureFound(
      await adminMasterRepository.updateServiceCatalog(id, payload),
      "Service catalog tidak ditemukan"
    ),
  deleteServiceCatalog: async (id) =>
    ensureFound(
      await adminMasterRepository.deleteServiceCatalog(id),
      "Service catalog tidak ditemukan"
    ),

  listSparepartCategories: adminMasterRepository.listSparepartCategories,
  createSparepartCategory: adminMasterRepository.createSparepartCategory,
  updateSparepartCategory: async (id, payload) =>
    ensureFound(
      await adminMasterRepository.updateSparepartCategory(id, payload),
      "Kategori sparepart tidak ditemukan"
    ),
  deleteSparepartCategory: async (id) =>
    ensureFound(
      await adminMasterRepository.deleteSparepartCategory(id),
      "Kategori sparepart tidak ditemukan"
    ),

  listSpareparts: adminMasterRepository.listSpareparts,
  getSparepart: async (id) =>
    ensureFound(await adminMasterRepository.getSparepart(id), "Sparepart tidak ditemukan"),
  createSparepart: adminMasterRepository.createSparepart,
  updateSparepart: async (id, payload) =>
    ensureFound(
      await adminMasterRepository.updateSparepart(id, payload),
      "Sparepart tidak ditemukan"
    ),
  deleteSparepart: async (id) =>
    ensureFound(
      await adminMasterRepository.deleteSparepart(id),
      "Sparepart tidak ditemukan"
    ),
};
