"use strict";

const path    = require("path");
const fs      = require("fs");
const logger  = require("../utils/logger");

const initSqlJs = require("sql.js");

const DB_PATH = process.env.DATABASE_PATH && process.env.DATABASE_PATH !== ":memory:"
  ? path.resolve(process.env.DATABASE_PATH)
  : null;

let db = null;

const CREATE_TABLES = `
  CREATE TABLE IF NOT EXISTS claims (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    claim_id      TEXT    NOT NULL UNIQUE,
    amount_raw    TEXT    NOT NULL,
    creator_addr  TEXT    NOT NULL,
    status        TEXT    NOT NULL DEFAULT 'pending',
    created_at    INTEGER NOT NULL,
    expires_at    INTEGER NOT NULL,
    claimed_at    INTEGER,
    claimer_addr  TEXT,
    tx_create     TEXT,
    tx_claim      TEXT,
    updated_at    INTEGER NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_claims_claim_id     ON claims(claim_id);
  CREATE INDEX IF NOT EXISTS idx_claims_creator_addr ON claims(creator_addr);
  CREATE INDEX IF NOT EXISTS idx_claims_status       ON claims(status);
  CREATE INDEX IF NOT EXISTS idx_claims_expires_at   ON claims(expires_at);
`;

function persistDb() {
  if (!DB_PATH || !db) return;
  try {
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const data = db.export();
    fs.writeFileSync(DB_PATH, Buffer.from(data));
  } catch (err) {
    logger.error("Failed to persist database:", err.message);
  }
}

async function initDb() {
  const SQL = await initSqlJs();
  if (DB_PATH && fs.existsSync(DB_PATH)) {
    const fileBuffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(fileBuffer);
    logger.info(`Database loaded from ${DB_PATH}`);
  } else {
    db = new SQL.Database();
    db.run(CREATE_TABLES);
    if (DB_PATH) { persistDb(); logger.info(`Database created at ${DB_PATH}`); }
    else { logger.info("Database initialised (in-memory)"); }
  }
  return db;
}

function getDb() {
  if (!db) throw new Error("Database not initialised — call initDb() first");
  return db;
}

function run(sql, params = []) {
  const database = getDb();
  database.run(sql, params);
  persistDb();
  const result = database.exec("SELECT last_insert_rowid() AS id, changes() AS changes");
  if (result.length && result[0].values.length) {
    const [id, changes] = result[0].values[0];
    return { lastInsertRowid: id, changes };
  }
  return { lastInsertRowid: null, changes: 0 };
}

function get(sql, params = []) {
  const database = getDb();
  const result = database.exec(sql, params);
  if (!result.length || !result[0].values.length) return null;
  const { columns, values } = result[0];
  return Object.fromEntries(columns.map((col, i) => [col, values[0][i]]));
}

function all(sql, params = []) {
  const database = getDb();
  const result = database.exec(sql, params);
  if (!result.length) return [];
  const { columns, values } = result[0];
  return values.map((row) => Object.fromEntries(columns.map((col, i) => [col, row[i]])));
}

module.exports = { initDb, getDb, run, get, all, persistDb };
