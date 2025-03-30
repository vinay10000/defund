import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import HomePage from "@/pages/home-page";
import AuthPage from "@/pages/auth-page";
import WalletConnectionPage from "@/pages/wallet-connection";
import ProfilePage from "@/pages/profile-page";
import AccountSettingsPage from "@/pages/account-settings";
import AdminPage from "@/pages/admin-page";

// Startup pages
import StartupDashboard from "@/pages/startup/dashboard";
import StartupTransactions from "@/pages/startup/transactions";
import StartupUpdates from "@/pages/startup/updates";
import StartupCreate from "@/pages/startup/create";
import StartupProfile from "@/pages/startup/profile";
import StartupEdit from "@/pages/startup/edit";

// Investor pages
import InvestorDashboard from "@/pages/investor/dashboard";
import InvestorTransactions from "@/pages/investor/transactions";
import InvestorInvestments from "@/pages/investor/investments";
import InvestorInvest from "@/pages/investor/invest";
import InvestorProfile from "@/pages/investor/profile";

import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/lib/protected-route";
import { Header } from "@/components/layout/header";

function Router(): JSX.Element {
  return (
    <div className="flex flex-col min-h-screen relative overflow-hidden">
      {/* Background particle effect */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-10 -right-10 w-[400px] h-[400px] bg-purple-900/10 rounded-full blur-3xl"></div>
        <div className="absolute top-[20%] -left-20 w-[300px] h-[300px] bg-blue-900/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-[10%] w-[250px] h-[250px] bg-indigo-900/10 rounded-full blur-3xl"></div>
      </div>
      
      <Header />
      
      <main className="flex-1 px-4 sm:px-6 md:px-8 py-6 relative">
        <Switch>
          {/* Public Routes */}
          <Route path="/" component={HomePage} />
          <Route path="/auth" component={AuthPage} />
          <Route path="/wallet-connection" component={WalletConnectionPage} />
          
          {/* Shared Protected Routes */}
          <ProtectedRoute
            path="/profile"
            component={ProfilePage}
            roles={["startup", "investor"]}
          />
          <ProtectedRoute
            path="/account-settings"
            component={AccountSettingsPage}
            roles={["startup", "investor", "admin"]}
          />
          <ProtectedRoute
            path="/account/settings"
            component={AccountSettingsPage}
            roles={["startup", "investor", "admin"]}
          />
          <ProtectedRoute
            path="/admin"
            component={AdminPage}
            roles={["startup", "investor", "admin"]}
          />

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
          <ProtectedRoute 
            path="/startup/create" 
            component={StartupCreate}
            roles={["startup"]}
          />
          <ProtectedRoute 
            path="/startup/profile" 
            component={StartupProfile}
            roles={["startup"]}
          />
          <ProtectedRoute 
            path="/startup/edit" 
            component={StartupEdit}
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
          <ProtectedRoute 
            path="/investor/profile" 
            component={InvestorProfile}
            roles={["investor"]}
          />

          {/* Fallback to 404 */}
          <Route component={NotFound} />
        </Switch>
      </main>
      
      <footer className="py-4 px-6 text-center text-sm text-gray-500">
        <p className="opacity-70">© {new Date().getFullYear()} BlockVenture | Decentralized Investment Platform</p>
      </footer>
    </div>
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
