import { useQuery } from "@tanstack/react-query";
import { Startup, User, Transaction, Document, Update } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { StartupInfo } from "@/components/dashboard/startup-info";
import { TotalRaisedCard, TotalInvestorsCard, InvestmentSourcesCard } from "@/components/dashboard/stats-card";
import { TransactionTable } from "@/components/dashboard/transaction-table";
import { UpdateForm } from "@/components/dashboard/update-form";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "wouter";

export default function StartupDashboard() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [userMap, setUserMap] = useState<Map<number, User>>(new Map());
  
  // If user hasn't completed startup profile, redirect to creation
  const { data: startup, isLoading: isLoadingStartup } = useQuery<Startup | undefined>({
    queryKey: ["/api/startups/user/me"],
    enabled: !!user,
    onError: () => {
      // If there's an error fetching the startup, redirect to create page
      navigate("/startup/create");
    }
  });

  // Fetch transactions for this startup
  const { data: transactions, isLoading: isLoadingTransactions } = useQuery<Transaction[]>({
    queryKey: ["/api/transactions/startup/me"],
    enabled: !!user && !!startup,
  });

  // Fetch documents for this startup
  const { data: documents, isLoading: isLoadingDocuments } = useQuery<Document[]>({
    queryKey: ["/api/startups", startup?.id, "documents"],
    enabled: !!startup,
  });

  // Get all investors who have invested in this startup
  useEffect(() => {
    // In a production app, we'd fetch the actual user details
    // For this MVP, we'll create mock investor profiles based on the transactions
    if (transactions && transactions.length > 0) {
      const investorIds = [...new Set(transactions.map(t => t.investorId))];
      const mockInvestors = new Map<number, User>();
      
      investorIds.forEach(id => {
        mockInvestors.set(id, {
          id,
          username: `Investor ${id}`,
          email: `investor${id}@example.com`,
          password: '',
          role: 'investor',
          walletAddress: null,
          upiId: null,
          createdAt: new Date()
        });
      });
      
      setUserMap(mockInvestors);
    }
  }, [transactions]);

  // If loading, show spinner
  if (isLoadingStartup) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-76px)]">
        <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
      </div>
    );
  }

  // If no startup profile exists, show create profile page
  if (!startup) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="max-w-2xl mx-auto text-center py-12">
          <h1 className="text-2xl font-bold text-neutral-800 mb-4">Welcome to DeFund!</h1>
          <p className="text-neutral-600 mb-8">
            To get started, you need to create your startup profile. This will allow investors to discover
            your startup and invest in your vision.
          </p>
          <Link href="/startup/create">
            <Button size="lg">Create Startup Profile</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-neutral-800">Startup Dashboard</h1>
        <p className="text-neutral-600">Manage your startup profile and track investments</p>
      </div>
      
      {/* Dashboard Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <TotalRaisedCard startup={startup} />
        <TotalInvestorsCard investors={Array.from(userMap.values())} />
        <InvestmentSourcesCard transactions={transactions || []} />
      </div>
      
      {/* Startup Information & Update Form */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2">
          <StartupInfo 
            startup={startup} 
            documents={documents || []} 
            onEditClick={() => {
              // In a full implementation, this would navigate to an edit page
              console.log("Edit startup info");
            }}
          />
        </div>
        <div>
          <UpdateForm startupId={startup.id} />
        </div>
      </div>
      
      {/* Recent Transactions */}
      <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6 mb-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-bold text-neutral-800">Recent Transactions</h2>
          <Link href="/startup/transactions">
            <Button variant="link" className="text-primary-500 hover:text-primary-700 text-sm font-medium">
              View All
            </Button>
          </Link>
        </div>
        
        <TransactionTable 
          transactions={transactions?.slice(0, 5) || []} 
          users={userMap}
          type="startup"
        />
      </div>
    </div>
  );
}
