const express = require("express");
const serviceOrderController = require("../controllers/serviceOrderController");
const { authMiddleware } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(authMiddleware);

router.get("/", serviceOrderController.list);
router.post("/", serviceOrderController.create);
router.get("/:id", serviceOrderController.detail);
router.patch("/:id", serviceOrderController.update);
router.patch("/:id/status", serviceOrderController.updateStatus);
router.patch("/:id/assign-mechanic", serviceOrderController.assignMechanic);
router.post("/:id/service-items", serviceOrderController.addServiceItem);
router.post("/:id/sparepart-items", serviceOrderController.addSparepartItem);
router.post("/:id/notes", serviceOrderController.addNote);
router.post("/:id/photos", serviceOrderController.addPhoto);
router.patch("/:id/complete", serviceOrderController.complete);

module.exports = router;
