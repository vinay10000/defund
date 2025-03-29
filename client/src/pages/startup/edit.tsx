import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { useQuery, useMutation, QueryClient } from "@tanstack/react-query";
import { Startup } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Loader2, ArrowLeft } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { format } from "date-fns";

const editStartupSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  description: z.string().min(30, "Description must be at least 30 characters"),
  pitch: z.string().min(10, "Pitch must be at least 10 characters"),
  stage: z.enum(["pre-seed", "seed", "series-a", "series-b", "series-c"]),
  fundingGoal: z.coerce.number().min(1, "Funding goal must be greater than 0"),
  endDate: z.string().optional(),
});

type FormValues = z.infer<typeof editStartupSchema>;

export default function EditStartupPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch startup data
  const {
    data: startup,
    isLoading,
    error,
  } = useQuery<Startup>({
    queryKey: ["/api/startups/user/me"],
    retry: false,
    refetchOnWindowFocus: false,
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(editStartupSchema),
    defaultValues: {
      name: "",
      description: "",
      pitch: "",
      stage: "seed",
      fundingGoal: 0,
      endDate: "",
    },
  });

  // Update form with startup data when it's loaded
  useEffect(() => {
    if (startup) {
      const endDateString = startup.endDate
        ? new Date(startup.endDate.toString()).toISOString().split("T")[0]
        : "";

      form.reset({
        name: startup.name,
        description: startup.description,
        pitch: startup.pitch,
        stage: startup.stage as any,
        fundingGoal: startup.fundingGoal,
        endDate: endDateString,
      });
    }
  }, [startup, form]);

  // Update mutation
  const updateStartupMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      const res = await apiRequest("PATCH", `/api/startups/${startup?.id}`, data);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to update startup");
      }
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Startup profile updated",
        description: "Your startup profile has been successfully updated.",
      });
      navigate("/startup/profile");
    },
    onError: (error: Error) => {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = async (data: FormValues) => {
    try {
      setIsSubmitting(true);
      await updateStartupMutation.mutateAsync(data);
    } catch (error) {
      console.error("Failed to update startup:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4 flex items-center justify-center min-h-[70vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!startup) {
    return (
      <div className="container mx-auto py-8 px-4 text-center">
        <p className="text-lg text-red-600">No startup profile found. Please create a startup profile first.</p>
        <Button className="mt-4" onClick={() => navigate("/startup/create")}>
          Create Startup Profile
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <Button
        variant="ghost"
        className="mb-6"
        onClick={() => navigate("/startup/profile")}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Profile
      </Button>

      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl">Edit Startup Profile</CardTitle>
          <CardDescription>
            Update your startup's information to keep investors informed about your progress.
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
                    <FormLabel>Startup Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Your startup name" {...field} />
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
                        placeholder="Detailed description of your startup"
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="pitch"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Elevator Pitch</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Brief pitch about your startup (1-2 sentences)"
                        className="min-h-[80px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="stage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Funding Stage</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select stage" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="pre-seed">Pre-Seed</SelectItem>
                          <SelectItem value="seed">Seed</SelectItem>
                          <SelectItem value="series-a">Series A</SelectItem>
                          <SelectItem value="series-b">Series B</SelectItem>
                          <SelectItem value="series-c">Series C</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="fundingGoal"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Funding Goal ($)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="10000" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Funding End Date (Optional)</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormDescription>
                      The date when your funding round will close.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end pt-4">
                <Button
                  type="button"
                  variant="outline"
                  className="mr-2"
                  onClick={() => navigate("/startup/profile")}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Changes
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}