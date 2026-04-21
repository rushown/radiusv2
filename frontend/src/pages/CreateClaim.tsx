import { useState, useCallback } from "react";
import { useAccount, useConnect } from "wagmi";
import {
  Button,
  Card,
  Input,
  TxStatusBar,
  Spinner,
} from "@/components/ui";
import { useCreateClaim } from "@/hooks/useClaim";
import { useUsdcBalance } from "@/hooks/useUsdcBalance";
import {
  generateSecret,
  deriveClaimId,
  buildClaimUrl,
  copyToClipboard,
  parseUsdc,
  formatUsdc,
} from "@/utils/crypto";
import { api } from "@/utils/api";
import { DEFAULT_EXPIRY_DAYS } from "@/config/chain";

type Step = "form" | "confirm" | "success";

export default function CreateClaim() {
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { raw: balance, formatted: balanceFormatted } = useUsdcBalance(address);

  const [step, setStep] = useState<Step>("form");
  const [amount, setAmount] = useState("");
  const [expiryDays, setExpiryDays] = useState(String(DEFAULT_EXPIRY_DAYS));
  const [amountError, setAmountError] = useState("");
  const [copied, setCopied] = useState(false);

  // Generated claim data
  const [secret, setSecret] = useState<`0x${string}` | null>(null);
  const [claimId, setClaimId] = useState<`0x${string}` | null>(null);
  const [claimUrl, setClaimUrl] = useState<string | null>(null);

  const { create, status, error: txError, txHash, reset } = useCreateClaim();

  const validateAmount = useCallback(
    (val: string) => {
      if (!val || isNaN(Number(val)) || Number(val) <= 0) {
        setAmountError("Enter a valid amount");
        return false;
      }
      if (balance !== undefined) {
        const raw = parseUsdc(val);
        if (raw > balance) {
          setAmountError(
            `Insufficient balance (${balanceFormatted} USDC available)`
          );
          return false;
        }
      }
      setAmountError("");
      return true;
    },
    [balance, balanceFormatted]
  );

  const handleProceed = () => {
    if (!validateAmount(amount)) return;
    setStep("confirm");
  };

  const handleCreate = async () => {
    if (!address || !validateAmount(amount)) return;

    // Generate secret in-browser, never stored
    const newSecret = generateSecret();
    const newClaimId = deriveClaimId(newSecret);
    const amountRaw = parseUsdc(amount);
    const days = Math.max(1, Math.min(30, parseInt(expiryDays) || DEFAULT_EXPIRY_DAYS));
    const expiryTimestamp = BigInt(Math.floor(Date.now() / 1000) + days * 86400);

    setSecret(newSecret);
    setClaimId(newClaimId);

    try {
      const hash = await create(newClaimId, amountRaw, expiryTimestamp, address);

      // Save non-sensitive metadata to backend
      try {
        await api.createClaim({
          claimId: newClaimId,
          amount: formatUsdc(amountRaw),
          amountRaw: amountRaw.toString(),
          creatorAddress: address,
          expiresAt: Number(expiryTimestamp),
          txHash: hash,
        });
      } catch {
        // Backend failure is non-fatal; on-chain is source of truth
        console.warn("Backend metadata save failed — claim is still valid on-chain");
      }

      const url = buildClaimUrl(newClaimId, newSecret);
      setClaimUrl(url);
      setStep("success");
    } catch {
      // error is displayed via TxStatusBar
    }
  };

  const handleCopy = async () => {
    if (!claimUrl) return;
    const ok = await copyToClipboard(claimUrl);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleStartOver = () => {
    reset();
    setStep("form");
    setAmount("");
    setExpiryDays(String(DEFAULT_EXPIRY_DAYS));
    setSecret(null);
    setClaimId(null);
    setClaimUrl(null);
    setCopied(false);
  };

  if (!isConnected) {
    return (
      <main className="min-h-screen pt-28 px-4 flex items-center justify-center">
        <Card className="max-w-md w-full p-8 text-center">
          <div className="text-4xl mb-4" aria-hidden="true">🔐</div>
          <h1 className="font-display text-2xl font-bold text-chocolate-50 mb-3">
            Connect your wallet
          </h1>
          <p className="font-body text-chocolate-400 mb-6 text-sm">
            You need a connected wallet to create a claim link.
          </p>
          <Button
            variant="primary"
            onClick={() => connect({ connector: connectors[0] })}
            aria-label="Connect wallet to continue"
          >
            Connect Wallet
          </Button>
        </Card>
      </main>
    );
  }

  return (
    <main className="min-h-screen pt-28 pb-16 px-4">
      <div className="max-w-lg mx-auto animate-fade-in">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold text-chocolate-50 mb-2">
            Create Claim Link
          </h1>
          <p className="font-body text-chocolate-400">
            Lock USDC in a smart contract and generate a one-time claim link.
          </p>
        </div>

        {/* Progress dots */}
        <div className="flex items-center gap-2 mb-8" aria-label="Progress">
          {(["form", "confirm", "success"] as Step[]).map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-body font-medium transition-colors ${
                  step === s
                    ? "bg-gold-500 text-chocolate-900"
                    : i < ["form", "confirm", "success"].indexOf(step)
                    ? "bg-gold-700/50 text-gold-300"
                    : "bg-chocolate-700 text-chocolate-400"
                }`}
                aria-current={step === s ? "step" : undefined}
              >
                {i + 1}
              </div>
              {i < 2 && (
                <div
                  className={`h-px w-8 transition-colors ${
                    i < ["form", "confirm", "success"].indexOf(step)
                      ? "bg-gold-600/50"
                      : "bg-chocolate-600"
                  }`}
                  aria-hidden="true"
                />
              )}
            </div>
          ))}
          <span className="ml-2 font-body text-xs text-chocolate-400 capitalize">
            {step === "form" ? "Configure" : step === "confirm" ? "Confirm" : "Done"}
          </span>
        </div>

        {/* ── Step 1: Form ── */}
        {step === "form" && (
          <Card className="p-6 animate-slide-up">
            <div className="flex flex-col gap-5">
              <Input
                label="Amount (USDC)"
                type="number"
                min="0.000001"
                step="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value);
                  if (amountError) validateAmount(e.target.value);
                }}
                suffix="USDC"
                error={amountError}
                hint={
                  balanceFormatted
                    ? `Available: ${balanceFormatted} USDC`
                    : undefined
                }
                aria-required="true"
              />

              <Input
                label="Expiry (days)"
                type="number"
                min="1"
                max="30"
                placeholder={String(DEFAULT_EXPIRY_DAYS)}
                value={expiryDays}
                onChange={(e) => setExpiryDays(e.target.value)}
                hint="Recipient must claim within this window. You can reclaim after expiry."
              />

              {/* Quick amount buttons */}
              <div>
                <p className="font-body text-xs text-chocolate-400 mb-2">
                  Quick amounts
                </p>
                <div className="flex flex-wrap gap-2">
                  {["1", "5", "10", "25", "50", "100"].map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => {
                        setAmount(v);
                        setAmountError("");
                      }}
                      className={`px-3 py-1 rounded-lg text-xs font-body font-medium border transition-colors ${
                        amount === v
                          ? "bg-gold-500/20 border-gold-600/50 text-gold-400"
                          : "bg-chocolate-800 border-chocolate-600 text-chocolate-300 hover:border-chocolate-500 hover:text-chocolate-200"
                      }`}
                    >
                      ${v}
                    </button>
                  ))}
                </div>
              </div>

              <Button
                variant="primary"
                size="lg"
                onClick={handleProceed}
                className="w-full mt-2"
                disabled={!amount}
                aria-label="Continue to confirmation"
              >
                Continue →
              </Button>
            </div>
          </Card>
        )}

        {/* ── Step 2: Confirm ── */}
        {step === "confirm" && (
          <Card className="p-6 animate-slide-up">
            <h2 className="font-display text-lg font-semibold text-chocolate-50 mb-5">
              Confirm transaction
            </h2>

            <dl className="flex flex-col gap-3 mb-6">
              {[
                { label: "Amount", value: `${amount} USDC` },
                {
                  label: "Expires in",
                  value: `${expiryDays} days`,
                },
                {
                  label: "Recipient",
                  value: "Anyone with the link",
                },
                {
                  label: "Steps",
                  value: "1. Approve USDC → 2. Lock funds",
                },
              ].map(({ label, value }) => (
                <div
                  key={label}
                  className="flex items-center justify-between py-2.5 border-b border-chocolate-600/50 last:border-0"
                >
                  <dt className="font-body text-sm text-chocolate-400">{label}</dt>
                  <dd className="font-body text-sm font-medium text-chocolate-100">
                    {value}
                  </dd>
                </div>
              ))}
            </dl>

            <div className="bg-gold-500/8 border border-gold-700/30 rounded-lg p-4 mb-5 text-sm font-body text-chocolate-300">
              <span className="text-gold-400 font-medium">Note: </span>
              Two wallet prompts will appear — one to approve USDC spending, one
              to lock funds. The claim link is generated after both confirm.
            </div>

            <TxStatusBar status={status} txHash={txHash} error={txError} />

            <div className="flex gap-3 mt-5">
              <Button
                variant="ghost"
                onClick={() => { setStep("form"); reset(); }}
                disabled={status !== "idle" && status !== "error"}
                aria-label="Go back to form"
              >
                Back
              </Button>
              <Button
                variant="primary"
                className="flex-1"
                loading={
                  status === "approving" ||
                  status === "approval-pending" ||
                  status === "creating" ||
                  status === "tx-pending"
                }
                onClick={handleCreate}
                disabled={status === "confirmed"}
                aria-label="Lock USDC and create claim link"
              >
                Lock USDC & Generate Link
              </Button>
            </div>
          </Card>
        )}

        {/* ── Step 3: Success ── */}
        {step === "success" && claimUrl && secret && claimId && (
          <Card className="p-6 animate-slide-up" glow>
            <div className="text-center mb-6">
              <div
                className="w-14 h-14 rounded-full bg-green-900/30 border border-green-700/40 flex items-center justify-center mx-auto mb-4"
                aria-hidden="true"
              >
                <svg
                  className="h-7 w-7 text-green-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h2 className="font-display text-xl font-bold text-chocolate-50 mb-1">
                Claim Link Ready
              </h2>
              <p className="font-body text-sm text-chocolate-400">
                Share this link with your recipient. It can only be used once.
              </p>
            </div>

            {/* Claim URL box */}
            <div className="bg-chocolate-800 border border-chocolate-600 rounded-xl p-4 mb-4">
              <p className="font-body text-xs text-chocolate-400 mb-2 uppercase tracking-wide">
                Claim URL (contains secret)
              </p>
              <p className="font-mono text-xs text-chocolate-200 break-all leading-relaxed">
                {claimUrl}
              </p>
            </div>

            <div className="bg-red-900/20 border border-red-800/40 rounded-lg p-3 mb-5 text-xs font-body text-red-300">
              ⚠️ <strong>This link contains the secret.</strong> Share it only with your intended recipient through a secure channel. Once lost, it cannot be recovered.
            </div>

            <div className="flex flex-col gap-3">
              <Button
                variant="primary"
                size="lg"
                className="w-full"
                onClick={handleCopy}
                aria-label="Copy claim link to clipboard"
              >
                {copied ? (
                  <>
                    <svg className="h-4 w-4 text-green-300" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Copied!
                  </>
                ) : (
                  <>
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Copy Claim Link
                  </>
                )}
              </Button>

              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="ghost"
                  onClick={handleStartOver}
                  aria-label="Create another claim link"
                >
                  Create Another
                </Button>
                <a
                  href={`https://testnet.arcscan.app/tx/${txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-body font-medium rounded-md bg-chocolate-600 text-chocolate-100 border border-chocolate-500 hover:bg-chocolate-500 transition-colors"
                  aria-label="View transaction on block explorer"
                >
                  View on Explorer ↗
                </a>
              </div>
            </div>
          </Card>
        )}
      </div>
    </main>
  );
}
