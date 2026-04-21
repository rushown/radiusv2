"use strict";

process.env.NODE_ENV                 = "test";
process.env.DATABASE_PATH            = ":memory:";
process.env.ARC_RPC_URL              = "https://rpc.testnet.arc.network";
process.env.ARC_CHAIN_ID             = "5042002";
process.env.LINKPAY_CONTRACT_ADDRESS = "0x1234567890123456789012345678901234567890";
process.env.CORS_ORIGINS             = "http://localhost:5173";

// Valid checksummed addresses
const VALID_ADDRESS   = "0xfBDCCA5D14d2431e787C70f7C4e08eE4431C7a5a";
const CLAIMER_ADDRESS = "0x71bE63f3384f5fb98995898A86B02Fb2426c5788";

const mockGetClaim    = jest.fn();
const mockIsClaimable = jest.fn();

jest.mock("../src/utils/blockchain", () => ({
  getProvider:        jest.fn(),
  getLinkPayContract: jest.fn(() => ({
    getClaim:         mockGetClaim,
    isClaimable:      mockIsClaimable,
    getCreatorClaims: jest.fn().mockResolvedValue([]),
  })),
  waitForReceipt: jest.fn(),
}));

const request = require("supertest");

const VALID_CLAIM_ID  = "0x" + "a".repeat(64);
const VALID_CLAIM_ID2 = "0x" + "e".repeat(64);
const VALID_TX_HASH   = "0x" + "b".repeat(64);
const VALID_SECRET    = "0x" + "c".repeat(64);
const ZERO_ADDRESS    = "0x" + "0".repeat(40);

let app;

function defaultOnchainClaim(claimed = false) {
  return [
    VALID_ADDRESS,
    BigInt("100000000"),
    BigInt(Math.floor(Date.now() / 1000) + 86400),
    claimed,
  ];
}

beforeAll(async () => {
  mockGetClaim.mockResolvedValue(defaultOnchainClaim());
  mockIsClaimable.mockResolvedValue(true);
  const { initDb } = require("../src/models/db");
  await initDb();
  app = require("../src/app");
});

beforeEach(() => {
  jest.clearAllMocks();
  mockGetClaim.mockResolvedValue(defaultOnchainClaim());
  mockIsClaimable.mockResolvedValue(true);
});

// ─── Health ───────────────────────────────────────────────────────────────────
describe("GET /health", () => {
  it("200 with status ok", async () => {
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
  });
});

// ─── POST /api/claims ─────────────────────────────────────────────────────────
describe("POST /api/claims", () => {
  it("creates a claim record after on-chain verification", async () => {
    const res = await request(app)
      .post("/api/claims")
      .send({ claimId: VALID_CLAIM_ID, creatorAddr: VALID_ADDRESS, txCreate: VALID_TX_HASH });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.claim.claimId).toBe(VALID_CLAIM_ID);
  });

  it("returns 409 on duplicate claimId", async () => {
    const res = await request(app)
      .post("/api/claims")
      .send({ claimId: VALID_CLAIM_ID, creatorAddr: VALID_ADDRESS, txCreate: VALID_TX_HASH });
    expect(res.status).toBe(409);
  });

  it("returns 400 for missing 0x prefix on claimId", async () => {
    const res = await request(app)
      .post("/api/claims")
      .send({ claimId: "a".repeat(64), creatorAddr: VALID_ADDRESS });
    expect(res.status).toBe(400);
  });

  it("returns 400 for invalid creator address", async () => {
    const res = await request(app)
      .post("/api/claims")
      .send({ claimId: VALID_CLAIM_ID2, creatorAddr: "notanaddress" });
    expect(res.status).toBe(400);
  });

  it("returns 400 when claim not found on-chain (zero address)", async () => {
    mockGetClaim.mockResolvedValueOnce([ZERO_ADDRESS, BigInt("0"), BigInt("0"), false]);
    const res = await request(app)
      .post("/api/claims")
      .send({ claimId: VALID_CLAIM_ID2, creatorAddr: VALID_ADDRESS });
    expect(res.status).toBe(400);
  });

  it("returns 400 when creator mismatch", async () => {
    mockGetClaim.mockResolvedValueOnce([CLAIMER_ADDRESS, BigInt("100000000"), BigInt(Math.floor(Date.now()/1000)+86400), false]);
    const res = await request(app)
      .post("/api/claims")
      .send({ claimId: VALID_CLAIM_ID2, creatorAddr: VALID_ADDRESS });
    expect(res.status).toBe(400);
  });
});

// ─── GET /api/claims/:claimId ─────────────────────────────────────────────────
describe("GET /api/claims/:claimId", () => {
  it("returns claim from DB", async () => {
    const res = await request(app).get(`/api/claims/${VALID_CLAIM_ID}`);
    expect(res.status).toBe(200);
    expect(res.body.claim.claimId).toBe(VALID_CLAIM_ID);
  });

  it("falls back to on-chain when not in DB", async () => {
    const notInDb = "0x" + "f".repeat(64);
    const res = await request(app).get(`/api/claims/${notInDb}`);
    expect(res.status).toBe(200);
    expect(res.body.claim.source).toBe("onchain");
  });

  it("returns 404 when not anywhere", async () => {
    mockGetClaim.mockResolvedValueOnce([ZERO_ADDRESS, BigInt("0"), BigInt("0"), false]);
    const notAnywhere = "0x" + "9".repeat(64);
    const res = await request(app).get(`/api/claims/${notAnywhere}`);
    expect(res.status).toBe(404);
  });

  it("returns 400 for malformed claimId", async () => {
    const res = await request(app).get("/api/claims/badid");
    expect(res.status).toBe(400);
  });
});

// ─── GET /api/claims/user/:address ────────────────────────────────────────────
describe("GET /api/claims/user/:address", () => {
  it("returns created and received arrays", async () => {
    const res = await request(app).get(`/api/claims/user/${VALID_ADDRESS}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.created)).toBe(true);
    expect(Array.isArray(res.body.received)).toBe(true);
  });

  it("includes newly created claim in created list", async () => {
    const res = await request(app).get(`/api/claims/user/${VALID_ADDRESS}`);
    expect(res.status).toBe(200);
    expect(res.body.created.length).toBeGreaterThan(0);
    expect(res.body.created[0].claimId).toBe(VALID_CLAIM_ID);
  });

  it("returns 400 for invalid address", async () => {
    const res = await request(app).get("/api/claims/user/notanaddress");
    expect(res.status).toBe(400);
  });
});

// ─── POST /api/claims/verify ──────────────────────────────────────────────────
describe("POST /api/claims/verify", () => {
  it("returns valid:false for mismatched secret", async () => {
    const res = await request(app)
      .post("/api/claims/verify")
      .send({ claimId: VALID_CLAIM_ID, secret: VALID_SECRET });
    expect(res.status).toBe(200);
    expect(res.body.valid).toBe(false);
  });

  it("returns 400 for short secret", async () => {
    const res = await request(app)
      .post("/api/claims/verify")
      .send({ claimId: VALID_CLAIM_ID, secret: "tooshort" });
    expect(res.status).toBe(400);
  });

  it("returns 400 for missing claimId", async () => {
    const res = await request(app)
      .post("/api/claims/verify")
      .send({ secret: VALID_SECRET });
    expect(res.status).toBe(400);
  });
});

// ─── POST /api/claims/:claimId/mark-claimed ───────────────────────────────────
describe("POST /api/claims/:claimId/mark-claimed", () => {
  it("returns 400 when not yet claimed on-chain", async () => {
    mockGetClaim.mockResolvedValueOnce(defaultOnchainClaim(false));
    const res = await request(app)
      .post(`/api/claims/${VALID_CLAIM_ID}/mark-claimed`)
      .send({ claimerAddr: CLAIMER_ADDRESS, txClaim: VALID_TX_HASH });
    expect(res.status).toBe(400);
  });

  it("marks as claimed when on-chain confirms claimed=true", async () => {
    mockGetClaim.mockResolvedValueOnce(defaultOnchainClaim(true));
    const res = await request(app)
      .post(`/api/claims/${VALID_CLAIM_ID}/mark-claimed`)
      .send({ claimerAddr: CLAIMER_ADDRESS, txClaim: VALID_TX_HASH });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it("returns 400 for invalid claimer address", async () => {
    const res = await request(app)
      .post(`/api/claims/${VALID_CLAIM_ID}/mark-claimed`)
      .send({ claimerAddr: "bad", txClaim: VALID_TX_HASH });
    expect(res.status).toBe(400);
  });
});

// ─── 404 ──────────────────────────────────────────────────────────────────────
describe("Unknown routes", () => {
  it("returns 404 for unknown path", async () => {
    const res = await request(app).get("/api/nonexistent");
    expect(res.status).toBe(404);
  });
});
