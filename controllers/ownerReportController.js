const ownerReportService = require("../services/ownerReportService");
const { sendSuccess } = require("../utils/response");

async function summary(_req, res, next) {
  try {
    const data = await ownerReportService.getDashboardSummary();
    return sendSuccess(res, 200, "Summary owner berhasil diambil", data);
  } catch (error) {
    return next(error);
  }
}

async function revenue(req, res, next) {
  try {
    const data = await ownerReportService.getRevenueReport(req.query);
    return sendSuccess(res, 200, "Report revenue berhasil diambil", data);
  } catch (error) {
    return next(error);
  }
}

async function services(req, res, next) {
  try {
    const data = await ownerReportService.getServiceReport(req.query);
    return sendSuccess(res, 200, "Report service berhasil diambil", data);
  } catch (error) {
    return next(error);
  }
}

async function spareparts(req, res, next) {
  try {
    const data = await ownerReportService.getSparepartReport(req.query);
    return sendSuccess(res, 200, "Report sparepart berhasil diambil", data);
  } catch (error) {
    return next(error);
  }
}

async function mechanics(req, res, next) {
  try {
    const data = await ownerReportService.getMechanicPerformance(req.query);
    return sendSuccess(res, 200, "Report mekanik berhasil diambil", data);
  } catch (error) {
    return next(error);
  }
}

async function unpaidInvoices(_req, res, next) {
  try {
    const data = await ownerReportService.listUnpaidInvoices();
    return sendSuccess(res, 200, "Invoice belum lunas berhasil diambil", data);
  } catch (error) {
    return next(error);
  }
}

async function lowStock(_req, res, next) {
  try {
    const data = await ownerReportService.listLowStockSpareparts();
    return sendSuccess(res, 200, "Stok menipis berhasil diambil", data);
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  summary,
  revenue,
  services,
  spareparts,
  mechanics,
  unpaidInvoices,
  lowStock,
};
