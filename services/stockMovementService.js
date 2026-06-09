const stockMovementRepository = require("../models/stockMovementRepository");
const { HttpError } = require("../utils/httpError");

function ensureAdmin(user) {
  const roles = user?.roles || [];
  if (!roles.includes("ADMIN")) {
    throw new HttpError(403, "Akses admin diperlukan");
  }
}

function ensureFound(value, message) {
  if (!value) throw new HttpError(404, message);
  return value;
}

function normalizeAdjustment(payload) {
  const quantity =
    payload.type === "OUT" ? -Math.abs(payload.quantity) : payload.quantity;
  return { ...payload, quantity };
}

async function listLowStockSpareparts(user, query) {
  ensureAdmin(user);
  return stockMovementRepository.listLowStockSpareparts(query);
}

async function listStockMovements(user, query) {
  ensureAdmin(user);
  return stockMovementRepository.listStockMovements(query);
}

async function listSparepartStockMovements(user, sparepartId, query) {
  ensureAdmin(user);
  return stockMovementRepository.listSparepartStockMovements(sparepartId, query);
}

async function adjustStock(user, sparepartId, payload) {
  ensureAdmin(user);
  const adjusted = await stockMovementRepository.adjustStock(
    sparepartId,
    user.id,
    normalizeAdjustment(payload)
  );
  return ensureFound(adjusted, "Sparepart tidak ditemukan");
}

module.exports = {
  adjustStock,
  listLowStockSpareparts,
  listSparepartStockMovements,
  listStockMovements,
};
