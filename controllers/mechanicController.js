const serviceOrderService = require("../services/serviceOrderService");
const { sendSuccess } = require("../utils/response");
const {
  validateChecklist,
  validateNote,
  validatePhoto,
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

async function listTasks(req, res, next) {
  try {
    const result = await serviceOrderService.listServiceOrders(req.user, req.query);
    return sendPaginated(res, "Task mekanik berhasil diambil", result);
  } catch (error) {
    return next(error);
  }
}

async function taskDetail(req, res, next) {
  try {
    const data = await serviceOrderService.getServiceOrder(req.user, req.params.id);
    return sendSuccess(res, 200, "Detail task mekanik berhasil diambil", data);
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
    return sendSuccess(res, 200, "Progress task berhasil diperbarui", data);
  } catch (error) {
    return next(error);
  }
}

async function addNote(req, res, next) {
  try {
    const payload = validateNote(req.body);
    const data = await serviceOrderService.addNote(req.user, req.params.id, payload);
    return sendSuccess(res, 201, "Catatan mekanik berhasil ditambahkan", data);
  } catch (error) {
    return next(error);
  }
}

async function addPhoto(req, res, next) {
  try {
    const payload = validatePhoto(req.body);
    const data = await serviceOrderService.addPhoto(req.user, req.params.id, payload);
    return sendSuccess(res, 201, "Foto progress berhasil ditambahkan", data);
  } catch (error) {
    return next(error);
  }
}

async function addChecklist(req, res, next) {
  try {
    const payload = validateChecklist(req.body);
    const data = await serviceOrderService.addChecklist(
      req.user,
      req.params.id,
      payload
    );
    return sendSuccess(res, 201, "Checklist service berhasil ditambahkan", data);
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  listTasks,
  taskDetail,
  updateStatus,
  addNote,
  addPhoto,
  addChecklist,
};
