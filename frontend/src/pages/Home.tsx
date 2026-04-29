import { Link } from "react-router-dom";
import { useAccount } from "wagmi";

const features = [
  { icon: "⬡", title: "Zero-Knowledge Links", desc: "The secret lives only in the URL. We never store it. Only the link holder can claim." },
  { icon: "⛓", title: "Non-Custodial", desc: "Funds lock in an audited smart contract on Arc. No intermediaries. No trust required." },
  { icon: "⏱", title: "Auto-Expiry", desc: "Configurable expiry windows. Unclaimed funds auto-return to the sender after expiry." },
  { icon: "🛡", title: "Front-Running Proof", desc: "Commit-reveal scheme ensures miners cannot intercept or steal a pending claim." },
];

const steps = [
  { n: "01", title: "Lock USDC", desc: "Approve the contract to hold your USDC, set amount and expiry date." },
  { n: "02", title: "Share Link", desc: "Copy the generated claim URL. Send to your recipient via any channel." },
  { n: "03", title: "Recipient Claims", desc: "They open the link, connect wallet, receive USDC in a single transaction." },
];

export default function Home() {
  const { isConnected } = useAccount();

  return (
    <main className="page-wrapper">
      {/* ── Hero ── */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-4 pt-16 pb-24 overflow-hidden" aria-labelledby="hero-heading">
        {/* Background layers */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-gradient-to-b from-gold-500/6 to-transparent rounded-[50%] blur-3xl"/>
          <div className="absolute top-1/3 -left-64 w-[500px] h-[500px] bg-choc-700/20 rounded-full blur-3xl animate-float" style={{ animationDelay: "0s" }}/>
          <div className="absolute top-1/4 -right-48 w-[400px] h-[400px] bg-choc-600/15 rounded-full blur-3xl animate-float" style={{ animationDelay: "3s" }}/>
          {/* Decorative grid */}
          <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: "linear-gradient(rgba(240,170,0,1) 1px, transparent 1px), linear-gradient(90deg, rgba(240,170,0,1) 1px, transparent 1px)", backgroundSize: "80px 80px" }}/>
        </div>

        <div className="relative max-w-4xl mx-auto text-center" style={{ animation: "fadeUp 0.7s cubic-bezier(0.16,1,0.3,1) forwards" }}>
          {/* Eyebrow */}
          <div className="inline-flex items-center gap-2.5 bg-choc-800/80 border border-choc-700/60 rounded-full px-4 py-2 mb-8">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-gold-400 opacity-60"/>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-gold-400"/>
            </span>
            <span className="font-body text-xs font-medium text-choc-300 tracking-wider uppercase">Arc Testnet · USDC Payments · Non-Custodial</span>
          </div>

          {/* Headline */}
          <h1 id="hero-heading" className="font-display font-bold leading-[1.05] mb-6">
            <span className="block text-5xl sm:text-6xl lg:text-7xl text-choc-50 mb-2">Send USDC via</span>
            <span className="block text-5xl sm:text-6xl lg:text-7xl text-gradient-gold italic">one-time links</span>
          </h1>

          <p className="font-body text-lg sm:text-xl text-choc-400 max-w-2xl mx-auto mb-12 leading-relaxed">
            Lock funds in a smart contract, generate a secure claim link, share it with anyone.{" "}
            <span className="text-choc-300">No wallet address needed upfront.</span>
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link to="/create">
              <button className="btn-primary px-8 py-4 text-base rounded-2xl">
                Create a Claim Link
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6"/>
                </svg>
              </button>
            </Link>
            {isConnected && (
              <Link to="/dashboard">
                <button className="btn-ghost px-8 py-4 text-base rounded-2xl">View Dashboard</button>
              </Link>
            )}
          </div>

          {/* Floating stat pills */}
          <div className="flex flex-wrap justify-center gap-4 mt-16">
            {[
              { label: "Chain", value: "Arc Testnet" },
              { label: "Gas token", value: "USDC" },
              { label: "Claim type", value: "One-time" },
              { label: "Custodian", value: "None" },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-center gap-2 bg-choc-800/60 border border-choc-700/40 rounded-xl px-4 py-2.5">
                <span className="section-label">{label}</span>
                <span className="font-body text-xs font-semibold text-choc-200">{value}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="py-24 px-4" aria-labelledby="how-heading">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="section-label mb-3">Process</p>
            <h2 id="how-heading" className="font-display text-4xl font-bold text-choc-50">Three steps, start to finish</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {steps.map((step, i) => (
              <div key={i} className="card p-6 relative overflow-hidden group hover:border-choc-600/80 transition-all duration-300"
                style={{ animation: `fadeUp 0.5s cubic-bezier(0.16,1,0.3,1) ${i * 120}ms forwards`, opacity: 0 }}
              >
                <div className="absolute -top-4 -right-2 font-display text-7xl font-bold text-choc-750 select-none pointer-events-none group-hover:text-choc-700 transition-colors duration-300">
                  {step.n}
                </div>
                <div className="relative">
                  <div className="w-9 h-9 rounded-xl bg-gold-500 flex items-center justify-center mb-5 shadow-gold-sm">
                    <span className="font-display font-bold text-choc-950 text-sm">{i + 1}</span>
                  </div>
                  <h3 className="font-display text-xl font-semibold text-choc-50 mb-2">{step.title}</h3>
                  <p className="font-body text-sm text-choc-400 leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="py-24 px-4 border-t border-choc-800/80" aria-labelledby="features-heading">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="section-label mb-3">Security</p>
            <h2 id="features-heading" className="font-display text-4xl font-bold text-choc-50">Built with security first</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {features.map((f, i) => (
              <div key={i} className="card p-6 flex gap-4 hover:border-choc-600/80 group transition-all duration-300"
                style={{ animation: `fadeUp 0.5s cubic-bezier(0.16,1,0.3,1) ${i * 80}ms forwards`, opacity: 0 }}
              >
                <div className="w-10 h-10 shrink-0 rounded-xl bg-choc-750 border border-choc-700/50 flex items-center justify-center text-lg group-hover:border-gold-700/30 transition-colors">
                  {f.icon}
                </div>
                <div>
                  <h3 className="font-body font-semibold text-choc-100 mb-1.5">{f.title}</h3>
                  <p className="font-body text-sm text-choc-400 leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Chain banner ── */}
      <section className="py-20 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="card-glow p-8 text-center">
            <p className="section-label mb-3">Deployed on</p>
            <h2 className="font-display text-3xl font-bold text-gradient-gold mb-2">Arc Testnet</h2>
            <p className="font-mono text-xs text-choc-500 mb-6">Chain ID: 5042002 · RPC: rpc.testnet.arc.network</p>
            <a href="https://faucet.circle.com" target="_blank" rel="noopener noreferrer"
              className="btn-secondary px-6 py-2.5 text-sm rounded-xl inline-flex"
            >
              Get testnet USDC from faucet ↗
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
