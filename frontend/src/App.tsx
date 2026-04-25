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

function NotFound() {
  return (
    <main className="page-wrapper min-h-screen flex items-center justify-center px-4">
      <div className="text-center">
        <p className="font-display text-8xl font-bold text-choc-800 mb-4 select-none">404</p>
        <h1 className="font-display text-2xl font-semibold text-choc-300 mb-2">Page not found</h1>
        <p className="font-body text-choc-500 text-sm">The page you're looking for doesn't exist.</p>
      </div>
    </main>
  );
}

export default function App() {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <div className="min-h-screen bg-choc-900 text-choc-100">
            <Navbar/>
            <Routes>
              <Route path="/" element={<Home/>}/>
              <Route path="/create" element={<CreateClaim/>}/>
              <Route path="/claim/:claimId/:secret" element={<Claim/>}/>
              <Route path="/dashboard" element={<Dashboard/>}/>
              <Route path="*" element={<NotFound/>}/>
            </Routes>
          </div>
        </BrowserRouter>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
