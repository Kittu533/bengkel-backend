const bcrypt = require("bcryptjs");
const { DEFAULT_ADMIN, ROLES } = require("../config/auth");

const users = new Map();
const usersByEmail = new Map();
const usersByPhone = new Map();
const customers = new Map();
const refreshTokens = new Map();

let nextUserId = 1;

function seedRoles() {
  return Object.values(ROLES);
}

function seedDefaultAdmin() {
  if (findUserByEmail(DEFAULT_ADMIN.email)) return null;

  return createUser({
    name: DEFAULT_ADMIN.name,
    email: DEFAULT_ADMIN.email,
    phone: DEFAULT_ADMIN.phone,
    passwordHash: bcrypt.hashSync(DEFAULT_ADMIN.password, 10),
    roles: [ROLES.ADMIN],
  });
}

function createUser(user) {
  const now = new Date().toISOString();
  const id = String(nextUserId++);
  const storedUser = {
    id,
    name: user.name,
    email: user.email.toLowerCase(),
    phone: user.phone,
    tenantId: user.tenantId || null,
    branchId: user.branchId || null,
    passwordHash: user.passwordHash,
    status: user.status || "ACTIVE",
    roles: user.roles,
    createdAt: now,
    updatedAt: now,
  };

  users.set(id, storedUser);
  usersByEmail.set(storedUser.email, id);
  usersByPhone.set(storedUser.phone, id);
  return storedUser;
}

function createCustomerUser(user) {
  const storedUser = createUser({
    ...user,
    roles: [ROLES.CUSTOMER],
  });
  customers.set(storedUser.id, {
    id: String(customers.size + 1),
    userId: storedUser.id,
    name: storedUser.name,
    email: storedUser.email,
    phone: storedUser.phone,
    createdAt: storedUser.createdAt,
    updatedAt: storedUser.updatedAt,
  });
  return storedUser;
}

function findUserByEmail(email) {
  const id = usersByEmail.get(email.toLowerCase());
  return id ? users.get(id) : null;
}

function findUserByPhone(phone) {
  const id = usersByPhone.get(phone);
  return id ? users.get(id) : null;
}

function findUserById(id) {
  return users.get(String(id)) || null;
}

function findCustomerByUserId(userId) {
  return customers.get(String(userId)) || null;
}

function saveRefreshToken({ tokenId, userId }) {
  refreshTokens.set(tokenId, {
    tokenId,
    userId,
    revokedAt: null,
    createdAt: new Date().toISOString(),
  });
}

function findRefreshToken(tokenId) {
  return refreshTokens.get(tokenId) || null;
}

function revokeRefreshToken(tokenId) {
  const storedToken = refreshTokens.get(tokenId);
  if (!storedToken) return false;
  storedToken.revokedAt = new Date().toISOString();
  return true;
}

function setUserStatus(email, status) {
  const user = findUserByEmail(email);
  if (!user) return null;
  user.status = status;
  user.updatedAt = new Date().toISOString();
  return user;
}

function toPublicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    tenantId: user.tenantId || null,
    branchId: user.branchId || null,
    status: user.status,
    roles: [...user.roles],
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

module.exports = {
  seedRoles,
  seedDefaultAdmin,
  createUser,
  createCustomerUser,
  findUserByEmail,
  findUserByPhone,
  findUserById,
  findCustomerByUserId,
  saveRefreshToken,
  findRefreshToken,
  revokeRefreshToken,
  setUserStatus,
  toPublicUser,
};
