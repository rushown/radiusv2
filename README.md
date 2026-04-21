# Secure Link Pay (Radius Pay)

**Trustless, one-time-claim USDC payment links on the Arc blockchain.**

Send USDC to anyone with a link — no wallet address required from the recipient upfront.

---

## What is Secure Link Pay?

Secure Link Pay lets you lock USDC into a smart contract and generate a unique claim link. Share that link with anyone — they connect their wallet and claim the funds instantly. Each link works exactly once.

Think of it like a digital bearer check: whoever has the link gets the money.

---

## How the Claim Link Mechanism Works

```
Creator                          Smart Contract                     Recipient
   │                                    │                               │
   │  1. Generate random secret         │                               │
   │     (32 bytes, client-side)        │                               │
   │                                    │                               │
   │  2. Compute claimId =              │                               │
   │     keccak256(secret)              │                               │
   │                                    │                               │
   │  3. approve(contract, amount)      │                               │
   │  ─────────────────────────────────►│                               │
   │                                    │                               │
   │  4. createClaim(claimId, amount)   │                               │
   │  ─────────────────────────────────►│ locks USDC                    │
   │                                    │                               │
   │  5. Share link:                    │                               │
   │     /claim/{claimId}/{secret}      │                               │
   │  ──────────────────────────────────────────────────────────────►   │
   │                                    │                               │
   │                                    │  6. claim(claimId, secret)    │
   │                                    │◄──────────────────────────────│
   │                                    │                               │
   │                                    │  7. verify: keccak256(secret) │
   │                                    │     == claimId ✓              │
   │                                    │                               │
   │                                    │  8. transfer USDC ──────────► │
```

**Key security properties:**
- The raw secret is **never stored** anywhere — not in the database, not on-chain, not in logs
- The smart contract stores only `keccak256(secret)` (the `claimId`)
- Claiming requires the raw secret — mathematically infeasible to reverse the hash
- Each link can only be claimed **once** (atomic on-chain flag)
- Links auto-expire after 7 days — creators can reclaim unclaimed funds
- Protected against reentrancy, replay attacks, and front-running

---

## Technologies

| Layer | Stack |
|-------|-------|
| Blockchain | Arc (EVM-compatible L1 by Circle, Chain ID 5042002) |
| Smart Contract | Solidity 0.8.24, OpenZeppelin v5 (ReentrancyGuard, SafeERC20, Pausable) |
| Contract Testing | Foundry (forge test + fuzz testing) |
| Frontend | React 18 + TypeScript, Wagmi v2, Viem, TailwindCSS |
| Backend API | Node.js + Express, better-sqlite3, ethers.js v6 |
| Token | USDC ERC-20 at `0x3600000000000000000000000000000000000000` (6 decimals) |

---

## Quick Start

See **[guide.md](./guide.md)** for full setup instructions.

**TL;DR:**
```bash
# 1. Deploy contract
cd contracts && forge install && forge test && forge script script/DeployLinkPay.s.sol --broadcast

# 2. Start backend
cd backend && cp .env.example .env  # fill in contract address
npm install && npm run dev

# 3. Start frontend (already built)
cd frontend && cp .env.example .env.local  # fill in contract address
npm install && npm run dev
```

---

## Project Structure

```
radius-pay/
├── contracts/
│   ├── src/LinkPay.sol           # Main claim contract
│   ├── test/LinkPay.t.sol        # Foundry test suite (unit + fuzz)
│   ├── script/DeployLinkPay.s.sol
│   └── foundry.toml
├── backend/
│   ├── src/
│   │   ├── app.js                # Express server entry point
│   │   ├── routes/claims.js      # API routes + validation
│   │   ├── controllers/          # Business logic
│   │   ├── models/               # SQLite DB + Claim model
│   │   ├── middleware/           # Error handling
│   │   └── utils/                # Logger, blockchain helpers
│   ├── tests/claims.test.js
│   └── .env.example
├── frontend/                     # (pre-built)
├── guide.md                      # Full deployment guide
└── README.md
```

---

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/claims` | Register a new claim (after on-chain tx confirmed) |
| `GET` | `/api/claims/:claimId` | Fetch claim metadata |
| `GET` | `/api/claims/user/:address` | All claims for a wallet |
| `POST` | `/api/claims/verify` | Verify a secret without claiming (rate-limited) |
| `POST` | `/api/claims/:claimId/mark-claimed` | Update status after on-chain claim |

---

## Smart Contract

**Network:** Arc Testnet (`https://rpc.testnet.arc.network`, Chain ID `5042002`)

**Key functions:**

| Function | Description |
|----------|-------------|
| `createClaim(claimId, amount, expiry)` | Lock USDC, register claim |
| `claim(claimId, secret)` | Claim USDC with secret |
| `reclaim(claimId)` | Creator reclaims after expiry |
| `getClaim(claimId)` | Read claim metadata |
| `isClaimable(claimId)` | Check if claimable |

---

## Known Limitations

- **Testnet only** — deployed on Arc testnet; not audited for mainnet
- **Single token** — only USDC (the Arc-native ERC-20)
- **SQLite backend** — suitable for development/small scale; swap for PostgreSQL in production
- **No email/notification** — the app doesn't email recipients; you share the link manually
- **Bearer credential** — anyone with the claim URL can claim funds; share links securely

---

## Security

- Secrets are generated with `crypto.getRandomValues()` (CSPRNG)
- Only `keccak256(secret)` is ever stored on-chain or in the database
- Smart contract uses `ReentrancyGuard`, `SafeERC20`, and checks-effects-interactions
- Backend rate-limits the `/verify` endpoint to prevent brute-force attacks
- All inputs validated and sanitized; security headers set with Helmet.js

---

## License

MIT
