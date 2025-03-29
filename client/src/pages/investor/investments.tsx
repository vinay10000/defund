import { useQuery } from "@tanstack/react-query";
import { Startup, Transaction, Update } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Link } from "wouter";
import { StartupCard } from "@/components/ui/startup-card";
import { useState, useEffect } from "react";

export default function InvestorInvestments() {
  const { user } = useAuth();
  const [investedStartups, setInvestedStartups] = useState<Map<number, Startup>>(new Map());
  const [investmentAmounts, setInvestmentAmounts] = useState<Map<number, number>>(new Map());

  // Fetch transactions for this investor
  const { data: transactions, isLoading: isLoadingTransactions } = useQuery<Transaction[]>({
    queryKey: ["/api/transactions/investor/me"],
    enabled: !!user,
  });

  // Fetch all startups to find the ones we've invested in
  const { data: startups, isLoading: isLoadingStartups } = useQuery<Startup[]>({
    queryKey: ["/api/startups"],
    enabled: !!user,
  });

  // Fetch updates from invested startups
  const { data: updates, isLoading: isLoadingUpdates } = useQuery<Update[]>({
    queryKey: ["/api/updates/investor/me"],
    enabled: !!user,
  });

  // Process the data to get invested startups
  useEffect(() => {
    if (transactions && startups) {
      const invested = new Map<number, Startup>();
      const amounts = new Map<number, number>();
      
      // Find unique startups we've invested in
      transactions.forEach(transaction => {
        const startup = startups.find(s => s.id === transaction.startupId);
        if (startup) {
          invested.set(startup.id, startup);
          
          // Sum up investment amounts
          const current = amounts.get(startup.id) || 0;
          amounts.set(startup.id, current + transaction.amount);
        }
      });
      
      setInvestedStartups(invested);
      setInvestmentAmounts(amounts);
    }
  }, [transactions, startups]);

  if (isLoadingTransactions || isLoadingStartups || isLoadingUpdates) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-76px)]">
        <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
      </div>
    );
  }

  // If no investments, show empty state
  if (investedStartups.size === 0) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-neutral-800">My Investments</h1>
          <p className="text-neutral-600">Track all your startup investments in one place</p>
        </div>
        
        <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-neutral-200">
          <h2 className="text-xl font-bold text-neutral-800 mb-4">No Investments Yet</h2>
          <p className="text-neutral-600 mb-6 max-w-md mx-auto">
            You haven't invested in any startups yet. Explore our curated list of startups and start investing today.
          </p>
          <Link href="/investor/dashboard">
            <Button>Explore Startups</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-neutral-800">My Investments</h1>
        <p className="text-neutral-600">Track all your startup investments in one place</p>
      </div>
      
      {/* Invested Startups */}
      <div className="mb-8">
        <h2 className="text-lg font-bold text-neutral-800 mb-6">Your Portfolio</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from(investedStartups.values()).map((startup) => (
            <div key={startup.id} className="flex flex-col">
              <StartupCard 
                startup={startup} 
                showInvestButton={false}
              />
              <div className="mt-2 p-3 bg-neutral-50 rounded-md border border-neutral-200">
                <p className="text-sm text-neutral-600">
                  Your Investment: <span className="font-medium text-neutral-800">{formatCurrency(investmentAmounts.get(startup.id) || 0)}</span>
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Recent Updates */}
      <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6 mb-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-bold text-neutral-800">Recent Updates from Your Investments</h2>
        </div>
        
        {updates && updates.length > 0 ? (
          <div className="space-y-6">
            {updates.map((update) => {
              const startup = investedStartups.get(update.startupId);
              return (
                <Card key={update.id} className="border-0 shadow-none">
                  <CardHeader className="pb-2 pt-0 px-0">
                    <div className="flex items-start">
                      <div className="h-10 w-10 bg-neutral-100 rounded-md flex items-center justify-center text-primary-500 mr-3">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="h-5 w-5"
                        >
                          <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                          <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <div className="font-medium text-neutral-800">{startup?.name || "Unknown Startup"}</div>
                          <div className="text-xs text-neutral-500">{formatDate(update.createdAt)}</div>
                        </div>
                        <h3 className="font-medium text-neutral-800 mb-2">{update.title}</h3>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pb-6 pt-0 px-0 ml-[52px]">
                    <p className="text-sm text-neutral-600 mb-3 line-clamp-3">
                      {update.content}
                    </p>
                    <Button variant="link" className="px-0 h-auto text-primary-500 hover:text-primary-700 text-sm font-medium">
                      Read More
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-neutral-600">No updates from your investments yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
