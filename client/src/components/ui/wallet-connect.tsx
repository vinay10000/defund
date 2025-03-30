import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { connectMetaMask, isMetaMaskInstalled, getCurrentAccount } from "@/lib/web3";
import { truncateAddress } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ExternalLink, ArrowRight } from "lucide-react";

export function WalletConnect() {
  const { user, connectWalletMutation } = useAuth();
  const { toast } = useToast();
  const [isConnecting, setIsConnecting] = useState(false);
  const [metaMaskInstalled, setMetaMaskInstalled] = useState(false);
  const [currentAccount, setCurrentAccount] = useState<string | null>(null);

  useEffect(() => {
    const checkMetaMask = async () => {
      const installed = isMetaMaskInstalled();
      setMetaMaskInstalled(installed);
      
      if (installed) {
        try {
          const account = await getCurrentAccount();
          setCurrentAccount(account);
        } catch (error) {
          console.error("Failed to get current account:", error);
        }
      }
    };
    
    checkMetaMask();
  }, []);

  const handleConnectWallet = async () => {
    if (!metaMaskInstalled) {
      toast({
        title: "MetaMask not found",
        description: "Please install MetaMask browser extension to connect your wallet.",
        variant: "destructive",
      });
      return;
    }

    setIsConnecting(true);
    try {
      const address = await connectMetaMask();
      setCurrentAccount(address); // Update local state
      connectWalletMutation.mutate({ walletAddress: address });
    } catch (error: any) {
      toast({
        title: "Connection failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <Card className="w-full card-gradient border-0">
      <CardContent className="pt-6">
        <div className="flex flex-col items-center mb-6">
          <div className="bg-gradient-to-br from-amber-500 to-amber-600 text-white p-3 rounded-full mb-4 shadow-lg">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-6 w-6"
            >
              <path d="M17 11h-6a2 2 0 0 0-2 2v6" />
              <path d="M12 17 17 12" />
              <rect x="2" y="2" width="7" height="9" rx="1" />
              <path d="M9 2h9a2 2 0 0 1 2 2v3" />
              <path d="M5 15v2a2 2 0 0 0 2 2h7" />
              <path d="M22 22v-7h-7" />
            </svg>
          </div>
          <h2 className="text-xl font-bold gradient-text">Connect Your Wallet</h2>
          <p className="text-sm text-gray-400 text-center mt-2">
            {user?.walletAddress
              ? "Your wallet is connected"
              : "Connect your wallet to securely invest in startups"}
          </p>
        </div>

        {user?.walletAddress ? (
          <div className="glassmorphism p-4 rounded-lg mb-6 border border-green-500/20">
            <div className="flex items-center">
              <div className="bg-gradient-to-br from-green-400 to-green-500 w-10 h-10 flex items-center justify-center rounded-full mr-3 text-white shadow-md">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-5 w-5"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-200">MetaMask Connected</div>
                <div className="text-xs text-gray-400 font-mono flex items-center">
                  {truncateAddress(user.walletAddress, 6)}
                  <a 
                    href={`https://etherscan.io/address/${user.walletAddress}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="ml-2 text-primary hover:text-primary/80"
                  >
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="glassmorphism p-4 rounded-lg mb-6 border border-blue-500/20">
              <div className="flex items-start">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-5 w-5 text-blue-400 mt-0.5 mr-2 flex-shrink-0"
                >
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 16v-4" />
                  <path d="M12 8h.01" />
                </svg>
                <p className="text-sm text-gray-300">
                  Your wallet will be permanently linked to your account. The same wallet cannot be used for multiple accounts.
                </p>
              </div>
            </div>

            {currentAccount && (
              <div className="glassmorphism p-4 rounded-lg mb-6 border border-amber-500/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <img
                      src="https://metamask.io/images/metamask-fox.svg"
                      alt="MetaMask"
                      className="h-5 w-5 mr-2"
                    />
                    <div>
                      <div className="text-sm font-medium text-gray-200">MetaMask Detected</div>
                      <div className="text-xs text-gray-400 font-mono">{truncateAddress(currentAccount, 6)}</div>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-amber-500" />
                </div>
              </div>
            )}

            <Button
              className="w-full flex items-center justify-center gradient-btn py-6"
              onClick={handleConnectWallet}
              disabled={isConnecting || connectWalletMutation.isPending || !metaMaskInstalled}
            >
              {isConnecting || connectWalletMutation.isPending ? (
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              ) : (
                <img
                  src="https://metamask.io/images/metamask-fox.svg"
                  alt="MetaMask"
                  className="h-5 w-5 mr-2"
                />
              )}
              <span>
                {!metaMaskInstalled
                  ? "MetaMask Not Installed"
                  : isConnecting || connectWalletMutation.isPending
                  ? "Connecting..."
                  : currentAccount 
                    ? `Connect with Account ${truncateAddress(currentAccount, 4)}`
                    : "Connect with MetaMask"}
              </span>
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
