import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { getInitials } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Menu, Home, BarChart2, RefreshCw, LogOut, User, ChevronDown, Activity } from "lucide-react";

export function Header() {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <header className="glassmorphism backdrop-blur-lg sticky top-0 z-10 border-b border-gray-800/10">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <Link href="/" className="flex items-center space-x-2">
          <span className="gradient-text text-3xl">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-primary"
            >
              <path d="M20.42 4.58a5.4 5.4 0 0 0-7.65 0l-.77.78-.77-.78a5.4 5.4 0 0 0-7.65 0C1.46 6.7 1.33 10.28 4 13l8 8 8-8c2.67-2.72 2.54-6.3.42-8.42z"></path>
              <path d="M3.5 12h4l1.5-3 1.5 3h5l1.5-3 1.5 3h2"></path>
            </svg>
          </span>
          <span className="font-bold text-xl gradient-text">BlockVenture</span>
        </Link>

        {/* For logged out state */}
        {!user && (
          <div className="hidden md:flex space-x-6 items-center">
            <Link href="/how-it-works">
              <span className="text-gray-300 hover:text-primary transition-colors text-sm">
                How it Works
              </span>
            </Link>
            <Link href="/startups">
              <span className="text-gray-300 hover:text-primary transition-colors text-sm">
                Startups
              </span>
            </Link>
            <Link href="/for-investors">
              <span className="text-gray-300 hover:text-primary transition-colors text-sm">
                For Investors
              </span>
            </Link>
            <Link href="/auth">
              <Button variant="ghost" className="text-gray-200 hover:text-white">Sign In</Button>
            </Link>
            <Link href="/auth?tab=register">
              <Button className="gradient-btn rounded-lg px-5">
                Sign Up
              </Button>
            </Link>
          </div>
        )}

        {/* For logged in state (Startup) */}
        {user && user.role === "startup" && (
          <div className="hidden md:flex space-x-6 items-center">
            <Link href="/startup/dashboard">
              <span className={`text-gray-300 hover:text-primary transition-colors text-sm ${location === "/startup/dashboard" ? "text-primary font-medium" : ""}`}>
                Dashboard
              </span>
            </Link>
            <Link href="/startup/transactions">
              <span className={`text-gray-300 hover:text-primary transition-colors text-sm ${location === "/startup/transactions" ? "text-primary font-medium" : ""}`}>
                Transactions
              </span>
            </Link>
            <Link href="/startup/updates">
              <span className={`text-gray-300 hover:text-primary transition-colors text-sm ${location === "/startup/updates" ? "text-primary font-medium" : ""}`}>
                Updates
              </span>
            </Link>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center space-x-2 text-gray-200 hover:text-white">
                  <div className="h-8 w-8 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center text-white">
                    <span className="font-medium">{getInitials(user.username)}</span>
                  </div>
                  <span className="hidden md:block">{user.username}</span>
                  <ChevronDown size={16} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 dark">
                <Link href="/profile">
                  <DropdownMenuItem>
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </DropdownMenuItem>
                </Link>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}

        {/* For logged in state (Investor) */}
        {user && user.role === "investor" && (
          <div className="hidden md:flex space-x-6 items-center">
            <Link href="/investor/dashboard">
              <span className={`text-gray-300 hover:text-primary transition-colors text-sm ${location === "/investor/dashboard" ? "text-primary font-medium" : ""}`}>
                Explore
              </span>
            </Link>
            <Link href="/investor/investments">
              <span className={`text-gray-300 hover:text-primary transition-colors text-sm ${location === "/investor/investments" ? "text-primary font-medium" : ""}`}>
                My Investments
              </span>
            </Link>
            <Link href="/investor/transactions">
              <span className={`text-gray-300 hover:text-primary transition-colors text-sm ${location === "/investor/transactions" ? "text-primary font-medium" : ""}`}>
                Transactions
              </span>
            </Link>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center space-x-2 text-gray-200 hover:text-white">
                  <div className="h-8 w-8 rounded-full bg-gradient-to-r from-blue-500 to-teal-400 flex items-center justify-center text-white">
                    <span className="font-medium">{getInitials(user.username)}</span>
                  </div>
                  <span className="hidden md:block">{user.username}</span>
                  <ChevronDown size={16} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 dark">
                <Link href="/profile">
                  <DropdownMenuItem>
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </DropdownMenuItem>
                </Link>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}

        {/* Mobile menu button */}
        <div className="md:hidden">
          <Button variant="ghost" onClick={toggleMobileMenu} size="sm" className="text-gray-300 hover:text-white">
            <Menu className="h-6 w-6" />
          </Button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden glassmorphism backdrop-blur-lg py-4 px-4 border-t border-gray-800/10">
          {!user && (
            <div className="flex flex-col space-y-4">
              <Link href="/how-it-works">
                <span className="text-gray-300 hover:text-primary transition-colors block py-2">
                  How it Works
                </span>
              </Link>
              <Link href="/startups">
                <span className="text-gray-300 hover:text-primary transition-colors block py-2">
                  Startups
                </span>
              </Link>
              <Link href="/for-investors">
                <span className="text-gray-300 hover:text-primary transition-colors block py-2">
                  For Investors
                </span>
              </Link>
              <Link href="/auth">
                <Button variant="ghost" className="w-full text-gray-200 hover:text-white justify-start">
                  Sign In
                </Button>
              </Link>
              <Link href="/auth?tab=register">
                <Button
                  className="w-full gradient-btn rounded-lg"
                >
                  Sign Up
                </Button>
              </Link>
            </div>
          )}

          {user && user.role === "startup" && (
            <div className="flex flex-col space-y-4">
              <Link href="/startup/dashboard">
                <span className={`flex items-center py-2 ${location === "/startup/dashboard" ? "text-primary font-medium" : "text-gray-300"}`}>
                  <Home className="h-5 w-5 mr-2" />
                  Dashboard
                </span>
              </Link>
              <Link href="/startup/transactions">
                <span className={`flex items-center py-2 ${location === "/startup/transactions" ? "text-primary font-medium" : "text-gray-300"}`}>
                  <BarChart2 className="h-5 w-5 mr-2" />
                  Transactions
                </span>
              </Link>
              <Link href="/startup/updates">
                <span className={`flex items-center py-2 ${location === "/startup/updates" ? "text-primary font-medium" : "text-gray-300"}`}>
                  <RefreshCw className="h-5 w-5 mr-2" />
                  Updates
                </span>
              </Link>
              <Link href="/profile">
                <span className={`flex items-center py-2 ${location === "/profile" ? "text-primary font-medium" : "text-gray-300"}`}>
                  <User className="h-5 w-5 mr-2" />
                  Profile
                </span>
              </Link>
              <Button variant="ghost" className="justify-start px-2 text-gray-300" onClick={handleLogout}>
                <LogOut className="h-5 w-5 mr-2" />
                Log out
              </Button>
            </div>
          )}

          {user && user.role === "investor" && (
            <div className="flex flex-col space-y-4">
              <Link href="/investor/dashboard">
                <span className={`flex items-center py-2 ${location === "/investor/dashboard" ? "text-primary font-medium" : "text-gray-300"}`}>
                  <Home className="h-5 w-5 mr-2" />
                  Explore
                </span>
              </Link>
              <Link href="/investor/investments">
                <span className={`flex items-center py-2 ${location === "/investor/investments" ? "text-primary font-medium" : "text-gray-300"}`}>
                  <BarChart2 className="h-5 w-5 mr-2" />
                  My Investments
                </span>
              </Link>
              <Link href="/investor/transactions">
                <span className={`flex items-center py-2 ${location === "/investor/transactions" ? "text-primary font-medium" : "text-gray-300"}`}>
                  <RefreshCw className="h-5 w-5 mr-2" />
                  Transactions
                </span>
              </Link>
              <Link href="/profile">
                <span className={`flex items-center py-2 ${location === "/profile" ? "text-primary font-medium" : "text-gray-300"}`}>
                  <User className="h-5 w-5 mr-2" />
                  Profile
                </span>
              </Link>
              <Button variant="ghost" className="justify-start px-2 text-gray-300" onClick={handleLogout}>
                <LogOut className="h-5 w-5 mr-2" />
                Log out
              </Button>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
