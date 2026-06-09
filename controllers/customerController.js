const customerService = require("../services/customerService");
const { sendSuccess } = require("../utils/response");
const {
  validateCreateVehicle,
  validateUpdateVehicle,
} = require("../validators/customerValidator");

async function dashboard(req, res, next) {
  try {
    const summary = await customerService.getDashboardSummary(req.user.id);
    return sendSuccess(res, 200, "Dashboard customer berhasil diambil", summary);
  } catch (error) {
    return next(error);
  }
}

async function listVehicles(req, res, next) {
  try {
    const vehicles = await customerService.listVehicles(req.user.id);
    return sendSuccess(res, 200, "Kendaraan customer berhasil diambil", vehicles);
  } catch (error) {
    return next(error);
  }
}

async function createVehicle(req, res, next) {
  try {
    const payload = validateCreateVehicle(req.body);
    const vehicle = await customerService.createVehicle(req.user.id, payload);
    return sendSuccess(res, 201, "Kendaraan berhasil ditambahkan", vehicle);
  } catch (error) {
    return next(error);
  }
}

async function getVehicle(req, res, next) {
  try {
    const vehicle = await customerService.getVehicle(req.user.id, req.params.id);
    return sendSuccess(res, 200, "Kendaraan berhasil diambil", vehicle);
  } catch (error) {
    return next(error);
  }
}

async function updateVehicle(req, res, next) {
  try {
    const payload = validateUpdateVehicle(req.body);
    const vehicle = await customerService.updateVehicle(
      req.user.id,
      req.params.id,
      payload
    );
    return sendSuccess(res, 200, "Kendaraan berhasil diperbarui", vehicle);
  } catch (error) {
    return next(error);
  }
}

async function deleteVehicle(req, res, next) {
  try {
    await customerService.deleteVehicle(req.user.id, req.params.id);
    return sendSuccess(res, 200, "Kendaraan berhasil dihapus");
  } catch (error) {
    return next(error);
  }
}

async function listBookings(req, res, next) {
  try {
    const bookings = await customerService.listBookings(req.user.id);
    return sendSuccess(res, 200, "Booking customer berhasil diambil", bookings);
  } catch (error) {
    return next(error);
  }
}

async function listActiveServiceOrders(req, res, next) {
  try {
    const serviceOrders = await customerService.listActiveServiceOrders(
      req.user.id
    );
    return sendSuccess(
      res,
      200,
      "Service aktif customer berhasil diambil",
      serviceOrders
    );
  } catch (error) {
    return next(error);
  }
}

async function listServiceHistory(req, res, next) {
  try {
    const histories = await customerService.listServiceHistory(req.user.id);
    return sendSuccess(res, 200, "Riwayat service berhasil diambil", histories);
  } catch (error) {
    return next(error);
  }
}

async function listInvoices(req, res, next) {
  try {
    const invoices = await customerService.listInvoices(req.user.id);
    return sendSuccess(res, 200, "Invoice customer berhasil diambil", invoices);
  } catch (error) {
    return next(error);
  }
}

async function getInvoice(req, res, next) {
  try {
    const invoice = await customerService.getInvoice(req.user.id, req.params.id);
    return sendSuccess(res, 200, "Invoice customer berhasil diambil", invoice);
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  dashboard,
  listVehicles,
  createVehicle,
  getVehicle,
  updateVehicle,
  deleteVehicle,
  listBookings,
  listActiveServiceOrders,
  listServiceHistory,
  listInvoices,
  getInvoice,
};
