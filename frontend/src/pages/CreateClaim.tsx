import { useState, useCallback } from "react";
import { useAccount, useConnect } from "wagmi";
import { Button, Card, Input, TxStatusBar } from "@/components/ui";
import { useCreateClaim } from "@/hooks/useClaim";
import { useUsdcBalance } from "@/hooks/useUsdcBalance";
import { WalletConnectModal } from "@/components/WalletConnectModal";
import {
  generateSecret, deriveClaimId, buildClaimUrl,
  copyToClipboard, parseUsdc, formatUsdc,
} from "@/utils/crypto";
import { api } from "@/utils/api";
import { DEFAULT_EXPIRY_DAYS } from "@/config/chain";

type Step = "form" | "confirm" | "success";

const QUICK_AMOUNTS = ["1", "5", "10", "25", "50", "100"];

export default function CreateClaim() {
  const { address, isConnected } = useAccount();
  const { raw: balance, formatted: balanceFormatted } = useUsdcBalance(address);
  const [connectOpen, setConnectOpen] = useState(false);

  const [step, setStep] = useState<Step>("form");
  const [amount, setAmount] = useState("");
  const [expiryDays, setExpiryDays] = useState(String(DEFAULT_EXPIRY_DAYS));
  const [amountError, setAmountError] = useState("");
  const [copied, setCopied] = useState(false);

  const [claimUrl, setClaimUrl] = useState<string | null>(null);
  const { create, status, error: txError, txHash, reset } = useCreateClaim();

  const validate = useCallback((val: string) => {
    if (!val || isNaN(Number(val)) || Number(val) <= 0) { setAmountError("Enter a valid amount"); return false; }
    if (balance !== undefined) {
      if (parseUsdc(val) > balance) { setAmountError(`Insufficient — ${balanceFormatted} USDC available`); return false; }
    }
    setAmountError(""); return true;
  }, [balance, balanceFormatted]);

  const handleCreate = async () => {
    if (!address || !validate(amount)) return;
    const newSecret = generateSecret();
    const newClaimId = deriveClaimId(newSecret);
    const amountRaw = parseUsdc(amount);
    const days = Math.max(1, Math.min(30, parseInt(expiryDays) || DEFAULT_EXPIRY_DAYS));
    const expiryTimestamp = BigInt(Math.floor(Date.now() / 1000) + days * 86400);
    try {
      const hash = await create(newClaimId, amountRaw, expiryTimestamp, address);
      try {
        await api.createClaim({ claimId: newClaimId, amount: formatUsdc(amountRaw), amountRaw: amountRaw.toString(), creatorAddress: address, expiresAt: Number(expiryTimestamp), txHash: hash });
      } catch { /* non-fatal */ }
      setClaimUrl(buildClaimUrl(newClaimId, newSecret));
      setStep("success");
    } catch { /* shown in TxStatusBar */ }
  };

  const handleCopy = async () => {
    if (!claimUrl) return;
    if (await copyToClipboard(claimUrl)) { setCopied(true); setTimeout(() => setCopied(false), 2500); }
  };

  const handleReset = () => { reset(); setStep("form"); setAmount(""); setExpiryDays(String(DEFAULT_EXPIRY_DAYS)); setClaimUrl(null); setCopied(false); };

  const stepLabels = ["Configure", "Confirm", "Done"];
  const stepIdx = { form: 0, confirm: 1, success: 2 }[step];

  if (!isConnected) {
    return (
      <main className="page-wrapper min-h-screen pt-28 px-4 flex items-center justify-center">
        <div className="card max-w-md w-full p-10 text-center" style={{ animation: "scaleIn 0.4s cubic-bezier(0.16,1,0.3,1) forwards" }}>
          <div className="w-16 h-16 rounded-2xl bg-choc-750 border border-choc-700/50 flex items-center justify-center text-2xl mx-auto mb-6" aria-hidden="true">🔐</div>
          <h1 className="font-display text-2xl font-bold text-choc-50 mb-3">Connect your wallet</h1>
          <p className="font-body text-sm text-choc-400 mb-8 leading-relaxed">You need a connected wallet to lock USDC and generate a claim link.</p>
          <Button variant="primary" size="lg" className="w-full rounded-xl" onClick={() => setConnectOpen(true)}>Connect Wallet</Button>
        </div>
        <WalletConnectModal open={connectOpen} onClose={() => setConnectOpen(false)}/>
      </main>
    );
  }

  return (
    <main className="page-wrapper min-h-screen pt-28 pb-20 px-4">
      <div className="max-w-lg mx-auto" style={{ animation: "fadeUp 0.5s cubic-bezier(0.16,1,0.3,1) forwards" }}>

        {/* Header */}
        <div className="mb-10">
          <p className="section-label mb-2">Radius Pay</p>
          <h1 className="font-display text-4xl font-bold text-choc-50 leading-tight mb-2">Create Claim Link</h1>
          <p className="font-body text-choc-400">Lock USDC and generate a one-time secure link.</p>
        </div>

        {/* Stepper */}
        <div className="flex items-center gap-2 mb-8" role="list" aria-label="Progress steps">
          {stepLabels.map((label, i) => {
            const done = i < stepIdx;
            const active = i === stepIdx;
            return (
              <div key={label} className="flex items-center gap-2" role="listitem">
                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-body font-medium transition-all duration-300 ${
                  active ? "bg-gold-500 text-choc-950" : done ? "bg-choc-700 text-gold-400" : "bg-choc-800 text-choc-600"
                }`} aria-current={active ? "step" : undefined}>
                  {done ? (
                    <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                    </svg>
                  ) : <span className="font-mono">{i + 1}</span>}
                  {label}
                </div>
                {i < 2 && <div className={`h-px w-6 transition-colors duration-300 ${i < stepIdx ? "bg-gold-600/50" : "bg-choc-700"}`} aria-hidden="true"/>}
              </div>
            );
          })}
        </div>

        {/* ── STEP 1: Form ── */}
        {step === "form" && (
          <div className="card p-6 sm:p-7 flex flex-col gap-6" style={{ animation: "fadeUp 0.35s ease forwards" }}>
            <Input label="Amount (USDC)" type="number" min="0.000001" step="0.01" placeholder="0.00"
              value={amount} onChange={e => { setAmount(e.target.value); if (amountError) validate(e.target.value); }}
              suffix="USDC" error={amountError}
              hint={balanceFormatted ? `Available: ${balanceFormatted} USDC` : undefined}
              aria-required="true"
            />

            {/* Quick picks */}
            <div>
              <p className="font-body text-xs text-choc-500 mb-2.5 font-medium">Quick amounts</p>
              <div className="flex flex-wrap gap-2">
                {QUICK_AMOUNTS.map(v => (
                  <button key={v} type="button"
                    onClick={() => { setAmount(v); setAmountError(""); }}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-body font-medium border transition-all duration-150 ${
                      amount === v
                        ? "bg-gold-500/15 border-gold-600/40 text-gold-400"
                        : "bg-choc-800 border-choc-700/50 text-choc-400 hover:border-choc-600 hover:text-choc-200"
                    }`}
                  >${v}</button>
                ))}
              </div>
            </div>

            <Input label="Expiry (days)" type="number" min="1" max="30" placeholder={String(DEFAULT_EXPIRY_DAYS)}
              value={expiryDays} onChange={e => setExpiryDays(e.target.value)}
              hint="Sender reclaims funds after this window if unclaimed."
            />

            <Button variant="primary" size="lg" className="w-full rounded-xl mt-1" onClick={() => { if (validate(amount)) setStep("confirm"); }} disabled={!amount}>
              Review & Continue
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6"/>
              </svg>
            </Button>
          </div>
        )}

        {/* ── STEP 2: Confirm ── */}
        {step === "confirm" && (
          <div className="card p-6 sm:p-7 flex flex-col gap-5" style={{ animation: "fadeUp 0.35s ease forwards" }}>
            <h2 className="font-display text-xl font-semibold text-choc-50">Review transaction</h2>

            <dl className="flex flex-col rounded-xl overflow-hidden border border-choc-700/50 divide-y divide-choc-700/50">
              {[
                { label: "Locking", value: `${amount} USDC`, accent: true },
                { label: "Expiry", value: `${expiryDays} days from now` },
                { label: "Recipient", value: "Anyone with the link" },
                { label: "Steps", value: "1 — Approve USDC · 2 — Lock funds" },
              ].map(({ label, value, accent }) => (
                <div key={label} className="flex items-center justify-between px-4 py-3 bg-choc-850/40">
                  <dt className="font-body text-sm text-choc-400">{label}</dt>
                  <dd className={`font-body text-sm font-medium ${accent ? "text-gold-400" : "text-choc-100"}`}>{value}</dd>
                </div>
              ))}
            </dl>

            <div className="flex items-start gap-3 bg-gold-500/6 border border-gold-700/25 rounded-xl px-4 py-3.5 text-sm font-body text-choc-300">
              <span className="text-gold-500 mt-0.5 shrink-0">ℹ</span>
              Two wallet prompts will appear — first to approve USDC spending, then to lock funds.
            </div>

            <TxStatusBar status={status} txHash={txHash} error={txError}/>

            <div className="flex gap-3 mt-1">
              <Button variant="ghost" size="md" className="rounded-xl" onClick={() => { setStep("form"); reset(); }}
                disabled={status !== "idle" && status !== "error"}
              >← Back</Button>
              <Button variant="primary" size="md" className="flex-1 rounded-xl"
                loading={["approving","approval-pending","creating","tx-pending"].includes(status)}
                onClick={handleCreate} disabled={status === "confirmed"}
              >Lock USDC & Generate Link</Button>
            </div>
          </div>
        )}

        {/* ── STEP 3: Success ── */}
        {step === "success" && claimUrl && (
          <div className="card-glow p-6 sm:p-7 flex flex-col gap-5" style={{ animation: "scaleIn 0.4s cubic-bezier(0.16,1,0.3,1) forwards" }}>
            <div className="text-center mb-1">
              <div className="relative inline-flex mb-5">
                <div className="w-16 h-16 rounded-2xl bg-jade-500/15 border border-jade-600/30 flex items-center justify-center">
                  <svg className="h-8 w-8 text-jade-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7"/>
                  </svg>
                </div>
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-gold-500 animate-pulse-gold"/>
              </div>
              <h2 className="font-display text-2xl font-bold text-choc-50 mb-1">Claim Link Ready</h2>
              <p className="font-body text-sm text-choc-400">Share this with your recipient. Valid for one use only.</p>
            </div>

            {/* URL box */}
            <div className="bg-choc-900 border border-choc-700/50 rounded-xl p-4">
              <p className="section-label mb-2">Claim URL (contains secret)</p>
              <p className="font-mono text-xs text-choc-300 break-all leading-relaxed select-all">{claimUrl}</p>
            </div>

            <div className="flex items-start gap-3 bg-ember-600/8 border border-ember-600/25 rounded-xl px-4 py-3 text-xs font-body text-choc-400">
              <span className="text-ember-400 shrink-0 mt-0.5">⚠</span>
              <span><strong className="text-ember-300">This URL contains the secret.</strong> Send only to your intended recipient. Once lost, it cannot be recovered.</span>
            </div>

            <Button variant="primary" size="lg" className="w-full rounded-xl" onClick={handleCopy}>
              {copied ? (
                <><svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>Copied!</>
              ) : (
                <><svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>Copy Claim Link</>
              )}
            </Button>

            <div className="grid grid-cols-2 gap-3">
              <Button variant="ghost" size="md" className="rounded-xl" onClick={handleReset}>Create Another</Button>
              <a href={`https://testnet.arcscan.app/tx/${txHash}`} target="_blank" rel="noopener noreferrer"
                className="btn-secondary px-4 py-2.5 text-sm rounded-xl text-center"
              >View on Explorer ↗</a>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
