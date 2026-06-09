const { z } = require("zod");
const { HttpError } = require("../utils/httpError");

const createBookingSchema = z
  .object({
    vehicleId: z.string().trim().min(1, "Kendaraan tidak valid"),
    serviceCatalogId: z.string().trim().min(1, "Service tidak valid"),
    bookingDate: z.string().trim().optional(),
    bookingTime: z.string().trim().optional(),
    scheduleAt: z.string().trim().optional(),
    complaint: z.string().trim().min(5, "Keluhan minimal 5 karakter"),
  })
  .superRefine((payload, context) => {
    if (!payload.scheduleAt && (!payload.bookingDate || !payload.bookingTime)) {
      context.addIssue({
        code: "custom",
        path: ["scheduleAt"],
        message: "Tanggal dan jam booking wajib diisi",
      });
    }
  });

const rejectBookingSchema = z.object({
  reason: z.string().trim().min(5, "Alasan minimal 5 karakter"),
});

const rescheduleBookingSchema = z
  .object({
    bookingDate: z.string().trim().optional(),
    bookingTime: z.string().trim().optional(),
    scheduleAt: z.string().trim().optional(),
    reason: z.string().trim().min(5, "Catatan reschedule minimal 5 karakter"),
  })
  .superRefine((payload, context) => {
    if (!payload.scheduleAt && (!payload.bookingDate || !payload.bookingTime)) {
      context.addIssue({
        code: "custom",
        path: ["scheduleAt"],
        message: "Tanggal dan jam booking wajib diisi",
      });
    }
  });

const cancelBookingSchema = z.object({
  reason: z.string().trim().optional(),
});

function normalizeEmptyStrings(payload) {
  return Object.fromEntries(
    Object.entries(payload || {}).map(([key, value]) => [
      key,
      value === "" ? undefined : value,
    ])
  );
}

function buildSchedule(payload) {
  const rawSchedule = payload.scheduleAt
    ? payload.scheduleAt
    : `${payload.bookingDate}T${payload.bookingTime}:00+07:00`;
  const scheduleAt = new Date(rawSchedule);

  if (Number.isNaN(scheduleAt.getTime())) {
    throw new HttpError(422, "Jadwal booking tidak valid", [
      { field: "scheduleAt", message: "Jadwal booking tidak valid" },
    ]);
  }

  if (scheduleAt.getTime() <= Date.now()) {
    throw new HttpError(422, "Jadwal booking tidak boleh lampau", [
      { field: "scheduleAt", message: "Jadwal booking tidak boleh lampau" },
    ]);
  }

  return scheduleAt;
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

function validateCreateBooking(payload) {
  const data = validate(createBookingSchema, payload);
  return { ...data, scheduleAt: buildSchedule(data) };
}

function validateRescheduleBooking(payload) {
  const data = validate(rescheduleBookingSchema, payload);
  return { ...data, scheduleAt: buildSchedule(data) };
}

module.exports = {
  validateCreateBooking,
  validateRejectBooking: (payload) => validate(rejectBookingSchema, payload),
  validateRescheduleBooking,
  validateCancelBooking: (payload) => validate(cancelBookingSchema, payload),
};
