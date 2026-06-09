const express = require("express");
const { ROLES } = require("../config/auth");
const customerController = require("../controllers/customerController");
const serviceOrderController = require("../controllers/serviceOrderController");
const {
  authMiddleware,
  roleMiddleware,
} = require("../middleware/authMiddleware");

const router = express.Router();

router.use(authMiddleware);
router.use(roleMiddleware([ROLES.CUSTOMER]));

router.get("/dashboard", customerController.dashboard);
router.get("/vehicles", customerController.listVehicles);
router.post("/vehicles", customerController.createVehicle);
router.get("/vehicles/:id", customerController.getVehicle);
router.patch("/vehicles/:id", customerController.updateVehicle);
router.delete("/vehicles/:id", customerController.deleteVehicle);
router.get("/bookings", customerController.listBookings);
router.get("/service-orders/active", customerController.listActiveServiceOrders);
router.get(
  "/service-orders/:id/tracking",
  serviceOrderController.customerTracking
);
router.get("/service-history", customerController.listServiceHistory);
router.get("/invoices", customerController.listInvoices);
router.get("/invoices/:id", customerController.getInvoice);

module.exports = router;
