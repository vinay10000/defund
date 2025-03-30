import { WalletConnect } from "@/components/ui/wallet-connect";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useEffect } from "react";
import { ArrowRight } from "lucide-react";

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
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-1/3 left-1/3 w-[300px] h-[300px] bg-amber-900/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/3 w-[250px] h-[250px] bg-purple-900/10 rounded-full blur-3xl"></div>
      </div>
      
      <div className="max-w-xl mx-auto relative z-10">
        <WalletConnect />
        
        <div className="relative flex items-center py-6 mt-8">
          <div className="flex-grow border-t border-gray-800/60"></div>
          <span className="flex-shrink mx-4 text-gray-400 text-sm">or</span>
          <div className="flex-grow border-t border-gray-800/60"></div>
        </div>
        
        <div className="text-center mb-6">
          <p className="text-gray-400 mb-4">Skip for now and connect later from your profile</p>
          <Link href={getRedirectPath()}>
            <Button 
              variant="ghost" 
              className="text-primary hover:text-primary/80 group flex items-center"
            >
              Skip & Continue
              <ArrowRight className="ml-2 h-4 w-4 transform transition-transform group-hover:translate-x-1" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
