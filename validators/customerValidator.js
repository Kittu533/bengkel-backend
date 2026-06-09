const { z } = require("zod");
const { HttpError } = require("../utils/httpError");

const vehicleSchema = z.object({
  plateNumber: z.string().trim().min(3, "Nomor polisi minimal 3 karakter"),
  brand: z.string().trim().min(2, "Brand minimal 2 karakter"),
  model: z.string().trim().min(1, "Model wajib diisi"),
  vehicleType: z.enum(["MOTOR", "CAR"], {
    error: "Tipe kendaraan harus MOTOR atau CAR",
  }),
  year: z.coerce
    .number()
    .int("Tahun harus angka bulat")
    .min(1970, "Tahun kendaraan terlalu lama")
    .max(2100, "Tahun kendaraan tidak valid")
    .optional(),
  color: z.string().trim().optional(),
  notes: z.string().trim().optional(),
});

const updateVehicleSchema = vehicleSchema.partial().refine(
  (payload) => Object.keys(payload).length > 0,
  {
    message: "Minimal satu field harus diisi",
  }
);

function normalizeEmptyStrings(payload) {
  return Object.fromEntries(
    Object.entries(payload || {}).map(([key, value]) => [
      key,
      value === "" ? undefined : value,
    ])
  );
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

module.exports = {
  validateCreateVehicle: (payload) => validate(vehicleSchema, payload),
  validateUpdateVehicle: (payload) => validate(updateVehicleSchema, payload),
};
