import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import HomePage from "@/pages/home-page";
import AuthPage from "@/pages/auth-page";
import WalletConnectionPage from "@/pages/wallet-connection";

// Startup pages
import StartupDashboard from "@/pages/startup/dashboard";
import StartupTransactions from "@/pages/startup/transactions";
import StartupUpdates from "@/pages/startup/updates";

// Investor pages
import InvestorDashboard from "@/pages/investor/dashboard";
import InvestorTransactions from "@/pages/investor/transactions";
import InvestorInvestments from "@/pages/investor/investments";
import InvestorInvest from "@/pages/investor/invest";

import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/lib/protected-route";
import { Header } from "@/components/layout/header";

function Router() {
  return (
    <>
      <Header />
      <main className="min-h-[calc(100vh-76px)]">
        <Switch>
          {/* Public Routes */}
          <Route path="/" component={HomePage} />
          <Route path="/auth" component={AuthPage} />
          <Route path="/wallet-connection" component={WalletConnectionPage} />

          {/* Protected Startup Routes */}
          <ProtectedRoute 
            path="/startup/dashboard" 
            component={StartupDashboard} 
            roles={["startup"]}
          />
          <ProtectedRoute 
            path="/startup/transactions" 
            component={StartupTransactions}
            roles={["startup"]}
          />
          <ProtectedRoute 
            path="/startup/updates" 
            component={StartupUpdates}
            roles={["startup"]}
          />

          {/* Protected Investor Routes */}
          <ProtectedRoute 
            path="/investor/dashboard" 
            component={InvestorDashboard}
            roles={["investor"]}
          />
          <ProtectedRoute 
            path="/investor/transactions" 
            component={InvestorTransactions}
            roles={["investor"]}
          />
          <ProtectedRoute 
            path="/investor/investments" 
            component={InvestorInvestments}
            roles={["investor"]}
          />
          <ProtectedRoute 
            path="/investor/invest/:startupId" 
            component={InvestorInvest}
            roles={["investor"]}
          />

          {/* Fallback to 404 */}
          <Route component={NotFound} />
        </Switch>
      </main>
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
