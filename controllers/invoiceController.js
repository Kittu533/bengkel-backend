const invoiceService = require("../services/invoiceService");
const { recordAuditLog } = require("../services/auditLogService");
const { sendSuccess } = require("../utils/response");
const {
  validateCreateInvoice,
  validateCreatePayment,
  validateUpdateInvoice,
  validateUpdatePayment,
} = require("../validators/invoiceValidator");

function sendPaginated(res, message, result) {
  return res.status(200).json({
    success: true,
    message,
    data: result.data,
    meta: result.meta,
  });
}

async function listInvoices(req, res, next) {
  try {
    const result = await invoiceService.listInvoices(req.user, req.query);
    return sendPaginated(res, "Invoice berhasil diambil", result);
  } catch (error) {
    return next(error);
  }
}

async function createInvoice(req, res, next) {
  try {
    const payload = validateCreateInvoice(req.body);
    const data = await invoiceService.createInvoice(req.user, payload);
    await recordAuditLog(req, {
      action: "invoice.create",
      entityType: "Invoice",
      entityId: data.id,
      metadata: { invoiceNumber: data.invoiceNumber, serviceOrderId: payload.serviceOrderId },
    });
    return sendSuccess(res, 201, "Invoice berhasil dibuat", data);
  } catch (error) {
    return next(error);
  }
}

async function getInvoice(req, res, next) {
  try {
    const data = await invoiceService.getInvoice(req.user, req.params.id);
    return sendSuccess(res, 200, "Invoice berhasil diambil", data);
  } catch (error) {
    return next(error);
  }
}

async function updateInvoice(req, res, next) {
  try {
    const payload = validateUpdateInvoice(req.body);
    const data = await invoiceService.updateInvoice(req.user, req.params.id, payload);
    await recordAuditLog(req, {
      action: "invoice.update",
      entityType: "Invoice",
      entityId: data.id,
      metadata: { changedFields: Object.keys(payload), status: data.status },
    });
    return sendSuccess(res, 200, "Invoice berhasil diperbarui", data);
  } catch (error) {
    return next(error);
  }
}

async function generatePdf(req, res, next) {
  try {
    const data = await invoiceService.generatePdf(req.user, req.params.id);
    await recordAuditLog(req, {
      action: "invoice.generate_pdf",
      entityType: "Invoice",
      entityId: data.id,
      metadata: { invoiceNumber: data.invoiceNumber, pdfUrl: data.pdfUrl },
    });
    return sendSuccess(res, 200, "Placeholder PDF invoice berhasil dibuat", data);
  } catch (error) {
    return next(error);
  }
}

async function listPayments(req, res, next) {
  try {
    const result = await invoiceService.listPayments(req.user, req.query);
    return sendPaginated(res, "Payment berhasil diambil", result);
  } catch (error) {
    return next(error);
  }
}

async function createPayment(req, res, next) {
  try {
    const payload = validateCreatePayment(req.body);
    const data = await invoiceService.createPayment(req.user, payload);
    await recordAuditLog(req, {
      action: "payment.create",
      entityType: "Payment",
      entityId: data.id,
      metadata: {
        invoiceId: data.invoiceId,
        paymentNumber: data.paymentNumber,
        amount: data.amount,
        method: data.method,
        status: data.status,
      },
    });
    return sendSuccess(res, 201, "Payment berhasil dibuat", data);
  } catch (error) {
    return next(error);
  }
}

async function getPayment(req, res, next) {
  try {
    const data = await invoiceService.getPayment(req.user, req.params.id);
    return sendSuccess(res, 200, "Payment berhasil diambil", data);
  } catch (error) {
    return next(error);
  }
}

async function updatePayment(req, res, next) {
  try {
    const payload = validateUpdatePayment(req.body);
    const data = await invoiceService.updatePayment(req.user, req.params.id, payload);
    await recordAuditLog(req, {
      action: "payment.update",
      entityType: "Payment",
      entityId: data.id,
      metadata: { changedFields: Object.keys(payload), status: data.status },
    });
    return sendSuccess(res, 200, "Payment berhasil diperbarui", data);
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  createInvoice,
  createPayment,
  generatePdf,
  getInvoice,
  getPayment,
  listInvoices,
  listPayments,
  updateInvoice,
  updatePayment,
};
