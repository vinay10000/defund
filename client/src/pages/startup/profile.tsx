import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { User, Startup } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Loader2, Edit, Wallet, Building2, Mail, AtSign, ArrowRight } from "lucide-react";
import { getInitials, formatCurrency, getStageColor } from "@/lib/utils";

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

  // If user has no startup yet, redirect to create page
  useEffect(() => {
    if (!isStartupLoading && !startup) {
      toast({
        title: "No startup profile found",
        description: "Please create your startup profile first.",
      });
      navigate("/startup/create");
    }
  }, [startup, isStartupLoading, navigate, toast]);

  if (isStartupLoading) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!startup) {
    return null;
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
                  <Badge variant="secondary" className={`${getStageColor(startup.stage)}`}>
                    {startup.stage.replace(/-/g, ' ').toUpperCase()}
                  </Badge>
                </div>
              </div>

              <div className="mt-8 space-y-4">
                <div className="flex items-center gap-3">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Company</p>
                    <p className="text-sm text-muted-foreground">{startup.name}</p>
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
              </div>
            </CardContent>
          </Card>

          {!user?.walletAddress && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-base">Connect Wallet</CardTitle>
                <CardDescription>
                  Connect your MetaMask wallet to receive investments in cryptocurrency.
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
              <CardTitle>Startup Details</CardTitle>
              <CardDescription>
                Information about your startup
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Description</h3>
                <p className="text-sm">{startup.description}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Elevator Pitch</h3>
                <p className="text-sm">{startup.pitch}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-border">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">Funding Goal</h3>
                  <p className="text-lg font-bold">{formatCurrency(startup.fundingGoal)}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">Funds Raised</h3>
                  <p className="text-lg font-bold">
                    {formatCurrency(startup.fundsRaised)} 
                    <span className="text-sm font-normal text-muted-foreground">
                      ({Math.round((startup.fundsRaised / startup.fundingGoal) * 100)}%)
                    </span>
                  </p>
                </div>
              </div>
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