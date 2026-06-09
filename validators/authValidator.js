const { z } = require("zod");
const { HttpError } = require("../utils/httpError");

const registerSchema = z.object({
  name: z.string().trim().min(2, "Nama minimal 2 karakter"),
  email: z.string().trim().email("Email tidak valid"),
  phone: z.string().trim().min(10, "Nomor HP minimal 10 karakter"),
  password: z.string().min(8, "Password minimal 8 karakter"),
  confirmPassword: z.string().min(8, "Confirm password minimal 8 karakter"),
}).refine((payload) => payload.password === payload.confirmPassword, {
  path: ["confirmPassword"],
  message: "Confirm password harus sama dengan password",
});

const loginSchema = z.object({
  email: z.string().trim().email("Email tidak valid"),
  password: z.string().min(8, "Password minimal 8 karakter"),
});

const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, "Refresh token wajib diisi"),
});

function validate(schema, payload) {
  const result = schema.safeParse(payload);
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
  validateRegister: (payload) => validate(registerSchema, payload),
  validateLogin: (payload) => validate(loginSchema, payload),
  validateRefreshToken: (payload) => validate(refreshTokenSchema, payload),
};
