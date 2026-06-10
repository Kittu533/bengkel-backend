const crypto = require("node:crypto");
const jwt = require("jsonwebtoken");
const {
  ACCESS_TOKEN_EXPIRES_IN,
  ACCESS_TOKEN_SECRET,
  REFRESH_TOKEN_EXPIRES_IN,
  REFRESH_TOKEN_SECRET,
} = require("../config/auth");

function signAccessToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      roles: user.roles,
      tenantId: user.tenantId || null,
      branchId: user.branchId || null,
    },
    ACCESS_TOKEN_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRES_IN }
  );
}

function signRefreshToken(user) {
  const tokenId = crypto.randomUUID();
  const token = jwt.sign(
    {
      sub: user.id,
      tokenId,
    },
    REFRESH_TOKEN_SECRET,
    { expiresIn: REFRESH_TOKEN_EXPIRES_IN }
  );

  return { token, tokenId };
}

function verifyAccessToken(token) {
  return jwt.verify(token, ACCESS_TOKEN_SECRET);
}

function verifyRefreshToken(token) {
  return jwt.verify(token, REFRESH_TOKEN_SECRET);
}

module.exports = {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
};
