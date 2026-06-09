const { sendError } = require("../utils/response");

function notFoundMiddleware(req, _res, next) {
  const error = new Error(`Route ${req.method} ${req.originalUrl} tidak ditemukan`);
  error.statusCode = 404;
  return next(error);
}

function errorMiddleware(error, _req, res, _next) {
  const statusCode = error.statusCode || 500;
  const message = statusCode === 500 ? "Internal Server Error" : error.message;
  const errors = Array.isArray(error.errors) ? error.errors : [];

  return sendError(res, statusCode, message, errors);
}

module.exports = { errorMiddleware, notFoundMiddleware };
