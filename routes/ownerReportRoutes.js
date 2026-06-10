const express = require("express");
const { ROLES } = require("../config/auth");
const ownerReportController = require("../controllers/ownerReportController");
const { authMiddleware, roleMiddleware } = require("../middleware/authMiddleware");

const router = express.Router();
const ownerOrAdmin = [authMiddleware, roleMiddleware([ROLES.OWNER, ROLES.ADMIN])];

router.get("/owner/dashboard/summary", ownerOrAdmin, ownerReportController.summary);
router.get("/reports/revenue", ownerOrAdmin, ownerReportController.revenue);
router.get("/reports/services", ownerOrAdmin, ownerReportController.services);
router.get("/reports/spareparts", ownerOrAdmin, ownerReportController.spareparts);
router.get("/reports/mechanics", ownerOrAdmin, ownerReportController.mechanics);
router.get(
  "/reports/unpaid-invoices",
  ownerOrAdmin,
  ownerReportController.unpaidInvoices
);
router.get("/reports/low-stock", ownerOrAdmin, ownerReportController.lowStock);

module.exports = router;
