import { useAccount, useDisconnect, useChainId, useSwitchChain } from "wagmi";
import { Link, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { truncateAddress } from "@/utils/crypto";
import { useUsdcBalance } from "@/hooks/useUsdcBalance";
import { arcTestnet } from "@/config/chain";
import { WalletConnectModal } from "./WalletConnectModal";

export function Navbar() {
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const { formatted } = useUsdcBalance(address);
  const location = useLocation();
  const [walletOpen, setWalletOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [connectOpen, setConnectOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const isWrongChain = isConnected && chainId !== arcTestnet.id;

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  const navLinks = [
    { to: "/", label: "Home" },
    { to: "/create", label: "Send" },
    { to: "/dashboard", label: "Dashboard" },
  ];

  return (
    <>
      <header className={`fixed top-0 inset-x-0 z-40 transition-all duration-300 ${
        scrolled
          ? "bg-choc-900/95 glass border-b border-choc-700/50 shadow-nav"
          : "bg-transparent border-b border-transparent"
      }`}>
        <nav className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4" aria-label="Main navigation">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group shrink-0">
            <div className="relative w-8 h-8">
              <div className="absolute inset-0 rounded-xl bg-gold-500 shadow-gold-sm group-hover:shadow-gold-md transition-shadow duration-300"/>
              <div className="absolute inset-0 rounded-xl flex items-center justify-center">
                <span className="font-display font-bold text-choc-950 text-base leading-none">R</span>
              </div>
            </div>
            <span className="font-display font-semibold text-choc-50 text-lg hidden sm:block tracking-wide">
              Radius<span className="text-gradient-gold"> Pay</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-0.5" role="menubar">
            {navLinks.map(({ to, label }) => {
              const active = location.pathname === to;
              return (
                <Link key={to} to={to} role="menuitem"
                  className={`relative px-4 py-2 rounded-xl font-body text-sm font-medium transition-all duration-200 ${
                    active ? "text-choc-50" : "text-choc-400 hover:text-choc-100"
                  }`}
                >
                  {active && (
                    <span className="absolute inset-0 rounded-xl bg-choc-750 border border-choc-600/50" aria-hidden="true"/>
                  )}
                  <span className="relative">{label}</span>
                </Link>
              );
            })}
          </div>

          {/* Right */}
          <div className="flex items-center gap-2 shrink-0">
            {isConnected && isWrongChain && (
              <button onClick={() => switchChain({ chainId: arcTestnet.id })}
                className="btn-danger px-3 py-1.5 text-xs rounded-lg"
                aria-label="Switch to Arc Testnet"
              >
                <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
                </svg>
                Wrong Network
              </button>
            )}

            {isConnected && !isWrongChain && formatted !== undefined && (
              <div className="hidden sm:flex items-center gap-1.5 bg-choc-800/80 border border-choc-700/50 rounded-xl px-3 py-2">
                <span className="w-1.5 h-1.5 rounded-full bg-gold-400 animate-pulse shrink-0" aria-hidden="true"/>
                <span className="font-mono text-xs text-choc-200 tabular-nums">{formatted}</span>
                <span className="font-body text-xs text-choc-500">USDC</span>
              </div>
            )}

            {isConnected ? (
              <div className="relative">
                <button onClick={() => setWalletOpen(v => !v)}
                  className="flex items-center gap-2 bg-choc-800 border border-choc-700/60 hover:border-choc-600 rounded-xl px-3 py-2 transition-all duration-200"
                  aria-haspopup="true" aria-expanded={walletOpen} aria-label="Wallet menu"
                >
                  <div className="w-5 h-5 rounded-full bg-gradient-to-br from-gold-500/40 to-gold-700/30 border border-gold-600/40 flex items-center justify-center shrink-0">
                    <span className="text-gold-300 text-[9px] leading-none">◆</span>
                  </div>
                  <span className="hidden sm:block font-mono text-xs text-choc-200">{truncateAddress(address || "")}</span>
                  <svg className={`h-3 w-3 text-choc-500 transition-transform duration-200 ${walletOpen ? "rotate-180" : ""}`} fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd"/>
                  </svg>
                </button>

                {walletOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setWalletOpen(false)} aria-hidden="true"/>
                    <div className="absolute right-0 top-full mt-2 w-56 bg-choc-800 border border-choc-700/60 rounded-2xl shadow-modal overflow-hidden z-20 animate-scale-in" role="menu">
                      <div className="px-4 py-3.5 border-b border-choc-700/50">
                        <p className="section-label mb-1">Connected</p>
                        <p className="font-mono text-xs text-choc-100 truncate">{address}</p>
                      </div>
                      {formatted !== undefined && (
                        <div className="px-4 py-3 border-b border-choc-700/50">
                          <p className="section-label mb-1">Balance</p>
                          <p className="font-mono text-sm text-gold-400 tabular-nums">{formatted} <span className="text-choc-500">USDC</span></p>
                        </div>
                      )}
                      <button role="menuitem" onClick={() => { disconnect(); setWalletOpen(false); }}
                        className="w-full text-left px-4 py-3 text-sm font-body text-ember-400 hover:bg-ember-600/10 transition-colors duration-150"
                      >Disconnect wallet</button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <button onClick={() => setConnectOpen(true)}
                className="btn-primary px-4 py-2 text-sm rounded-xl"
                aria-label="Connect wallet"
              >
                <svg className="h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/>
                </svg>
                <span className="hidden sm:inline">Connect Wallet</span>
                <span className="sm:hidden">Connect</span>
              </button>
            )}

            <button className="md:hidden p-2 text-choc-400 hover:text-choc-100 rounded-xl hover:bg-choc-750 transition-colors"
              onClick={() => setMobileOpen(v => !v)} aria-label="Menu" aria-expanded={mobileOpen}
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d={mobileOpen ? "M6 18L18 6M6 6l12 12" : "M3 7h18M3 12h18M3 17h18"}/>
              </svg>
            </button>
          </div>
        </nav>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden border-t border-choc-700/40 bg-choc-900/98 glass px-4 py-3 flex flex-col gap-1 animate-fade-in">
            {navLinks.map(({ to, label }) => (
              <Link key={to} to={to}
                className={`px-4 py-3 rounded-xl font-body text-sm font-medium transition-colors ${
                  location.pathname === to
                    ? "bg-choc-750 text-choc-50 border border-choc-600/50"
                    : "text-choc-400 hover:text-choc-100 hover:bg-choc-800"
                }`}
              >{label}</Link>
            ))}
          </div>
        )}
      </header>

      <WalletConnectModal open={connectOpen} onClose={() => setConnectOpen(false)}/>
    </>
  );
}
