import { useState, useEffect, useRef, useCallback } from "react";
import { useConnect, useAccount, useDisconnect, useChainId, useSwitchChain } from "wagmi";
import { arcTestnet } from "@/config/chain";

// ─── Wallet icons as inline SVGs ────────────────────────────────────────────

function MetaMaskIcon({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="40" height="40" rx="10" fill="#1A0F0A"/>
      <path d="M32.5 7L22.1 14.6L24.1 10L32.5 7Z" fill="#E2761B" stroke="#E2761B" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M7.5 7L17.8 14.7L15.9 10L7.5 7Z" fill="#E4761B" stroke="#E4761B" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M28.8 25.7L26 30L31.9 31.6L33.6 25.8L28.8 25.7Z" fill="#E4761B" stroke="#E4761B" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M6.4 25.8L8.1 31.6L14 30L11.2 25.7L6.4 25.8Z" fill="#E4761B" stroke="#E4761B" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M13.7 19.2L12 21.9L17.8 22.2L17.6 15.9L13.7 19.2Z" fill="#E4761B" stroke="#E4761B" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M26.3 19.2L22.3 15.8L22.2 22.2L28 21.9L26.3 19.2Z" fill="#E4761B" stroke="#E4761B" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M14 30L17.4 28.3L14.5 25.8L14 30Z" fill="#E4761B" stroke="#E4761B" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M22.6 28.3L26 30L25.5 25.8L22.6 28.3Z" fill="#E4761B" stroke="#E4761B" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function RabbyIcon({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="40" height="40" rx="10" fill="#1A0F0A"/>
      <ellipse cx="20" cy="22" rx="11" ry="8" fill="#8697FF"/>
      <ellipse cx="20" cy="21" rx="9" ry="6.5" fill="#7084FF"/>
      <circle cx="14.5" cy="16" r="4.5" fill="#8697FF"/>
      <circle cx="25.5" cy="16" r="4.5" fill="#8697FF"/>
      <circle cx="14.5" cy="16" r="3" fill="#AAB8FF"/>
      <circle cx="25.5" cy="16" r="3" fill="#AAB8FF"/>
      <circle cx="14.5" cy="16" r="1.5" fill="#1A0F0A"/>
      <circle cx="25.5" cy="16" r="1.5" fill="#1A0F0A"/>
      <ellipse cx="20" cy="26" rx="5" ry="2" fill="#6070E8"/>
      <path d="M17 29 Q20 31 23 29" stroke="#6070E8" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
    </svg>
  );
}

function InjectedIcon({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="40" height="40" rx="10" fill="#2C1A12"/>
      <circle cx="20" cy="20" r="10" stroke="#FFB300" strokeWidth="1.5" fill="none"/>
      <circle cx="20" cy="20" r="5" fill="#FFB300" fillOpacity="0.4"/>
      <circle cx="20" cy="20" r="2" fill="#FFB300"/>
    </svg>
  );
}

// ─── Wallet option row ───────────────────────────────────────────────────────

interface WalletOptionProps {
  name: string;
  description: string;
  icon: React.ReactNode;
  onClick: () => void;
  loading: boolean;
  disabled: boolean;
  tag?: string;
}

function WalletOption({ name, description, icon, onClick, loading, disabled, tag }: WalletOptionProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className="
        group w-full flex items-center gap-4 px-4 py-3.5 rounded-xl
        border border-chocolate-600/60 bg-chocolate-800/60
        hover:bg-chocolate-700/80 hover:border-gold-700/50
        active:scale-[0.99] transition-all duration-150
        disabled:opacity-40 disabled:cursor-not-allowed
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500/60
        text-left
      "
      aria-label={`Connect with ${name}`}
    >
      {/* Icon */}
      <div className="shrink-0 transition-transform duration-150 group-hover:scale-105">
        {icon}
      </div>

      {/* Label */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-body font-semibold text-sm text-chocolate-50 group-hover:text-white transition-colors">
            {name}
          </span>
          {tag && (
            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-gold-500/15 text-gold-400 border border-gold-600/30">
              {tag}
            </span>
          )}
        </div>
        <p className="font-body text-xs text-chocolate-400 group-hover:text-chocolate-300 transition-colors mt-0.5 truncate">
          {description}
        </p>
      </div>

      {/* Arrow / spinner */}
      <div className="shrink-0 text-chocolate-500 group-hover:text-gold-500 transition-colors">
        {loading ? (
          <svg className="animate-spin h-4 w-4 text-gold-500" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
          </svg>
        ) : (
          <svg className="h-4 w-4 transition-transform duration-150 group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/>
          </svg>
        )}
      </div>
    </button>
  );
}

// ─── Main modal component ────────────────────────────────────────────────────

interface WalletConnectModalProps {
  open: boolean;
  onClose: () => void;
}

export function WalletConnectModal({ open, onClose }: WalletConnectModalProps) {
  const { connect, connectors, isPending, error } = useConnect();
  const [connectingId, setConnectingId] = useState<string | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  // Reset connecting state when modal closes
  useEffect(() => { if (!open) setConnectingId(null); }, [open]);

  const handleConnect = useCallback((connectorId: string) => {
    const connector = connectors.find(c => c.id === connectorId || c.name.toLowerCase().includes(connectorId.toLowerCase()));
    if (!connector) return;
    setConnectingId(connectorId);
    connect(
      { connector },
      {
        onSuccess: () => { setConnectingId(null); onClose(); },
        onError: () => setConnectingId(null),
      }
    );
  }, [connect, connectors, onClose]);

  // Map connectors to display metadata
  const walletMeta: Record<string, { description: string; icon: React.ReactNode; tag?: string }> = {
    metaMask: {
      description: "The most widely used Web3 wallet",
      icon: <MetaMaskIcon size={36} />,
      tag: "Popular",
    },
    rabby: {
      description: "Security-focused wallet by DeBank",
      icon: <RabbyIcon size={36} />,
      tag: "Recommended",
    },
    injected: {
      description: "Browser extension wallet",
      icon: <InjectedIcon size={36} />,
    },
  };

  // Build display list: prefer MetaMask + Rabby, then any other injected
  const displayConnectors = connectors
    .filter((c, i, arr) => arr.findIndex(x => x.id === c.id) === i) // dedupe
    .map(c => {
      const key = c.name.toLowerCase().includes("metamask")
        ? "metaMask"
        : c.name.toLowerCase().includes("rabby")
        ? "rabby"
        : "injected";
      return { connector: c, meta: walletMeta[key] ?? walletMeta.injected, key };
    });

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        ref={overlayRef}
        className="fixed inset-0 z-50 bg-chocolate-950/80 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="wallet-modal-title"
        className="
          fixed z-50
          bottom-0 inset-x-0 sm:inset-auto sm:top-1/2 sm:left-1/2
          sm:-translate-x-1/2 sm:-translate-y-1/2
          w-full sm:w-[420px] sm:max-w-[calc(100vw-2rem)]
          bg-chocolate-800 border-t sm:border border-chocolate-600/70
          rounded-t-2xl sm:rounded-2xl
          shadow-2xl shadow-chocolate-950/60
          overflow-hidden
          animate-slide-up sm:animate-fade-in
        "
      >
        {/* Drag handle (mobile) */}
        <div className="sm:hidden flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-chocolate-600" aria-hidden="true"/>
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-chocolate-700/60">
          <div>
            <h2
              id="wallet-modal-title"
              className="font-display text-base font-semibold text-chocolate-50"
            >
              Connect Wallet
            </h2>
            <p className="font-body text-xs text-chocolate-400 mt-0.5">
              Choose your wallet to continue
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-chocolate-400 hover:text-chocolate-100 hover:bg-chocolate-700 transition-colors"
            aria-label="Close wallet selector"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        {/* Network badge */}
        <div className="mx-5 mt-4 flex items-center gap-2 bg-chocolate-900/60 border border-chocolate-700/40 rounded-lg px-3 py-2.5">
          <span className="w-2 h-2 rounded-full bg-gold-400 animate-pulse shrink-0" aria-hidden="true"/>
          <div className="flex-1 min-w-0">
            <p className="font-body text-xs text-chocolate-400">Connecting to</p>
            <p className="font-body text-sm font-medium text-gold-400 truncate">Arc Testnet</p>
          </div>
          <span className="font-mono text-[10px] text-chocolate-500 shrink-0">ID: 5042002</span>
        </div>

        {/* Wallet options */}
        <div className="px-5 py-4 flex flex-col gap-2.5">
          {displayConnectors.length === 0 ? (
            <div className="py-8 text-center">
              <p className="font-body text-sm text-chocolate-400 mb-1">No wallets detected</p>
              <p className="font-body text-xs text-chocolate-500">
                Install{" "}
                <a href="https://metamask.io" target="_blank" rel="noopener noreferrer" className="text-gold-500 hover:underline">MetaMask</a>
                {" "}or{" "}
                <a href="https://rabby.io" target="_blank" rel="noopener noreferrer" className="text-gold-500 hover:underline">Rabby</a>
                {" "}to continue
              </p>
            </div>
          ) : (
            displayConnectors.map(({ connector, meta }) => (
              <WalletOption
                key={connector.id}
                name={connector.name}
                description={meta.description}
                icon={meta.icon}
                tag={meta.tag}
                loading={connectingId === connector.id && isPending}
                disabled={isPending && connectingId !== connector.id}
                onClick={() => handleConnect(connector.id)}
              />
            ))
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="mx-5 mb-4 px-4 py-3 bg-red-900/20 border border-red-800/40 rounded-lg">
            <p className="font-body text-xs text-red-400">
              {error.message.includes("rejected") || error.message.includes("denied")
                ? "Connection rejected. Please try again."
                : error.message.length > 80
                ? error.message.slice(0, 80) + "…"
                : error.message}
            </p>
          </div>
        )}

        {/* Footer */}
        <div className="px-5 pb-5 pt-1">
          <p className="font-body text-[11px] text-chocolate-500 text-center leading-relaxed">
            By connecting you agree to the{" "}
            <span className="text-chocolate-400">terms of use</span>. Your wallet
            remains in your full custody — we never store keys.
          </p>
        </div>
      </div>
    </>
  );
}

// ─── Connect Button (drop-in trigger) ───────────────────────────────────────

interface ConnectWalletButtonProps {
  size?: "sm" | "md" | "lg";
  className?: string;
  label?: string;
}

export function ConnectWalletButton({
  size = "md",
  className = "",
  label = "Connect Wallet",
}: ConnectWalletButtonProps) {
  const [open, setOpen] = useState(false);

  const sizes = {
    sm: "px-3 py-1.5 text-sm gap-1.5",
    md: "px-5 py-2.5 text-sm gap-2",
    lg: "px-7 py-3.5 text-base gap-2.5",
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={`
          inline-flex items-center justify-center font-body font-medium rounded-md
          bg-gold-500 text-chocolate-900 hover:bg-gold-400 active:bg-gold-600
          shadow-gold-sm hover:shadow-gold-md transition-all duration-200
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500
          ${sizes[size]} ${className}
        `}
        aria-label={label}
      >
        <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/>
        </svg>
        {label}
      </button>
      <WalletConnectModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}

// ─── Updated Navbar Connect section (replace your existing connect button) ──

export function NavbarConnectButton() {
  const [open, setOpen] = useState(false);
  const { isConnected } = useAccount();

  if (isConnected) return null;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="
          inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm
          bg-gold-500 text-chocolate-900 font-body font-medium
          hover:bg-gold-400 active:bg-gold-600
          shadow-gold-sm hover:shadow-gold-md
          transition-all duration-200
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500/60
        "
        aria-label="Connect wallet"
      >
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
            d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/>
        </svg>
        <span className="hidden sm:inline">Connect Wallet</span>
        <span className="sm:hidden">Connect</span>
      </button>
      <WalletConnectModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
