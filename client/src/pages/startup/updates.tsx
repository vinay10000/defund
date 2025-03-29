import { useQuery } from "@tanstack/react-query";
import { Update, Startup } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { Loader2, Plus } from "lucide-react";
import { UpdateForm } from "@/components/dashboard/update-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function StartupUpdates() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  
  // Get startup info
  const { data: startup, isLoading: isLoadingStartup } = useQuery<Startup | undefined>({
    queryKey: ["/api/startups/user/me"],
    enabled: !!user,
  });

  // Fetch updates for this startup
  const { data: updates, isLoading: isLoadingUpdates } = useQuery<Update[]>({
    queryKey: ["/api/updates/startup", startup?.id],
    enabled: !!startup,
  });

  if (isLoadingStartup || isLoadingUpdates) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-76px)]">
        <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
      </div>
    );
  }

  // If no startup profile exists, show message
  if (!startup) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="max-w-2xl mx-auto text-center py-12">
          <h1 className="text-2xl font-bold text-neutral-800 mb-4">No Startup Profile Found</h1>
          <p className="text-neutral-600 mb-8">
            You need to create your startup profile before you can post updates.
          </p>
          <Button>Create Startup Profile</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-neutral-800">Investor Updates</h1>
          <p className="text-neutral-600">Keep your investors informed about your progress</p>
        </div>
        
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Update
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[550px]">
            <DialogHeader>
              <DialogTitle>Post Update to Investors</DialogTitle>
            </DialogHeader>
            <UpdateForm startupId={startup.id} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Updates List */}
      <div className="grid grid-cols-1 gap-6 mb-8">
        {updates && updates.length > 0 ? (
          updates.map((update) => (
            <Card key={update.id} className="overflow-hidden">
              <CardHeader className="bg-neutral-50 border-b border-neutral-200">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl">{update.title}</CardTitle>
                  <div className="flex items-center space-x-4">
                    <span className="text-sm text-neutral-500">{formatDate(update.createdAt)}</span>
                    <span className="bg-neutral-200 text-neutral-700 text-xs px-2 py-1 rounded-full">
                      {update.visibility === "all-investors" ? "All Investors" : "Major Investors"}
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <p className="text-neutral-700 whitespace-pre-line">{update.content}</p>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="text-center py-12 bg-neutral-50 rounded-lg border border-neutral-200">
            <h3 className="text-lg font-medium text-neutral-800 mb-2">No Updates Yet</h3>
            <p className="text-neutral-600 mb-6">
              Post your first update to keep your investors informed about your progress.
            </p>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Post First Update
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[550px]">
                <DialogHeader>
                  <DialogTitle>Post Update to Investors</DialogTitle>
                </DialogHeader>
                <UpdateForm startupId={startup.id} />
              </DialogContent>
            </Dialog>
          </div>
        )}
      </div>
    </div>
  );
}
