# Secure Link Pay — Configuration & Deployment Guide

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Arc Testnet Setup in MetaMask](#arc-testnet-setup)
3. [Getting Testnet USDC](#getting-testnet-usdc)
4. [Smart Contract Deployment](#smart-contract-deployment)
5. [Backend Configuration & Setup](#backend-setup)
6. [Frontend Configuration](#frontend-configuration)
7. [Running the Full Stack](#running-the-full-stack)
8. [Troubleshooting](#troubleshooting)
9. [Security Reminders for Production](#security-reminders)

---

## 1. Prerequisites

| Tool | Version | Install |
|------|---------|---------|
| Node.js | ≥ 20.x | https://nodejs.org |
| npm | ≥ 10.x | bundled with Node |
| Foundry | latest | `curl -L https://foundry.paradigm.xyz \| bash && foundryup` |
| MetaMask | latest | https://metamask.io |
| Git | any | https://git-scm.com |

Verify installations:
```bash
node -v        # v20.x.x
npm -v         # 10.x.x
forge --version  # forge 0.2.x
cast --version   # cast 0.2.x
```

---

## 2. Arc Testnet Setup in MetaMask

1. Open MetaMask → **Settings** → **Networks** → **Add a network** → **Add a network manually**
2. Fill in:

| Field | Value |
|-------|-------|
| Network Name | Arc Testnet |
| New RPC URL | `https://rpc.testnet.arc.network` |
| Chain ID | `5042002` |
| Currency Symbol | `USDC` |
| Block Explorer URL | `https://testnet.arcscan.app` |

3. Click **Save**, then switch to **Arc Testnet**.

> **Note:** Gas on Arc is paid in USDC (18-decimal native token). The ERC-20 USDC used for payments has 6 decimals. These are two different representations — the smart contract handles only the 6-decimal ERC-20 USDC.

---

## 3. Getting Testnet USDC

1. Visit **https://faucet.circle.com**
2. Select **Arc Testnet** from the network dropdown
3. Paste your wallet address
4. Request testnet USDC — you'll receive both native-gas USDC and ERC-20 USDC

You need at minimum:
- **~5 USDC** for gas (native, 18-dec) to deploy contracts and run transactions
- **Any amount** of ERC-20 USDC (6-dec) to create test payment links

---

## 4. Smart Contract Deployment

### 4.1 Install Foundry dependencies

```bash
cd contracts

# Install OpenZeppelin v5 and forge-std
forge install OpenZeppelin/openzeppelin-contracts@v5.1.0 
forge install foundry-rs/forge-std 

# Verify it builds cleanly
forge build
```

### 4.2 Run tests before deploying

```bash
# Run all tests (includes fuzz tests)
forge test -vv

# Run with gas report
forge test --gas-report

# Run with higher fuzz iterations (CI mode)
forge test -vv --profile ci
```

All tests must pass before proceeding.

### 4.3 Set environment variables

**Never hardcode private keys.** Use environment variables:

```bash
export DEPLOYER_PRIVATE_KEY="0xyour_private_key_here"
export USDC_ADDRESS="0x3600000000000000000000000000000000000000"
```

Or create a `.env` file in `contracts/` (add to `.gitignore`!):
```
DEPLOYER_PRIVATE_KEY=0xyour_private_key_here
USDC_ADDRESS=0x3600000000000000000000000000000000000000
```

Then load it: `source .env`

> **CRITICAL:** Never commit `.env` or any file containing your private key to git.

### 4.4 Deploy to Arc Testnet

```bash
forge script script/DeployLinkPay.s.sol \
  --rpc-url https://rpc.testnet.arc.network \
  --broadcast \
  -vvvv
```

The script will print the deployed contract address. **Save this address.**

### 4.5 Verify contract source on ArcScan

```bash
forge verify-contract \
  <DEPLOYED_CONTRACT_ADDRESS> \
  src/LinkPay.sol:LinkPay \
  --verifier-url https://testnet.arcscan.app/api \
  --chain-id 5042002 \
  --constructor-args $(cast abi-encode "constructor(address)" 0x3600000000000000000000000000000000000000)
```

After verification, your contract source will be visible at:
`https://testnet.arcscan.app/address/<CONTRACT_ADDRESS>`

---

## 5. Backend Configuration & Setup

### 5.1 Install dependencies

```bash
cd backend
npm install
```

### 5.2 Configure environment variables

```bash
cp .env.example .env
```

Edit `.env`:

```env
NODE_ENV=development
PORT=4000

# Comma-separated allowed origins (your frontend URL)
CORS_ORIGINS=http://localhost:5173

# SQLite database path
DATABASE_PATH=./data/radiuspay.db

# Arc testnet RPC
ARC_RPC_URL=https://rpc.testnet.arc.network
ARC_CHAIN_ID=5042002

# USDC ERC-20 on Arc testnet (6 decimals)
USDC_CONTRACT_ADDRESS=0x3600000000000000000000000000000000000000

# Your deployed LinkPay contract address (from Step 4.4)
LINKPAY_CONTRACT_ADDRESS=0xYOUR_DEPLOYED_CONTRACT_ADDRESS

# Rate limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=60
VERIFY_RATE_LIMIT_WINDOW_MS=60000
VERIFY_RATE_LIMIT_MAX_REQUESTS=10

# Logging
LOG_LEVEL=info

# Frontend URL (for CORS and link building)
FRONTEND_URL=http://localhost:5173
```

### 5.3 Initialize the database

The database is auto-created on first run. To initialize manually:

```bash
node -e "require('./src/models/db').initDb()"
```

### 5.4 Run backend tests

```bash
npm test
```

### 5.5 Start the backend

```bash
# Development (auto-reload)
npm run dev

# Production
npm start
```

The API will be available at `http://localhost:4000`.

Health check: `curl http://localhost:4000/health`

---

## 6. Frontend Configuration

> The frontend is already built. This section covers environment variable setup only.

### 6.1 Create frontend `.env`

In your `frontend/` directory, create `.env.local`:

```env
VITE_API_URL=http://localhost:4000
VITE_LINKPAY_CONTRACT_ADDRESS=0xYOUR_DEPLOYED_CONTRACT_ADDRESS
VITE_USDC_CONTRACT_ADDRESS=0x3600000000000000000000000000000000000000
VITE_ARC_CHAIN_ID=5042002
VITE_ARC_RPC_URL=https://rpc.testnet.arc.network
```

### 6.2 Arc Chain configuration for Wagmi/Viem

In your frontend `wagmi.config.ts` or chain definition file, add the Arc testnet:

```typescript
import { defineChain } from 'viem'

export const arcTestnet = defineChain({
  id: 5042002,
  name: 'Arc Testnet',
  nativeCurrency: {
    name: 'USDC',
    symbol: 'USDC',
    decimals: 18,           // native gas token is 18-decimal
  },
  rpcUrls: {
    default: { http: ['https://rpc.testnet.arc.network'] },
  },
  blockExplorers: {
    default: {
      name: 'ArcScan',
      url: 'https://testnet.arcscan.app',
    },
  },
  testnet: true,
})
```

### 6.3 USDC decimal handling

| Context | Decimals | Address |
|---------|----------|---------|
| Native gas token (MetaMask balance) | 18 | N/A |
| ERC-20 USDC (transfers, allowances) | **6** | `0x3600000000000000000000000000000000000000` |

When reading the ERC-20 balance:
```typescript
// 6 decimals — divide raw by 1e6 for display
const humanAmount = Number(rawAmount) / 1_000_000
```

When sending to the contract:
```typescript
// User inputs "10.5 USDC" → send 10_500_000 to contract
const rawAmount = parseUnits(userInput, 6)  // viem parseUnits
```

---

## 7. Running the Full Stack

Open three terminals:

**Terminal 1 — Backend:**
```bash
cd backend && npm run dev
```

**Terminal 2 — Frontend:**
```bash
cd frontend && npm run dev
```

**Terminal 3 — (optional) Foundry local node for development:**
```bash
# If you want a local test node instead of hitting Arc testnet
anvil --chain-id 5042002
```

Navigate to `http://localhost:5173` in your browser.

---

## 8. Troubleshooting

### "Transaction reverted: insufficient allowance"
**Cause:** You must call `USDC.approve(linkPayAddress, amount)` before `createClaim()`.
**Fix:** The frontend should send the approval tx first and wait for confirmation, then call `createClaim`.

### "ClaimAlreadyExists" error
**Cause:** The same secret was used twice, generating the same `claimId`.
**Fix:** Always generate a new 32-byte random secret using `crypto.getRandomValues()`. Never reuse secrets.

### USDC decimal mismatch (wrong amounts)
**Cause:** Mixing 18-decimal native USDC with 6-decimal ERC-20 USDC.
**Fix:** Always use `parseUnits(amount, 6)` for ERC-20 USDC amounts going into the contract. The native gas balance shown in MetaMask uses 18 decimals but is irrelevant to contract interactions.

### "Gas estimation failed"
**Cause:** Usually means the transaction would revert (insufficient allowance, wrong parameters).
**Fix:** Check that the USDC approval has been submitted and confirmed first.

### Backend "LINKPAY_CONTRACT_ADDRESS not set or is zero"
**Fix:** Deploy the contract first (Step 4), then update `backend/.env` with the deployed address.

### MetaMask shows wrong USDC balance
**Cause:** MetaMask may be showing native gas USDC (18 dec), not ERC-20 USDC.
**Fix:** Add the ERC-20 USDC token manually in MetaMask:
- Token contract: `0x3600000000000000000000000000000000000000`
- Symbol: `USDC`
- Decimals: `6`

### "CORS error" in browser console
**Fix:** Ensure `CORS_ORIGINS` in `backend/.env` includes your frontend URL exactly (including port).

### Foundry: "forge: command not found"
**Fix:** Run `foundryup` and follow the output instructions to add Foundry to your PATH.

### SQLite "database is locked"
**Fix:** Only one process should access the SQLite file at a time. In production, consider upgrading to PostgreSQL by replacing `better-sqlite3` with `pg`.

---

## 9. Security Reminders for Production

### Private Keys
- **Never** commit private keys, `.env` files, or mnemonics to git
- Use a hardware wallet (Ledger/Trezor) for mainnet deployments
- For CI/CD deployments, use secrets management (AWS Secrets Manager, HashiCorp Vault)

### Smart Contract
- Re-audit the contract before mainnet deployment
- Consider a professional audit from a reputable firm
- Enable `Pausable` and test the pause/unpause flow
- Set up a multi-sig wallet as the contract owner

### Backend
- Replace SQLite with PostgreSQL for production scale
- Add authentication if you expose private endpoints
- Set up TLS/HTTPS (use nginx reverse proxy + Let's Encrypt)
- Configure proper log rotation and monitoring
- Set `NODE_ENV=production` in all production deployments

### Frontend
- Set a strict Content Security Policy header
- Never store secrets or private keys in localStorage
- Implement wallet disconnect timeout (clear session after inactivity)
- Sanitize all user inputs before display

### Claim Links
- The claim link contains the raw secret — it is the bearer credential
- Anyone with the link can claim the funds
- Share claim links only through private, encrypted channels
- Do not share claim links publicly
- Links auto-expire (default 7 days) — expired unclaimed funds can be reclaimed by the creator

### Infrastructure
- Use HTTPS everywhere in production
- Set up DDoS protection (Cloudflare or similar)
- Monitor the contract for unusual claim patterns
- Set up alerts for the `Pausable` circuit breaker
