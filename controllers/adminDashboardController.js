const adminDashboardService = require("../services/adminDashboardService");
const { sendSuccess } = require("../utils/response");

async function summary(_req, res, next) {
  try {
    const data = await adminDashboardService.getSummary();
    return sendSuccess(res, 200, "Summary dashboard admin berhasil diambil", data);
  } catch (error) {
    return next(error);
  }
}

async function todayBookings(_req, res, next) {
  try {
    const data = await adminDashboardService.listTodayBookings();
    return sendSuccess(res, 200, "Booking hari ini berhasil diambil", data);
  } catch (error) {
    return next(error);
  }
}

async function activeServiceOrders(_req, res, next) {
  try {
    const data = await adminDashboardService.listActiveServiceOrders();
    return sendSuccess(res, 200, "Service aktif berhasil diambil", data);
  } catch (error) {
    return next(error);
  }
}

async function lowStock(_req, res, next) {
  try {
    const data = await adminDashboardService.listLowStockSpareparts();
    return sendSuccess(res, 200, "Stok menipis berhasil diambil", data);
  } catch (error) {
    return next(error);
  }
}

async function revenueChart(_req, res, next) {
  try {
    const data = await adminDashboardService.getRevenueChart();
    return sendSuccess(res, 200, "Chart revenue berhasil diambil", data);
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  summary,
  todayBookings,
  activeServiceOrders,
  lowStock,
  revenueChart,
};
