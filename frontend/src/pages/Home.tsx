import { Link } from "react-router-dom";
import { useAccount } from "wagmi";
import { Button, Card } from "@/components/ui";

const features = [
  {
    icon: "🔐",
    title: "Zero-Knowledge Links",
    desc: "The secret is embedded in the URL only. We never store it. Only the holder of the link can claim the funds.",
  },
  {
    icon: "⛓",
    title: "On-Chain Settlement",
    desc: "Funds are locked in a non-custodial smart contract on Arc testnet. No intermediaries, no trust required.",
  },
  {
    icon: "⏱",
    title: "Auto-Expiry",
    desc: "Links expire after a configurable period. Unclaimed funds can be reclaimed by the sender.",
  },
  {
    icon: "🛡",
    title: "Front-Running Proof",
    desc: "The claim mechanism uses a commit-reveal scheme—miners cannot steal funds from a pending transaction.",
  },
];

const steps = [
  {
    num: "01",
    title: "Lock USDC",
    desc: "Approve the contract to spend your USDC, set an amount and expiry, and lock funds on-chain.",
  },
  {
    num: "02",
    title: "Share the Link",
    desc: "Copy the generated claim URL. Send it to your recipient through any channel you trust.",
  },
  {
    num: "03",
    title: "Claim Funds",
    desc: "The recipient opens the link, connects their wallet, and receives the USDC in one transaction.",
  },
];

export default function Home() {
  const { isConnected } = useAccount();

  return (
    <main className="min-h-screen">
      {/* Hero */}
      <section className="relative pt-32 pb-24 px-4 overflow-hidden" aria-labelledby="hero-heading">
        {/* Background orbs */}
        <div
          className="pointer-events-none absolute inset-0"
          aria-hidden="true"
        >
          <div className="absolute top-1/4 -left-32 w-96 h-96 bg-gold-500/5 rounded-full blur-3xl" />
          <div className="absolute top-1/3 right-0 w-80 h-80 bg-chocolate-600/20 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-3xl mx-auto text-center animate-fade-in">
          <div className="inline-flex items-center gap-2 bg-gold-500/10 border border-gold-600/30 rounded-full px-4 py-1.5 mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-gold-400 animate-pulse" aria-hidden="true" />
            <span className="text-gold-400 text-xs font-body font-medium tracking-wide uppercase">
              Arc Testnet · USDC Payments
            </span>
          </div>

          <h1
            id="hero-heading"
            className="font-display text-5xl sm:text-6xl font-bold text-chocolate-50 leading-tight mb-6"
          >
            Send USDC via{" "}
            <span className="text-gold-400 italic">one-time links</span>
          </h1>

          <p className="font-body text-lg text-chocolate-300 max-w-xl mx-auto mb-10 leading-relaxed">
            Lock funds in a smart contract, generate a claim link, and share it
            with anyone. No wallet address needed upfront. Funds claimed once,
            securely.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link to="/create">
              <Button variant="primary" size="lg" aria-label="Create a new claim link">
                Create a Claim Link
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Button>
            </Link>
            {isConnected && (
              <Link to="/dashboard">
                <Button variant="ghost" size="lg" aria-label="View your dashboard">
                  View Dashboard
                </Button>
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-4" aria-labelledby="how-it-works-heading">
        <div className="max-w-5xl mx-auto">
          <h2
            id="how-it-works-heading"
            className="font-display text-3xl font-bold text-chocolate-50 text-center mb-4"
          >
            How it works
          </h2>
          <p className="font-body text-chocolate-400 text-center mb-14 max-w-lg mx-auto">
            Three steps from sending to receiving. No accounts. No KYC.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {steps.map((step, i) => (
              <Card
                key={i}
                className="relative p-6 overflow-hidden animate-slide-up"
                style={{ animationDelay: `${i * 100}ms` } as React.CSSProperties}
              >
                <div
                  className="absolute top-4 right-4 font-display text-5xl font-bold text-chocolate-600/50 select-none"
                  aria-hidden="true"
                >
                  {step.num}
                </div>
                <div className="relative">
                  <div className="w-8 h-8 rounded-full bg-gold-500 flex items-center justify-center text-chocolate-900 font-display font-bold text-sm mb-4 shadow-gold-sm">
                    {i + 1}
                  </div>
                  <h3 className="font-display text-lg font-semibold text-chocolate-50 mb-2">
                    {step.title}
                  </h3>
                  <p className="font-body text-sm text-chocolate-400 leading-relaxed">
                    {step.desc}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4 border-t border-chocolate-700/50" aria-labelledby="features-heading">
        <div className="max-w-5xl mx-auto">
          <h2
            id="features-heading"
            className="font-display text-3xl font-bold text-chocolate-50 text-center mb-14"
          >
            Built with security first
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {features.map((f, i) => (
              <Card key={i} className="p-6 flex gap-4">
                <div
                  className="text-2xl shrink-0 mt-0.5"
                  aria-hidden="true"
                >
                  {f.icon}
                </div>
                <div>
                  <h3 className="font-body font-semibold text-chocolate-100 mb-1">
                    {f.title}
                  </h3>
                  <p className="font-body text-sm text-chocolate-400 leading-relaxed">
                    {f.desc}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Chain info banner */}
      <section className="py-12 px-4" aria-labelledby="chain-info-heading">
        <div className="max-w-2xl mx-auto">
          <Card className="p-6 text-center" glow>
            <p className="font-body text-xs text-chocolate-400 uppercase tracking-wider mb-2">
              Deployed on
            </p>
            <h2
              id="chain-info-heading"
              className="font-display text-xl font-bold text-gold-400 mb-1"
            >
              Arc Testnet
            </h2>
            <p className="font-mono text-xs text-chocolate-400">
              Chain ID: 5042002 · Gas token: USDC
            </p>
            <a
              href="https://faucet.circle.com"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center gap-1.5 text-sm font-body text-gold-500 hover:text-gold-400 underline"
            >
              Get testnet USDC from faucet ↗
            </a>
          </Card>
        </div>
      </section>
    </main>
  );
}
