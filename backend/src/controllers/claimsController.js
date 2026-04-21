"use strict";

const { ethers }   = require("ethers");
const { validationResult } = require("express-validator");
const ClaimModel   = require("../models/Claim");
const logger       = require("../utils/logger");
const { getLinkPayContract } = require("../utils/blockchain");

function sendValidationError(res, errors) {
  return res.status(400).json({ error: "Validation failed", details: errors.array() });
}

function safeLogId(claimId) {
  if (!claimId || typeof claimId !== "string") return "[invalid]";
  return claimId.slice(0, 10) + "…";
}

// Normalize address — tries checksum, falls back to lowercase comparison
function normalizeAddress(addr) {
  try { return ethers.getAddress(addr); }
  catch { return addr.toLowerCase(); }
}

// ─── POST /api/claims ─────────────────────────────────────────────────────────
async function createClaim(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return sendValidationError(res, errors);

  const { claimId, creatorAddr, txCreate } = req.body;

  try {
    const contract = getLinkPayContract();
    const [onChainCreator, onChainAmount, onChainExpiry, onChainClaimed] =
      await contract.getClaim(claimId);

    if (onChainCreator === ethers.ZeroAddress) {
      return res.status(400).json({ error: "Claim does not exist on-chain. Submit transaction first." });
    }

    if (onChainCreator.toLowerCase() !== creatorAddr.toLowerCase()) {
      return res.status(400).json({ error: "Creator address mismatch with on-chain data." });
    }

    const claim = ClaimModel.createClaim({
      claimId,
      amountRaw:   onChainAmount.toString(),
      creatorAddr: normalizeAddress(creatorAddr),
      expiresAt:   Number(onChainExpiry) * 1000,
      txCreate:    txCreate || null,
    });

    logger.info(`Claim recorded: ${safeLogId(claimId)}`);
    return res.status(201).json({ success: true, claim });
  } catch (err) {
    if (err.code === "DUPLICATE_CLAIM") {
      return res.status(409).json({ error: "Claim already recorded." });
    }
    logger.error("createClaim error:", err.message);
    next(err);
  }
}

// ─── GET /api/claims/:claimId ─────────────────────────────────────────────────
async function getClaimById(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return sendValidationError(res, errors);

  const { claimId } = req.params;

  try {
    ClaimModel.sweepExpiredClaims();

    let claim = ClaimModel.getClaimById(claimId);
    if (claim) return res.json({ claim });

    // Fallback: on-chain
    const contract = getLinkPayContract();
    const [creator, amount, expiry, claimed] = await contract.getClaim(claimId);

    if (creator === ethers.ZeroAddress) {
      return res.status(404).json({ error: "Claim not found." });
    }

    const now = Date.now();
    return res.json({
      claim: {
        claimId,
        amountRaw:   amount.toString(),
        creatorAddr: creator,
        status:      claimed ? "claimed" : now > Number(expiry) * 1000 ? "expired" : "pending",
        expiresAt:   Number(expiry) * 1000,
        createdAt:   null,
        claimedAt:   null,
        claimerAddr: null,
        source:      "onchain",
      },
    });
  } catch (err) {
    logger.error(`getClaimById error (${safeLogId(claimId)}):`, err.message);
    next(err);
  }
}

// ─── GET /api/claims/user/:address ────────────────────────────────────────────
async function getClaimsByUser(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return sendValidationError(res, errors);

  const { address } = req.params;

  try {
    ClaimModel.sweepExpiredClaims();
    const created  = ClaimModel.getClaimsByCreator(address);
    const received = ClaimModel.getClaimsByClaimer(address);
    return res.json({ created, received });
  } catch (err) {
    logger.error("getClaimsByUser error:", err.message);
    next(err);
  }
}

// ─── POST /api/claims/verify ──────────────────────────────────────────────────
async function verifyClaim(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return sendValidationError(res, errors);

  const { claimId, secret } = req.body;

  try {
    const secretBytes  = ethers.getBytes(secret);
    const computedHash = ethers.keccak256(
      ethers.solidityPacked(["bytes32"], [secretBytes])
    );

    if (computedHash.toLowerCase() !== claimId.toLowerCase()) {
      return res.json({ valid: false, reason: "Secret does not match claim ID." });
    }

    const contract = getLinkPayContract();
    const isClaimable = await contract.isClaimable(claimId);

    return res.json({
      valid:  isClaimable,
      reason: isClaimable ? null : "Claim is not claimable (already claimed or expired).",
    });
  } catch (err) {
    logger.error(`verifyClaim error (${safeLogId(claimId)}):`, err.message);
    next(err);
  }
}

// ─── POST /api/claims/:claimId/mark-claimed ───────────────────────────────────
async function markClaimed(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return sendValidationError(res, errors);

  const { claimId }            = req.params;
  const { claimerAddr, txClaim } = req.body;

  try {
    const contract = getLinkPayContract();
    const [, , , claimed] = await contract.getClaim(claimId);

    if (!claimed) {
      return res.status(400).json({ error: "Claim is not yet claimed on-chain." });
    }

    const updated = ClaimModel.markClaimed({
      claimId,
      claimerAddr: normalizeAddress(claimerAddr),
      txClaim:     txClaim || null,
    });

    return res.json({ success: true, claim: updated });
  } catch (err) {
    logger.error(`markClaimed error (${safeLogId(claimId)}):`, err.message);
    next(err);
  }
}

module.exports = { createClaim, getClaimById, getClaimsByUser, verifyClaim, markClaimed };
