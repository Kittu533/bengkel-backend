const serviceOrderService = require("../services/serviceOrderService");
const { sendSuccess } = require("../utils/response");
const {
  validateAssignMechanic,
  validateCreateServiceOrder,
  validateNote,
  validatePhoto,
  validateServiceItem,
  validateSparepartItem,
  validateUpdateServiceOrder,
  validateUpdateStatus,
} = require("../validators/serviceOrderValidator");

function sendPaginated(res, message, result) {
  return res.status(200).json({
    success: true,
    message,
    data: result.data,
    meta: result.meta,
  });
}

async function create(req, res, next) {
  try {
    const payload = validateCreateServiceOrder(req.body);
    const data = await serviceOrderService.createServiceOrder(req.user, payload);
    return sendSuccess(res, 201, "Service order berhasil dibuat", data);
  } catch (error) {
    return next(error);
  }
}

async function list(req, res, next) {
  try {
    const result = await serviceOrderService.listServiceOrders(req.user, req.query);
    return sendPaginated(res, "Service order berhasil diambil", result);
  } catch (error) {
    return next(error);
  }
}

async function detail(req, res, next) {
  try {
    const data = await serviceOrderService.getServiceOrder(req.user, req.params.id);
    return sendSuccess(res, 200, "Service order berhasil diambil", data);
  } catch (error) {
    return next(error);
  }
}

async function update(req, res, next) {
  try {
    const payload = validateUpdateServiceOrder(req.body);
    const data = await serviceOrderService.updateServiceOrder(
      req.user,
      req.params.id,
      payload
    );
    return sendSuccess(res, 200, "Service order berhasil diperbarui", data);
  } catch (error) {
    return next(error);
  }
}

async function updateStatus(req, res, next) {
  try {
    const payload = validateUpdateStatus(req.body);
    const data = await serviceOrderService.updateStatus(
      req.user,
      req.params.id,
      payload
    );
    return sendSuccess(res, 200, "Status service order berhasil diperbarui", data);
  } catch (error) {
    return next(error);
  }
}

async function assignMechanic(req, res, next) {
  try {
    const payload = validateAssignMechanic(req.body);
    const data = await serviceOrderService.assignMechanic(
      req.user,
      req.params.id,
      payload
    );
    return sendSuccess(res, 200, "Mekanik berhasil diassign", data);
  } catch (error) {
    return next(error);
  }
}

async function addServiceItem(req, res, next) {
  try {
    const payload = validateServiceItem(req.body);
    const data = await serviceOrderService.addServiceItem(
      req.user,
      req.params.id,
      payload
    );
    return sendSuccess(res, 201, "Service item berhasil ditambahkan", data);
  } catch (error) {
    return next(error);
  }
}

async function addSparepartItem(req, res, next) {
  try {
    const payload = validateSparepartItem(req.body);
    const data = await serviceOrderService.addSparepartItem(
      req.user,
      req.params.id,
      payload
    );
    return sendSuccess(res, 201, "Sparepart item berhasil ditambahkan", data);
  } catch (error) {
    return next(error);
  }
}

async function addNote(req, res, next) {
  try {
    const payload = validateNote(req.body);
    const data = await serviceOrderService.addNote(
      req.user,
      req.params.id,
      payload
    );
    return sendSuccess(res, 201, "Catatan berhasil ditambahkan", data);
  } catch (error) {
    return next(error);
  }
}

async function addPhoto(req, res, next) {
  try {
    const payload = validatePhoto(req.body);
    const data = await serviceOrderService.addPhoto(
      req.user,
      req.params.id,
      payload
    );
    return sendSuccess(res, 201, "Foto progress berhasil ditambahkan", data);
  } catch (error) {
    return next(error);
  }
}

async function complete(req, res, next) {
  try {
    const data = await serviceOrderService.completeServiceOrder(
      req.user,
      req.params.id
    );
    return sendSuccess(res, 200, "Service order berhasil diselesaikan", data);
  } catch (error) {
    return next(error);
  }
}

async function customerTracking(req, res, next) {
  try {
    const data = await serviceOrderService.getCustomerTracking(
      req.user,
      req.params.id
    );
    return sendSuccess(res, 200, "Tracking service berhasil diambil", data);
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  create,
  list,
  detail,
  update,
  updateStatus,
  assignMechanic,
  addServiceItem,
  addSparepartItem,
  addNote,
  addPhoto,
  complete,
  customerTracking,
};
