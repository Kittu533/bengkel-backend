const express = require("express");
const { ROLES } = require("../config/auth");
const invoiceController = require("../controllers/invoiceController");
const {
  authMiddleware,
  roleMiddleware,
} = require("../middleware/authMiddleware");

const router = express.Router();
const adminOnly = [authMiddleware, roleMiddleware([ROLES.ADMIN])];

router.get("/invoices", adminOnly, invoiceController.listInvoices);
router.post("/invoices", adminOnly, invoiceController.createInvoice);
router.get("/invoices/:id", adminOnly, invoiceController.getInvoice);
router.patch("/invoices/:id", adminOnly, invoiceController.updateInvoice);
router.post(
  "/invoices/:id/generate-pdf",
  adminOnly,
  invoiceController.generatePdf
);

router.get("/payments", adminOnly, invoiceController.listPayments);
router.post("/payments", adminOnly, invoiceController.createPayment);
router.get("/payments/:id", adminOnly, invoiceController.getPayment);
router.patch("/payments/:id", adminOnly, invoiceController.updatePayment);

module.exports = router;
