import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Startup, Update, InsertUpdate } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Loader2, ArrowLeft, PlusCircle, CalendarClock, Trash, Edit, AlertCircle
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

// Form schema for updates
const updateSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(100, "Title cannot exceed 100 characters"),
  content: z.string().min(10, "Content must be at least 10 characters").max(5000, "Content cannot exceed 5000 characters"),
});

type UpdateFormValues = z.infer<typeof updateSchema>;

export default function StartupUpdatesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [isNewUpdateDialogOpen, setIsNewUpdateDialogOpen] = useState(false);

  // Setup form
  const form = useForm<UpdateFormValues>({
    resolver: zodResolver(updateSchema),
    defaultValues: {
      title: "",
      content: "",
    },
  });

  // Fetch startup data
  const { data: startup, isLoading: isStartupLoading } = useQuery<Startup>({
    queryKey: ["/api/startups/user/me"],
    retry: false,
    refetchOnWindowFocus: false,
  });

  // Fetch updates
  const { data: updates, isLoading: isUpdatesLoading } = useQuery<Update[]>({
    queryKey: [`/api/updates/startup/${startup?.id}`],
    enabled: !!startup?.id,
    retry: false,
    refetchOnWindowFocus: false,
  });

  // Mutation for creating an update
  const createUpdateMutation = useMutation({
    mutationFn: async (data: InsertUpdate) => {
      const res = await apiRequest("POST", "/api/updates", data);
      return await res.json() as Update;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/updates/startup/${startup?.id}`] });
      toast({
        title: "Update posted",
        description: "Your update has been posted successfully.",
      });
      setIsNewUpdateDialogOpen(false);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle form submission
  const onSubmit = (values: UpdateFormValues) => {
    if (!startup) return;
    
    createUpdateMutation.mutate({
      startupId: startup.id,
      title: values.title,
      content: values.content,
      visibility: "all-investors", // Default to making updates visible to all investors
    });
  };

  const isLoading = isStartupLoading || isUpdatesLoading;

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4 flex items-center justify-center min-h-[70vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!startup) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="text-center max-w-md mx-auto">
          <AlertCircle className="h-12 w-12 mx-auto text-destructive" />
          <h2 className="mt-6 text-2xl font-bold">No Startup Profile</h2>
          <p className="mt-2 text-muted-foreground">
            You need to create a startup profile first before posting updates.
          </p>
          <Button onClick={() => navigate("/startup/create")} className="mt-4">
            Create Startup Profile
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <Button 
            variant="ghost" 
            className="mr-2" 
            onClick={() => navigate("/startup/profile")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Profile
          </Button>
          <h1 className="text-2xl font-bold hidden md:block">Startup Updates</h1>
        </div>
        
        <Dialog open={isNewUpdateDialogOpen} onOpenChange={setIsNewUpdateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="h-4 w-4 mr-2" /> Post New Update
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Post New Update</DialogTitle>
              <DialogDescription>
                Share progress and important information with your investors.
              </DialogDescription>
            </DialogHeader>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Quarterly Report Q2 2025" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="content"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Content</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Share details about your progress, milestones, challenges, or any other information you want investors to know."
                          className="min-h-32"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <DialogFooter>
                  <Button 
                    variant="outline" 
                    type="button"
                    onClick={() => setIsNewUpdateDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit"
                    disabled={createUpdateMutation.isPending}
                  >
                    {createUpdateMutation.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Post Update
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Updates for {startup.name}</CardTitle>
          <CardDescription>Keep your investors informed about your progress and milestones</CardDescription>
        </CardHeader>
        <CardContent>
          {updates && updates.length > 0 ? (
            <div className="space-y-6">
              {updates.map((update) => (
                <Card key={update.id} className="border border-border">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{update.title}</CardTitle>
                        <CardDescription className="flex items-center mt-1">
                          <CalendarClock className="h-3.5 w-3.5 mr-1" />
                          {update.createdAt ? formatDate(update.createdAt.toString()) : "Recently"} 
                        </CardDescription>
                      </div>
                      <div className="flex space-x-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Trash className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="whitespace-pre-line">{update.content}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="bg-primary/10 h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <CalendarClock className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-lg font-medium">No Updates Yet</h3>
              <p className="text-muted-foreground max-w-md mx-auto mt-2">
                You haven't posted any updates yet. Keep your investors informed by sharing your progress, milestones, and important news.
              </p>
              <Button 
                className="mt-4"
                onClick={() => setIsNewUpdateDialogOpen(true)}
              >
                Post Your First Update
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}