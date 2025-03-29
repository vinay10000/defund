import { useQuery } from "@tanstack/react-query";
import { Transaction, User } from "@shared/schema";
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

export default function StartupTransactions() {
  const { user } = useAuth();
  const [userMap, setUserMap] = useState<Map<number, User>>(new Map());
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [filters, setFilters] = useState({
    method: "all",
    status: "all",
    search: "",
    date: "",
  });

  // Fetch transactions for this startup
  const { data: transactions, isLoading } = useQuery<Transaction[]>({
    queryKey: ["/api/transactions/startup/me"],
    enabled: !!user,
  });

  // Get all investors who have transacted
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
          walletAddress: id % 2 === 0 ? `0x${id}C7656EC7ab88b098defB751B7401B5f6d8976F` : null,
          upiId: id % 2 !== 0 ? `investor${id}@okaxis` : null,
          createdAt: new Date()
        });
      });
      
      setUserMap(mockInvestors);
    }
  }, [transactions]);

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

    // Filter by search term (investor name or transaction ID)
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(t => {
        const investor = userMap.get(t.investorId);
        return (
          (investor && investor.username.toLowerCase().includes(searchLower)) ||
          (t.transactionReference && t.transactionReference.toLowerCase().includes(searchLower))
        );
      });
    }

    // Filter by date (in a real app, this would be more sophisticated)
    if (filters.date) {
      // This is a simplified implementation
      const filterDate = new Date(filters.date).toDateString();
      filtered = filtered.filter(t => 
        new Date(t.createdAt).toDateString() === filterDate
      );
    }

    setFilteredTransactions(filtered);
  }, [transactions, filters, userMap]);

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
        <h1 className="text-2xl font-bold text-neutral-800">Transaction History</h1>
        <p className="text-neutral-600">View and filter transactions from your investors</p>
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
                  placeholder="Search investor or transaction ID"
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
          users={userMap}
          type="startup"
        />
      </div>
    </div>
  );
}
