import { useEffect, useState } from "react";
import { useAccount, useConnect } from "wagmi";
import { Link } from "react-router-dom";
import { Button, Card, Spinner, StatusBadge } from "@/components/ui";
import { useReclaimFunds } from "@/hooks/useClaim";
import { useUsdcBalance } from "@/hooks/useUsdcBalance";
import { api } from "@/utils/api";
import type { ClaimRecord } from "@/utils/api";
import {
  formatDate,
  timeUntilExpiry,
  truncateAddress,
} from "@/utils/crypto";

type Tab = "sent" | "received";

function ClaimRow({
  record,
  onReclaim,
  reclaimingId,
}: {
  record: ClaimRecord;
  onReclaim?: (id: string) => void;
  reclaimingId?: string;
}) {
  const canReclaim =
    record.status === "pending" &&
    record.expiresAt < Math.floor(Date.now() / 1000) &&
    onReclaim;

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3 py-4 border-b border-chocolate-600/30 last:border-0">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-display font-bold text-chocolate-50">
            {record.amount} USDC
          </span>
          <StatusBadge status={record.status} />
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs font-body text-chocolate-400">
          <span>Created {formatDate(record.createdAt)}</span>
          {record.status === "pending" && record.expiresAt && (
            <span className="text-gold-500/80">
              {timeUntilExpiry(record.expiresAt)}
            </span>
          )}
          {record.claimedBy && (
            <span>
              Claimed by {truncateAddress(record.claimedBy)}
            </span>
          )}
        </div>
        <p className="font-mono text-xs text-chocolate-500 mt-0.5 truncate">
          {record.claimId.slice(0, 18)}…
        </p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {canReclaim && (
          <Button
            variant="ghost"
            size="sm"
            loading={reclaimingId === record.claimId}
            onClick={() => onReclaim(record.claimId)}
            aria-label={`Reclaim ${record.amount} USDC`}
          >
            Reclaim
          </Button>
        )}
        <a
          href={`https://testnet.arcscan.app`}
          target="_blank"
          rel="noopener noreferrer"
          className="px-3 py-1.5 text-xs font-body text-chocolate-400 hover:text-chocolate-200 border border-chocolate-600 hover:border-chocolate-500 rounded-lg transition-colors"
          aria-label="View on block explorer"
        >
          Explorer ↗
        </a>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { formatted: balanceFormatted } = useUsdcBalance(address);

  const [tab, setTab] = useState<Tab>("sent");
  const [claims, setClaims] = useState<ClaimRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [reclaimingId, setReclaimingId] = useState<string | undefined>();

  const { reclaim } = useReclaimFunds();

  useEffect(() => {
    if (!address) return;
    setLoading(true);
    api
      .getUserClaims(address)
      .then((data) => setClaims(data))
      .catch(() => setClaims([]))
      .finally(() => setLoading(false));
  }, [address]);

  const sentClaims = claims.filter(
    (c) => c.creatorAddress.toLowerCase() === address?.toLowerCase()
  );
  const receivedClaims = claims.filter(
    (c) => c.claimedBy?.toLowerCase() === address?.toLowerCase()
  );

  const handleReclaim = async (claimId: string) => {
    setReclaimingId(claimId);
    try {
      await reclaim(claimId as `0x${string}`);
      // Refresh after reclaim
      const data = await api.getUserClaims(address!);
      setClaims(data);
    } catch {
      // error is shown via hook
    } finally {
      setReclaimingId(undefined);
    }
  };

  // Stats
  const totalSent = sentClaims.reduce((sum, c) => sum + parseFloat(c.amount), 0);
  const totalReceived = receivedClaims.reduce((sum, c) => sum + parseFloat(c.amount), 0);
  const pendingCount = sentClaims.filter((c) => c.status === "pending").length;

  if (!isConnected) {
    return (
      <main className="min-h-screen pt-28 px-4 flex items-center justify-center">
        <Card className="max-w-md w-full p-8 text-center">
          <div className="text-4xl mb-4" aria-hidden="true">📊</div>
          <h1 className="font-display text-2xl font-bold text-chocolate-50 mb-3">
            Your Dashboard
          </h1>
          <p className="font-body text-chocolate-400 mb-6 text-sm">
            Connect your wallet to view your sent and received claims.
          </p>
          <Button
            variant="primary"
            onClick={() => connect({ connector: connectors[0] })}
            aria-label="Connect wallet to view dashboard"
          >
            Connect Wallet
          </Button>
        </Card>
      </main>
    );
  }

  return (
    <main className="min-h-screen pt-28 pb-16 px-4">
      <div className="max-w-3xl mx-auto animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="font-display text-3xl font-bold text-chocolate-50 mb-1">
              Dashboard
            </h1>
            <p className="font-mono text-xs text-chocolate-400">
              {truncateAddress(address || "", 8)}
            </p>
          </div>
          <Link to="/create">
            <Button variant="primary" aria-label="Create a new claim link">
              + New Claim Link
            </Button>
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Balance", value: `${balanceFormatted ?? "—"} USDC`, accent: true },
            { label: "Total Sent", value: `${totalSent.toFixed(2)} USDC` },
            { label: "Total Received", value: `${totalReceived.toFixed(2)} USDC` },
            { label: "Pending Links", value: String(pendingCount) },
          ].map(({ label, value, accent }) => (
            <Card key={label} className="p-4">
              <p className="font-body text-xs text-chocolate-400 mb-1">{label}</p>
              <p
                className={`font-display font-bold text-lg ${
                  accent ? "text-gold-400" : "text-chocolate-100"
                }`}
              >
                {value}
              </p>
            </Card>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-chocolate-800 rounded-xl p-1 mb-6 w-fit" role="tablist">
          {(["sent", "received"] as Tab[]).map((t) => (
            <button
              key={t}
              role="tab"
              aria-selected={tab === t}
              onClick={() => setTab(t)}
              className={`px-5 py-2 rounded-lg text-sm font-body font-medium capitalize transition-colors ${
                tab === t
                  ? "bg-chocolate-600 text-chocolate-50"
                  : "text-chocolate-400 hover:text-chocolate-200"
              }`}
            >
              {t === "sent" ? `Sent (${sentClaims.length})` : `Received (${receivedClaims.length})`}
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-20" aria-live="polite">
            <Spinner size="lg" />
          </div>
        ) : (
          <Card className="p-2" role="tabpanel">
            {(tab === "sent" ? sentClaims : receivedClaims).length === 0 ? (
              <div className="py-16 text-center">
                <p className="font-body text-chocolate-400 mb-4">
                  {tab === "sent"
                    ? "You haven't created any claim links yet."
                    : "You haven't claimed any funds yet."}
                </p>
                {tab === "sent" && (
                  <Link to="/create">
                    <Button variant="ghost" size="sm">
                      Create your first link →
                    </Button>
                  </Link>
                )}
              </div>
            ) : (
              <div className="px-4">
                {(tab === "sent" ? sentClaims : receivedClaims).map((record) => (
                  <ClaimRow
                    key={record.claimId}
                    record={record}
                    onReclaim={tab === "sent" ? handleReclaim : undefined}
                    reclaimingId={reclaimingId}
                  />
                ))}
              </div>
            )}
          </Card>
        )}

        {/* Faucet reminder */}
        <div className="mt-8 text-center">
          <p className="font-body text-xs text-chocolate-500">
            Need testnet USDC?{" "}
            <a
              href="https://faucet.circle.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gold-600 hover:text-gold-500 underline"
            >
              Get it from the Circle faucet ↗
            </a>
          </p>
        </div>
      </div>
    </main>
  );
}
