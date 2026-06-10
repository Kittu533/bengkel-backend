const express = require("express");
const { ROLES } = require("../config/auth");
const invoiceController = require("../controllers/invoiceController");
const {
  authMiddleware,
  roleMiddleware,
} = require("../middleware/authMiddleware");

const router = express.Router();

router.use(authMiddleware);
router.use(roleMiddleware([ROLES.ADMIN]));

router.get("/invoices", invoiceController.listInvoices);
router.post("/invoices", invoiceController.createInvoice);
router.get("/invoices/:id", invoiceController.getInvoice);
router.patch("/invoices/:id", invoiceController.updateInvoice);
router.post("/invoices/:id/generate-pdf", invoiceController.generatePdf);

router.get("/payments", invoiceController.listPayments);
router.post("/payments", invoiceController.createPayment);
router.get("/payments/:id", invoiceController.getPayment);
router.patch("/payments/:id", invoiceController.updatePayment);

module.exports = router;
