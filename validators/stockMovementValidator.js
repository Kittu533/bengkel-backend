const { z } = require("zod");
const { HttpError } = require("../utils/httpError");

const stockAdjustmentSchema = z.object({
  type: z.enum(["IN", "OUT", "ADJUSTMENT"]),
  quantity: z.coerce.number().int().refine((value) => value !== 0, {
    message: "Quantity tidak boleh 0",
  }),
  note: z.string().trim().optional(),
  referenceType: z
    .enum(["SERVICE_ORDER", "PURCHASE", "MANUAL_ADJUSTMENT"])
    .optional(),
  referenceId: z.string().trim().optional(),
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

module.exports = {
  validateStockAdjustment: (payload) => validate(stockAdjustmentSchema, payload),
};
