const customerRepository = require("../models/customerRepository");
const { HttpError } = require("../utils/httpError");

function ensureFound(value, message) {
  if (!value) throw new HttpError(404, message);
  return value;
}

async function getDashboardSummary(userId) {
  return ensureFound(
    await customerRepository.getDashboardSummary(userId),
    "Customer tidak ditemukan"
  );
}

async function listVehicles(userId) {
  return ensureFound(
    await customerRepository.listVehicles(userId),
    "Customer tidak ditemukan"
  );
}

async function createVehicle(userId, payload) {
  return ensureFound(
    await customerRepository.createVehicle(userId, payload),
    "Customer tidak ditemukan"
  );
}

async function getVehicle(userId, vehicleId) {
  return ensureFound(
    await customerRepository.getVehicle(userId, vehicleId),
    "Kendaraan tidak ditemukan"
  );
}

async function updateVehicle(userId, vehicleId, payload) {
  return ensureFound(
    await customerRepository.updateVehicle(userId, vehicleId, payload),
    "Kendaraan tidak ditemukan"
  );
}

async function deleteVehicle(userId, vehicleId) {
  return ensureFound(
    await customerRepository.deleteVehicle(userId, vehicleId),
    "Kendaraan tidak ditemukan"
  );
}

async function listBookings(userId) {
  return ensureFound(
    await customerRepository.listBookings(userId),
    "Customer tidak ditemukan"
  );
}

async function listActiveServiceOrders(userId) {
  return ensureFound(
    await customerRepository.listActiveServiceOrders(userId),
    "Customer tidak ditemukan"
  );
}

async function listServiceHistory(userId) {
  return ensureFound(
    await customerRepository.listServiceHistory(userId),
    "Customer tidak ditemukan"
  );
}

async function listInvoices(userId) {
  return ensureFound(
    await customerRepository.listInvoices(userId),
    "Customer tidak ditemukan"
  );
}

async function getInvoice(userId, invoiceId) {
  return ensureFound(
    await customerRepository.getInvoice(userId, invoiceId),
    "Invoice tidak ditemukan"
  );
}

module.exports = {
  getDashboardSummary,
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
