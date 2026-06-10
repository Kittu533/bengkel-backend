const bcrypt = require("bcryptjs");
const { DEFAULT_ADMIN, DEFAULT_MECHANIC, ROLES } = require("../config/auth");
const { getPrisma } = require("./prismaClient");
const memoryStore = require("./userStore");

function useMemoryStore() {
  return process.env.NODE_ENV === "test" || !process.env.DATABASE_URL;
}

function prismaUserToDomain(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    passwordHash: user.passwordHash,
    status: user.status,
    roles: user.userRoles?.map((userRole) => userRole.role.name) || [],
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}

async function seedRoles() {
  if (useMemoryStore()) return memoryStore.seedRoles();

  const prisma = getPrisma();
  return Promise.all(
    Object.values(ROLES).map((name) =>
      prisma.role.upsert({ where: { name }, update: {}, create: { name } })
    )
  );
}

async function seedDefaultAdmin() {
  if (useMemoryStore()) return memoryStore.seedDefaultAdmin();

  const prisma = getPrisma();
  const email = DEFAULT_ADMIN.email.toLowerCase();
  const existingAdmin = await prisma.user.findUnique({ where: { email } });
  if (existingAdmin) return null;

  const adminRole = await prisma.role.upsert({
    where: { name: ROLES.ADMIN },
    update: {},
    create: { name: ROLES.ADMIN },
  });

  const user = await prisma.user.create({
    data: {
      name: DEFAULT_ADMIN.name,
      email,
      phone: DEFAULT_ADMIN.phone,
      passwordHash: bcrypt.hashSync(DEFAULT_ADMIN.password, 10),
      userRoles: { create: { roleId: adminRole.id } },
    },
    include: { userRoles: { include: { role: true } } },
  });

  return prismaUserToDomain(user);
}

async function seedDefaultMechanic() {
  if (useMemoryStore()) return null;

  const prisma = getPrisma();
  const email = DEFAULT_MECHANIC.email.toLowerCase();
  const existingMechanic = await prisma.user.findUnique({ where: { email } });
  if (existingMechanic) return null;

  const mechanicRole = await prisma.role.upsert({
    where: { name: ROLES.MECHANIC },
    update: {},
    create: { name: ROLES.MECHANIC },
  });

  const user = await prisma.user.create({
    data: {
      name: DEFAULT_MECHANIC.name,
      email,
      phone: DEFAULT_MECHANIC.phone,
      passwordHash: bcrypt.hashSync(DEFAULT_MECHANIC.password, 10),
      userRoles: { create: { roleId: mechanicRole.id } },
    },
    include: { userRoles: { include: { role: true } } },
  });

  return prismaUserToDomain(user);
}

async function createCustomerUser(user) {
  if (useMemoryStore()) return memoryStore.createCustomerUser(user);

  const prisma = getPrisma();
  const customerRole = await prisma.role.upsert({
    where: { name: ROLES.CUSTOMER },
    update: {},
    create: { name: ROLES.CUSTOMER },
  });

  const createdUser = await prisma.user.create({
    data: {
      name: user.name,
      email: user.email.toLowerCase(),
      phone: user.phone,
      passwordHash: user.passwordHash,
      userRoles: { create: { roleId: customerRole.id } },
      customer: {
        create: {
          name: user.name,
          email: user.email.toLowerCase(),
          phone: user.phone,
        },
      },
    },
    include: { userRoles: { include: { role: true } } },
  });

  return prismaUserToDomain(createdUser);
}

async function findUserByEmail(email) {
  if (useMemoryStore()) return memoryStore.findUserByEmail(email);

  const prisma = getPrisma();
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
    include: { userRoles: { include: { role: true } } },
  });
  return user ? prismaUserToDomain(user) : null;
}

async function findUserByPhone(phone) {
  if (useMemoryStore()) return memoryStore.findUserByPhone(phone);

  const prisma = getPrisma();
  const user = await prisma.user.findUnique({
    where: { phone },
    include: { userRoles: { include: { role: true } } },
  });
  return user ? prismaUserToDomain(user) : null;
}

async function findUserById(id) {
  if (useMemoryStore()) return memoryStore.findUserById(id);

  const prisma = getPrisma();
  const user = await prisma.user.findUnique({
    where: { id: String(id) },
    include: { userRoles: { include: { role: true } } },
  });
  return user ? prismaUserToDomain(user) : null;
}

async function saveRefreshToken(token) {
  if (useMemoryStore()) return memoryStore.saveRefreshToken(token);

  const prisma = getPrisma();
  return prisma.refreshToken.create({ data: token });
}

async function findRefreshToken(tokenId) {
  if (useMemoryStore()) return memoryStore.findRefreshToken(tokenId);

  const prisma = getPrisma();
  return prisma.refreshToken.findUnique({ where: { tokenId } });
}

async function revokeRefreshToken(tokenId) {
  if (useMemoryStore()) return memoryStore.revokeRefreshToken(tokenId);

  const prisma = getPrisma();
  const result = await prisma.refreshToken.updateMany({
    where: { tokenId },
    data: { revokedAt: new Date() },
  });
  return result.count > 0;
}

async function setUserStatus(email, status) {
  if (useMemoryStore()) return memoryStore.setUserStatus(email, status);

  const prisma = getPrisma();
  const user = await prisma.user.update({
    where: { email: email.toLowerCase() },
    data: { status },
    include: { userRoles: { include: { role: true } } },
  });
  return prismaUserToDomain(user);
}

module.exports = {
  seedRoles,
  seedDefaultAdmin,
  seedDefaultMechanic,
  createCustomerUser,
  findUserByEmail,
  findUserByPhone,
  findUserById,
  saveRefreshToken,
  findRefreshToken,
  revokeRefreshToken,
  setUserStatus,
  toPublicUser: memoryStore.toPublicUser,
};
