const express = require("express");
const publicCatalogController = require("../controllers/publicCatalogController");

const router = express.Router();

router.get("/service-catalogs", publicCatalogController.listServiceCatalogs);
router.get("/service-catalogs/:id", publicCatalogController.getServiceCatalog);
router.get("/spareparts", publicCatalogController.listSpareparts);
router.get("/spareparts/:id", publicCatalogController.getSparepart);

module.exports = router;
