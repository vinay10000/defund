import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, useRoute } from "wouter";
import { Startup, Update, InsertTransaction, Transaction } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { 
  Loader2, ArrowLeft, Building2, Info, DollarSign, IndianRupee, Wallet, AlertCircle
} from "lucide-react";
import { getInitials, formatCurrency, formatDate, truncateAddress } from "@/lib/utils";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { connectMetaMask, sendTransaction, ethToWei } from "@/lib/web3";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function InvestPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [, params] = useRoute("/investor/invest/:id");
  const startupId = params?.id;

  const [amount, setAmount] = useState("");
  const [isInvestDialogOpen, setIsInvestDialogOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"metamask" | "upi">("metamask");

  // Fetch the startup data
  const { 
    data: startup, 
    isLoading: isStartupLoading 
  } = useQuery<Startup>({
    queryKey: [`/api/startups/${startupId}`],
    enabled: !!startupId,
    retry: false,
    refetchOnWindowFocus: false,
  });

  // Fetch updates for this startup
  const { 
    data: updates, 
    isLoading: isUpdatesLoading 
  } = useQuery<Update[]>({
    queryKey: [`/api/updates/startup/${startupId}`],
    enabled: !!startupId,
    retry: false,
    refetchOnWindowFocus: false,
  });

  // Mutation for creating a transaction
  const createTransactionMutation = useMutation({
    mutationFn: async (data: InsertTransaction) => {
      const res = await apiRequest("POST", "/api/transactions", data);
      return await res.json() as Transaction;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/startups/${startupId}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/transactions/investor/me"] });
      toast({
        title: "Investment successful",
        description: "Your investment has been processed successfully.",
      });
      setIsInvestDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Investment failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleMetamaskInvestment = async () => {
    if (!startup || !user) return;
    if (!user.walletAddress) {
      toast({
        title: "Wallet required",
        description: "Please connect your MetaMask wallet before investing.",
        variant: "destructive",
      });
      return;
    }

    try {
      const numAmount = parseFloat(amount);
      if (isNaN(numAmount) || numAmount <= 0) {
        throw new Error("Please enter a valid amount");
      }

      // Get the recipient wallet address (startup's wallet)
      const recipientWallet = startup.walletAddress;
      if (!recipientWallet) {
        throw new Error("This startup has not connected a wallet for cryptocurrency payments");
      }

      // Send the transaction using MetaMask
      const txHash = await sendTransaction({
        to: recipientWallet,
        value: ethToWei(numAmount),
      });

      // Record the transaction in our database
      if (user) { // Add null check for TypeScript
        createTransactionMutation.mutate({
          investorId: user.id,
          startupId: startup.id,
          amount: numAmount,
          transactionReference: txHash,
          method: "metamask",
          status: "completed",
        });
      }

    } catch (error: any) {
      toast({
        title: "Transaction failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleUpiInvestment = async () => {
    if (!startup || !user) return;
    if (!startup.upiId) {
      toast({
        title: "UPI not available",
        description: "This startup doesn't have a UPI ID for payments.",
        variant: "destructive",
      });
      return;
    }

    try {
      const numAmount = parseFloat(amount);
      if (isNaN(numAmount) || numAmount <= 0) {
        throw new Error("Please enter a valid amount");
      }

      // For UPI payments, we'll just record the transaction and provide instructions
      // In a real app, we'd use a UPI payment gateway API here
      if (user) { // Add null check for TypeScript
        createTransactionMutation.mutate({
          investorId: user.id,
          startupId: startup.id,
          amount: numAmount,
          method: "upi",
          status: "pending",
          transactionReference: "UPI-PENDING", // This would normally be a real UPI transaction ID
        });
      }

      // Open UPI app if possible
      window.open(`upi://pay?pa=${startup.upiId}&pn=${startup.name}&am=${numAmount}&cu=INR`, "_blank");

    } catch (error: any) {
      toast({
        title: "Transaction failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleInvest = () => {
    if (paymentMethod === "metamask") {
      handleMetamaskInvestment();
    } else {
      handleUpiInvestment();
    }
  };

  const isLoading = isStartupLoading || isUpdatesLoading;

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
          <AlertCircle className="h-12 w-12 mx-auto text-destructive" />
          <h2 className="mt-6 text-2xl font-bold">Startup Not Found</h2>
          <p className="mt-2 text-muted-foreground">
            The startup you're looking for could not be found.
          </p>
          <Button onClick={() => navigate("/investor/discover")} className="mt-4">
            Browse Startups
          </Button>
        </div>
      </div>
    );
  }

  const percentageRaised = startup.fundsRaised 
    ? Math.min(Math.round((startup.fundsRaised / startup.fundingGoal) * 100), 100) 
    : 0;

  return (
    <div className="container mx-auto py-8 px-4">
      <Button 
        variant="ghost" 
        className="mb-6" 
        onClick={() => navigate("/investor/discover")}
      >
        <ArrowLeft className="h-4 w-4 mr-2" /> Back to Startups
      </Button>

      <div className="grid gap-8 grid-cols-1 lg:grid-cols-3">
        {/* Startup Info Card */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader className="border-b border-border">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl">{startup.name}</CardTitle>
                <span className="text-xs font-medium px-2 py-1 bg-primary/10 text-primary rounded-full capitalize">
                  {startup.stage.replace(/-/g, " ")}
                </span>
              </div>
            </CardHeader>
            <CardContent className="py-6">
              <div className="flex flex-col items-center text-center space-y-4">
                <Avatar className="h-24 w-24">
                  <AvatarFallback className="text-xl font-bold bg-primary/20 text-primary">
                    {getInitials(startup.name)}
                  </AvatarFallback>
                </Avatar>
                
                <div className="w-full pt-4 border-t border-border">
                  <div className="space-y-6">
                    <div>
                      <p className="text-sm text-muted-foreground">Funding Goal</p>
                      <p className="text-lg font-medium">{formatCurrency(startup.fundingGoal)}</p>
                    </div>
                    
                    <div>
                      <div className="flex justify-between mb-1">
                        <p className="text-sm text-muted-foreground">Raised</p>
                        <p className="text-sm font-medium">{percentageRaised}%</p>
                      </div>
                      <div className="w-full h-2 bg-neutral-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary rounded-full" 
                          style={{ width: `${percentageRaised}%` }} 
                        />
                      </div>
                      <p className="text-sm font-medium mt-1">
                        {formatCurrency(startup.fundsRaised || 0)} raised
                      </p>
                    </div>
                    
                    {startup.endDate && (
                      <div>
                        <p className="text-sm text-muted-foreground">Funding Ends</p>
                        <p className="text-sm font-medium">{formatDate(startup.endDate.toString())}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col">
              <Dialog open={isInvestDialogOpen} onOpenChange={setIsInvestDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="w-full">Invest Now</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Invest in {startup.name}</DialogTitle>
                    <DialogDescription>
                      Support this startup by making an investment.
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="amount">Investment Amount (ETH)</Label>
                      <Input
                        id="amount"
                        placeholder="Enter amount in ETH"
                        type="number"
                        min="0"
                        step="0.001"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Payment Method</Label>
                      <div className="grid grid-cols-2 gap-4">
                        <Button
                          type="button"
                          variant={paymentMethod === "metamask" ? "default" : "outline"}
                          onClick={() => setPaymentMethod("metamask")}
                          disabled={!startup.walletAddress}
                          className="flex items-center justify-center"
                        >
                          <Wallet className="h-4 w-4 mr-2" />
                          MetaMask
                        </Button>
                        <Button
                          type="button"
                          variant={paymentMethod === "upi" ? "default" : "outline"}
                          onClick={() => setPaymentMethod("upi")}
                          disabled={!startup.upiId}
                          className="flex items-center justify-center"
                        >
                          <IndianRupee className="h-4 w-4 mr-2" />
                          UPI
                        </Button>
                      </div>
                      
                      {paymentMethod === "metamask" && !startup.walletAddress && (
                        <Alert variant="destructive" className="mt-2">
                          <AlertCircle className="h-4 w-4" />
                          <AlertTitle>Not Available</AlertTitle>
                          <AlertDescription>
                            This startup hasn't connected a MetaMask wallet yet.
                          </AlertDescription>
                        </Alert>
                      )}
                      
                      {paymentMethod === "upi" && !startup.upiId && (
                        <Alert variant="destructive" className="mt-2">
                          <AlertCircle className="h-4 w-4" />
                          <AlertTitle>Not Available</AlertTitle>
                          <AlertDescription>
                            This startup hasn't provided UPI details yet.
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                    
                    {paymentMethod === "metamask" && !user?.walletAddress && (
                      <Alert className="mt-2">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Wallet Required</AlertTitle>
                        <AlertDescription>
                          You need to connect your MetaMask wallet first.
                          <Button 
                            variant="link" 
                            className="p-0 h-auto font-normal ml-2"
                            onClick={() => {
                              setIsInvestDialogOpen(false);
                              navigate("/wallet-connection");
                            }}
                          >
                            Connect Wallet
                          </Button>
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                  
                  <DialogFooter>
                    <Button 
                      variant="outline" 
                      onClick={() => setIsInvestDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleInvest}
                      disabled={
                        !amount || 
                        (paymentMethod === "metamask" && (!user?.walletAddress || !startup.walletAddress)) ||
                        (paymentMethod === "upi" && !startup.upiId) ||
                        createTransactionMutation.isPending
                      }
                    >
                      {createTransactionMutation.isPending && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Confirm Investment
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardFooter>
          </Card>
        </div>

        {/* Startup Details */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="about">
            <TabsList className="w-full">
              <TabsTrigger value="about" className="flex-1">About</TabsTrigger>
              <TabsTrigger value="updates" className="flex-1">Updates</TabsTrigger>
              <TabsTrigger value="documents" className="flex-1">Documents</TabsTrigger>
            </TabsList>
            
            <TabsContent value="about" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>About {startup.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-line">
                    {startup.description}
                  </p>
                  
                  <div className="mt-6">
                    <h3 className="text-lg font-medium mb-3">Pitch</h3>
                    <p className="whitespace-pre-line">
                      {startup.pitch}
                    </p>
                  </div>
                  
                  {(startup.walletAddress || startup.upiId) && (
                    <div className="mt-6">
                      <h3 className="text-lg font-medium mb-3">Payment Information</h3>
                      <div className="space-y-2">
                        {startup.walletAddress && (
                          <div className="flex items-start space-x-2">
                            <Wallet className="h-5 w-5 text-muted-foreground mt-0.5" />
                            <div>
                              <p className="text-sm font-medium">Wallet Address</p>
                              <p className="text-xs font-mono break-all">{startup.walletAddress}</p>
                            </div>
                          </div>
                        )}
                        
                        {startup.upiId && (
                          <div className="flex items-start space-x-2">
                            <IndianRupee className="h-5 w-5 text-muted-foreground mt-0.5" />
                            <div>
                              <p className="text-sm font-medium">UPI ID</p>
                              <p className="text-xs">{startup.upiId}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="updates" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Updates from {startup.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  {updates && updates.length > 0 ? (
                    <Accordion type="single" collapsible className="w-full">
                      {updates.map((update) => (
                        <AccordionItem key={update.id} value={update.id.toString()}>
                          <AccordionTrigger>
                            <div className="flex items-center">
                              <span className="text-left font-medium">{update.title}</span>
                              <span className="text-xs text-muted-foreground ml-4">
                                {formatDate(update.createdAt?.toString() || "")}
                              </span>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent>
                            <p className="whitespace-pre-line">{update.content}</p>
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  ) : (
                    <div className="text-center py-12">
                      <Info className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-medium">No Updates Yet</h3>
                      <p className="text-muted-foreground">
                        This startup hasn't posted any updates yet.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="documents" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Documents</CardTitle>
                </CardHeader>
                <CardContent>
                  {startup.documentUrl ? (
                    <div className="border rounded-md p-4">
                      <div className="flex items-center">
                        <div className="h-10 w-10 bg-primary/10 rounded-md flex items-center justify-center">
                          <Building2 className="h-5 w-5 text-primary" />
                        </div>
                        <div className="ml-4">
                          <p className="font-medium">Company Documents</p>
                          <p className="text-sm text-muted-foreground">
                            View startup's official documents
                          </p>
                        </div>
                        <Button 
                          variant="outline" 
                          className="ml-auto"
                          onClick={() => {
                            if (startup.documentUrl) {
                              window.open(startup.documentUrl, "_blank");
                            }
                          }}
                        >
                          View
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Info className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-medium">No Documents</h3>
                      <p className="text-muted-foreground">
                        This startup hasn't uploaded any documents yet.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}