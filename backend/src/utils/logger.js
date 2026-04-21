"use strict";

const winston = require("winston");

const { combine, timestamp, printf, colorize, errors } = winston.format;

const logFormat = printf(({ level, message, timestamp: ts, stack }) => {
  const base = `${ts} [${level}]: ${message}`;
  return stack ? `${base}\n${stack}` : base;
});

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: combine(
    errors({ stack: true }),
    timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    logFormat
  ),
  transports: [
    new winston.transports.Console({
      format: combine(
        colorize(),
        errors({ stack: true }),
        timestamp({ format: "HH:mm:ss" }),
        logFormat
      ),
      silent: process.env.NODE_ENV === "test",
    }),
  ],
});

// In production add a file transport
if (process.env.NODE_ENV === "production") {
  logger.add(
    new winston.transports.File({
      filename: "logs/error.log",
      level:    "error",
      maxsize:  5_000_000,  // 5 MB
      maxFiles: 5,
      tailable: true,
    })
  );
  logger.add(
    new winston.transports.File({
      filename: "logs/combined.log",
      maxsize:  10_000_000, // 10 MB
      maxFiles: 10,
      tailable: true,
    })
  );
}

module.exports = logger;
