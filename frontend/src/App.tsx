import { BrowserRouter, Routes, Route } from "react-router-dom";
import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { wagmiConfig } from "@/config/chain";
import { Navbar } from "@/components/Navbar";
import Home from "@/pages/Home";
import CreateClaim from "@/pages/CreateClaim";
import Claim from "@/pages/Claim";
import Dashboard from "@/pages/Dashboard";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 2, staleTime: 10_000 } },
});

export default function App() {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <div className="min-h-screen bg-chocolate-900 text-chocolate-100">
            <Navbar />
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/create" element={<CreateClaim />} />
              <Route path="/claim/:claimId/:secret" element={<Claim />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="*" element={
                <main className="min-h-screen pt-32 px-4 text-center">
                  <h1 className="font-display text-4xl font-bold text-chocolate-50 mb-4">404</h1>
                  <p className="font-body text-chocolate-400">Page not found.</p>
                </main>
              } />
            </Routes>
          </div>
        </BrowserRouter>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
