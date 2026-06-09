const { ROLES } = require("../config/auth");
const serviceOrderRepository = require("../models/serviceOrderRepository");
const { HttpError } = require("../utils/httpError");

const statusSteps = {
  WAITING: "Menunggu check-in",
  CHECKED_IN: "Kendaraan sudah check-in",
  DIAGNOSIS: "Diagnosis awal",
  WAITING_APPROVAL: "Menunggu approval customer",
  IN_PROGRESS: "Pengerjaan berlangsung",
  WAITING_SPAREPART: "Menunggu sparepart",
  QUALITY_CHECK: "Quality check",
  READY_TO_PICKUP: "Siap diambil",
  COMPLETED: "Selesai",
  CANCELLED: "Dibatalkan",
};

const allowedTransitions = {
  WAITING: ["CHECKED_IN", "CANCELLED"],
  CHECKED_IN: ["DIAGNOSIS", "IN_PROGRESS", "CANCELLED"],
  DIAGNOSIS: ["WAITING_APPROVAL", "IN_PROGRESS", "WAITING_SPAREPART", "CANCELLED"],
  WAITING_APPROVAL: ["IN_PROGRESS", "CANCELLED"],
  IN_PROGRESS: ["WAITING_SPAREPART", "QUALITY_CHECK", "CANCELLED"],
  WAITING_SPAREPART: ["IN_PROGRESS", "CANCELLED"],
  QUALITY_CHECK: ["READY_TO_PICKUP", "IN_PROGRESS"],
  READY_TO_PICKUP: ["COMPLETED"],
  COMPLETED: [],
  CANCELLED: [],
};

function ensureFound(value, message) {
  if (!value) throw new HttpError(404, message);
  return value;
}

function ensureStaff(user) {
  const roles = user.roles || [];
  const isAllowed = [ROLES.ADMIN, ROLES.MECHANIC, ROLES.OWNER].some((role) =>
    roles.includes(role)
  );
  if (!isAllowed) throw new HttpError(403, "Role tidak memiliki akses");
}

function ensureAdmin(user) {
  if (!user.roles?.includes(ROLES.ADMIN)) {
    throw new HttpError(403, "Role tidak memiliki akses");
  }
}

function ensureEditable(order) {
  if (["COMPLETED", "CANCELLED"].includes(order.status)) {
    throw new HttpError(409, "Service order sudah tidak bisa diubah");
  }
}

async function createServiceOrder(user, payload) {
  ensureAdmin(user);
  ensureFound(
    await serviceOrderRepository.findCustomer(payload.customerId),
    "Customer tidak ditemukan"
  );
  ensureFound(
    await serviceOrderRepository.findVehicleForCustomer(
      payload.customerId,
      payload.vehicleId
    ),
    "Kendaraan tidak ditemukan"
  );

  if (payload.serviceCatalogId) {
    ensureFound(
      await serviceOrderRepository.findServiceCatalog(payload.serviceCatalogId),
      "Service tidak ditemukan"
    );
  } else if (!payload.serviceName) {
    throw new HttpError(422, "Service wajib diisi", [
      { field: "serviceName", message: "Service wajib diisi" },
    ]);
  }

  if (payload.mechanicId) {
    ensureFound(
      await serviceOrderRepository.findMechanic(payload.mechanicId),
      "Mekanik tidak ditemukan"
    );
  }

  return serviceOrderRepository.createServiceOrder(payload);
}

function listServiceOrders(user, query) {
  ensureStaff(user);
  return serviceOrderRepository.listServiceOrders(query);
}

async function getServiceOrder(user, id) {
  ensureStaff(user);
  return ensureFound(
    await serviceOrderRepository.getServiceOrder(id),
    "Service order tidak ditemukan"
  );
}

async function updateServiceOrder(user, id, payload) {
  ensureAdmin(user);
  const order = ensureFound(
    await serviceOrderRepository.getServiceOrder(id),
    "Service order tidak ditemukan"
  );
  ensureEditable(order);
  return serviceOrderRepository.updateServiceOrder(id, payload);
}

async function updateStatus(user, id, payload) {
  ensureStaff(user);
  const order = ensureFound(
    await serviceOrderRepository.getServiceOrder(id),
    "Service order tidak ditemukan"
  );
  ensureEditable(order);

  const nextStatuses = allowedTransitions[order.status] || [];
  if (!nextStatuses.includes(payload.status)) {
    throw new HttpError(409, "Status tidak mengikuti workflow");
  }

  return serviceOrderRepository.updateServiceOrder(id, {
    status: payload.status,
    currentStep: statusSteps[payload.status],
    ...(payload.status === "CHECKED_IN" ? { checkInAt: new Date() } : {}),
  });
}

async function assignMechanic(user, id, payload) {
  ensureAdmin(user);
  const order = ensureFound(
    await serviceOrderRepository.getServiceOrder(id),
    "Service order tidak ditemukan"
  );
  ensureEditable(order);
  ensureFound(
    await serviceOrderRepository.findMechanic(payload.mechanicId),
    "Mekanik tidak ditemukan"
  );
  return serviceOrderRepository.assignMechanic(id, payload.mechanicId);
}

async function addServiceItem(user, id, payload) {
  ensureAdmin(user);
  const order = ensureFound(
    await serviceOrderRepository.getServiceOrder(id),
    "Service order tidak ditemukan"
  );
  ensureEditable(order);
  const service = ensureFound(
    await serviceOrderRepository.findServiceCatalog(payload.serviceCatalogId),
    "Service tidak ditemukan"
  );
  return serviceOrderRepository.addServiceItem(id, service, payload.quantity);
}

async function addSparepartItem(user, id, payload) {
  ensureStaff(user);
  const order = ensureFound(
    await serviceOrderRepository.getServiceOrder(id),
    "Service order tidak ditemukan"
  );
  ensureEditable(order);
  const sparepart = ensureFound(
    await serviceOrderRepository.findSparepart(payload.sparepartId),
    "Sparepart tidak ditemukan"
  );
  if (sparepart.stock < payload.quantity) {
    throw new HttpError(409, "Stok sparepart tidak cukup");
  }
  return serviceOrderRepository.addSparepartItem(
    id,
    sparepart,
    payload.quantity,
    user.id
  );
}

async function addNote(user, id, payload) {
  ensureStaff(user);
  const order = ensureFound(
    await serviceOrderRepository.getServiceOrder(id),
    "Service order tidak ditemukan"
  );
  ensureEditable(order);
  return serviceOrderRepository.addNote(id, user.id, payload);
}

async function addPhoto(user, id, payload) {
  ensureStaff(user);
  const order = ensureFound(
    await serviceOrderRepository.getServiceOrder(id),
    "Service order tidak ditemukan"
  );
  ensureEditable(order);
  return serviceOrderRepository.addPhoto(id, payload);
}

async function completeServiceOrder(user, id) {
  ensureAdmin(user);
  const order = ensureFound(
    await serviceOrderRepository.getServiceOrder(id),
    "Service order tidak ditemukan"
  );
  ensureEditable(order);
  if (order.status !== "READY_TO_PICKUP") {
    throw new HttpError(409, "Service harus ready to pickup sebelum selesai");
  }
  return serviceOrderRepository.completeServiceOrder(id);
}

async function getCustomerTracking(user, id) {
  if (!user.roles?.includes(ROLES.CUSTOMER)) {
    throw new HttpError(403, "Role tidak memiliki akses");
  }
  return ensureFound(
    await serviceOrderRepository.getCustomerTracking(user.id, id),
    "Service order tidak ditemukan"
  );
}

module.exports = {
  createServiceOrder,
  listServiceOrders,
  getServiceOrder,
  updateServiceOrder,
  updateStatus,
  assignMechanic,
  addServiceItem,
  addSparepartItem,
  addNote,
  addPhoto,
  completeServiceOrder,
  getCustomerTracking,
};
