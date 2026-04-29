import { useState, useEffect, useCallback } from "react";
import { useConnect, useAccount } from "wagmi";

function MetaMaskIcon() {
  return (
    <svg width="38" height="38" viewBox="0 0 38 38" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="38" height="38" rx="10" fill="#1c0f0a"/>
      <path d="M30.5 6L21 12.8L22.7 9L30.5 6Z" fill="#E2761B"/>
      <path d="M7.5 6L16.9 12.9L15.3 9L7.5 6Z" fill="#E4761B"/>
      <path d="M27.2 24.2L24.7 28L30 29.4L31.5 24.3L27.2 24.2Z" fill="#E4761B"/>
      <path d="M6.5 24.3L8 29.4L13.3 28L10.8 24.2L6.5 24.3Z" fill="#E4761B"/>
      <path d="M13 18L11.5 20.4L16.8 20.7L16.6 15L13 18Z" fill="#E4761B"/>
      <path d="M25 18L21.3 14.9L21.2 20.7L26.5 20.4L25 18Z" fill="#E4761B"/>
      <path d="M13.3 28L16.4 26.5L13.7 24.3L13.3 28Z" fill="#E4761B"/>
      <path d="M21.6 26.5L24.7 28L24.3 24.3L21.6 26.5Z" fill="#E4761B"/>
    </svg>
  );
}

function RabbyIcon() {
  return (
    <svg width="38" height="38" viewBox="0 0 38 38" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="38" height="38" rx="10" fill="#1c0f0a"/>
      <ellipse cx="19" cy="21" rx="10" ry="7.5" fill="#7C8CFF"/>
      <ellipse cx="19" cy="20" rx="8" ry="6" fill="#6070F0"/>
      <circle cx="13.5" cy="15" r="4" fill="#8697FF"/>
      <circle cx="24.5" cy="15" r="4" fill="#8697FF"/>
      <circle cx="13.5" cy="15" r="2.5" fill="#AAB8FF"/>
      <circle cx="24.5" cy="15" r="2.5" fill="#AAB8FF"/>
      <circle cx="13.5" cy="15" r="1.2" fill="#1c0f0a"/>
      <circle cx="24.5" cy="15" r="1.2" fill="#1c0f0a"/>
      <ellipse cx="19" cy="25" rx="4.5" ry="1.8" fill="#5060D8"/>
    </svg>
  );
}

function GenericWalletIcon() {
  return (
    <svg width="38" height="38" viewBox="0 0 38 38" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="38" height="38" rx="10" fill="#2e1a14"/>
      <rect x="8" y="13" width="22" height="15" rx="3" stroke="#f0aa00" strokeWidth="1.5" fill="none"/>
      <path d="M8 18h22" stroke="#f0aa00" strokeWidth="1.5"/>
      <circle cx="24" cy="23" r="2" fill="#f0aa00"/>
    </svg>
  );
}

interface WalletConnectModalProps { open: boolean; onClose: () => void; }

export function WalletConnectModal({ open, onClose }: WalletConnectModalProps) {
  const { connect, connectors, isPending, error } = useConnect();
  const { isConnected } = useAccount();
  const [connectingId, setConnectingId] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    const fn = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [open, onClose]);

  useEffect(() => { document.body.style.overflow = open ? "hidden" : ""; return () => { document.body.style.overflow = ""; }; }, [open]);
  useEffect(() => { if (!open) setConnectingId(null); }, [open]);
  useEffect(() => { if (isConnected && open) onClose(); }, [isConnected, open, onClose]);

  const handleConnect = useCallback((connectorId: string) => {
    const c = connectors.find(x => x.id === connectorId);
    if (!c) return;
    setConnectingId(connectorId);
    connect({ connector: c }, {
      onSuccess: () => { setConnectingId(null); onClose(); },
      onError:   () => setConnectingId(null),
    });
  }, [connect, connectors, onClose]);

  const getIcon = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes("metamask")) return <MetaMaskIcon/>;
    if (n.includes("rabby"))    return <RabbyIcon/>;
    return <GenericWalletIcon/>;
  };

  const getDesc = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes("metamask")) return "The most widely used Web3 wallet";
    if (n.includes("rabby"))    return "Security-focused multi-chain wallet";
    return "Browser extension wallet";
  };

  const getTag = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes("rabby"))    return "Recommended";
    if (n.includes("metamask")) return "Popular";
    return null;
  };

  const unique = connectors.filter((c, i, a) => a.findIndex(x => x.id === c.id) === i);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-choc-950/75 glass animate-fade-in" onClick={onClose} aria-hidden="true"/>

      <div
        role="dialog" aria-modal="true" aria-labelledby="wc-title"
        className="relative z-10 w-full max-w-[400px] max-h-[calc(100dvh-2rem)] flex flex-col
                   bg-choc-850 border border-choc-700/60 rounded-2xl
                   shadow-modal overflow-hidden animate-scale-in"
      >
        <div className="flex items-start justify-between px-5 pt-5 pb-4 shrink-0">
          <div>
            <h2 id="wc-title" className="font-display text-xl font-semibold text-choc-50 tracking-wide">Connect Wallet</h2>
            <p className="font-body text-xs text-choc-400 mt-0.5">Select a wallet to connect to Radius Pay</p>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-xl text-choc-500 hover:text-choc-200 hover:bg-choc-750 transition-colors mt-0.5"
            aria-label="Close"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <div className="mx-5 mb-4 flex items-center gap-3 bg-choc-900/60 border border-choc-700/40 rounded-xl px-3.5 py-2.5 shrink-0">
          <div className="relative shrink-0">
            <span className="w-2.5 h-2.5 rounded-full bg-gold-500 block"/>
            <span className="absolute inset-0 rounded-full bg-gold-500 animate-ping opacity-50"/>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-body text-xs font-medium text-gold-400">Arc Testnet</p>
            <p className="font-mono text-[10px] text-choc-500">Chain ID 5042002 · USDC gas</p>
          </div>
          <span className="text-[10px] font-body text-jade-400 bg-jade-500/10 border border-jade-600/20 px-2 py-0.5 rounded-full">Testnet</span>
        </div>

        <div className="px-5 pb-4 flex flex-col gap-2 overflow-y-auto">
          {unique.length === 0 ? (
            <div className="py-10 text-center">
              <div className="text-3xl mb-3" aria-hidden="true">🦊</div>
              <p className="font-body text-sm text-choc-300 mb-1">No wallets detected</p>
              <p className="font-body text-xs text-choc-500">
                Install{" "}
                <a href="https://metamask.io" target="_blank" rel="noopener noreferrer" className="text-gold-500 hover:underline">MetaMask</a>
                {" "}or{" "}
                <a href="https://rabby.io" target="_blank" rel="noopener noreferrer" className="text-gold-500 hover:underline">Rabby</a>
              </p>
            </div>
          ) : unique.map(c => {
            const loading = connectingId === c.id && isPending;
            const disabled = isPending && connectingId !== c.id;
            const tag = getTag(c.name);
            return (
              <button key={c.id} onClick={() => handleConnect(c.id)} disabled={disabled || loading}
                className="group flex items-center gap-3.5 w-full px-4 py-3.5 rounded-xl border border-choc-700/50 bg-choc-800/60 hover:bg-choc-750 hover:border-gold-700/40 active:scale-[0.99] transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed text-left"
                aria-label={`Connect with ${c.name}`}
              >
                <div className="shrink-0 transition-transform duration-150 group-hover:scale-105">
                  {getIcon(c.name)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-body font-semibold text-sm text-choc-50">{c.name}</span>
                    {tag && (
                      <span className="px-1.5 py-0.5 rounded-md text-[10px] font-body font-medium bg-gold-500/10 text-gold-400 border border-gold-600/25">
                        {tag}
                      </span>
                    )}
                  </div>
                  <p className="font-body text-xs text-choc-400 mt-0.5">{getDesc(c.name)}</p>
                </div>
                <div className="shrink-0 text-choc-600 group-hover:text-gold-500 transition-colors">
                  {loading ? (
                    <svg className="animate-spin h-4 w-4 text-gold-500" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                    </svg>
                  ) : (
                    <svg className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/>
                    </svg>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {error && (
          <div className="mx-5 mb-4 px-4 py-3 bg-ember-600/10 border border-ember-600/30 rounded-xl shrink-0">
            <p className="font-body text-xs text-ember-400">
              {error.message.toLowerCase().includes("reject") ? "Connection rejected. Please try again." : error.message.slice(0, 100)}
            </p>
          </div>
        )}

        <div className="px-5 pb-5 shrink-0">
          <p className="font-body text-[11px] text-choc-600 text-center leading-relaxed">
            Your wallet stays in your custody. Radius Pay never stores private keys.
          </p>
        </div>
      </div>
    </div>
  );
}