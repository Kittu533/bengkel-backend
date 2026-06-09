const stockMovementService = require("../services/stockMovementService");
const { sendSuccess } = require("../utils/response");
const { validateStockAdjustment } = require("../validators/stockMovementValidator");

function sendPaginated(res, message, result) {
  return res.status(200).json({
    success: true,
    message,
    data: result.data,
    meta: result.meta,
  });
}

async function lowStock(req, res, next) {
  try {
    const result = await stockMovementService.listLowStockSpareparts(
      req.user,
      req.query
    );
    return sendPaginated(res, "Sparepart low stock berhasil diambil", result);
  } catch (error) {
    return next(error);
  }
}

async function movements(req, res, next) {
  try {
    const result = await stockMovementService.listStockMovements(
      req.user,
      req.query
    );
    return sendPaginated(res, "Stock movement berhasil diambil", result);
  } catch (error) {
    return next(error);
  }
}

async function sparepartMovements(req, res, next) {
  try {
    const result = await stockMovementService.listSparepartStockMovements(
      req.user,
      req.params.id,
      req.query
    );
    return sendPaginated(res, "Stock movement sparepart berhasil diambil", result);
  } catch (error) {
    return next(error);
  }
}

async function stockAdjustment(req, res, next) {
  try {
    const payload = validateStockAdjustment(req.body);
    const data = await stockMovementService.adjustStock(
      req.user,
      req.params.id,
      payload
    );
    return sendSuccess(res, 200, "Stock sparepart berhasil disesuaikan", data);
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  lowStock,
  movements,
  sparepartMovements,
  stockAdjustment,
};
