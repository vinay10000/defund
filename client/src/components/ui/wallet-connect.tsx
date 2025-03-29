import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { connectMetaMask, isMetaMaskInstalled } from "@/lib/web3";
import { truncateAddress } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

export function WalletConnect() {
  const { user, connectWalletMutation } = useAuth();
  const { toast } = useToast();
  const [isConnecting, setIsConnecting] = useState(false);
  const [metaMaskInstalled, setMetaMaskInstalled] = useState(false);

  useEffect(() => {
    setMetaMaskInstalled(isMetaMaskInstalled());
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
    <Card className="w-full">
      <CardContent className="pt-6">
        <div className="flex flex-col items-center mb-6">
          <div className="bg-amber-500 text-white p-3 rounded-full mb-3">
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
          <h2 className="text-xl font-bold text-neutral-800">Connect Your Wallet</h2>
          <p className="text-sm text-neutral-500 text-center mt-1">
            {user?.walletAddress
              ? "Your wallet is connected"
              : "Connect your wallet to securely invest in startups"}
          </p>
        </div>

        {user?.walletAddress ? (
          <div className="bg-green-50 p-4 rounded-md mb-6">
            <div className="flex items-center">
              <div className="bg-green-100 w-10 h-10 flex items-center justify-center rounded-full mr-3 text-green-600">
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
                <div className="text-sm font-medium text-neutral-800">MetaMask Connected</div>
                <div className="text-xs text-neutral-500 font-mono">
                  {truncateAddress(user.walletAddress, 6)}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="bg-blue-50 p-4 rounded-md mb-6">
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
                  className="h-5 w-5 text-blue-500 mt-0.5 mr-2"
                >
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 16v-4" />
                  <path d="M12 8h.01" />
                </svg>
                <p className="text-sm text-neutral-600">
                  Your wallet will be permanently linked to your account. The same wallet cannot be used for multiple accounts.
                </p>
              </div>
            </div>

            <Button
              className="w-full flex items-center justify-center bg-amber-500 hover:bg-amber-600 text-white"
              onClick={handleConnectWallet}
              disabled={isConnecting || connectWalletMutation.isPending || !metaMaskInstalled}
            >
              {isConnecting || connectWalletMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
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
                  : "Connect with MetaMask"}
              </span>
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
