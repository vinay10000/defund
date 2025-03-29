import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { Startup } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatCurrency, calculatePercentage, getStageColor } from "@/lib/utils";
import { UpiPayment } from "@/components/ui/upi-payment";
import { WalletConnect } from "@/components/ui/wallet-connect";
import { ethToWei, sendTransaction } from "@/lib/web3";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function InvestorInvest() {
  const { startupId } = useParams();
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [investmentAmount, setInvestmentAmount] = useState(1000);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Get startup info
  const { data: startup, isLoading: isLoadingStartup } = useQuery<Startup>({
    queryKey: ["/api/startups", startupId],
  });

  // Transaction mutation
  const metamaskMutation = useMutation({
    mutationFn: async ({ amount, txHash }: { amount: number, txHash: string }) => {
      const res = await apiRequest("POST", "/api/transactions", {
        startupId: parseInt(startupId),
        amount,
        method: "metamask",
        status: "completed",
        transactionReference: txHash,
      });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Investment Successful",
        description: `You have successfully invested ${formatCurrency(investmentAmount)} via MetaMask.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/transactions/investor/me"] });
      navigate("/investor/investments");
    },
    onError: (error: Error) => {
      toast({
        title: "Investment Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const handleMetaMaskPayment = async () => {
    if (!startup || !user?.walletAddress) return;
    
    setIsSubmitting(true);
    try {
      // This is a simplified implementation. In a real app,
      // you would use the actual startup's wallet address.
      const toAddress = startup.walletAddress || "0x71C7656EC7ab88b098defB751B7401B5f6d8976F";
      
      // Convert investment amount to wei
      const weiAmount = ethToWei(investmentAmount);
      
      // Send transaction
      const txHash = await sendTransaction({
        to: toAddress,
        value: weiAmount,
      });
      
      // Record transaction
      await metamaskMutation.mutateAsync({ amount: investmentAmount, txHash });
    } catch (error: any) {
      toast({
        title: "Payment Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingStartup) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-76px)]">
        <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
      </div>
    );
  }

  if (!startup) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-lg mx-auto text-center">
          <h1 className="text-2xl font-bold text-neutral-800 mb-4">Startup Not Found</h1>
          <p className="text-neutral-600 mb-6">
            The startup you're looking for could not be found. It may have been removed or the ID is incorrect.
          </p>
          <Button onClick={() => navigate("/investor/dashboard")}>
            Return to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const percentFunded = calculatePercentage(startup.fundsRaised, startup.fundingGoal);
  const stageClassName = getStageColor(startup.stage);
  
  // Format stage name for display
  const formatStage = (stage: string) => {
    return stage.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-neutral-800">Invest in {startup.name}</h1>
        <p className="text-neutral-600">Support this startup by investing via MetaMask or UPI</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Startup Info */}
        <div className="lg:col-span-2">
          <Card>
            <CardContent className="pt-6">
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-neutral-800">{startup.name}</h2>
                  <div className={`text-xs font-bold px-2 py-1 rounded ${stageClassName}`}>
                    {formatStage(startup.stage)}
                  </div>
                </div>
                
                <p className="text-neutral-600 mb-6">{startup.description}</p>
                
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-neutral-700 mb-2">Elevator Pitch</h3>
                  <p className="text-neutral-600 text-sm italic bg-neutral-50 p-4 rounded-md border border-neutral-200">
                    "{startup.pitch}"
                  </p>
                </div>
                
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-neutral-700">Funding Progress</span>
                    <span className="text-sm text-neutral-600">{percentFunded}% of {formatCurrency(startup.fundingGoal)}</span>
                  </div>
                  <div className="w-full bg-neutral-200 rounded-full h-2 mb-2">
                    <div 
                      className="bg-primary-500 h-2 rounded-full" 
                      style={{ width: `${percentFunded}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-neutral-600">{formatCurrency(startup.fundsRaised)} raised</span>
                    <span className="text-neutral-600">{formatCurrency(startup.fundingGoal - startup.fundsRaised)} remaining</span>
                  </div>
                </div>
                
                {/* Investment Amount Slider */}
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-neutral-700 mb-3">Investment Amount</h3>
                  <div className="flex items-center space-x-4">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setInvestmentAmount(1000)}
                      className={investmentAmount === 1000 ? "bg-primary-50 border-primary-200" : ""}
                    >
                      $1,000
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setInvestmentAmount(5000)}
                      className={investmentAmount === 5000 ? "bg-primary-50 border-primary-200" : ""}
                    >
                      $5,000
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setInvestmentAmount(10000)}
                      className={investmentAmount === 10000 ? "bg-primary-50 border-primary-200" : ""}
                    >
                      $10,000
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setInvestmentAmount(25000)}
                      className={investmentAmount === 25000 ? "bg-primary-50 border-primary-200" : ""}
                    >
                      $25,000
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setInvestmentAmount(50000)}
                      className={investmentAmount === 50000 ? "bg-primary-50 border-primary-200" : ""}
                    >
                      $50,000
                    </Button>
                  </div>
                </div>
                
                {/* If user has wallet, show pay with MetaMask button */}
                {user?.walletAddress && (
                  <Button 
                    className="w-full bg-amber-500 hover:bg-amber-600 mt-4" 
                    onClick={handleMetaMaskPayment}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <img src="https://metamask.io/images/metamask-fox.svg" alt="MetaMask" className="h-5 w-5 mr-2" />
                        Pay {formatCurrency(investmentAmount)} with MetaMask
                      </>
                    )}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Payment Options */}
        <div>
          <Tabs defaultValue={user?.walletAddress ? "upi" : "wallet"}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="wallet">MetaMask</TabsTrigger>
              <TabsTrigger value="upi">UPI</TabsTrigger>
            </TabsList>
            <TabsContent value="wallet" className="pt-4">
              <WalletConnect />
            </TabsContent>
            <TabsContent value="upi" className="pt-4">
              <UpiPayment startup={startup} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
