"use strict";

const { run, get, all } = require("./db");
const logger = require("../utils/logger");

const CLAIM_STATUS = {
  PENDING:   "pending",
  CLAIMED:   "claimed",
  EXPIRED:   "expired",
  RECLAIMED: "reclaimed",
};

function createClaim({ claimId, amountRaw, creatorAddr, expiresAt, txCreate }) {
  const now = Date.now();
  try {
    const result = run(
      `INSERT INTO claims (claim_id, amount_raw, creator_addr, status, created_at, expires_at, tx_create, updated_at)
       VALUES (?, ?, ?, 'pending', ?, ?, ?, ?)`,
      [claimId, amountRaw, creatorAddr, now, expiresAt, txCreate || null, now]
    );
    logger.info(`Claim record created (rowid=${result.lastInsertRowid})`);
    return getClaimById(claimId);
  } catch (err) {
    if (err.message && err.message.includes("UNIQUE")) {
      throw Object.assign(new Error("Claim ID already exists"), { code: "DUPLICATE_CLAIM" });
    }
    throw err;
  }
}

function getClaimById(claimId) {
  const row = get("SELECT * FROM claims WHERE claim_id = ?", [claimId]);
  return row ? rowToDto(row) : null;
}

function getClaimsByCreator(creatorAddr) {
  const rows = all(
    "SELECT * FROM claims WHERE LOWER(creator_addr) = LOWER(?) ORDER BY created_at DESC",
    [creatorAddr]
  );
  return rows.map(rowToDto);
}

function getClaimsByClaimer(claimerAddr) {
  const rows = all(
    "SELECT * FROM claims WHERE LOWER(claimer_addr) = LOWER(?) ORDER BY claimed_at DESC",
    [claimerAddr]
  );
  return rows.map(rowToDto);
}

function markClaimed({ claimId, claimerAddr, txClaim }) {
  const now = Date.now();
  const result = run(
    `UPDATE claims SET status='claimed', claimer_addr=?, claimed_at=?, tx_claim=?, updated_at=?
     WHERE claim_id=? AND status='pending'`,
    [claimerAddr, now, txClaim || null, now, claimId]
  );
  if (result.changes === 0) {
    logger.warn("markClaimed: no rows updated");
    return null;
  }
  return getClaimById(claimId);
}

function markReclaimed({ claimId, txClaim }) {
  const now = Date.now();
  run(
    `UPDATE claims SET status='reclaimed', claimed_at=?, tx_claim=?, updated_at=?
     WHERE claim_id=? AND status='pending'`,
    [now, txClaim || null, now, claimId]
  );
  return getClaimById(claimId);
}

function sweepExpiredClaims() {
  const now = Date.now();
  const result = run(
    "UPDATE claims SET status='expired', updated_at=? WHERE status='pending' AND expires_at <= ?",
    [now, now]
  );
  if (result.changes > 0) logger.info(`Swept ${result.changes} expired claim(s)`);
}

function rowToDto(row) {
  return {
    claimId:     row.claim_id,
    amountRaw:   row.amount_raw,
    creatorAddr: row.creator_addr,
    status:      row.status,
    createdAt:   row.created_at,
    expiresAt:   row.expires_at,
    claimedAt:   row.claimed_at  || null,
    claimerAddr: row.claimer_addr || null,
    txCreate:    row.tx_create    || null,
    txClaim:     row.tx_claim     || null,
    updatedAt:   row.updated_at,
  };
}

module.exports = {
  CLAIM_STATUS,
  createClaim,
  getClaimById,
  getClaimsByCreator,
  getClaimsByClaimer,
  markClaimed,
  markReclaimed,
  sweepExpiredClaims,
};
