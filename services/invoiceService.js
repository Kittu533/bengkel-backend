const invoiceRepository = require("../models/invoiceRepository");
const { ROLES } = require("../config/auth");
const { HttpError } = require("../utils/httpError");

function ensureAdmin(user) {
  if (!user?.roles?.includes(ROLES.ADMIN)) {
    throw new HttpError(403, "Akses admin diperlukan");
  }
}

function ensureFound(value, message) {
  if (!value) throw new HttpError(404, message);
  if (value.blocked) throw new HttpError(409, value.blocked);
  return value;
}

async function listInvoices(user, query) {
  ensureAdmin(user);
  return invoiceRepository.listInvoices(query);
}

async function getInvoice(user, id) {
  ensureAdmin(user);
  return ensureFound(await invoiceRepository.getInvoice(id), "Invoice tidak ditemukan");
}

async function createInvoice(user, payload) {
  ensureAdmin(user);
  const order = ensureFound(
    await invoiceRepository.findCompletedServiceOrder(payload.serviceOrderId),
    "Service order completed tidak ditemukan"
  );
  return invoiceRepository.createInvoiceFromServiceOrder(order, payload);
}

async function updateInvoice(user, id, payload) {
  ensureAdmin(user);
  return ensureFound(
    await invoiceRepository.updateInvoice(id, payload),
    "Invoice tidak ditemukan"
  );
}

async function generatePdf(user, id) {
  ensureAdmin(user);
  return ensureFound(
    await invoiceRepository.generatePdf(id),
    "Invoice tidak ditemukan"
  );
}

async function listPayments(user, query) {
  ensureAdmin(user);
  return invoiceRepository.listPayments(query);
}

async function getPayment(user, id) {
  ensureAdmin(user);
  return ensureFound(await invoiceRepository.getPayment(id), "Payment tidak ditemukan");
}

async function createPayment(user, payload) {
  ensureAdmin(user);
  return ensureFound(
    await invoiceRepository.createPayment(payload),
    "Invoice tidak ditemukan"
  );
}

async function updatePayment(user, id, payload) {
  ensureAdmin(user);
  return ensureFound(
    await invoiceRepository.updatePayment(id, payload),
    "Payment tidak ditemukan"
  );
}

module.exports = {
  createInvoice,
  createPayment,
  generatePdf,
  getInvoice,
  getPayment,
  listInvoices,
  listPayments,
  updateInvoice,
  updatePayment,
};
