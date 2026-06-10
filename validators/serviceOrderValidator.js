const { z } = require("zod");
const { HttpError } = require("../utils/httpError");

const statusValues = [
  "WAITING",
  "CHECKED_IN",
  "DIAGNOSIS",
  "WAITING_APPROVAL",
  "IN_PROGRESS",
  "WAITING_SPAREPART",
  "QUALITY_CHECK",
  "READY_TO_PICKUP",
  "COMPLETED",
  "CANCELLED",
];

const visibilityValues = ["INTERNAL", "CUSTOMER_VISIBLE"];

const createServiceOrderSchema = z.object({
  customerId: z.string().trim().min(1, "Customer wajib dipilih"),
  vehicleId: z.string().trim().min(1, "Kendaraan wajib dipilih"),
  serviceCatalogId: z.string().trim().optional(),
  serviceName: z.string().trim().optional(),
  mechanicId: z.string().trim().optional(),
  customerComplaint: z.string().trim().min(5, "Keluhan minimal 5 karakter"),
  initialDiagnosis: z.string().trim().optional(),
  mileageIn: z.coerce.number().int().min(0).optional(),
  estimatedFinishedAt: z.string().trim().optional(),
});

const updateServiceOrderSchema = z.object({
  customerComplaint: z.string().trim().min(5).optional(),
  initialDiagnosis: z.string().trim().optional(),
  mileageIn: z.coerce.number().int().min(0).optional(),
  estimatedFinishedAt: z.string().trim().optional(),
});

const updateStatusSchema = z.object({
  status: z.enum(statusValues, { error: "Status tidak valid" }),
});

const assignMechanicSchema = z.object({
  mechanicId: z.string().trim().min(1, "Mekanik wajib dipilih"),
});

const serviceItemSchema = z.object({
  serviceCatalogId: z.string().trim().min(1, "Service wajib dipilih"),
  quantity: z.coerce.number().int().min(1).default(1),
});

const sparepartItemSchema = z.object({
  sparepartId: z.string().trim().min(1, "Sparepart wajib dipilih"),
  quantity: z.coerce.number().int().min(1).default(1),
});

const noteSchema = z.object({
  note: z.string().trim().min(3, "Catatan minimal 3 karakter"),
  visibility: z.enum(visibilityValues).default("INTERNAL"),
});

const photoSchema = z.object({
  url: z.string().trim().url("URL foto tidak valid"),
  caption: z.string().trim().optional(),
  visibility: z.enum(visibilityValues).default("CUSTOMER_VISIBLE"),
});

const checklistSchema = z.object({
  title: z.string().trim().min(3, "Checklist minimal 3 karakter"),
  isDone: z.coerce.boolean().default(false),
  note: z.string().trim().optional(),
});

function normalizeEmptyStrings(payload) {
  return Object.fromEntries(
    Object.entries(payload || {}).map(([key, value]) => [
      key,
      value === "" ? undefined : value,
    ])
  );
}

function validateDate(value, field) {
  if (!value) return undefined;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new HttpError(422, "Tanggal tidak valid", [
      { field, message: "Tanggal tidak valid" },
    ]);
  }
  return parsed;
}

function validate(schema, payload) {
  const result = schema.safeParse(normalizeEmptyStrings(payload));
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

function withEstimatedDate(payload) {
  return {
    ...payload,
    estimatedFinishedAt: validateDate(
      payload.estimatedFinishedAt,
      "estimatedFinishedAt"
    ),
  };
}

module.exports = {
  serviceOrderStatuses: statusValues,
  validateCreateServiceOrder: (payload) =>
    withEstimatedDate(validate(createServiceOrderSchema, payload)),
  validateUpdateServiceOrder: (payload) =>
    withEstimatedDate(validate(updateServiceOrderSchema, payload)),
  validateUpdateStatus: (payload) => validate(updateStatusSchema, payload),
  validateAssignMechanic: (payload) => validate(assignMechanicSchema, payload),
  validateServiceItem: (payload) => validate(serviceItemSchema, payload),
  validateSparepartItem: (payload) => validate(sparepartItemSchema, payload),
  validateNote: (payload) => validate(noteSchema, payload),
  validatePhoto: (payload) => validate(photoSchema, payload),
  validateChecklist: (payload) => validate(checklistSchema, payload),
};
