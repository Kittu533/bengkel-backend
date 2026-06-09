const { z } = require("zod");
const { HttpError } = require("../utils/httpError");

const customerSchema = z.object({
  name: z.string().trim().min(2, "Nama minimal 2 karakter"),
  email: z.string().trim().email("Email tidak valid"),
  phone: z.string().trim().min(10, "Nomor HP minimal 10 karakter"),
  password: z.string().min(8, "Password minimal 8 karakter").optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
});

const vehicleSchema = z.object({
  customerId: z.string().min(1, "Customer wajib dipilih"),
  plateNumber: z.string().trim().min(3, "Nomor polisi minimal 3 karakter"),
  brand: z.string().trim().min(2, "Brand minimal 2 karakter"),
  model: z.string().trim().min(1, "Model wajib diisi"),
  vehicleType: z.enum(["MOTOR", "CAR", "MOBIL"]),
  year: z.coerce.number().int().min(1970).max(2100).optional(),
  color: z.string().trim().optional(),
  notes: z.string().trim().optional(),
});

const categorySchema = z.object({
  name: z.string().trim().min(2, "Nama kategori minimal 2 karakter"),
  isActive: z.coerce.boolean().optional(),
});

const serviceCatalogSchema = z.object({
  categoryId: z.string().min(1, "Kategori wajib dipilih"),
  name: z.string().trim().min(2, "Nama service minimal 2 karakter"),
  slug: z.string().trim().min(2, "Slug minimal 2 karakter").optional(),
  description: z.string().trim().min(5, "Deskripsi minimal 5 karakter"),
  vehicleType: z.enum(["MOTOR", "CAR", "MOBIL"]),
  price: z.coerce.number().int().min(0, "Harga tidak boleh negatif"),
  estimatedDurationMinutes: z.coerce
    .number()
    .int()
    .min(1, "Estimasi durasi wajib lebih dari 0"),
  isActive: z.coerce.boolean().optional(),
});

const sparepartSchema = z.object({
  categoryId: z.string().min(1, "Kategori wajib dipilih"),
  name: z.string().trim().min(2, "Nama sparepart minimal 2 karakter"),
  sku: z.string().trim().min(2, "SKU minimal 2 karakter"),
  brand: z.string().trim().min(2, "Brand minimal 2 karakter"),
  description: z.string().trim().min(5, "Deskripsi minimal 5 karakter"),
  vehicleType: z.enum(["MOTOR", "CAR", "MOBIL"]),
  stock: z.coerce.number().int().min(0, "Stok tidak boleh negatif"),
  minStock: z.coerce.number().int().min(0, "Minimum stok tidak boleh negatif"),
  sellPrice: z.coerce.number().int().min(0, "Harga jual tidak boleh negatif"),
  costPrice: z.coerce.number().int().min(0, "Harga modal tidak boleh negatif"),
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
  validateCreateCustomer: (payload) => validate(customerSchema.required({ password: true }), payload),
  validateUpdateCustomer: (payload) => validate(partial(customerSchema), payload),
  validateCreateVehicle: (payload) => validate(vehicleSchema, payload),
  validateUpdateVehicle: (payload) => validate(partial(vehicleSchema), payload),
  validateCreateCategory: (payload) => validate(categorySchema, payload),
  validateUpdateCategory: (payload) => validate(partial(categorySchema), payload),
  validateCreateServiceCatalog: (payload) => validate(serviceCatalogSchema, payload),
  validateUpdateServiceCatalog: (payload) =>
    validate(partial(serviceCatalogSchema), payload),
  validateCreateSparepart: (payload) => validate(sparepartSchema, payload),
  validateUpdateSparepart: (payload) => validate(partial(sparepartSchema), payload),
};
