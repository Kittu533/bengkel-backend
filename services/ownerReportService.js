const ownerReportRepository = require("../models/ownerReportRepository");

function normalizeDateRange(query = {}) {
  return {
    startDate: query.startDate,
    endDate: query.endDate,
  };
}

function getDashboardSummary() {
  return ownerReportRepository.getDashboardSummary();
}

function getRevenueReport(query) {
  return ownerReportRepository.getRevenueReport(normalizeDateRange(query));
}

function getServiceReport(query) {
  return ownerReportRepository.getServiceReport(normalizeDateRange(query));
}

function getSparepartReport(query) {
  return ownerReportRepository.getSparepartReport(normalizeDateRange(query));
}

function getMechanicPerformance(query) {
  return ownerReportRepository.getMechanicPerformance(normalizeDateRange(query));
}

function listUnpaidInvoices() {
  return ownerReportRepository.listUnpaidInvoices();
}

function listLowStockSpareparts() {
  return ownerReportRepository.listLowStockSpareparts();
}

module.exports = {
  getDashboardSummary,
  getRevenueReport,
  getServiceReport,
  getSparepartReport,
  getMechanicPerformance,
  listUnpaidInvoices,
  listLowStockSpareparts,
};
