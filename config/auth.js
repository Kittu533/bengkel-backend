const ACCESS_TOKEN_EXPIRES_IN = process.env.JWT_ACCESS_EXPIRES_IN || "15m";
const REFRESH_TOKEN_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || "7d";

const ACCESS_TOKEN_SECRET =
  process.env.JWT_ACCESS_SECRET || "change-this-access-secret";
const REFRESH_TOKEN_SECRET =
  process.env.JWT_REFRESH_SECRET || "change-this-refresh-secret";

const ROLES = Object.freeze({
  SUPER_ADMIN: "SUPER_ADMIN",
  OWNER: "OWNER",
  ADMIN: "ADMIN",
  MECHANIC: "MECHANIC",
  CASHIER: "CASHIER",
  CUSTOMER: "CUSTOMER",
});

const DEFAULT_ADMIN = Object.freeze({
  name: process.env.DEFAULT_ADMIN_NAME || "Admin BengkelPro",
  email: process.env.DEFAULT_ADMIN_EMAIL || "admin@bengkelpro.local",
  phone: process.env.DEFAULT_ADMIN_PHONE || "080000000001",
  password: process.env.DEFAULT_ADMIN_PASSWORD || "admin12345",
});

const DEFAULT_MECHANIC = Object.freeze({
  name: process.env.DEFAULT_MECHANIC_NAME || "Mechanic BengkelPro",
  email: process.env.DEFAULT_MECHANIC_EMAIL || "mechanic@bengkelpro.local",
  phone: process.env.DEFAULT_MECHANIC_PHONE || "080000000002",
  password: process.env.DEFAULT_MECHANIC_PASSWORD || "mechanic12345",
});

module.exports = {
  ACCESS_TOKEN_EXPIRES_IN,
  REFRESH_TOKEN_EXPIRES_IN,
  ACCESS_TOKEN_SECRET,
  REFRESH_TOKEN_SECRET,
  ROLES,
  DEFAULT_ADMIN,
  DEFAULT_MECHANIC,
};
