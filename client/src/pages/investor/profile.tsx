import { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Startup, Transaction } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { 
  Loader2, Edit, Wallet, User2, Mail, AtSign, 
  ArrowRight, Calendar, Building2, CheckCircle2
} from "lucide-react";
import { getInitials, formatCurrency, formatDate, truncateAddress } from "@/lib/utils";

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

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4 flex items-center justify-center min-h-[70vh]">
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
                  {user?.profilePicture ? (
                    <img 
                      src={user.profilePicture}
                      alt={`${user.username}'s profile`} 
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <AvatarFallback className="text-xl font-bold bg-primary/20 text-primary">
                      {getInitials(user?.username)}
                    </AvatarFallback>
                  )}
                </Avatar>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold">{user?.username}</h3>
                  <p className="text-sm text-muted-foreground capitalize">Investor</p>
                </div>
              </div>

              <div className="w-full pt-6 mt-4 border-t border-border space-y-4">
                <div className="flex items-center">
                  <User2 className="h-4 w-4 text-muted-foreground mr-3" />
                  <span className="text-sm">{user?.username || "Not specified"}</span>
                </div>
                <div className="flex items-center">
                  <Mail className="h-4 w-4 text-muted-foreground mr-3" />
                  <span className="text-sm">{user?.email}</span>
                </div>
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 text-muted-foreground mr-3" />
                  <span className="text-sm">Joined {user?.createdAt ? formatDate(user.createdAt.toString()) : "Recently"}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Wallet Status Card */}
          <Card className="mt-4">
            <CardHeader>
              <CardTitle className="text-base">Wallet Status</CardTitle>
            </CardHeader>
            <CardContent>
              {user?.walletAddress ? (
                <div className="flex flex-col items-start space-y-2">
                  <div className="flex items-center">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mr-2" />
                    <span className="text-sm font-medium">MetaMask Connected</span>
                  </div>
                  <div className="bg-neutral-100 text-neutral-800 text-xs p-2 rounded-md font-mono w-full break-all">
                    {user.walletAddress}
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-neutral-600">Connect your wallet to invest using cryptocurrency.</p>
                  <Button 
                    onClick={() => navigate("/wallet-connection")} 
                    variant="outline" 
                    className="w-full"
                  >
                    <Wallet className="h-4 w-4 mr-2" /> Connect Wallet
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* UPI Status Card */}
          <Card className="mt-4">
            <CardHeader>
              <CardTitle className="text-base">UPI Status</CardTitle>
            </CardHeader>
            <CardContent>
              {user?.upiId ? (
                <div className="flex flex-col items-start space-y-2">
                  <div className="flex items-center">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mr-2" />
                    <span className="text-sm font-medium">UPI ID Connected</span>
                  </div>
                  <div className="bg-neutral-100 text-neutral-800 text-xs p-2 rounded-md font-mono w-full">
                    {user.upiId}
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-neutral-600">Add your UPI ID to enable UPI payments.</p>
                  <Button 
                    onClick={() => navigate("/investor/connect-upi")} 
                    variant="outline" 
                    className="w-full"
                  >
                    <AtSign className="h-4 w-4 mr-2" /> Add UPI ID
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Investment Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Total Invested</p>
                  <p className="text-2xl font-bold">{formatCurrency(totalInvestment)}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Startups Funded</p>
                  <p className="text-2xl font-bold">
                    {new Set(transactions?.map(t => t.startupId)).size || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
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
                          {startup.imageUrl ? (
                            <img 
                              src={startup.imageUrl}
                              alt={`${startup.name} logo`} 
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <AvatarFallback className="text-xs font-bold bg-primary/10 text-primary">
                              {getInitials(startup.name)}
                            </AvatarFallback>
                          )}
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
                        View
                      </Button>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No startups available at the moment.</p>
                )}
                {startups && startups.length > 3 && (
                  <Button 
                    variant="link" 
                    className="w-full mt-2" 
                    onClick={() => navigate("/investor/discover")}
                  >
                    View All Startups
                  </Button>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Transaction History</CardTitle>
                <CardDescription>
                  View your investment transactions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {transactions && transactions.length > 0 ? (
                    transactions.slice(0, 3).map((transaction) => (
                      <div key={transaction.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <Building2 className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">
                              {startups?.find(s => s.id === transaction.startupId)?.name || "Unknown Startup"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {transaction.createdAt ? formatDate(transaction.createdAt.toString()) : "Recently"}
                            </p>
                          </div>
                        </div>
                        <p className="text-sm font-medium">{formatCurrency(transaction.amount)}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">No transactions yet.</p>
                  )}
                  {transactions && transactions.length > 3 && (
                    <Button 
                      variant="link" 
                      className="w-full mt-2" 
                      onClick={() => navigate("/investor/transactions")}
                    >
                      View All Transactions
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}