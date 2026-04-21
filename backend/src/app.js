"use strict";

require("dotenv").config();

const express    = require("express");
const helmet     = require("helmet");
const cors       = require("cors");
const morgan     = require("morgan");
const rateLimit  = require("express-rate-limit");

const logger         = require("./utils/logger");
const { initDb }     = require("./models/db");
const claimRoutes    = require("./routes/claims");
const { errorHandler, notFound } = require("./middleware/errorHandler");

const app = express();

// ─── Security headers ─────────────────────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc:  ["'self'"],
      styleSrc:   ["'self'", "'unsafe-inline'"],
      imgSrc:     ["'self'", "data:"],
      connectSrc: ["'self'", process.env.ARC_RPC_URL].filter(Boolean),
      frameSrc:   ["'none'"],
      objectSrc:  ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

// ─── CORS ─────────────────────────────────────────────────────────────────────
const allowedOrigins = (process.env.CORS_ORIGINS || "http://localhost:5173")
  .split(",").map((o) => o.trim());

app.use(cors({
  origin: (origin, callback) => {
    if (!origin && process.env.NODE_ENV !== "production") return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error(`CORS: origin ${origin} not allowed`));
  },
  methods:        ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Request-ID"],
  credentials:    false,
  maxAge:         86400,
}));

// ─── Body parsing ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: false, limit: "16kb" }));

// ─── Logging ──────────────────────────────────────────────────────────────────
app.use(morgan(":method :url :status - :response-time ms", {
  stream: { write: (msg) => logger.http(msg.trim()) },
  skip: (req) => req.url === "/health",
}));

// ─── Global rate limit ────────────────────────────────────────────────────────
const globalLimiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS)   || 60_000,
  max:      Number(process.env.RATE_LIMIT_MAX_REQUESTS) || 60,
  standardHeaders: true,
  legacyHeaders:   false,
  message: { error: "Too many requests, please slow down." },
  skip: (req) => req.url === "/health",
});
app.use(globalLimiter);

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use("/api/claims", claimRoutes);

app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString(), version: "1.0.0" });
});

// ─── Error handlers ───────────────────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ─── Start (only when run directly, not required by tests) ───────────────────
if (require.main === module) {
  const PORT = process.env.PORT || 4000;
  initDb().then(() => {
    app.listen(PORT, () => {
      logger.info(`Radius Pay API listening on port ${PORT} [${process.env.NODE_ENV}]`);
    });
  }).catch((err) => {
    logger.error("Failed to start server:", err);
    process.exit(1);
  });

  process.on("SIGTERM", () => { logger.info("SIGTERM — shutting down"); process.exit(0); });
  process.on("SIGINT",  () => { logger.info("SIGINT — shutting down");  process.exit(0); });
}

module.exports = app;
