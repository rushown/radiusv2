"use strict";

const express      = require("express");
const rateLimit    = require("express-rate-limit");
const { body, param } = require("express-validator");
const ctrl         = require("../controllers/claimsController");

const router = express.Router();

// ─── Rate limiters ────────────────────────────────────────────────────────────

const verifyLimiter = rateLimit({
  windowMs: Number(process.env.VERIFY_RATE_LIMIT_WINDOW_MS)  || 60_000,
  max:      Number(process.env.VERIFY_RATE_LIMIT_MAX_REQUESTS) || 10,
  standardHeaders: true,
  legacyHeaders:   false,
  message: { error: "Too many verify attempts. Please wait before trying again." },
  keyGenerator: (req) => req.ip,
});

const writeLimiter = rateLimit({
  windowMs: 60_000,
  max:      20,
  standardHeaders: true,
  legacyHeaders:   false,
  message: { error: "Too many write requests. Please slow down." },
  keyGenerator: (req) => req.ip,
});

// ─── Validation schemas ───────────────────────────────────────────────────────

const claimIdParam = param("claimId")
  .isHexadecimal().withMessage("claimId must be a hex string")
  .isLength({ min: 64, max: 66 }).withMessage("claimId must be 32 bytes (64 hex chars or 0x-prefixed)");

const addressParam = param("address")
  .matches(/^0x[0-9a-fA-F]{40}$/).withMessage("Invalid Ethereum address");

const createClaimBody = [
  body("claimId")
    .isString()
    .matches(/^0x[0-9a-fA-F]{64}$/).withMessage("claimId must be 0x-prefixed 32-byte hex"),
  body("creatorAddr")
    .matches(/^0x[0-9a-fA-F]{40}$/).withMessage("Invalid creator address"),
  body("txCreate")
    .optional()
    .matches(/^0x[0-9a-fA-F]{64}$/).withMessage("Invalid tx hash"),
];

const verifyBody = [
  body("claimId")
    .isString()
    .matches(/^0x[0-9a-fA-F]{64}$/).withMessage("claimId must be 0x-prefixed 32-byte hex"),
  body("secret")
    .isString()
    .matches(/^0x[0-9a-fA-F]{64}$/).withMessage("secret must be 0x-prefixed 32-byte hex"),
];

const markClaimedBody = [
  body("claimerAddr")
    .matches(/^0x[0-9a-fA-F]{40}$/).withMessage("Invalid claimer address"),
  body("txClaim")
    .optional()
    .matches(/^0x[0-9a-fA-F]{64}$/).withMessage("Invalid tx hash"),
];

// ─── Routes ───────────────────────────────────────────────────────────────────

// POST /api/claims — register a new claim after on-chain confirmation
router.post("/", writeLimiter, createClaimBody, ctrl.createClaim);

// POST /api/claims/verify — check if a secret is valid (rate-limited)
router.post("/verify", verifyLimiter, verifyBody, ctrl.verifyClaim);

// GET /api/claims/user/:address — all claims for a wallet
router.get("/user/:address", addressParam, ctrl.getClaimsByUser);

// GET /api/claims/:claimId — fetch single claim metadata
router.get("/:claimId", claimIdParam, ctrl.getClaimById);

// POST /api/claims/:claimId/mark-claimed — update DB after claim tx confirmed
router.post("/:claimId/mark-claimed", writeLimiter, claimIdParam, markClaimedBody, ctrl.markClaimed);

module.exports = router;
