const superAdminRepository = require("../models/superAdminRepository");
const { HttpError } = require("../utils/httpError");

function ensureFound(value, message) {
  if (!value) throw new HttpError(404, message);
  return value;
}

async function listTenants(query) {
  return superAdminRepository.listTenants(query);
}

async function getTenant(id) {
  return ensureFound(await superAdminRepository.getTenant(id), "Tenant tidak ditemukan");
}

async function createTenant(payload) {
  const slug = payload.slug || payload.name;
  const normalizedSlug = slug
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  const existing = await superAdminRepository.findTenantBySlug(normalizedSlug);
  if (existing) throw new HttpError(409, "Slug tenant sudah digunakan");

  if (payload.planId) {
    ensureFound(await superAdminRepository.getPlan(payload.planId), "Plan tidak ditemukan");
  }

  return superAdminRepository.createTenant({ ...payload, slug: normalizedSlug });
}

async function updateTenant(id, payload) {
  ensureFound(await superAdminRepository.getTenant(id), "Tenant tidak ditemukan");
  if (payload.slug) {
    const existing = await superAdminRepository.findTenantBySlug(payload.slug);
    if (existing && existing.id !== id) {
      throw new HttpError(409, "Slug tenant sudah digunakan");
    }
  }
  return superAdminRepository.updateTenant(id, payload);
}

async function deactivateTenant(id) {
  ensureFound(await superAdminRepository.getTenant(id), "Tenant tidak ditemukan");
  return superAdminRepository.deactivateTenant(id);
}

function listPlans(query) {
  return superAdminRepository.listPlans(query);
}

async function createPlan(payload) {
  return superAdminRepository.createPlan(payload);
}

async function updatePlan(id, payload) {
  ensureFound(await superAdminRepository.getPlan(id), "Plan tidak ditemukan");
  return superAdminRepository.updatePlan(id, payload);
}

async function deactivatePlan(id) {
  ensureFound(await superAdminRepository.getPlan(id), "Plan tidak ditemukan");
  return superAdminRepository.deactivatePlan(id);
}

module.exports = {
  listTenants,
  getTenant,
  createTenant,
  updateTenant,
  deactivateTenant,
  listPlans,
  createPlan,
  updatePlan,
  deactivatePlan,
};
