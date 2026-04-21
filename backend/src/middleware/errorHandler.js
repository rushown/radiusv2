"use strict";

const logger = require("../utils/logger");

/**
 * 404 handler — catches requests that reach no route.
 */
function notFound(req, res, _next) {
  res.status(404).json({ error: `Not found: ${req.method} ${req.originalUrl}` });
}

/**
 * Global error handler — catches anything thrown or passed to next(err).
 * Never leaks stack traces or internal details to the client.
 */
function errorHandler(err, req, res, _next) {
  // Log the full error server-side
  logger.error(`[${req.method} ${req.originalUrl}] ${err.message}`, { stack: err.stack });

  // Operational errors we expose to the client
  if (err.name === "ValidationError") {
    return res.status(400).json({ error: err.message });
  }

  if (err.message && err.message.includes("CORS")) {
    return res.status(403).json({ error: "CORS policy violation" });
  }

  // Default: opaque 500
  const statusCode = err.status || err.statusCode || 500;
  const message    = process.env.NODE_ENV === "production"
    ? "Internal server error"
    : err.message;

  res.status(statusCode).json({ error: message });
}

module.exports = { notFound, errorHandler };
