import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { ArrowRight, Database, RefreshCw, Shield, Trash2, Users } from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "wouter";

export default function AdminPage() {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [syncInProgress, setSyncInProgress] = useState(false);
  const [resetInProgress, setResetInProgress] = useState(false);

  const syncWalletAddresses = async () => {
    setSyncInProgress(true);
    try {
      const res = await apiRequest("POST", "/api/admin/sync-wallets");
      if (res.ok) {
        toast({
          title: "Wallet addresses synchronized",
          description: "All startup wallet addresses have been synchronized with their owner's wallet addresses.",
        });
        // Invalidate any relevant queries
        queryClient.invalidateQueries({ queryKey: ["/api/startups"] });
      } else {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to synchronize wallet addresses");
      }
    } catch (error) {
      toast({
        title: "Synchronization failed",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setSyncInProgress(false);
    }
  };

  const resetStartupData = async () => {
    if (!window.confirm("Are you sure you want to delete all startup data? This action cannot be undone.")) {
      return;
    }

    setResetInProgress(true);
    try {
      const res = await apiRequest("DELETE", "/api/admin/reset-startups");
      if (res.ok) {
        toast({
          title: "Startup data reset",
          description: "All startup data has been deleted from the database.",
        });
        // Invalidate any relevant queries
        queryClient.invalidateQueries({ queryKey: ["/api/startups"] });
      } else {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to reset startup data");
      }
    } catch (error) {
      toast({
        title: "Reset failed",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setResetInProgress(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-1/4 right-1/3 w-[500px] h-[500px] bg-purple-900/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/3 left-1/4 w-[400px] h-[400px] bg-amber-900/10 rounded-full blur-3xl"></div>
      </div>
      
      <div className="relative z-10 max-w-4xl mx-auto">
        <div className="flex items-center mb-2 space-x-2">
          <Shield className="h-6 w-6 text-primary" />
          <h1 className="text-3xl font-bold bg-gradient-to-r from-amber-400 to-amber-200 text-transparent bg-clip-text">Admin Dashboard</h1>
        </div>
        <p className="text-gray-400 mb-8">Manage platform data and perform administrative tasks</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card className="bg-gray-900/40 border-gray-800/40 backdrop-blur-sm">
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Database className="h-5 w-5 text-primary" />
                <CardTitle className="text-white text-lg">Data Management</CardTitle>
              </div>
              <CardDescription className="text-gray-400">
                Manage platform data and synchronization
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-300 mb-1">Wallet Address Synchronization</h3>
                <p className="text-sm text-gray-500 mb-2">
                  Ensure all startup wallet addresses match their owner's wallet addresses.
                </p>
                <Button 
                  onClick={syncWalletAddresses}
                  disabled={syncInProgress}
                  className="w-full flex items-center justify-center"
                >
                  {syncInProgress ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4 mr-2" />
                  )}
                  Sync Wallet Addresses
                </Button>
              </div>
              
              <Separator className="bg-gray-800" />
              
              <div>
                <h3 className="text-sm font-medium text-gray-300 mb-1">Reset Startup Data</h3>
                <p className="text-sm text-gray-500 mb-2">
                  Delete all startup data from the database. This action cannot be undone.
                </p>
                <Button 
                  variant="destructive" 
                  onClick={resetStartupData}
                  disabled={resetInProgress}
                  className="w-full flex items-center justify-center"
                >
                  {resetInProgress ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4 mr-2" />
                  )}
                  Reset All Startup Data
                </Button>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gray-900/40 border-gray-800/40 backdrop-blur-sm">
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-primary" />
                <CardTitle className="text-white text-lg">User Management</CardTitle>
              </div>
              <CardDescription className="text-gray-400">
                Manage user accounts and permissions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500 mb-4">
                User management functionality coming soon. This will include the ability to view, edit, and delete user accounts.
              </p>
              <div className="bg-gray-800/60 rounded-md p-4 mb-4">
                <p className="text-xs text-gray-400">
                  Future features:
                </p>
                <ul className="text-xs text-gray-500 list-disc pl-4 space-y-1 mt-2">
                  <li>User role management</li>
                  <li>Account suspension and verification</li>
                  <li>Activity logs and audit trails</li>
                  <li>Bulk user operations</li>
                </ul>
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full" disabled>
                Manage Users (Coming Soon)
              </Button>
            </CardFooter>
          </Card>
        </div>
        
        <div className="flex justify-center">
          <Link href="/">
            <Button variant="ghost" className="text-gray-400 hover:text-gray-300 group flex items-center">
              <ArrowRight className="h-4 w-4 mr-2 transform rotate-180 group-hover:translate-x-[-2px] transition-transform" />
              Return to Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}