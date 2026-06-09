const express = require("express");
const { ROLES } = require("../config/auth");
const bookingController = require("../controllers/bookingController");
const {
  authMiddleware,
  roleMiddleware,
} = require("../middleware/authMiddleware");

const router = express.Router();

router.use(authMiddleware);

router.post("/", roleMiddleware([ROLES.CUSTOMER]), bookingController.create);
router.get("/", bookingController.list);
router.get("/:id", bookingController.detail);
router.patch("/:id/accept", bookingController.accept);
router.patch("/:id/reject", bookingController.reject);
router.patch("/:id/reschedule", bookingController.reschedule);
router.patch("/:id/cancel", bookingController.cancel);
router.post("/:id/convert-to-service-order", bookingController.convertToServiceOrder);

module.exports = router;
