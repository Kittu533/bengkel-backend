const publicCatalogService = require("../services/publicCatalogService");

function sendPaginated(res, message, result) {
  return res.status(200).json({
    success: true,
    message,
    data: result.data,
    meta: result.meta,
  });
}

function sendSuccess(res, message, data) {
  return res.status(200).json({
    success: true,
    message,
    data,
  });
}

async function listServiceCatalogs(req, res, next) {
  try {
    const result = await publicCatalogService.listServiceCatalogs(req.query);
    return sendPaginated(res, "Service catalog berhasil diambil", result);
  } catch (error) {
    return next(error);
  }
}

async function getServiceCatalog(req, res, next) {
  try {
    const service = await publicCatalogService.getServiceCatalogById(req.params.id);
    return sendSuccess(res, "Service catalog berhasil diambil", service);
  } catch (error) {
    return next(error);
  }
}

async function listSpareparts(req, res, next) {
  try {
    const result = await publicCatalogService.listSpareparts(req.query);
    return sendPaginated(res, "Sparepart berhasil diambil", result);
  } catch (error) {
    return next(error);
  }
}

async function getSparepart(req, res, next) {
  try {
    const sparepart = await publicCatalogService.getSparepartById(req.params.id);
    return sendSuccess(res, "Sparepart berhasil diambil", sparepart);
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  listServiceCatalogs,
  getServiceCatalog,
  listSpareparts,
  getSparepart,
};
