import { WalletConnect } from "@/components/ui/wallet-connect";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useEffect } from "react";

export default function WalletConnectionPage() {
  const { user } = useAuth();
  const [, navigate] = useLocation();

  // Redirect if not logged in
  useEffect(() => {
    if (!user) {
      navigate("/auth");
    }
  }, [user, navigate]);

  // Determine where to redirect based on user role
  const getRedirectPath = () => {
    if (!user) return "/auth";
    return user.role === "startup" ? "/startup/dashboard" : "/investor/dashboard";
  };

  if (!user) return null;

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-xl mx-auto">
        <WalletConnect />
        
        <div className="relative flex items-center py-5 mt-8">
          <div className="flex-grow border-t border-neutral-300"></div>
          <span className="flex-shrink mx-4 text-neutral-500 text-sm">or</span>
          <div className="flex-grow border-t border-neutral-300"></div>
        </div>
        
        <div className="text-center mb-6">
          <p className="text-neutral-600 mb-3">Skip for now and connect later from your profile</p>
          <Link href={getRedirectPath()}>
            <Button variant="link" className="text-primary-500 hover:text-primary-700">
              Skip & Continue
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
