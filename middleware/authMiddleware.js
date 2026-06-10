const { HttpError } = require("../utils/httpError");
const { verifyAccessToken } = require("../utils/token");
const { buildTenantContext } = require("./tenantContext");

function authMiddleware(req, _res, next) {
  const header = req.headers.authorization || "";
  const [scheme, token] = header.split(" ");

  if (scheme !== "Bearer" || !token) {
    return next(new HttpError(401, "Token tidak ditemukan"));
  }

  try {
    const payload = verifyAccessToken(token);
    req.user = {
      id: payload.sub,
      email: payload.email,
      roles: payload.roles || [],
      tenantId: payload.tenantId || null,
      branchId: payload.branchId || null,
    };
    req.tenantContext = buildTenantContext(req);
    return next();
  } catch (_error) {
    return next(new HttpError(401, "Token tidak valid"));
  }
}

function roleMiddleware(allowedRoles) {
  return (req, _res, next) => {
    const roles = req.user?.roles || [];
    const isAllowed = allowedRoles.some((role) => roles.includes(role));

    if (!isAllowed) {
      return next(new HttpError(403, "Role tidak memiliki akses"));
    }

    return next();
  };
}

module.exports = { authMiddleware, roleMiddleware };
