import { useQuery } from "@tanstack/react-query";
import { Startup, User } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { Loader2, Search } from "lucide-react";
import { StartupCard } from "@/components/ui/startup-card";
import { PortfolioCard, WalletStatusCard } from "@/components/dashboard/stats-card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState, useEffect } from "react";

export default function InvestorDashboard() {
  const { user } = useAuth();
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredStartups, setFilteredStartups] = useState<Startup[]>([]);
  
  // Get startups
  const { data: startups, isLoading } = useQuery<Startup[]>({
    queryKey: ["/api/startups"],
    enabled: !!user,
  });
  
  // Fetch our investments
  const { data: transactions } = useQuery({
    queryKey: ["/api/transactions/investor/me"],
    enabled: !!user,
  });

  // Process investments data for the portfolio card
  const investmentData = startups && transactions ? 
    startups
      .filter(startup => transactions.some(t => t.startupId === startup.id))
      .map(startup => {
        const amount = transactions
          .filter(t => t.startupId === startup.id)
          .reduce((sum, t) => sum + t.amount, 0);
        
        // Generate a random percent change for display purposes
        // In a real app, this would be calculated from actual data
        const percentChange = parseFloat((Math.random() * 20 - 5).toFixed(1));
        
        return { startup, amount, percentChange };
      })
    : [];
  
  // Apply filters
  useEffect(() => {
    if (!startups) return;
    
    let filtered = [...startups];
    
    // Apply stage filter
    if (filter !== "all") {
      filtered = filtered.filter(startup => startup.stage === filter);
    }
    
    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        startup => 
          startup.name.toLowerCase().includes(term) || 
          startup.description.toLowerCase().includes(term)
      );
    }
    
    setFilteredStartups(filtered);
  }, [startups, filter, searchTerm]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-76px)]">
        <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-neutral-800">Investor Dashboard</h1>
        <p className="text-neutral-600">Discover and invest in promising startups</p>
      </div>
      
      {/* Dashboard Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="col-span-2">
          <PortfolioCard investments={investmentData} />
        </div>
        <WalletStatusCard user={user as User} />
      </div>
      
      {/* Recommended Startups */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-neutral-800 mb-4 md:mb-0">Recommended Startups</h2>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
              <Input
                placeholder="Search startups..."
                className="pl-9 w-full md:w-[250px]"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Filter by stage" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Stages</SelectItem>
                <SelectItem value="pre-seed">Pre-seed</SelectItem>
                <SelectItem value="seed">Seed</SelectItem>
                <SelectItem value="series-a">Series A</SelectItem>
                <SelectItem value="series-b">Series B</SelectItem>
                <SelectItem value="series-c">Series C</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        {filteredStartups.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredStartups.map((startup) => (
              <StartupCard key={startup.id} startup={startup} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-neutral-50 rounded-lg">
            <h3 className="text-lg font-medium text-neutral-700">No startups found</h3>
            <p className="text-neutral-500 mt-1">
              Try changing your filters or check back later for new opportunities
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
