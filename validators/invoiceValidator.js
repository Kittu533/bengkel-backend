const { z } = require("zod");
const { HttpError } = require("../utils/httpError");

const invoiceStatusValues = ["UNPAID", "PARTIAL", "PAID", "CANCELLED", "REFUNDED"];
const paymentStatusValues = ["PENDING", "CONFIRMED", "FAILED", "CANCELLED", "REFUNDED"];
const paymentMethodValues = ["CASH", "BANK_TRANSFER", "QRIS_MANUAL", "MIDTRANS", "XENDIT"];

const createInvoiceSchema = z.object({
  serviceOrderId: z.string().trim().min(1, "Service order wajib dipilih"),
  issuedAt: z.string().trim().optional(),
  dueAt: z.string().trim().optional(),
});

const updateInvoiceSchema = z.object({
  status: z.enum(invoiceStatusValues).optional(),
  dueAt: z.string().trim().nullable().optional(),
  pdfUrl: z.string().trim().nullable().optional(),
});

const createPaymentSchema = z.object({
  invoiceId: z.string().trim().min(1, "Invoice wajib dipilih"),
  amount: z.coerce.number().int().min(1, "Amount wajib lebih dari 0"),
  method: z.enum(paymentMethodValues),
  status: z.enum(paymentStatusValues).optional(),
  paidAt: z.string().trim().optional(),
  referenceNumber: z.string().trim().optional(),
  note: z.string().trim().optional(),
});

const updatePaymentSchema = z.object({
  amount: z.coerce.number().int().min(1).optional(),
  method: z.enum(paymentMethodValues).optional(),
  status: z.enum(paymentStatusValues).optional(),
  paidAt: z.string().trim().optional(),
  referenceNumber: z.string().trim().optional(),
  note: z.string().trim().optional(),
});

function normalize(payload) {
  return Object.fromEntries(
    Object.entries(payload || {}).map(([key, value]) => [
      key,
      value === "" ? undefined : value,
    ])
  );
}

function validate(schema, payload) {
  const result = schema.safeParse(normalize(payload));
  if (result.success) return result.data;

  throw new HttpError(
    422,
    "Validasi gagal",
    result.error.issues.map((issue) => ({
      field: issue.path.join("."),
      message: issue.message,
    }))
  );
}

function partial(schema) {
  return schema.partial().refine((payload) => Object.keys(payload).length > 0, {
    message: "Minimal satu field harus diisi",
  });
}

module.exports = {
  invoiceStatusValues,
  paymentMethodValues,
  paymentStatusValues,
  validateCreateInvoice: (payload) => validate(createInvoiceSchema, payload),
  validateCreatePayment: (payload) => validate(createPaymentSchema, payload),
  validateUpdateInvoice: (payload) => validate(partial(updateInvoiceSchema), payload),
  validateUpdatePayment: (payload) => validate(partial(updatePaymentSchema), payload),
};
