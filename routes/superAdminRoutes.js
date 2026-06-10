const express = require("express");
const { ROLES } = require("../config/auth");
const superAdminController = require("../controllers/superAdminController");
const { authMiddleware, roleMiddleware } = require("../middleware/authMiddleware");

const router = express.Router();
const superAdminOnly = [authMiddleware, roleMiddleware([ROLES.SUPER_ADMIN])];

router.get("/tenants", superAdminOnly, superAdminController.listTenants);
router.post("/tenants", superAdminOnly, superAdminController.createTenant);
router.get("/tenants/:id", superAdminOnly, superAdminController.getTenant);
router.patch("/tenants/:id", superAdminOnly, superAdminController.updateTenant);
router.delete("/tenants/:id", superAdminOnly, superAdminController.deleteTenant);

router.get("/plans", superAdminOnly, superAdminController.listPlans);
router.post("/plans", superAdminOnly, superAdminController.createPlan);
router.patch("/plans/:id", superAdminOnly, superAdminController.updatePlan);
router.delete("/plans/:id", superAdminOnly, superAdminController.deletePlan);

module.exports = router;
