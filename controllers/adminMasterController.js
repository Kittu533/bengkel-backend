const adminMasterService = require("../services/adminMasterService");
const { sendSuccess } = require("../utils/response");
const validators = require("../validators/adminMasterValidator");

function sendPaginated(res, message, result) {
  return res.status(200).json({
    success: true,
    message,
    data: result.data,
    meta: result.meta,
  });
}

function buildResourceController(config) {
  return {
    list: async (req, res, next) => {
      try {
        const result = await adminMasterService[config.list](req.query);
        return sendPaginated(res, `${config.label} berhasil diambil`, result);
      } catch (error) {
        return next(error);
      }
    },
    detail: config.detail
      ? async (req, res, next) => {
          try {
            const data = await adminMasterService[config.detail](req.params.id);
            return sendSuccess(res, 200, `${config.label} berhasil diambil`, data);
          } catch (error) {
            return next(error);
          }
        }
      : undefined,
    create: async (req, res, next) => {
      try {
        const payload = validators[config.validateCreate](req.body);
        const data = await adminMasterService[config.create](payload);
        return sendSuccess(res, 201, `${config.label} berhasil dibuat`, data);
      } catch (error) {
        return next(error);
      }
    },
    update: async (req, res, next) => {
      try {
        const payload = validators[config.validateUpdate](req.body);
        const data = await adminMasterService[config.update](
          req.params.id,
          payload
        );
        return sendSuccess(res, 200, `${config.label} berhasil diperbarui`, data);
      } catch (error) {
        return next(error);
      }
    },
    remove: async (req, res, next) => {
      try {
        await adminMasterService[config.remove](req.params.id);
        return sendSuccess(res, 200, `${config.label} berhasil dihapus`);
      } catch (error) {
        return next(error);
      }
    },
  };
}

module.exports = {
  customers: buildResourceController({
    label: "Customer",
    list: "listCustomers",
    detail: "getCustomer",
    create: "createCustomer",
    update: "updateCustomer",
    remove: "deleteCustomer",
    validateCreate: "validateCreateCustomer",
    validateUpdate: "validateUpdateCustomer",
  }),
  vehicles: buildResourceController({
    label: "Kendaraan",
    list: "listVehicles",
    detail: "getVehicle",
    create: "createVehicle",
    update: "updateVehicle",
    remove: "deleteVehicle",
    validateCreate: "validateCreateVehicle",
    validateUpdate: "validateUpdateVehicle",
  }),
  serviceCategories: buildResourceController({
    label: "Kategori service",
    list: "listServiceCategories",
    create: "createServiceCategory",
    update: "updateServiceCategory",
    remove: "deleteServiceCategory",
    validateCreate: "validateCreateCategory",
    validateUpdate: "validateUpdateCategory",
  }),
  serviceCatalogs: buildResourceController({
    label: "Service catalog",
    list: "listServiceCatalogs",
    detail: "getServiceCatalog",
    create: "createServiceCatalog",
    update: "updateServiceCatalog",
    remove: "deleteServiceCatalog",
    validateCreate: "validateCreateServiceCatalog",
    validateUpdate: "validateUpdateServiceCatalog",
  }),
  sparepartCategories: buildResourceController({
    label: "Kategori sparepart",
    list: "listSparepartCategories",
    create: "createSparepartCategory",
    update: "updateSparepartCategory",
    remove: "deleteSparepartCategory",
    validateCreate: "validateCreateCategory",
    validateUpdate: "validateUpdateCategory",
  }),
  spareparts: buildResourceController({
    label: "Sparepart",
    list: "listSpareparts",
    detail: "getSparepart",
    create: "createSparepart",
    update: "updateSparepart",
    remove: "deleteSparepart",
    validateCreate: "validateCreateSparepart",
    validateUpdate: "validateUpdateSparepart",
  }),
};
