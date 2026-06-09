const userRepository = require("../models/userRepository");
const publicCatalogRepository = require("../models/publicCatalogRepository");

async function main() {
  await userRepository.seedRoles();
  await userRepository.seedDefaultAdmin();
  await publicCatalogRepository.seedPublicCatalogs();

  console.info(
    JSON.stringify({
      success: true,
      message: "Seed berhasil",
      seeded: ["roles", "default_admin", "public_catalog"],
    })
  );
}

main()
  .catch((error) => {
    console.error(
      JSON.stringify({
        success: false,
        message: error.message || "Seed gagal",
      })
    );
    process.exitCode = 1;
  })
  .finally(async () => {
    const { prisma } = require("../models/prismaClient");
    if (prisma) await prisma.$disconnect();
  });
