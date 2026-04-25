import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { Link } from "react-router-dom";
import { Button, StatusBadge, SkeletonDashboardStats, Skeleton } from "@/components/ui";
import { WalletConnectModal } from "@/components/WalletConnectModal";
import { useReclaimFunds } from "@/hooks/useClaim";
import { useUsdcBalance } from "@/hooks/useUsdcBalance";
import { api } from "@/utils/api";
import type { ClaimRecord } from "@/utils/api";
import { formatDate, timeUntilExpiry, truncateAddress } from "@/utils/crypto";

type Tab = "sent" | "received";

function ClaimRow({ record, onReclaim, reclaimingId }: {
  record: ClaimRecord;
  onReclaim?: (id: string) => void;
  reclaimingId?: string;
}) {
  const canReclaim = record.status === "pending" && record.expiresAt < Math.floor(Date.now() / 1000) && onReclaim;
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3 py-4 border-b border-choc-700/30 last:border-0 group">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2.5 mb-1">
          <span className="font-display font-semibold text-choc-50 text-lg">{record.amount} <span className="text-choc-500 text-sm font-body font-normal">USDC</span></span>
          <StatusBadge status={record.status}/>
        </div>
        <div className="flex flex-wrap gap-x-3 gap-y-0.5">
          <span className="font-body text-xs text-choc-500">{formatDate(record.createdAt)}</span>
          {record.status === "pending" && record.expiresAt && (
            <span className="font-body text-xs text-gold-600">{timeUntilExpiry(record.expiresAt)}</span>
          )}
          {record.claimedBy && (
            <span className="font-body text-xs text-choc-500">→ <span className="font-mono">{truncateAddress(record.claimedBy)}</span></span>
          )}
        </div>
        <p className="font-mono text-[10px] text-choc-700 mt-1 select-all">{record.claimId.slice(0, 20)}…</p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {canReclaim && (
          <Button variant="ghost" size="sm" className="rounded-xl"
            loading={reclaimingId === record.claimId}
            onClick={() => onReclaim(record.claimId)}
          >Reclaim</Button>
        )}
        <a href="https://testnet.arcscan.app" target="_blank" rel="noopener noreferrer"
          className="px-3 py-1.5 text-xs font-body text-choc-500 hover:text-choc-300 border border-choc-700/50 hover:border-choc-600 rounded-xl transition-colors"
        >Explorer ↗</a>
      </div>
    </div>
  );
}

function EmptyState({ tab }: { tab: Tab }) {
  return (
    <div className="py-16 text-center">
      <div className="w-12 h-12 rounded-2xl bg-choc-750 border border-choc-700/40 flex items-center justify-center text-xl mx-auto mb-4" aria-hidden="true">
        {tab === "sent" ? "📤" : "📥"}
      </div>
      <p className="font-body text-sm text-choc-400 mb-4">
        {tab === "sent" ? "No claim links created yet." : "No claims received yet."}
      </p>
      {tab === "sent" && (
        <Link to="/create">
          <Button variant="ghost" size="sm" className="rounded-xl">Create your first link →</Button>
        </Link>
      )}
    </div>
  );
}

export default function Dashboard() {
  const { address, isConnected } = useAccount();
  const { formatted: balanceFormatted } = useUsdcBalance(address);
  const [connectOpen, setConnectOpen] = useState(false);
  const [tab, setTab] = useState<Tab>("sent");
  const [claims, setClaims] = useState<ClaimRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [reclaimingId, setReclaimingId] = useState<string>();
  const { reclaim } = useReclaimFunds();

  useEffect(() => {
    if (!address) return;
    setLoading(true);
    api.getUserClaims(address).then(setClaims).catch(() => setClaims([])).finally(() => setLoading(false));
  }, [address]);

  const sentClaims = claims.filter(c => c.creatorAddress.toLowerCase() === address?.toLowerCase());
  const receivedClaims = claims.filter(c => c.claimedBy?.toLowerCase() === address?.toLowerCase());
  const totalSent = sentClaims.reduce((s, c) => s + parseFloat(c.amount), 0);
  const totalReceived = receivedClaims.reduce((s, c) => s + parseFloat(c.amount), 0);
  const pendingCount = sentClaims.filter(c => c.status === "pending").length;

  const handleReclaim = async (claimId: string) => {
    setReclaimingId(claimId);
    try {
      await reclaim(claimId as `0x${string}`);
      const data = await api.getUserClaims(address!);
      setClaims(data);
    } catch { /* shown via hook */ }
    finally { setReclaimingId(undefined); }
  };

  if (!isConnected) return (
    <main className="page-wrapper min-h-screen pt-28 px-4 flex items-center justify-center">
      <div className="card max-w-md w-full p-10 text-center" style={{ animation: "scaleIn 0.4s ease forwards" }}>
        <div className="w-14 h-14 rounded-2xl bg-choc-750 border border-choc-700/40 flex items-center justify-center text-2xl mx-auto mb-5" aria-hidden="true">📊</div>
        <h1 className="font-display text-2xl font-bold text-choc-50 mb-3">Your Dashboard</h1>
        <p className="font-body text-sm text-choc-400 mb-8 leading-relaxed">Connect your wallet to view sent and received claims.</p>
        <Button variant="primary" size="lg" className="w-full rounded-xl" onClick={() => setConnectOpen(true)}>Connect Wallet</Button>
      </div>
      <WalletConnectModal open={connectOpen} onClose={() => setConnectOpen(false)}/>
    </main>
  );

  return (
    <main className="page-wrapper min-h-screen pt-28 pb-20 px-4">
      <div className="max-w-3xl mx-auto" style={{ animation: "fadeUp 0.5s cubic-bezier(0.16,1,0.3,1) forwards" }}>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10">
          <div>
            <p className="section-label mb-2">Radius Pay</p>
            <h1 className="font-display text-4xl font-bold text-choc-50 leading-tight">Dashboard</h1>
            <p className="font-mono text-xs text-choc-600 mt-1.5">{truncateAddress(address || "", 10)}</p>
          </div>
          <Link to="/create">
            <Button variant="primary" size="md" className="rounded-xl">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/>
              </svg>
              New Claim Link
            </Button>
          </Link>
        </div>

        {/* Stats */}
        {loading ? <SkeletonDashboardStats/> : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
            {[
              { label: "Balance", value: `${balanceFormatted ?? "—"}`, unit: "USDC", accent: true },
              { label: "Total Sent", value: totalSent.toFixed(2), unit: "USDC" },
              { label: "Total Received", value: totalReceived.toFixed(2), unit: "USDC" },
              { label: "Active Links", value: String(pendingCount), unit: "" },
            ].map(({ label, value, unit, accent }, i) => (
              <div key={label} className="card p-4" style={{ animation: `fadeUp 0.4s ease ${i * 60}ms forwards`, opacity: 0 }}>
                <p className="section-label mb-2">{label}</p>
                <p className={`font-display font-bold text-xl tabular-nums ${accent ? "text-gradient-gold" : "text-choc-100"}`}>
                  {value}{unit && <span className="text-sm font-body font-normal text-choc-500 ml-1">{unit}</span>}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 bg-choc-850 border border-choc-700/40 rounded-2xl p-1 mb-6 w-fit" role="tablist">
          {(["sent","received"] as Tab[]).map(t => (
            <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)}
              className={`px-5 py-2.5 rounded-xl text-sm font-body font-medium capitalize transition-all duration-200 ${
                tab === t ? "bg-choc-700 text-choc-50 border border-choc-600/50 shadow-sm" : "text-choc-400 hover:text-choc-200"
              }`}
            >
              {t === "sent" ? `Sent (${sentClaims.length})` : `Received (${receivedClaims.length})`}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="card overflow-hidden" role="tabpanel">
          {loading ? (
            <div className="p-5 flex flex-col gap-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center gap-4 py-3 border-b border-choc-700/30 last:border-0">
                  <div className="flex-1 flex flex-col gap-2">
                    <div className="flex gap-2"><Skeleton className="h-5 w-24"/><Skeleton className="h-5 w-16 rounded-full"/></div>
                    <Skeleton className="h-3 w-40"/>
                  </div>
                  <Skeleton className="h-8 w-20 rounded-xl"/>
                </div>
              ))}
            </div>
          ) : (tab === "sent" ? sentClaims : receivedClaims).length === 0 ? (
            <EmptyState tab={tab}/>
          ) : (
            <div className="px-5">
              {(tab === "sent" ? sentClaims : receivedClaims).map(record => (
                <ClaimRow key={record.claimId} record={record}
                  onReclaim={tab === "sent" ? handleReclaim : undefined}
                  reclaimingId={reclaimingId}
                />
              ))}
            </div>
          )}
        </div>

        {/* Faucet link */}
        <p className="text-center font-body text-xs text-choc-700 mt-8">
          Need testnet USDC?{" "}
          <a href="https://faucet.circle.com" target="_blank" rel="noopener noreferrer" className="text-choc-500 hover:text-gold-600 underline transition-colors">
            Circle faucet ↗
          </a>
        </p>
      </div>
    </main>
  );
}
