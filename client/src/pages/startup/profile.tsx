import { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Startup, Transaction } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Loader2, Edit, ArrowRight, Building2, Wallet, CheckCircle2 } from "lucide-react";
import { getInitials, formatCurrency, formatDate, truncateAddress } from "@/lib/utils";

export default function StartupProfile() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();

  // Fetch startup data
  const { data: startup, isLoading: isStartupLoading } = useQuery<Startup>({
    queryKey: ["/api/startups/user/me"],
    retry: false,
    refetchOnWindowFocus: false,
  });

  // Fetch transactions data
  const { data: transactions, isLoading: isTransactionsLoading } = useQuery<Transaction[]>({
    queryKey: ["/api/transactions/startup/me"],
    retry: false,
    refetchOnWindowFocus: false,
  });

  const isLoading = isStartupLoading || isTransactionsLoading;

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4 flex items-center justify-center min-h-[70vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!startup) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="text-center max-w-md mx-auto">
          <Building2 className="h-12 w-12 mx-auto text-primary" />
          <h2 className="mt-6 text-2xl font-bold">No Startup Profile</h2>
          <p className="mt-2 text-muted-foreground">
            You haven't created a startup profile yet.
          </p>
          <Button onClick={() => navigate("/startup/create")} className="mt-4">
            Create Startup Profile
          </Button>
        </div>
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
                <Button variant="ghost" size="sm" onClick={() => navigate("/startup/edit")} className="text-xs">
                  <Edit className="h-4 w-4 mr-1" /> Edit
                </Button>
              </div>
            </CardHeader>
            <CardContent className="py-6">
              <div className="flex flex-col items-center text-center space-y-4">
                <Avatar className="h-24 w-24">
                  <AvatarFallback className="text-xl font-bold bg-primary/20 text-primary">
                    {getInitials(startup.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold">{startup.name}</h3>
                  <p className="text-sm text-muted-foreground capitalize">
                    {startup.stage.replace(/-/g, " ")}
                  </p>
                </div>
                <div className="w-full pt-4 border-t border-border text-left">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Funding Goal</p>
                      <p className="text-sm font-medium">{formatCurrency(startup.fundingGoal)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">End Date</p>
                      <p className="text-sm font-medium">{startup.endDate ? formatDate(startup.endDate.toString()) : 'Not set'}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-xs text-muted-foreground">Raised So Far</p>
                      <p className="text-sm font-medium">{formatCurrency(startup.fundsRaised || 0)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Wallet Connection Status */}
          <Card className="mt-4">
            <CardHeader>
              <CardTitle className="text-base">Wallet Status</CardTitle>
            </CardHeader>
            <CardContent>
              {(user?.walletAddress || startup?.walletAddress) ? (
                <div className="flex flex-col items-start space-y-2">
                  <div className="flex items-center">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mr-2" />
                    <span className="text-sm font-medium">MetaMask Connected</span>
                  </div>
                  <div className="bg-neutral-100 text-neutral-800 text-xs p-2 rounded-md font-mono w-full break-all">
                    {user?.walletAddress || startup?.walletAddress}
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-neutral-600">Connect your wallet to receive cryptocurrency investments.</p>
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
        </div>

        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">About</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-neutral-600">{startup.description}</p>
            </CardContent>
          </Card>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Manage Updates</CardTitle>
                <CardDescription>
                  Share updates with your investors
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  variant="default" 
                  className="w-full"
                  onClick={() => navigate("/startup/updates")}
                >
                  Manage Updates <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Transaction History</CardTitle>
                <CardDescription>
                  View all investments and transactions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  variant="default" 
                  className="w-full"
                  onClick={() => navigate("/startup/transactions")}
                >
                  View Transactions <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}