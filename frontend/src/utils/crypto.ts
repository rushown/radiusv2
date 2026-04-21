import { keccak256, toBytes, bytesToHex, hexToBytes } from "viem";

/**
 * Generates a cryptographically secure 32-byte secret.
 * NEVER stored anywhere – only embedded in the claim link.
 */
export function generateSecret(): `0x${string}` {
  const bytes = new Uint8Array(32);
  window.crypto.getRandomValues(bytes);
  return bytesToHex(bytes) as `0x${string}`;
}

/**
 * Derives the claimId (bytes32) from the secret via keccak256.
 * This is what gets stored on-chain and in the backend (not the secret).
 */
export function deriveClaimId(secret: `0x${string}`): `0x${string}` {
  return keccak256(hexToBytes(secret));
}

/**
 * Builds the full claim URL.
 * Format: https://app.com/claim/{claimId}/{secret}
 * Both claimId and secret are hex strings.
 */
export function buildClaimUrl(
  claimId: `0x${string}`,
  secret: `0x${string}`
): string {
  const base = window.location.origin;
  return `${base}/claim/${claimId}/${secret}`;
}

/**
 * Parses claimId and secret from the claim URL path params.
 * Returns null if either is invalid.
 */
export function parseClaimUrl(
  claimId: string,
  secret: string
): { claimId: `0x${string}`; secret: `0x${string}` } | null {
  const hexPattern = /^0x[0-9a-fA-F]{64}$/;
  if (!hexPattern.test(claimId) || !hexPattern.test(secret)) return null;

  // Verify the secret hashes to the claimId
  const derived = keccak256(hexToBytes(secret as `0x${string}`));
  if (derived.toLowerCase() !== claimId.toLowerCase()) return null;

  return {
    claimId: claimId as `0x${string}`,
    secret: secret as `0x${string}`,
  };
}

/**
 * Copies text to clipboard. Returns true on success.
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback for older browsers
    const el = document.createElement("textarea");
    el.value = text;
    el.style.position = "fixed";
    el.style.opacity = "0";
    document.body.appendChild(el);
    el.focus();
    el.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(el);
    return ok;
  }
}

/**
 * Truncates a hex address for display.
 */
export function truncateAddress(addr: string, chars = 6): string {
  if (!addr || addr.length < 10) return addr;
  return `${addr.slice(0, chars + 2)}…${addr.slice(-chars)}`;
}

/**
 * Convert USDC amount (6 decimals) to human-readable string.
 */
export function formatUsdc(amount: bigint): string {
  const divisor = BigInt(1_000_000); // 10^6
  const whole = amount / divisor;
  const frac = amount % divisor;
  const fracStr = frac.toString().padStart(6, "0").replace(/0+$/, "");
  return fracStr ? `${whole}.${fracStr}` : `${whole}`;
}

/**
 * Parse human-readable USDC string to bigint (6 decimals).
 */
export function parseUsdc(amount: string): bigint {
  const [whole, frac = ""] = amount.split(".");
  const fracPadded = frac.slice(0, 6).padEnd(6, "0");
  return BigInt(whole || "0") * BigInt(1_000_000) + BigInt(fracPadded || "0");
}

/**
 * Format a timestamp to a localized date string.
 */
export function formatDate(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Returns whether a claim has expired given its expiry timestamp (unix seconds).
 */
export function isExpired(expiryTimestamp: number): boolean {
  return Date.now() / 1000 > expiryTimestamp;
}

/**
 * Returns a human-readable countdown string.
 */
export function timeUntilExpiry(expiryTimestamp: number): string {
  const diff = expiryTimestamp - Math.floor(Date.now() / 1000);
  if (diff <= 0) return "Expired";
  const days = Math.floor(diff / 86400);
  const hours = Math.floor((diff % 86400) / 3600);
  const mins = Math.floor((diff % 3600) / 60);
  if (days > 0) return `${days}d ${hours}h remaining`;
  if (hours > 0) return `${hours}h ${mins}m remaining`;
  return `${mins}m remaining`;
}

export { keccak256, toBytes };
