const authService = require("../services/authService");
const { sendSuccess } = require("../utils/response");
const {
  validateLogin,
  validateRefreshToken,
  validateRegister,
} = require("../validators/authValidator");

async function register(req, res, next) {
  try {
    const payload = validateRegister(req.body);
    const data = await authService.registerCustomer(payload);
    return sendSuccess(res, 201, "Register berhasil", data);
  } catch (error) {
    return next(error);
  }
}

async function login(req, res, next) {
  try {
    const payload = validateLogin(req.body);
    const data = await authService.login(payload);
    return sendSuccess(res, 200, "Login berhasil", data);
  } catch (error) {
    return next(error);
  }
}

async function me(req, res, next) {
  try {
    const user = await authService.getCurrentUser(req.user.id);
    return sendSuccess(res, 200, "Current user berhasil diambil", { user });
  } catch (error) {
    return next(error);
  }
}

async function refresh(req, res, next) {
  try {
    const payload = validateRefreshToken(req.body);
    const data = await authService.refresh(payload.refreshToken);
    return sendSuccess(res, 200, "Token berhasil diperbarui", data);
  } catch (error) {
    return next(error);
  }
}

async function logout(req, res, next) {
  try {
    const payload = validateRefreshToken(req.body);
    await authService.logout(payload.refreshToken);
    return sendSuccess(res, 200, "Logout berhasil");
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  register,
  login,
  me,
  refresh,
  logout,
};
