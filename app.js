const express = require("express");
const cors = require("cors");
const { ROLES } = require("./config/auth");
const { authMiddleware, roleMiddleware } = require("./middleware/authMiddleware");
const {
  errorMiddleware,
  notFoundMiddleware,
} = require("./middleware/errorMiddleware");
const userRepository = require("./models/userRepository");
const publicCatalogRepository = require("./models/publicCatalogRepository");
const authRoutes = require("./routes/authRoutes");
const publicCatalogRoutes = require("./routes/publicCatalogRoutes");
const { sendSuccess } = require("./utils/response");

const app = express();

const boot = Promise.all([
  userRepository.seedRoles(),
  userRepository.seedDefaultAdmin(),
  publicCatalogRepository.seedPublicCatalogs(),
]);

app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:3000",
    credentials: true,
  })
);
app.use(express.json());

app.use(async (_req, _res, next) => {
  try {
    await boot;
    return next();
  } catch (error) {
    return next(error);
  }
});

app.get("/api/health", (_req, res) => {
  sendSuccess(res, 200, "API berjalan", { status: "ok" });
});

app.use("/api/auth", authRoutes);
app.use("/api/public", publicCatalogRoutes);

if (process.env.NODE_ENV === "test") {
  app.patch("/__test/users/:email/inactive", async (req, res) => {
    await userRepository.setUserStatus(req.params.email, "INACTIVE");
    sendSuccess(res, 200, "User dinonaktifkan");
  });

  app.get(
    "/__test/admin-only",
    authMiddleware,
    roleMiddleware([ROLES.ADMIN]),
    (_req, res) => sendSuccess(res, 200, "Admin route")
  );
}

app.use(notFoundMiddleware);
app.use(errorMiddleware);

module.exports = app;
