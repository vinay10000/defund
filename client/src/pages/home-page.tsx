import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { StartupCard } from "@/components/ui/startup-card";
import { useQuery } from "@tanstack/react-query";
import { Startup } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { useEffect, useState } from "react";

export default function HomePage() {
  const { user } = useAuth();
  const [redirectPath, setRedirectPath] = useState("/");
  
  // Redirect to appropriate dashboard if user is logged in
  useEffect(() => {
    if (user) {
      setRedirectPath(user.role === "startup" ? "/startup/dashboard" : "/investor/dashboard");
    }
  }, [user]);

  // Fetch featured startups
  const { data: startups, isLoading } = useQuery<Startup[]>({
    queryKey: ["/api/startups"],
    enabled: true,
  });

  // Get only 3 startups for display
  const featuredStartups = startups?.slice(0, 3) || [];

  return (
    <div>
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-primary-500 to-primary-700 text-white">
        <div className="container mx-auto px-4 py-16 md:py-24">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">Decentralized Funding for the Next Generation of Startups</h1>
            <p className="text-lg md:text-xl mb-8 text-white/90">Connect your MetaMask wallet or use UPI to invest directly in curated startups. Transparent, secure, and blockchain-powered.</p>
            <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4">
              <Link href={user ? redirectPath : "/auth"}>
                <Button variant="secondary" className="w-full sm:w-auto text-primary-700 bg-white hover:bg-neutral-100">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Featured Startups */}
      <div className="container mx-auto px-4 py-16">
        <h2 className="text-2xl md:text-3xl font-bold text-neutral-800 mb-8 text-center">Featured Startups</h2>
        
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-96 rounded-lg bg-neutral-100 animate-pulse"></div>
            ))}
          </div>
        ) : featuredStartups.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredStartups.map((startup) => (
              <StartupCard key={startup.id} startup={startup} />
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-neutral-500">No startups available at the moment.</p>
          </div>
        )}
      </div>
    </div>
  );
}
