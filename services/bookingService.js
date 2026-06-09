const { ROLES } = require("../config/auth");
const bookingRepository = require("../models/bookingRepository");
const { HttpError } = require("../utils/httpError");

const EDITABLE_STATUSES = ["PENDING", "ACCEPTED", "RESCHEDULED"];

function ensureFound(value, message) {
  if (!value) throw new HttpError(404, message);
  return value;
}

function isAdmin(user) {
  return user.roles?.includes(ROLES.ADMIN);
}

function isCustomer(user) {
  return user.roles?.includes(ROLES.CUSTOMER);
}

function ensureAdmin(user) {
  if (!isAdmin(user)) throw new HttpError(403, "Role tidak memiliki akses");
}

function ensureBookingEditable(booking) {
  if (!EDITABLE_STATUSES.includes(booking.status)) {
    throw new HttpError(409, "Booking sudah tidak bisa diubah");
  }
}

function appendNote(existing, label, value) {
  const nextNote = `${label}: ${value}`;
  return existing ? `${existing}\n${nextNote}` : nextNote;
}

async function createCustomerBooking(user, payload) {
  if (!isCustomer(user)) throw new HttpError(403, "Role tidak memiliki akses");

  const customer = ensureFound(
    await bookingRepository.getCustomerByUserId(user.id),
    "Customer tidak ditemukan"
  );
  ensureFound(
    await bookingRepository.getActiveVehicleForCustomer(customer.id, payload.vehicleId),
    "Kendaraan tidak ditemukan"
  );
  const service = ensureFound(
    await bookingRepository.getActiveServiceCatalog(payload.serviceCatalogId),
    "Service tidak ditemukan"
  );

  const conflict = await bookingRepository.findSlotConflict(payload.scheduleAt);
  if (conflict) throw new HttpError(409, "Slot booking sudah terisi");

  return bookingRepository.createBooking(customer.id, payload, service);
}

async function listBookings(user, query) {
  if (isAdmin(user)) return bookingRepository.listAdminBookings(query);
  if (isCustomer(user)) {
    return ensureFound(
      await bookingRepository.listCustomerBookings(user.id),
      "Customer tidak ditemukan"
    );
  }
  throw new HttpError(403, "Role tidak memiliki akses");
}

async function getBooking(user, id) {
  if (isAdmin(user)) {
    return ensureFound(await bookingRepository.getBookingById(id), "Booking tidak ditemukan");
  }
  if (isCustomer(user)) {
    return ensureFound(
      await bookingRepository.getCustomerBookingById(user.id, id),
      "Booking tidak ditemukan"
    );
  }
  throw new HttpError(403, "Role tidak memiliki akses");
}

async function acceptBooking(user, id) {
  ensureAdmin(user);
  const booking = ensureFound(
    await bookingRepository.getBookingById(id),
    "Booking tidak ditemukan"
  );
  ensureBookingEditable(booking);

  if (!["PENDING", "RESCHEDULED"].includes(booking.status)) {
    throw new HttpError(409, "Booking tidak bisa diterima");
  }

  return bookingRepository.updateBooking(id, { status: "ACCEPTED" });
}

async function rejectBooking(user, id, payload) {
  ensureAdmin(user);
  const booking = ensureFound(
    await bookingRepository.getBookingById(id),
    "Booking tidak ditemukan"
  );
  ensureBookingEditable(booking);
  return bookingRepository.updateBooking(id, {
    status: "REJECTED",
    notes: appendNote(booking.notes, "Admin reject", payload.reason),
  });
}

async function rescheduleBooking(user, id, payload) {
  ensureAdmin(user);
  const booking = ensureFound(
    await bookingRepository.getBookingById(id),
    "Booking tidak ditemukan"
  );
  ensureBookingEditable(booking);

  const conflict = await bookingRepository.findSlotConflict(payload.scheduleAt, id);
  if (conflict) throw new HttpError(409, "Slot booking sudah terisi");

  return bookingRepository.updateBooking(id, {
    status: "RESCHEDULED",
    scheduleAt: payload.scheduleAt,
    notes: appendNote(booking.notes, "Admin reschedule", payload.reason),
  });
}

async function cancelBooking(user, id, payload) {
  const booking = await getBooking(user, id);
  ensureBookingEditable(booking);
  return bookingRepository.updateBooking(id, {
    status: "CANCELLED",
    notes: payload.reason
      ? appendNote(booking.notes, "Cancel", payload.reason)
      : booking.notes,
  });
}

async function convertToServiceOrder(user, id) {
  ensureAdmin(user);
  const booking = ensureFound(
    await bookingRepository.getBookingById(id),
    "Booking tidak ditemukan"
  );

  if (booking.status !== "ACCEPTED") {
    throw new HttpError(409, "Hanya booking accepted yang bisa dikonversi");
  }

  return bookingRepository.convertBookingToServiceOrder(id);
}

module.exports = {
  createCustomerBooking,
  listBookings,
  getBooking,
  acceptBooking,
  rejectBooking,
  rescheduleBooking,
  cancelBooking,
  convertToServiceOrder,
};
