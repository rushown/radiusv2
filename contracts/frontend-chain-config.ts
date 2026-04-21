// frontend/src/config/chain.ts
// ─────────────────────────────────────────────────────────────────────────────
// Arc Testnet chain definition for Wagmi v2 / Viem
// Copy this file into your existing frontend/src/config/ directory
// ─────────────────────────────────────────────────────────────────────────────

import { defineChain } from "viem";
import { http, createConfig } from "wagmi";
import { metaMask, injected } from "wagmi/connectors";

// ─── Arc Testnet Chain ────────────────────────────────────────────────────────
export const arcTestnet = defineChain({
  id: 5042002,
  name: "Arc Testnet",
  nativeCurrency: {
    name: "USDC",
    symbol: "USDC",
    decimals: 18, // native gas token is 18-decimal
  },
  rpcUrls: {
    default: { http: ["https://rpc.testnet.arc.network"] },
  },
  blockExplorers: {
    default: {
      name: "ArcScan",
      url: "https://testnet.arcscan.app",
    },
  },
  testnet: true,
});

// ─── Contract Addresses ───────────────────────────────────────────────────────
export const CONTRACTS = {
  // ERC-20 USDC on Arc testnet — 6 DECIMALS (not 18)
  USDC: (import.meta.env.VITE_USDC_CONTRACT_ADDRESS ||
    "0x3600000000000000000000000000000000000000") as `0x${string}`,

  // Your deployed LinkPay contract
  LINK_PAY: (import.meta.env.VITE_LINKPAY_CONTRACT_ADDRESS ||
    "0x0000000000000000000000000000000000000000") as `0x${string}`,
} as const;

export const USDC_DECIMALS = 6; // ERC-20 USDC always 6 decimals

// ─── Wagmi Config ─────────────────────────────────────────────────────────────
export const wagmiConfig = createConfig({
  chains: [arcTestnet],
  connectors: [metaMask(), injected()],
  transports: {
    [arcTestnet.id]: http("https://rpc.testnet.arc.network"),
  },
});

// ─── ERC-20 USDC minimal ABI ──────────────────────────────────────────────────
export const ERC20_ABI = [
  {
    type: "function",
    name: "balanceOf",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "allowance",
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
    ],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "approve",
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "decimals",
    inputs: [],
    outputs: [{ name: "", type: "uint8" }],
    stateMutability: "view",
  },
] as const;

// ─── LinkPay ABI (core functions only) ───────────────────────────────────────
// Full ABI is in contracts/LinkPay.abi.json
export const LINK_PAY_ABI = [
  {
    type: "function",
    name: "createClaim",
    inputs: [
      { name: "claimId",          type: "bytes32" },
      { name: "amount",           type: "uint256" },
      { name: "expiryTimestamp",  type: "uint256" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "claim",
    inputs: [
      { name: "claimId", type: "bytes32" },
      { name: "secret",  type: "bytes32" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "reclaim",
    inputs: [{ name: "claimId", type: "bytes32" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "getClaim",
    inputs: [{ name: "claimId", type: "bytes32" }],
    outputs: [
      { name: "creator",   type: "address" },
      { name: "amount",    type: "uint256" },
      { name: "expiresAt", type: "uint256" },
      { name: "claimed",   type: "bool"    },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "isClaimable",
    inputs: [{ name: "claimId", type: "bytes32" }],
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getCreatorClaims",
    inputs: [{ name: "creator", type: "address" }],
    outputs: [{ name: "", type: "bytes32[]" }],
    stateMutability: "view",
  },
  {
    type: "event",
    name: "ClaimCreated",
    inputs: [
      { name: "claimId",   type: "bytes32", indexed: true  },
      { name: "creator",   type: "address", indexed: true  },
      { name: "amount",    type: "uint256", indexed: false },
      { name: "expiresAt", type: "uint256", indexed: false },
    ],
  },
  {
    type: "event",
    name: "ClaimClaimed",
    inputs: [
      { name: "claimId",   type: "bytes32", indexed: true  },
      { name: "recipient", type: "address", indexed: true  },
      { name: "amount",    type: "uint256", indexed: false },
    ],
  },
  {
    type: "event",
    name: "ClaimReclaimed",
    inputs: [
      { name: "claimId", type: "bytes32", indexed: true  },
      { name: "creator", type: "address", indexed: true  },
      { name: "amount",  type: "uint256", indexed: false },
    ],
  },
] as const;

// ─── Utility: generate a cryptographically secure claim secret ────────────────
/**
 * Generates a 32-byte random secret using the browser CSPRNG.
 * Returns a 0x-prefixed hex string.
 * NEVER store this value. It belongs only in the claim URL.
 */
export function generateSecret(): `0x${string}` {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return ("0x" + Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("")) as `0x${string}`;
}

/**
 * Compute claimId = keccak256(abi.encodePacked(secret))
 * Uses viem's keccak256 + encodePacked.
 */
export async function computeClaimId(secret: `0x${string}`): Promise<`0x${string}`> {
  const { keccak256, encodePacked } = await import("viem");
  return keccak256(encodePacked(["bytes32"], [secret]));
}

/**
 * Format USDC amount for display (6 decimals → human readable).
 */
export function formatUsdc(raw: bigint): string {
  const whole     = raw / 1_000_000n;
  const remainder = raw % 1_000_000n;
  if (remainder === 0n) return whole.toString();
  return `${whole}.${remainder.toString().padStart(6, "0").replace(/0+$/, "")}`;
}

/**
 * Parse a human USDC string to raw bigint (6 decimals).
 * e.g. "10.5" → 10_500_000n
 */
export function parseUsdc(human: string): bigint {
  const [whole, frac = ""] = human.split(".");
  const fracPadded = frac.slice(0, 6).padEnd(6, "0");
  return BigInt(whole) * 1_000_000n + BigInt(fracPadded);
}
