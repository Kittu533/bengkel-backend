const userStore = require("./userStore");

const vehicles = new Map();
const bookings = new Map();
const serviceOrders = new Map();
const serviceHistory = new Map();
const invoices = new Map();

let nextVehicleId = 1;

function now() {
  return new Date().toISOString();
}

function clone(value) {
  return value ? JSON.parse(JSON.stringify(value)) : value;
}

function findCustomerByUserId(userId) {
  return userStore.findCustomerByUserId(userId);
}

function listActiveVehicles(customerId) {
  return [...vehicles.values()]
    .filter((vehicle) => vehicle.customerId === customerId && vehicle.isActive)
    .map(clone);
}

function findActiveVehicle(customerId, vehicleId) {
  const vehicle = vehicles.get(String(vehicleId));
  if (!vehicle || vehicle.customerId !== customerId || !vehicle.isActive) {
    return null;
  }
  return clone(vehicle);
}

function createVehicle(customerId, payload) {
  const timestamp = now();
  const vehicle = {
    id: String(nextVehicleId++),
    customerId,
    plateNumber: payload.plateNumber.toUpperCase(),
    brand: payload.brand,
    model: payload.model,
    vehicleType: payload.vehicleType,
    year: payload.year || null,
    color: payload.color || null,
    notes: payload.notes || null,
    isActive: true,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  vehicles.set(vehicle.id, vehicle);
  return clone(vehicle);
}

function updateVehicle(customerId, vehicleId, payload) {
  const vehicle = vehicles.get(String(vehicleId));
  if (!vehicle || vehicle.customerId !== customerId || !vehicle.isActive) {
    return null;
  }

  const updatedVehicle = {
    ...vehicle,
    ...payload,
    plateNumber: payload.plateNumber
      ? payload.plateNumber.toUpperCase()
      : vehicle.plateNumber,
    year: Object.prototype.hasOwnProperty.call(payload, "year")
      ? payload.year || null
      : vehicle.year,
    color: Object.prototype.hasOwnProperty.call(payload, "color")
      ? payload.color || null
      : vehicle.color,
    notes: Object.prototype.hasOwnProperty.call(payload, "notes")
      ? payload.notes || null
      : vehicle.notes,
    updatedAt: now(),
  };

  vehicles.set(vehicle.id, updatedVehicle);
  return clone(updatedVehicle);
}

function deleteVehicle(customerId, vehicleId) {
  const vehicle = vehicles.get(String(vehicleId));
  if (!vehicle || vehicle.customerId !== customerId || !vehicle.isActive) {
    return null;
  }

  vehicle.isActive = false;
  vehicle.updatedAt = now();
  return clone(vehicle);
}

function listBookings(customerId) {
  return [...bookings.values()]
    .filter((booking) => booking.customerId === customerId)
    .map(clone);
}

function listActiveServiceOrders(customerId) {
  return [...serviceOrders.values()]
    .filter(
      (order) =>
        order.customerId === customerId &&
        !["COMPLETED", "CANCELLED"].includes(order.status)
    )
    .map(clone);
}

function listServiceHistory(customerId) {
  return [...serviceHistory.values()]
    .filter((history) => history.customerId === customerId)
    .map(clone);
}

function listInvoices(customerId) {
  return [...invoices.values()]
    .filter((invoice) => invoice.customerId === customerId)
    .map(clone);
}

function findInvoice(customerId, invoiceId) {
  const invoice = invoices.get(String(invoiceId));
  if (!invoice || invoice.customerId !== customerId) return null;
  return clone(invoice);
}

module.exports = {
  findCustomerByUserId,
  listActiveVehicles,
  findActiveVehicle,
  createVehicle,
  updateVehicle,
  deleteVehicle,
  listBookings,
  listActiveServiceOrders,
  listServiceHistory,
  listInvoices,
  findInvoice,
};
