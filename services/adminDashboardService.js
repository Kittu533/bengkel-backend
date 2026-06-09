const adminDashboardRepository = require("../models/adminDashboardRepository");

function getSummary() {
  return adminDashboardRepository.getSummary();
}

function listTodayBookings() {
  return adminDashboardRepository.listTodayBookings();
}

function listActiveServiceOrders() {
  return adminDashboardRepository.listActiveServiceOrders();
}

function listLowStockSpareparts() {
  return adminDashboardRepository.listLowStockSpareparts();
}

function getRevenueChart() {
  return adminDashboardRepository.getRevenueChart();
}

module.exports = {
  getSummary,
  listTodayBookings,
  listActiveServiceOrders,
  listLowStockSpareparts,
  getRevenueChart,
};
