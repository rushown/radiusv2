import { useAccount, useConnect, useDisconnect, useChainId, useSwitchChain } from "wagmi";
import { Link, useLocation } from "react-router-dom";
import { truncateAddress } from "@/utils/crypto";
import { useUsdcBalance } from "@/hooks/useUsdcBalance";
import { arcTestnet } from "@/config/chain";
import { Button } from "./ui";
import { useState } from "react";

export function Navbar() {
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const { formatted } = useUsdcBalance(address);
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const isWrongChain = isConnected && chainId !== arcTestnet.id;

  const navLinks = [
    { to: "/", label: "Home" },
    { to: "/create", label: "Send" },
    { to: "/dashboard", label: "Dashboard" },
  ];

  return (
    <header className="fixed top-0 inset-x-0 z-50 border-b border-chocolate-600/40 bg-chocolate-900/80 backdrop-blur-md">
      <nav
        className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4"
        aria-label="Main navigation"
      >
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 group shrink-0">
          <div className="w-8 h-8 rounded-lg bg-gold-500 flex items-center justify-center shadow-gold-sm group-hover:shadow-gold-md transition-shadow">
            <span className="text-chocolate-900 font-display font-bold text-sm">R</span>
          </div>
          <span className="font-display font-semibold text-chocolate-50 text-lg hidden sm:block">
            Radius<span className="text-gold-500"> Pay</span>
          </span>
        </Link>

        {/* Desktop Nav Links */}
        <div className="hidden md:flex items-center gap-1" role="menubar">
          {navLinks.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              role="menuitem"
              className={`px-4 py-2 rounded-lg font-body text-sm font-medium transition-colors ${
                location.pathname === to
                  ? "bg-chocolate-600 text-chocolate-50"
                  : "text-chocolate-300 hover:text-chocolate-100 hover:bg-chocolate-700"
              }`}
            >
              {label}
            </Link>
          ))}
        </div>

        {/* Right section */}
        <div className="flex items-center gap-2 shrink-0">
          {isConnected && isWrongChain && (
            <Button
              variant="danger"
              size="sm"
              onClick={() => switchChain({ chainId: arcTestnet.id })}
              aria-label="Switch to Arc Testnet"
            >
              Wrong Network
            </Button>
          )}

          {isConnected && !isWrongChain && formatted !== undefined && (
            <div className="hidden sm:flex items-center gap-1.5 bg-chocolate-700/60 border border-chocolate-600/50 rounded-lg px-3 py-1.5">
              <span className="w-2 h-2 rounded-full bg-gold-400 animate-pulse" aria-hidden="true" />
              <span className="font-mono text-xs text-chocolate-200">
                {formatted} <span className="text-chocolate-400">USDC</span>
              </span>
            </div>
          )}

          {isConnected ? (
            <div className="relative">
              <button
                onClick={() => setMenuOpen((v) => !v)}
                className="flex items-center gap-2 bg-chocolate-700 border border-chocolate-600 hover:border-chocolate-500 rounded-lg px-3 py-2 text-sm font-body text-chocolate-200 transition-colors"
                aria-haspopup="true"
                aria-expanded={menuOpen}
                aria-label="Wallet menu"
              >
                <div className="w-5 h-5 rounded-full bg-gold-600/50 border border-gold-500/50 flex items-center justify-center">
                  <span className="text-gold-300 text-xs">◆</span>
                </div>
                <span className="hidden sm:block font-mono">
                  {truncateAddress(address || "")}
                </span>
                <svg className={`h-3 w-3 text-chocolate-400 transition-transform ${menuOpen ? "rotate-180" : ""}`} fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>

              {menuOpen && (
                <div
                  className="absolute right-0 top-full mt-2 w-48 bg-chocolate-700 border border-chocolate-600 rounded-xl shadow-xl overflow-hidden"
                  role="menu"
                >
                  <div className="px-4 py-3 border-b border-chocolate-600">
                    <p className="text-xs text-chocolate-400 font-body">Connected wallet</p>
                    <p className="text-sm font-mono text-chocolate-100 mt-0.5 truncate">
                      {address}
                    </p>
                  </div>
                  {formatted !== undefined && (
                    <div className="px-4 py-2 border-b border-chocolate-600">
                      <p className="text-xs text-chocolate-400 font-body">Balance</p>
                      <p className="text-sm font-mono text-gold-400">{formatted} USDC</p>
                    </div>
                  )}
                  <button
                    role="menuitem"
                    onClick={() => { disconnect(); setMenuOpen(false); }}
                    className="w-full text-left px-4 py-3 text-sm font-body text-red-400 hover:bg-red-900/20 transition-colors"
                  >
                    Disconnect
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Button
              variant="primary"
              size="sm"
              onClick={() => connect({ connector: connectors[0] })}
              aria-label="Connect wallet"
            >
              Connect Wallet
            </Button>
          )}

          {/* Mobile menu toggle */}
          <button
            className="md:hidden p-2 text-chocolate-300 hover:text-chocolate-100"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Toggle mobile menu"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={menuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
            </svg>
          </button>
        </div>
      </nav>

      {/* Mobile nav dropdown */}
      {menuOpen && (
        <div className="md:hidden border-t border-chocolate-600/40 bg-chocolate-900/95 px-4 py-3 flex flex-col gap-1">
          {navLinks.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              onClick={() => setMenuOpen(false)}
              className={`px-3 py-2.5 rounded-lg font-body text-sm font-medium transition-colors ${
                location.pathname === to
                  ? "bg-chocolate-600 text-chocolate-50"
                  : "text-chocolate-300 hover:text-chocolate-100"
              }`}
            >
              {label}
            </Link>
          ))}
        </div>
      )}
    </header>
  );
}