const publicCatalogRepository = require("../models/publicCatalogRepository");
const { HttpError } = require("../utils/httpError");

async function listServiceCatalogs(query) {
  return publicCatalogRepository.listServiceCatalogs(query);
}

async function getServiceCatalogById(id) {
  const service = await publicCatalogRepository.getServiceCatalogById(id);
  if (!service) {
    throw new HttpError(404, "Service catalog tidak ditemukan");
  }
  return service;
}

async function listSpareparts(query) {
  return publicCatalogRepository.listSpareparts(query);
}

async function getSparepartById(id) {
  const sparepart = await publicCatalogRepository.getSparepartById(id);
  if (!sparepart) {
    throw new HttpError(404, "Sparepart tidak ditemukan");
  }
  return sparepart;
}

module.exports = {
  listServiceCatalogs,
  getServiceCatalogById,
  listSpareparts,
  getSparepartById,
};
