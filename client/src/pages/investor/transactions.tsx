import { useQuery } from "@tanstack/react-query";
import { Transaction, Startup } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { useState, useEffect } from "react";
import { TransactionTable } from "@/components/dashboard/transaction-table";
import { Loader2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CalendarIcon, Search, Filter } from "lucide-react";

export default function InvestorTransactions() {
  const { user } = useAuth();
  const [startupMap, setStartupMap] = useState<Map<number, Startup>>(new Map());
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [filters, setFilters] = useState({
    method: "all",
    status: "all",
    search: "",
    date: "",
  });

  // Fetch transactions for this investor
  const { data: transactions, isLoading: isLoadingTransactions } = useQuery<Transaction[]>({
    queryKey: ["/api/transactions/investor/me"],
    enabled: !!user,
  });

  // Fetch startups to get their names
  const { data: startups, isLoading: isLoadingStartups } = useQuery<Startup[]>({
    queryKey: ["/api/startups"],
    enabled: !!user,
  });

  // Create a map of startup ids to startup objects
  useEffect(() => {
    if (startups) {
      const map = new Map<number, Startup>();
      startups.forEach(startup => {
        map.set(startup.id, startup);
      });
      setStartupMap(map);
    }
  }, [startups]);

  // Apply filters
  useEffect(() => {
    if (!transactions) return;

    let filtered = [...transactions];

    // Filter by payment method
    if (filters.method !== "all") {
      filtered = filtered.filter(t => t.method === filters.method);
    }

    // Filter by status
    if (filters.status !== "all") {
      filtered = filtered.filter(t => t.status === filters.status);
    }

    // Filter by search term (startup name or transaction ID)
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(t => {
        const startup = startupMap.get(t.startupId);
        return (
          (startup && startup.name.toLowerCase().includes(searchLower)) ||
          (t.transactionReference && t.transactionReference.toLowerCase().includes(searchLower))
        );
      });
    }

    // Filter by date
    if (filters.date) {
      const filterDate = new Date(filters.date).toDateString();
      filtered = filtered.filter(t => 
        new Date(t.createdAt).toDateString() === filterDate
      );
    }

    setFilteredTransactions(filtered);
  }, [transactions, filters, startupMap]);

  if (isLoadingTransactions || isLoadingStartups) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-76px)]">
        <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-neutral-800">My Transactions</h1>
        <p className="text-neutral-600">Track and filter your startup investments</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6 mb-8">
        <div className="flex flex-col md:flex-row justify-between mb-6">
          <h2 className="text-lg font-bold text-neutral-800 mb-4 md:mb-0">Filters</h2>
          
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center w-full md:w-auto">
              <div className="relative w-full">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
                <Input
                  placeholder="Search startup or transaction ID"
                  className="pl-9"
                  value={filters.search}
                  onChange={(e) => setFilters({...filters, search: e.target.value})}
                />
              </div>
            </div>
            
            <Select
              value={filters.method}
              onValueChange={(value) => setFilters({...filters, method: value})}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Payment Method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Methods</SelectItem>
                <SelectItem value="metamask">MetaMask</SelectItem>
                <SelectItem value="upi">UPI</SelectItem>
              </SelectContent>
            </Select>
            
            <Select
              value={filters.status}
              onValueChange={(value) => setFilters({...filters, status: value})}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
            
            <div className="relative">
              <div className="absolute left-3 top-2.5">
                <CalendarIcon className="h-4 w-4 text-neutral-400" />
              </div>
              <Input
                type="date"
                className="pl-9"
                value={filters.date}
                onChange={(e) => setFilters({...filters, date: e.target.value})}
              />
            </div>
            
            <Button
              variant="outline"
              onClick={() => setFilters({
                method: "all",
                status: "all",
                search: "",
                date: "",
              })}
            >
              <Filter className="h-4 w-4 mr-2" />
              Reset
            </Button>
          </div>
        </div>

        {/* Transaction Table */}
        <TransactionTable 
          transactions={filteredTransactions} 
          startups={startupMap}
          type="investor"
        />
      </div>
    </div>
  );
}
