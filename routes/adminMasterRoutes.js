const express = require("express");
const { ROLES } = require("../config/auth");
const adminMasterController = require("../controllers/adminMasterController");
const stockMovementController = require("../controllers/stockMovementController");
const {
  authMiddleware,
  roleMiddleware,
} = require("../middleware/authMiddleware");

const router = express.Router();

router.use(authMiddleware);
router.use(roleMiddleware([ROLES.ADMIN]));

mountResource(router, "/customers", adminMasterController.customers, true);
mountResource(router, "/vehicles", adminMasterController.vehicles, true);
mountResource(
  router,
  "/service-categories",
  adminMasterController.serviceCategories
);
mountResource(
  router,
  "/service-catalogs",
  adminMasterController.serviceCatalogs,
  true
);
mountResource(
  router,
  "/sparepart-categories",
  adminMasterController.sparepartCategories
);
router.get("/spareparts/low-stock", stockMovementController.lowStock);
router.post(
  "/spareparts/:id/stock-adjustment",
  stockMovementController.stockAdjustment
);
router.get(
  "/spareparts/:id/stock-movements",
  stockMovementController.sparepartMovements
);
router.get("/stock-movements", stockMovementController.movements);
mountResource(router, "/spareparts", adminMasterController.spareparts, true);

function mountResource(routerInstance, path, controller, withDetail = false) {
  routerInstance.get(path, controller.list);
  routerInstance.post(path, controller.create);
  if (withDetail) routerInstance.get(`${path}/:id`, controller.detail);
  routerInstance.patch(`${path}/:id`, controller.update);
  routerInstance.delete(`${path}/:id`, controller.remove);
}

module.exports = router;
