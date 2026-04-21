import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useAccount, useConnect } from "wagmi";
import { Button, Card, Spinner, TxStatusBar, StatusBadge } from "@/components/ui";
import { useClaimFunds, useOnChainClaim } from "@/hooks/useClaim";
import { parseClaimUrl, formatUsdc, formatDate, timeUntilExpiry, truncateAddress } from "@/utils/crypto";
import { api } from "@/utils/api";
import type { ClaimRecord } from "@/utils/api";

export default function Claim() {
  const { claimId: rawClaimId, secret: rawSecret } = useParams<{
    claimId: string;
    secret: string;
  }>();

  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { claimFunds, status, error: txError, txHash, reset } = useClaimFunds();

  const [parsed, setParsed] = useState<{
    claimId: `0x${string}`;
    secret: `0x${string}`;
  } | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [backendRecord, setBackendRecord] = useState<ClaimRecord | null>(null);
  const [fetchingBackend, setFetchingBackend] = useState(false);

  // Parse URL params
  useEffect(() => {
    if (!rawClaimId || !rawSecret) {
      setParseError("Missing claim ID or secret in URL.");
      return;
    }
    const result = parseClaimUrl(rawClaimId, rawSecret);
    if (!result) {
      setParseError(
        "Invalid or tampered claim link. The secret does not match the claim ID."
      );
      return;
    }
    setParsed(result);
  }, [rawClaimId, rawSecret]);

  // Read on-chain claim state
  const { claim: onChainClaim, isLoading: loadingChain, refetch } =
    useOnChainClaim(parsed?.claimId);

  // Fetch backend metadata
  useEffect(() => {
    if (!parsed?.claimId) return;
    setFetchingBackend(true);
    api
      .getClaim(parsed.claimId)
      .then((r) => setBackendRecord(r))
      .catch(() => {/* non-fatal */})
      .finally(() => setFetchingBackend(false));
  }, [parsed?.claimId]);

  const handleClaim = async () => {
    if (!parsed || !address) return;
    try {
      const hash = await claimFunds(parsed.claimId, parsed.secret);
      // Mark as claimed in backend
      try {
        await api.markClaimed(parsed.claimId, address, hash);
      } catch {/* non-fatal */}
      refetch();
    } catch {
      // error shown via TxStatusBar
    }
  };

  // ── Error state ──
  if (parseError) {
    return (
      <main className="min-h-screen pt-28 px-4 flex items-center justify-center">
        <Card className="max-w-md w-full p-8 text-center">
          <div className="text-4xl mb-4" aria-hidden="true">⛔</div>
          <h1 className="font-display text-xl font-bold text-red-400 mb-2">
            Invalid Claim Link
          </h1>
          <p className="font-body text-sm text-chocolate-400">{parseError}</p>
        </Card>
      </main>
    );
  }

  // ── Loading state ──
  if (!parsed || loadingChain || fetchingBackend) {
    return (
      <main className="min-h-screen pt-28 px-4 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Spinner size="lg" />
          <p className="font-body text-chocolate-400">Loading claim details…</p>
        </div>
      </main>
    );
  }

  // ── Claim not found on-chain ──
  if (onChainClaim && !onChainClaim.exists) {
    return (
      <main className="min-h-screen pt-28 px-4 flex items-center justify-center">
        <Card className="max-w-md w-full p-8 text-center">
          <div className="text-4xl mb-4" aria-hidden="true">🔍</div>
          <h1 className="font-display text-xl font-bold text-chocolate-50 mb-2">
            Claim Not Found
          </h1>
          <p className="font-body text-sm text-chocolate-400">
            This claim doesn't exist on-chain. It may have been reclaimed by the
            creator or the link is invalid.
          </p>
        </Card>
      </main>
    );
  }

  const isClaimed = onChainClaim?.claimed ?? false;
  const expiryTs = Number(onChainClaim?.expiryTimestamp ?? 0);
  const isExpiredNow = expiryTs > 0 && Date.now() / 1000 > expiryTs;
  const amount = onChainClaim?.amount;
  const creator = onChainClaim?.creator;
  const claimedBy = onChainClaim?.claimedBy;

  const canClaim =
    isConnected &&
    !isClaimed &&
    !isExpiredNow &&
    status !== "confirmed";

  const statusLabel = isClaimed
    ? "claimed"
    : isExpiredNow
    ? "expired"
    : "pending";

  return (
    <main className="min-h-screen pt-28 pb-16 px-4">
      <div className="max-w-lg mx-auto animate-fade-in">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold text-chocolate-50 mb-2">
            Claim Funds
          </h1>
          <p className="font-body text-chocolate-400 text-sm">
            Someone sent you USDC via a one-time claim link.
          </p>
        </div>

        {/* Claim Details Card */}
        <Card className="p-6 mb-5" glow={!isClaimed && !isExpiredNow}>
          <div className="flex items-start justify-between mb-5">
            <div>
              <p className="font-body text-xs text-chocolate-400 uppercase tracking-wide mb-1">
                Amount available
              </p>
              <p className="font-display text-4xl font-bold text-gold-400">
                {amount !== undefined ? formatUsdc(amount) : "—"}
                <span className="text-lg text-chocolate-400 ml-1.5">USDC</span>
              </p>
            </div>
            <StatusBadge status={statusLabel} />
          </div>

          <dl className="flex flex-col gap-2.5 border-t border-chocolate-600/40 pt-4">
            {creator && (
              <div className="flex items-center justify-between">
                <dt className="font-body text-sm text-chocolate-400">Sent by</dt>
                <dd className="font-mono text-sm text-chocolate-200">
                  {truncateAddress(creator)}
                </dd>
              </div>
            )}
            {expiryTs > 0 && (
              <div className="flex items-center justify-between">
                <dt className="font-body text-sm text-chocolate-400">Expires</dt>
                <dd className="font-body text-sm text-chocolate-200">
                  {isExpiredNow ? (
                    <span className="text-red-400">Expired</span>
                  ) : (
                    <span className="text-gold-400">{timeUntilExpiry(expiryTs)}</span>
                  )}
                </dd>
              </div>
            )}
            {backendRecord?.createdAt && (
              <div className="flex items-center justify-between">
                <dt className="font-body text-sm text-chocolate-400">Created</dt>
                <dd className="font-body text-sm text-chocolate-200">
                  {formatDate(backendRecord.createdAt)}
                </dd>
              </div>
            )}
            {isClaimed && claimedBy && (
              <div className="flex items-center justify-between">
                <dt className="font-body text-sm text-chocolate-400">Claimed by</dt>
                <dd className="font-mono text-sm text-green-400">
                  {truncateAddress(claimedBy)}
                </dd>
              </div>
            )}
            <div className="flex items-center justify-between">
              <dt className="font-body text-sm text-chocolate-400">Claim ID</dt>
              <dd className="font-mono text-xs text-chocolate-400">
                {parsed.claimId.slice(0, 12)}…
              </dd>
            </div>
          </dl>
        </Card>

        {/* Already claimed */}
        {isClaimed && (
          <Card className="p-5 bg-green-900/10 border-green-800/30">
            <div className="flex items-center gap-3">
              <svg className="h-5 w-5 text-green-400 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <div>
                <p className="font-body font-medium text-green-300">
                  Funds already claimed
                </p>
                <p className="font-body text-xs text-green-400/70 mt-0.5">
                  This link has been used. Each link can only be claimed once.
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Expired */}
        {!isClaimed && isExpiredNow && (
          <Card className="p-5 bg-red-900/10 border-red-800/30">
            <div className="flex items-center gap-3">
              <svg className="h-5 w-5 text-red-400 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <div>
                <p className="font-body font-medium text-red-300">
                  This claim has expired
                </p>
                <p className="font-body text-xs text-red-400/70 mt-0.5">
                  The sender can now reclaim these funds.
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Claim action */}
        {!isClaimed && !isExpiredNow && (
          <Card className="p-6 animate-slide-up">
            {!isConnected ? (
              <div className="text-center">
                <p className="font-body text-chocolate-300 mb-4 text-sm">
                  Connect your wallet to receive{" "}
                  <strong className="text-gold-400">
                    {amount !== undefined ? formatUsdc(amount) : "—"} USDC
                  </strong>
                </p>
                <Button
                  variant="primary"
                  size="lg"
                  className="w-full"
                  onClick={() => connect({ connector: connectors[0] })}
                  aria-label="Connect wallet to claim funds"
                >
                  Connect Wallet to Claim
                </Button>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <div className="bg-chocolate-800/60 rounded-lg px-4 py-3 flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-green-400" aria-hidden="true" />
                  <div>
                    <p className="font-body text-xs text-chocolate-400">Receiving to</p>
                    <p className="font-mono text-sm text-chocolate-100">{address}</p>
                  </div>
                </div>

                <TxStatusBar status={status} txHash={txHash} error={txError} />

                <Button
                  variant="primary"
                  size="lg"
                  className="w-full"
                  onClick={handleClaim}
                  loading={
                    status === "creating" || status === "tx-pending"
                  }
                  disabled={!canClaim}
                  aria-label={`Claim ${amount !== undefined ? formatUsdc(amount) : ""} USDC`}
                >
                  {status === "confirmed"
                    ? "✓ Claimed Successfully"
                    : `Claim ${amount !== undefined ? formatUsdc(amount) : "—"} USDC`}
                </Button>

                {status === "confirmed" && txHash && (
                  <a
                    href={`https://testnet.arcscan.app/tx/${txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-center text-sm font-body text-gold-500 hover:text-gold-400 underline"
                  >
                    View transaction on ArcScan ↗
                  </a>
                )}
              </div>
            )}
          </Card>
        )}
      </div>
    </main>
  );
}
