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
              <Link href="/how-it-works">
                <Button variant="outline" className="w-full sm:w-auto bg-primary-600 text-white border border-white/30 hover:bg-primary-700">
                  How It Works
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
        
        <div className="mt-10 text-center">
          <Link href="/startups">
            <Button variant="link" className="text-primary-500 hover:text-primary-700 font-medium inline-flex items-center">
              View All Startups
              <svg className="ml-1 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
              </svg>
            </Button>
          </Link>
        </div>
      </div>

      {/* How It Works */}
      <div className="bg-neutral-100 py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-neutral-800 mb-12 text-center">How It Works</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* For Startups */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="bg-primary-100 w-14 h-14 flex items-center justify-center rounded-full mb-5">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
                </svg>
              </div>
              <h3 className="text-xl font-bold text-neutral-800 mb-3">For Startups</h3>
              <p className="text-neutral-600 mb-4">Create your profile, showcase your vision, and connect with investors globally. Manage your funding and provide updates to your investors.</p>
              <ul className="space-y-2 mb-6">
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-primary-500 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                  </svg>
                  <span className="text-sm text-neutral-700">Fully customizable profile</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-primary-500 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                  </svg>
                  <span className="text-sm text-neutral-700">Secure document sharing</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-primary-500 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                  </svg>
                  <span className="text-sm text-neutral-700">Investment tracking dashboard</span>
                </li>
              </ul>
              <Link href="/auth?tab=register&role=startup">
                <Button variant="link" className="text-primary-500 hover:text-primary-700 font-medium text-sm inline-flex items-center">
                  Register as Startup
                  <svg className="ml-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                  </svg>
                </Button>
              </Link>
            </div>
            
            {/* For Investors */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="bg-secondary-100 w-14 h-14 flex items-center justify-center rounded-full mb-5">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-secondary-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <path d="M16 12h-6.5a2 2 0 1 0 0 4H12"></path>
                  <path d="M8 8h6.5a2 2 0 1 1 0 4H12"></path>
                </svg>
              </div>
              <h3 className="text-xl font-bold text-neutral-800 mb-3">For Investors</h3>
              <p className="text-neutral-600 mb-4">Browse vetted startups, review their details, and invest securely using MetaMask or UPI. Track all your investments in one place.</p>
              <ul className="space-y-2 mb-6">
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-secondary-500 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                  </svg>
                  <span className="text-sm text-neutral-700">MetaMask and UPI integration</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-secondary-500 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                  </svg>
                  <span className="text-sm text-neutral-700">Detailed startup analytics</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-secondary-500 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                  </svg>
                  <span className="text-sm text-neutral-700">Regular founder updates</span>
                </li>
              </ul>
              <Link href="/auth?tab=register&role=investor">
                <Button variant="link" className="text-secondary-500 hover:text-secondary-700 font-medium text-sm inline-flex items-center">
                  Register as Investor
                  <svg className="ml-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                  </svg>
                </Button>
              </Link>
            </div>
            
            {/* Platform Security */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="bg-accent-100 w-14 h-14 flex items-center justify-center rounded-full mb-5">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-accent-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                </svg>
              </div>
              <h3 className="text-xl font-bold text-neutral-800 mb-3">Platform Security</h3>
              <p className="text-neutral-600 mb-4">We prioritize security with encrypted data storage in MongoDB Atlas and blockchain-based transaction verification.</p>
              <ul className="space-y-2 mb-6">
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-accent-500 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                  </svg>
                  <span className="text-sm text-neutral-700">Encrypted document storage</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-accent-500 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                  </svg>
                  <span className="text-sm text-neutral-700">JWT authentication</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-accent-500 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                  </svg>
                  <span className="text-sm text-neutral-700">Blockchain verification</span>
                </li>
              </ul>
              <Link href="/auth">
                <Button variant="link" className="text-accent-500 hover:text-accent-700 font-medium text-sm inline-flex items-center">
                  Sign In Now
                  <svg className="ml-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                  </svg>
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
