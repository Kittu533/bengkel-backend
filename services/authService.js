const userRepository = require("../models/userRepository");
const { HttpError } = require("../utils/httpError");
const { hashPassword, verifyPassword } = require("../utils/password");
const {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} = require("../utils/token");

async function issueTokens(user) {
  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);

  await userRepository.saveRefreshToken({
    tokenId: refreshToken.tokenId,
    userId: user.id,
  });

  return {
    accessToken,
    refreshToken: refreshToken.token,
  };
}

async function registerCustomer(payload) {
  const existingUser = await userRepository.findUserByEmail(payload.email);
  if (existingUser) {
    throw new HttpError(409, "Email sudah digunakan");
  }

  const existingPhone = await userRepository.findUserByPhone(payload.phone);
  if (existingPhone) {
    throw new HttpError(409, "Nomor HP sudah digunakan");
  }

  const passwordHash = await hashPassword(payload.password);
  const user = await userRepository.createCustomerUser({
    name: payload.name,
    email: payload.email,
    phone: payload.phone,
    passwordHash,
  });

  return {
    user: userRepository.toPublicUser(user),
    ...(await issueTokens(user)),
  };
}

async function login(payload) {
  const user = await userRepository.findUserByEmail(payload.email);
  if (!user) {
    throw new HttpError(401, "Email atau password salah");
  }

  if (user.status !== "ACTIVE") {
    throw new HttpError(403, "User tidak aktif");
  }

  const passwordMatches = await verifyPassword(payload.password, user.passwordHash);
  if (!passwordMatches) {
    throw new HttpError(401, "Email atau password salah");
  }

  return {
    user: userRepository.toPublicUser(user),
    ...(await issueTokens(user)),
  };
}

async function getCurrentUser(userId) {
  const user = await userRepository.findUserById(userId);
  if (!user) {
    throw new HttpError(401, "User tidak ditemukan");
  }

  return userRepository.toPublicUser(user);
}

async function refresh(refreshToken) {
  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch (_error) {
    throw new HttpError(401, "Refresh token tidak valid");
  }

  const storedToken = await userRepository.findRefreshToken(payload.tokenId);
  if (!storedToken || storedToken.revokedAt) {
    throw new HttpError(401, "Refresh token tidak valid");
  }

  await userRepository.revokeRefreshToken(payload.tokenId);

  const user = await userRepository.findUserById(payload.sub);
  if (!user || user.status !== "ACTIVE") {
    throw new HttpError(401, "Refresh token tidak valid");
  }

  return {
    user: userRepository.toPublicUser(user),
    ...(await issueTokens(user)),
  };
}

async function logout(refreshToken) {
  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch (_error) {
    return;
  }

  await userRepository.revokeRefreshToken(payload.tokenId);
}

module.exports = {
  registerCustomer,
  login,
  getCurrentUser,
  refresh,
  logout,
};
