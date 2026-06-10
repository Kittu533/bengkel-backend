const { z } = require("zod");
const { HttpError } = require("../utils/httpError");

const tenantStatusValues = ["ACTIVE", "INACTIVE", "SUSPENDED"];
const subscriptionStatusValues = ["TRIAL", "ACTIVE", "PAST_DUE", "CANCELLED"];

const createTenantSchema = z.object({
  name: z.string().trim().min(2, "Nama tenant minimal 2 karakter"),
  slug: z.string().trim().min(2).optional(),
  status: z.enum(tenantStatusValues).optional(),
  billingEmail: z.string().trim().email().optional(),
  phone: z.string().trim().optional(),
  address: z.string().trim().optional(),
  branchName: z.string().trim().optional(),
  branchCode: z.string().trim().optional(),
  planId: z.string().trim().optional(),
  subscriptionStatus: z.enum(subscriptionStatusValues).optional(),
});

const updateTenantSchema = z.object({
  name: z.string().trim().min(2).optional(),
  slug: z.string().trim().min(2).optional(),
  status: z.enum(tenantStatusValues).optional(),
  billingEmail: z.string().trim().email().nullable().optional(),
  phone: z.string().trim().nullable().optional(),
  address: z.string().trim().nullable().optional(),
});

const createPlanSchema = z.object({
  name: z.string().trim().min(2, "Nama plan minimal 2 karakter"),
  code: z.string().trim().min(2).optional(),
  priceMonthly: z.coerce.number().int().min(0),
  maxBranches: z.coerce.number().int().min(1).optional(),
  maxUsers: z.coerce.number().int().min(1).optional(),
  features: z.string().trim().optional(),
  isActive: z.coerce.boolean().optional(),
});

const updatePlanSchema = z.object({
  name: z.string().trim().min(2).optional(),
  code: z.string().trim().min(2).optional(),
  priceMonthly: z.coerce.number().int().min(0).optional(),
  maxBranches: z.coerce.number().int().min(1).nullable().optional(),
  maxUsers: z.coerce.number().int().min(1).nullable().optional(),
  features: z.string().trim().nullable().optional(),
  isActive: z.coerce.boolean().optional(),
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
  validateCreateTenant: (payload) => validate(createTenantSchema, payload),
  validateUpdateTenant: (payload) => validate(partial(updateTenantSchema), payload),
  validateCreatePlan: (payload) => validate(createPlanSchema, payload),
  validateUpdatePlan: (payload) => validate(partial(updatePlanSchema), payload),
};
