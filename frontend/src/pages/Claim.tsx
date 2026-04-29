import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useAccount } from "wagmi";
import { TxStatusBar, StatusBadge, SkeletonCard } from "@/components/ui";
import { WalletConnectModal } from "@/components/WalletConnectModal";
import { useClaimFunds, useOnChainClaim } from "@/hooks/useClaim";
import { parseClaimUrl, formatUsdc, formatDate, timeUntilExpiry, truncateAddress } from "@/utils/crypto";
import { api } from "@/utils/api";
import type { ClaimRecord } from "@/utils/api";

export default function Claim() {
  const { claimId: rawId, secret: rawSecret } = useParams<{ claimId: string; secret: string }>();
  const { address, isConnected } = useAccount();
  const [connectOpen, setConnectOpen] = useState(false);
  const { claimFunds, status, error: txError, txHash } = useClaimFunds();

  const [parsed, setParsed] = useState<{ claimId: `0x${string}`; secret: `0x${string}` } | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [backendRecord, setBackendRecord] = useState<ClaimRecord | null>(null);
  const [fetchingBackend, setFetchingBackend] = useState(false);

  useEffect(() => {
    if (!rawId || !rawSecret) { setParseError("Missing claim ID or secret."); return; }
    const r = parseClaimUrl(rawId, rawSecret);
    if (!r) { setParseError("Invalid or tampered link — the secret doesn't match the claim ID."); return; }
    setParsed(r);
  }, [rawId, rawSecret]);

  const { claim: onChain, isLoading: loadingChain, refetch } = useOnChainClaim(parsed?.claimId);

  useEffect(() => {
    if (!parsed?.claimId) return;
    setFetchingBackend(true);
    api.getClaim(parsed.claimId).then(r => setBackendRecord(r)).catch(() => {}).finally(() => setFetchingBackend(false));
  }, [parsed?.claimId]);

  const handleClaim = async () => {
    if (!parsed || !address) return;
    try {
      const hash = await claimFunds(parsed.claimId, parsed.secret);
      try { await api.markClaimed(parsed.claimId, address, hash); } catch { /* non-fatal */ }
      refetch();
    } catch { /* shown in TxStatusBar */ }
  };

  // ── States ──
  if (parseError) return (
    <main className="page-wrapper min-h-screen pt-28 px-4 flex items-center justify-center">
      <div className="card max-w-md w-full p-10 text-center" style={{ animation: "scaleIn 0.4s ease forwards" }}>
        <div className="w-14 h-14 rounded-2xl bg-ember-600/15 border border-ember-600/25 flex items-center justify-center text-2xl mx-auto mb-5">⛔</div>
        <h1 className="font-display text-xl font-bold text-ember-400 mb-2">Invalid Claim Link</h1>
        <p className="font-body text-sm text-choc-400 leading-relaxed">{parseError}</p>
      </div>
    </main>
  );

  if (!parsed || loadingChain || fetchingBackend) return (
    <main className="page-wrapper min-h-screen pt-28 px-4">
      <div className="max-w-lg mx-auto pt-8">
        <div className="h-6 w-32 skeleton mb-4 rounded-full" aria-hidden="true"/>
        <div className="h-9 w-64 skeleton mb-8 rounded-xl" aria-hidden="true"/>
        <SkeletonCard/>
        <div className="mt-5 h-12 skeleton rounded-xl" aria-hidden="true"/>
      </div>
    </main>
  );

  if (onChain && !onChain.exists) return (
    <main className="page-wrapper min-h-screen pt-28 px-4 flex items-center justify-center">
      <div className="card max-w-md w-full p-10 text-center">
        <div className="w-14 h-14 rounded-2xl bg-choc-750 border border-choc-700/40 flex items-center justify-center text-2xl mx-auto mb-5">🔍</div>
        <h1 className="font-display text-xl font-bold text-choc-50 mb-2">Claim Not Found</h1>
        <p className="font-body text-sm text-choc-400 leading-relaxed">This claim doesn't exist on-chain. It may have been reclaimed or the link is invalid.</p>
      </div>
    </main>
  );

  const isClaimed = onChain?.claimed ?? false;
  const expiryTs = Number(onChain?.expiryTimestamp ?? 0);
  const isExpiredNow = expiryTs > 0 && Date.now() / 1000 > expiryTs;
  const amount = onChain?.amount;
  const creator = onChain?.creator;
  const claimedBy = onChain?.claimedBy;
  const canClaim = isConnected && !isClaimed && !isExpiredNow && status !== "confirmed";
  const statusLabel = isClaimed ? "claimed" : isExpiredNow ? "expired" : "pending";

  return (
    <main className="page-wrapper min-h-screen pt-28 pb-20 px-4">
      <div className="max-w-lg mx-auto" style={{ animation: "fadeUp 0.5s cubic-bezier(0.16,1,0.3,1) forwards" }}>

        <div className="mb-8">
          <p className="section-label mb-2">Radius Pay</p>
          <h1 className="font-display text-4xl font-bold text-choc-50 leading-tight">Claim Funds</h1>
          <p className="font-body text-choc-400 mt-1.5 text-sm">Someone sent you USDC via a one-time secure link.</p>
        </div>

        {/* Main card */}
        <div className={`card p-6 sm:p-7 mb-5 ${!isClaimed && !isExpiredNow ? "card-glow" : ""}`}>
          <div className="flex items-start justify-between mb-6">
            <div>
              <p className="section-label mb-1.5">Amount</p>
              <div className="flex items-baseline gap-2">
                <span className="font-display text-5xl font-bold text-gradient-gold tabular-nums">
                  {amount !== undefined ? formatUsdc(amount) : "—"}
                </span>
                <span className="font-body text-lg text-choc-500">USDC</span>
              </div>
            </div>
            <StatusBadge status={statusLabel}/>
          </div>

          <dl className="flex flex-col gap-0 rounded-xl overflow-hidden border border-choc-700/40 divide-y divide-choc-700/40">
            {creator && (
              <div className="flex items-center justify-between px-4 py-3 bg-choc-850/40">
                <dt className="font-body text-xs text-choc-400">Sent by</dt>
                <dd className="font-mono text-xs text-choc-200">{truncateAddress(creator)}</dd>
              </div>
            )}
            {expiryTs > 0 && (
              <div className="flex items-center justify-between px-4 py-3 bg-choc-850/40">
                <dt className="font-body text-xs text-choc-400">Expiry</dt>
                <dd className={`font-body text-xs font-medium ${isExpiredNow ? "text-ember-400" : "text-gold-400"}`}>
                  {isExpiredNow ? "Expired" : timeUntilExpiry(expiryTs)}
                </dd>
              </div>
            )}
            {backendRecord?.createdAt && (
              <div className="flex items-center justify-between px-4 py-3 bg-choc-850/40">
                <dt className="font-body text-xs text-choc-400">Created</dt>
                <dd className="font-body text-xs text-choc-200">{formatDate(backendRecord.createdAt)}</dd>
              </div>
            )}
            {isClaimed && claimedBy && (
              <div className="flex items-center justify-between px-4 py-3 bg-choc-850/40">
                <dt className="font-body text-xs text-choc-400">Claimed by</dt>
                <dd className="font-mono text-xs text-jade-400">{truncateAddress(claimedBy)}</dd>
              </div>
            )}
            <div className="flex items-center justify-between px-4 py-3 bg-choc-850/40">
              <dt className="font-body text-xs text-choc-400">Claim ID</dt>
              <dd className="font-mono text-xs text-choc-500 select-all">{parsed?.claimId.slice(0, 14)}…</dd>
            </div>
          </dl>
        </div>

        {/* Already claimed */}
        {isClaimed && (
          <div className="flex items-center gap-3.5 bg-jade-500/8 border border-jade-600/25 rounded-2xl px-5 py-4">
            <div className="w-8 h-8 rounded-xl bg-jade-500/15 border border-jade-600/25 flex items-center justify-center shrink-0">
              <svg className="h-4 w-4 text-jade-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
              </svg>
            </div>
            <div>
              <p className="font-body font-semibold text-jade-300 text-sm">Funds already claimed</p>
              <p className="font-body text-xs text-jade-400/60 mt-0.5">Each link can only be claimed once.</p>
            </div>
          </div>
        )}

        {/* Expired */}
        {!isClaimed && isExpiredNow && (
          <div className="flex items-center gap-3.5 bg-ember-600/8 border border-ember-600/25 rounded-2xl px-5 py-4">
            <div className="w-8 h-8 rounded-xl bg-ember-600/15 border border-ember-600/25 flex items-center justify-center shrink-0">
              <svg className="h-4 w-4 text-ember-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/>
              </svg>
            </div>
            <div>
              <p className="font-body font-semibold text-ember-300 text-sm">This claim has expired</p>
              <p className="font-body text-xs text-ember-400/60 mt-0.5">The sender can now reclaim these funds.</p>
            </div>
          </div>
        )}

        {/* Claim action */}
        {!isClaimed && !isExpiredNow && (
          <div className="card p-6 sm:p-7 mt-5" style={{ animation: "fadeUp 0.4s ease forwards" }}>
            {!isConnected ? (
              <div className="text-center">
                <p className="font-body text-choc-300 mb-6">
                  Connect your wallet to receive{" "}
                  <strong className="text-gradient-gold">{amount !== undefined ? formatUsdc(amount) : "—"} USDC</strong>
                </p>
                <button className="btn-primary w-full px-6 py-3.5 text-sm rounded-xl" onClick={() => setConnectOpen(true)}>
                  Connect Wallet to Claim
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-3 bg-choc-900/60 border border-choc-700/40 rounded-xl px-4 py-3">
                  <span className="w-2 h-2 rounded-full bg-jade-400 shrink-0" aria-hidden="true"/>
                  <div className="min-w-0">
                    <p className="section-label mb-0.5">Receiving to</p>
                    <p className="font-mono text-xs text-choc-100 truncate">{address}</p>
                  </div>
                </div>

                <TxStatusBar status={status} txHash={txHash} error={txError}/>

                <button
                  className="btn-primary w-full px-6 py-3.5 text-sm rounded-xl disabled:opacity-40 disabled:cursor-not-allowed"
                  onClick={handleClaim}
                  disabled={!canClaim || ["creating","tx-pending"].includes(status)}
                  aria-label={`Claim ${amount !== undefined ? formatUsdc(amount) : ""} USDC`}
                >
                  {["creating","tx-pending"].includes(status) ? (
                    <><svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>Confirming…</>
                  ) : status === "confirmed" ? "✓ Claimed Successfully"
                  : `Claim ${amount !== undefined ? formatUsdc(amount) : "—"} USDC`}
                </button>

                {status === "confirmed" && txHash && (
                  <a href={`https://testnet.arcscan.app/tx/${txHash}`} target="_blank" rel="noopener noreferrer"
                    className="text-center text-xs font-body text-gold-500 hover:text-gold-400 underline"
                  >View transaction on ArcScan ↗</a>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <WalletConnectModal open={connectOpen} onClose={() => setConnectOpen(false)}/>
    </main>
  );
}
