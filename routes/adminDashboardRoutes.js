const express = require("express");
const { ROLES } = require("../config/auth");
const adminDashboardController = require("../controllers/adminDashboardController");
const {
  authMiddleware,
  roleMiddleware,
} = require("../middleware/authMiddleware");

const router = express.Router();

router.use(authMiddleware);
router.use(roleMiddleware([ROLES.ADMIN]));

router.get("/summary", adminDashboardController.summary);
router.get("/today-bookings", adminDashboardController.todayBookings);
router.get(
  "/active-service-orders",
  adminDashboardController.activeServiceOrders
);
router.get("/low-stock", adminDashboardController.lowStock);
router.get("/revenue-chart", adminDashboardController.revenueChart);

module.exports = router;
