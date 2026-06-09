function requestLogger(req, res, next) {
  if (process.env.NODE_ENV === "test") return next();

  const startedAt = process.hrtime.bigint();
  const requestId =
    req.headers["x-request-id"] ||
    `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

  req.requestId = requestId;
  res.setHeader("X-Request-Id", requestId);

  res.on("finish", () => {
    const durationMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000;
    const log = {
      requestId,
      method: req.method,
      path: req.originalUrl,
      statusCode: res.statusCode,
      durationMs: Number(durationMs.toFixed(2)),
      ip: req.ip,
      userAgent: req.headers["user-agent"] || null,
    };

    const message = JSON.stringify(log);
    if (res.statusCode >= 500) {
      console.error(message);
      return;
    }
    console.info(message);
  });

  return next();
}

module.exports = { requestLogger };
