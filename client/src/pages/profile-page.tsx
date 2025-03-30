import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  User, Settings, Wallet, CreditCard, ChevronRight, LogOut, 
  ExternalLink, Copy, Check, Loader2
} from "lucide-react";
import { useLocation } from "wouter";
import { getInitials, truncateAddress } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getCurrentAccount, connectMetaMask } from "@/lib/web3";

export default function ProfilePage() {
  const { user, logoutMutation, connectWalletMutation, connectUpiMutation } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  
  const [upiId, setUpiId] = useState("");
  const [copied, setCopied] = useState(false);
  const [isConnectingWallet, setIsConnectingWallet] = useState(false);

  if (!user) {
    return (
      <div className="container mx-auto py-16 px-4 text-center">
        <h1 className="text-2xl font-bold mb-4">Please log in to view your profile</h1>
        <Button onClick={() => navigate("/auth")}>Go to Login</Button>
      </div>
    );
  }

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    toast({
      title: "Copied to clipboard",
      description: "The wallet address has been copied to your clipboard.",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSuccess: () => {
        navigate("/auth");
      }
    });
  };

  const connectWallet = async () => {
    try {
      setIsConnectingWallet(true);
      // Check if MetaMask is already connected first
      let account = await getCurrentAccount();
      
      // If not connected, request connection
      if (!account) {
        account = await connectMetaMask();
      }
      
      // Update user record with wallet address
      if (account) {
        connectWalletMutation.mutate({ walletAddress: account });
      }
    } catch (error: any) {
      toast({
        title: "Connection failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsConnectingWallet(false);
    }
  };

  const handleUpiConnect = () => {
    if (!upiId) {
      toast({
        title: "Missing UPI ID",
        description: "Please enter a valid UPI ID",
        variant: "destructive",
      });
      return;
    }

    connectUpiMutation.mutate({ upiId }, {
      onSuccess: () => {
        toast({
          title: "UPI ID connected",
          description: "Your UPI ID has been successfully connected.",
        });
        setUpiId("");
      }
    });
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Profile Sidebar */}
          <div className="md:col-span-1">
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-col items-center text-center">
                  <Avatar className="h-24 w-24 mb-4">
                    {user.profilePicture ? (
                      <img 
                        src={user.profilePicture}
                        alt={`${user.username}'s profile`} 
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <AvatarFallback className="text-xl font-bold bg-primary/20 text-primary">
                        {getInitials(user.username)}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <h2 className="text-xl font-bold">{user.username}</h2>
                  <p className="text-sm text-muted-foreground capitalize">{user.role}</p>
                  
                  <div className="w-full mt-6 pt-6 border-t border-border">
                    <Button 
                      variant="outline" 
                      className="flex items-center justify-between w-full text-left mb-3"
                      onClick={() => navigate("/account/settings")}
                    >
                      <div className="flex items-center">
                        <Settings className="h-4 w-4 mr-2" />
                        <span>Account Settings</span>
                      </div>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                    
                    {user.role === "startup" && (
                      <Button 
                        variant="outline" 
                        className="flex items-center justify-between w-full text-left mb-3"
                        onClick={() => navigate("/startup/profile")}
                      >
                        <div className="flex items-center">
                          <User className="h-4 w-4 mr-2" />
                          <span>Startup Profile</span>
                        </div>
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    )}
                    
                    <Button 
                      variant="outline" 
                      className="flex items-center justify-between w-full text-left mb-3"
                      onClick={() => navigate("/wallet-connection")}
                    >
                      <div className="flex items-center">
                        <Wallet className="h-4 w-4 mr-2" />
                        <span>Wallet</span>
                      </div>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      className="flex items-center justify-between w-full text-left text-destructive"
                      onClick={handleLogout}
                    >
                      <div className="flex items-center">
                        <LogOut className="h-4 w-4 mr-2" />
                        <span>Log Out</span>
                      </div>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Main Content */}
          <div className="md:col-span-2">
            <Tabs defaultValue="overview">
              <TabsList className="w-full">
                <TabsTrigger value="overview" className="flex-1">Overview</TabsTrigger>
                <TabsTrigger value="payments" className="flex-1">Payment Methods</TabsTrigger>
                <TabsTrigger value="security" className="flex-1">Security</TabsTrigger>
              </TabsList>
              
              <TabsContent value="overview" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Account Overview</CardTitle>
                    <CardDescription>
                      Manage your account details and preferences
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground mb-1">Username</h3>
                        <p className="text-base">{user.username}</p>
                      </div>
                      
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground mb-1">Email Address</h3>
                        <p className="text-base">{user.email}</p>
                      </div>
                      
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground mb-1">Account Type</h3>
                        <p className="text-base capitalize">{user.role}</p>
                      </div>
                      
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground mb-1">Member Since</h3>
                        <p className="text-base">{new Date(user.createdAt || Date.now()).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="payments" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Payment Methods</CardTitle>
                    <CardDescription>
                      Manage your connected payment methods
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* MetaMask Wallet */}
                    <div className="border rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="h-10 w-10 bg-orange-100 rounded-full flex items-center justify-center">
                            <Wallet className="h-5 w-5 text-orange-600" />
                          </div>
                          <div className="ml-4">
                            <h3 className="font-medium">MetaMask Wallet</h3>
                            {user.walletAddress ? (
                              <div className="flex items-center mt-1">
                                <p className="text-sm text-muted-foreground font-mono">
                                  {truncateAddress(user.walletAddress)}
                                </p>
                                <button 
                                  onClick={() => copyToClipboard(user.walletAddress || "")}
                                  className="ml-2 text-muted-foreground hover:text-foreground"
                                >
                                  {copied ? (
                                    <Check className="h-4 w-4 text-green-500" />
                                  ) : (
                                    <Copy className="h-4 w-4" />
                                  )}
                                </button>
                              </div>
                            ) : (
                              <p className="text-sm text-muted-foreground">Not connected</p>
                            )}
                          </div>
                        </div>
                        {user.walletAddress ? (
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="text-sm"
                            onClick={() => window.open("https://etherscan.io/address/" + user.walletAddress, "_blank")}
                          >
                            <ExternalLink className="h-4 w-4 mr-1" />
                            View
                          </Button>
                        ) : (
                          <Button 
                            onClick={connectWallet}
                            disabled={isConnectingWallet}
                            size="sm"
                          >
                            {isConnectingWallet && (
                              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                            )}
                            Connect
                          </Button>
                        )}
                      </div>
                    </div>
                    
                    {/* UPI ID */}
                    <div className="border rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="h-10 w-10 bg-purple-100 rounded-full flex items-center justify-center">
                            <CreditCard className="h-5 w-5 text-purple-600" />
                          </div>
                          <div className="ml-4">
                            <h3 className="font-medium">UPI Payment</h3>
                            {user.upiId ? (
                              <p className="text-sm text-muted-foreground">{user.upiId}</p>
                            ) : (
                              <p className="text-sm text-muted-foreground">Not connected</p>
                            )}
                          </div>
                        </div>
                        {!user.upiId && (
                          <div className="flex items-center">
                            <div className="mr-2">
                              <Input 
                                placeholder="Enter UPI ID" 
                                value={upiId}
                                onChange={(e) => setUpiId(e.target.value)}
                                className="h-9 w-40"
                              />
                            </div>
                            <Button 
                              size="sm"
                              onClick={handleUpiConnect}
                              disabled={connectUpiMutation.isPending}
                            >
                              {connectUpiMutation.isPending && (
                                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                              )}
                              Connect
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="security" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Security Settings</CardTitle>
                    <CardDescription>
                      Manage your account security settings
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="current-password">Current Password</Label>
                        <Input id="current-password" type="password" className="mt-1" />
                      </div>
                      
                      <div>
                        <Label htmlFor="new-password">New Password</Label>
                        <Input id="new-password" type="password" className="mt-1" />
                      </div>
                      
                      <div>
                        <Label htmlFor="confirm-password">Confirm New Password</Label>
                        <Input id="confirm-password" type="password" className="mt-1" />
                      </div>
                      
                      <Button className="mt-2">Update Password</Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}