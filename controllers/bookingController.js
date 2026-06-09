const bookingService = require("../services/bookingService");
const { sendSuccess } = require("../utils/response");
const {
  validateCancelBooking,
  validateCreateBooking,
  validateRejectBooking,
  validateRescheduleBooking,
} = require("../validators/bookingValidator");

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
    const payload = validateCreateBooking(req.body);
    const booking = await bookingService.createCustomerBooking(req.user, payload);
    return sendSuccess(res, 201, "Booking berhasil dibuat", booking);
  } catch (error) {
    return next(error);
  }
}

async function list(req, res, next) {
  try {
    const result = await bookingService.listBookings(req.user, req.query);
    if (result.meta) return sendPaginated(res, "Booking berhasil diambil", result);
    return sendSuccess(res, 200, "Booking berhasil diambil", result);
  } catch (error) {
    return next(error);
  }
}

async function detail(req, res, next) {
  try {
    const booking = await bookingService.getBooking(req.user, req.params.id);
    return sendSuccess(res, 200, "Booking berhasil diambil", booking);
  } catch (error) {
    return next(error);
  }
}

async function accept(req, res, next) {
  try {
    const booking = await bookingService.acceptBooking(req.user, req.params.id);
    return sendSuccess(res, 200, "Booking berhasil diterima", booking);
  } catch (error) {
    return next(error);
  }
}

async function reject(req, res, next) {
  try {
    const payload = validateRejectBooking(req.body);
    const booking = await bookingService.rejectBooking(
      req.user,
      req.params.id,
      payload
    );
    return sendSuccess(res, 200, "Booking berhasil ditolak", booking);
  } catch (error) {
    return next(error);
  }
}

async function reschedule(req, res, next) {
  try {
    const payload = validateRescheduleBooking(req.body);
    const booking = await bookingService.rescheduleBooking(
      req.user,
      req.params.id,
      payload
    );
    return sendSuccess(res, 200, "Booking berhasil dijadwalkan ulang", booking);
  } catch (error) {
    return next(error);
  }
}

async function cancel(req, res, next) {
  try {
    const payload = validateCancelBooking(req.body);
    const booking = await bookingService.cancelBooking(
      req.user,
      req.params.id,
      payload
    );
    return sendSuccess(res, 200, "Booking berhasil dibatalkan", booking);
  } catch (error) {
    return next(error);
  }
}

async function convertToServiceOrder(req, res, next) {
  try {
    const result = await bookingService.convertToServiceOrder(
      req.user,
      req.params.id
    );
    return sendSuccess(res, 201, "Booking berhasil dikonversi", result);
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  create,
  list,
  detail,
  accept,
  reject,
  reschedule,
  cancel,
  convertToServiceOrder,
};
