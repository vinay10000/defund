import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { insertStartupSchema, InsertStartup } from "@shared/schema";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, FileImage, FileText, AlertCircle, Upload, Calendar } from "lucide-react";
import { z } from "zod";

// Extended schema for the form
const formSchema = z.object({
  name: z.string().min(2, { message: "Startup title must be at least 2 characters" }),
  description: z.string().min(10, { message: "Description must be at least 10 characters" }),
  imageUrl: z.string().optional(),
  documentUrl: z.string().optional(),
  upiId: z.string().optional(),
  endDate: z.string().min(1, { message: "End date is required" }),
  userId: z.string().or(z.number())
});

type StartupFormData = z.infer<typeof formSchema>;

export default function StartupCreate() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Fetch startup to check if user already has one
  const { data: startup, isLoading } = useQuery({
    queryKey: ["/api/startups/user/me"],
    retry: false,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    // If startup already exists, redirect to dashboard
    if (startup) {
      navigate("/startup/dashboard");
    }
  }, [startup, navigate]);

  // Form setup
  const form = useForm<StartupFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      imageUrl: "",
      documentUrl: "",
      upiId: "",
      endDate: "",
      userId: user?.id || "",
    },
  });

  // Handle image file selection
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      // Create a preview URL for the image
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
    }
  };

  // Handle document file selection
  const handleDocumentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setDocumentFile(file);
    }
  };

  // Mutation for creating startup
  const createStartupMutation = useMutation({
    mutationFn: async (data: StartupFormData) => {
      // Here you would normally upload the files to a storage service
      // and get back URLs to store in the database
      // For now, we'll just simulate this process
      
      // In a real implementation, you would:
      // 1. Upload the image and document files to your storage service
      // 2. Get back the URLs
      // 3. Add these URLs to the data object before saving to the database

      // Create a FormData instance for file uploads (if needed later)
      const formData = new FormData();
      if (imageFile) {
        formData.append('image', imageFile);
      }
      if (documentFile) {
        formData.append('document', documentFile);
      }
      
      // Prepare startup data with all required fields
      const startupData: InsertStartup = {
        name: data.name,
        description: data.description,
        imageUrl: imageFile ? `uploads/${imageFile.name}` : undefined,
        documentUrl: documentFile ? `uploads/${documentFile.name}` : undefined,
        upiId: data.upiId || undefined,
        endDate: new Date(data.endDate),
        userId: user?.id || "",
        // Required fields from schema with default values
        stage: "pre-seed",
        fundingGoal: 10000,
        pitch: data.description // Using description as pitch for now
      };
      
      const res = await apiRequest("POST", "/api/startups", startupData);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Startup created!",
        description: "Your startup profile has been created successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/startups/user/me"] });
      navigate("/startup/dashboard");
    },
    onError: (error: Error) => {
      toast({
        title: "Error creating startup",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Form submission handler
  const onSubmit = (data: StartupFormData) => {
    createStartupMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Create Your Startup</CardTitle>
          <CardDescription>
            Complete the form below to set up your startup profile and start raising funds.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Startup Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter your startup title" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter a detailed description of your startup"
                        className="min-h-[120px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Image Upload (Optional) */}
              <FormItem>
                <FormLabel>Startup Image (Optional)</FormLabel>
                <div className="mt-1 flex items-center">
                  <label className="block w-full">
                    <div className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border rounded-md cursor-pointer hover:bg-muted/50 transition-colors">
                      {imagePreview ? (
                        <div className="relative w-full h-full">
                          <img
                            src={imagePreview}
                            alt="Preview"
                            className="w-full h-full object-contain rounded-md"
                          />
                          <button
                            type="button"
                            className="absolute top-1 right-1 p-1 bg-background/80 rounded-full"
                            onClick={() => {
                              setImagePreview(null);
                              setImageFile(null);
                            }}
                          >
                            <AlertCircle className="h-4 w-4 text-destructive" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-4">
                          <FileImage className="h-10 w-10 text-muted-foreground mb-2" />
                          <p className="text-sm text-muted-foreground">
                            Click to upload startup image
                          </p>
                        </div>
                      )}
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageChange}
                    />
                  </label>
                </div>
                <FormDescription>
                  Upload an image representing your startup (max 5MB)
                </FormDescription>
              </FormItem>

              {/* Document Upload (Optional) */}
              <FormItem>
                <FormLabel>Proof Documents (Optional)</FormLabel>
                <div className="mt-1">
                  <label className="block w-full">
                    <div className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-border rounded-md cursor-pointer hover:bg-muted/50 transition-colors">
                      <div className="flex flex-col items-center justify-center py-4">
                        <FileText className="h-10 w-10 text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground">
                          {documentFile ? documentFile.name : "Click to upload documents"}
                        </p>
                      </div>
                    </div>
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx"
                      className="hidden"
                      onChange={handleDocumentChange}
                    />
                  </label>
                </div>
                <FormDescription>
                  Upload any proof or supporting documents for your startup (PDF, DOC)
                </FormDescription>
              </FormItem>

              {/* UPI ID (Optional) */}
              <FormField
                control={form.control}
                name="upiId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>UPI ID (Optional)</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="yourname@upi" 
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      Enter your UPI ID to receive direct payments
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* End Date */}
              <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End Date</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input 
                          type="date" 
                          {...field}
                          min={new Date().toISOString().split('T')[0]}
                        />
                        <Calendar className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
                      </div>
                    </FormControl>
                    <FormDescription>
                      Select the end date for your fundraising campaign
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button 
                type="submit" 
                className="w-full"
                disabled={createStartupMutation.isPending}
              >
                {createStartupMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Startup"
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}