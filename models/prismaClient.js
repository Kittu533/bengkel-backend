let prisma;

function getPrisma() {
  if (!process.env.DATABASE_URL) return null;
  if (!prisma) {
    const { Pool } = require("pg");
    const { PrismaPg } = require("@prisma/adapter-pg");
    const { PrismaClient } = require("@prisma/client");
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    prisma = new PrismaClient({ adapter: new PrismaPg(pool) });
  }
  return prisma;
}

module.exports = { getPrisma };
