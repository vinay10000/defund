import { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Startup, Transaction } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Loader2, Edit, Wallet, User2, Mail, AtSign, ArrowRight, Calendar, Building2 } from "lucide-react";
import { getInitials, formatCurrency, formatDate } from "@/lib/utils";

export default function InvestorProfile() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();

  // Fetch transactions data
  const { data: transactions, isLoading: isTransactionsLoading } = useQuery<Transaction[]>({
    queryKey: ["/api/transactions/investor/me"],
    retry: false,
    refetchOnWindowFocus: false,
  });

  // Fetch all startups data
  const { data: startups, isLoading: isStartupsLoading } = useQuery<Startup[]>({
    queryKey: ["/api/startups"],
    retry: false,
    refetchOnWindowFocus: false,
  });

  const isLoading = isTransactionsLoading || isStartupsLoading;

  // Calculate total investment amount
  const totalInvestment = transactions?.reduce((total, transaction) => {
    return total + transaction.amount;
  }, 0) || 0;

  // Count unique startups invested in
  const uniqueStartups = new Set(transactions?.map(t => t.startupId));
  const startupCount = uniqueStartups.size;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="grid gap-8 grid-cols-1 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <Card>
            <CardHeader className="border-b border-border">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl">Profile</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => navigate("/investor/edit")} className="text-xs">
                  <Edit className="h-4 w-4 mr-1" /> Edit
                </Button>
              </div>
            </CardHeader>
            <CardContent className="py-6">
              <div className="flex flex-col items-center text-center space-y-4">
                <Avatar className="h-24 w-24">
                  <AvatarFallback className="text-xl font-bold bg-primary/20 text-primary">
                    {getInitials(user?.username)}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold">{user?.username}</h3>
                  <p className="text-sm text-muted-foreground capitalize">Investor</p>
                </div>
              </div>

              <div className="mt-8 space-y-4">
                <div className="flex items-center gap-3">
                  <User2 className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Name</p>
                    <p className="text-sm text-muted-foreground">{user?.username}</p>
                  </div>
                </div>
                {user?.email && (
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Email</p>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                  </div>
                )}
                {user?.username && (
                  <div className="flex items-center gap-3">
                    <AtSign className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Username</p>
                      <p className="text-sm text-muted-foreground">{user.username}</p>
                    </div>
                  </div>
                )}
                {user?.walletAddress && (
                  <div className="flex items-center gap-3">
                    <Wallet className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Wallet</p>
                      <p className="text-sm text-muted-foreground">
                        {user.walletAddress.substring(0, 6)}...{user.walletAddress.substring(38)}
                      </p>
                    </div>
                  </div>
                )}
                {user?.createdAt && (
                  <div className="flex items-center gap-3">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Joined</p>
                      <p className="text-sm text-muted-foreground">{formatDate(user.createdAt)}</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {!user?.walletAddress && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-base">Connect Wallet</CardTitle>
                <CardDescription>
                  Connect your MetaMask wallet to invest using cryptocurrency.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => navigate("/wallet-connection")}
                >
                  <Wallet className="h-4 w-4 mr-2" /> Connect Wallet
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Investment Overview</CardTitle>
              <CardDescription>
                Summary of your investment activities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-4">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">Total Invested</h3>
                  <p className="text-2xl font-bold">{formatCurrency(totalInvestment)}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">Startups Funded</h3>
                  <p className="text-2xl font-bold">{startupCount}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">Transactions</h3>
                  <p className="text-2xl font-bold">{transactions?.length || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Recent Investments</CardTitle>
                <CardDescription>
                  Your latest startup investments
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {transactions && transactions.length > 0 ? (
                  transactions.slice(0, 3).map((transaction) => {
                    const startup = startups?.find(s => s.id === transaction.startupId);
                    return (
                      <div key={transaction.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="text-xs font-bold bg-primary/10 text-primary">
                              {getInitials(startup?.name || '')}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-medium">{startup?.name || 'Unknown Startup'}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatDate(transaction.createdAt)}
                            </p>
                          </div>
                        </div>
                        <div>
                          <p className="text-sm font-medium">{formatCurrency(transaction.amount)}</p>
                          <p className="text-xs text-right text-muted-foreground capitalize">
                            {transaction.method}
                          </p>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-center text-sm text-muted-foreground py-4">
                    No investments yet
                  </p>
                )}

                <Button 
                  variant="outline" 
                  className="w-full mt-4"
                  onClick={() => navigate("/investor/transactions")}
                >
                  View All Transactions <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Explore Startups</CardTitle>
                <CardDescription>
                  Discover promising startups to invest in
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {startups && startups.length > 0 ? (
                  startups.slice(0, 3).map((startup) => (
                    <div key={startup.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-xs font-bold bg-primary/10 text-primary">
                            {getInitials(startup.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">{startup.name}</p>
                          <p className="text-xs text-muted-foreground capitalize">
                            {startup.stage.replace(/-/g, ' ')}
                          </p>
                        </div>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => navigate(`/investor/invest/${startup.id}`)}
                      >
                        Invest
                      </Button>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-sm text-muted-foreground py-4">
                    No startups available
                  </p>
                )}

                <Button 
                  variant="default" 
                  className="w-full mt-4"
                  onClick={() => navigate("/")}
                >
                  <Building2 className="h-4 w-4 mr-2" /> Browse All Startups
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}