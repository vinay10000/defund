import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { WalletConnect } from "@/components/ui/wallet-connect";
import { getInitials } from "@/lib/utils";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Loader2, UserCircle2, Shield, ArrowRight, Upload, X } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation } from "wouter";
import { Link } from "wouter";
import { useRef, useState } from "react";

const profileFormSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Please enter a valid email address"),
  bio: z.string().optional().nullable(),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

const upiFormSchema = z.object({
  upiId: z.string().min(3, "UPI ID must be at least 3 characters"),
});

type UpiFormValues = z.infer<typeof upiFormSchema>;

export default function AccountSettingsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Redirect if not logged in
  if (!user) {
    navigate("/auth");
    return null;
  }

  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      username: user.username || "",
      email: user.email || "",
      bio: user.bio || "",
    },
  });

  const upiForm = useForm<UpiFormValues>({
    resolver: zodResolver(upiFormSchema),
    defaultValues: {
      upiId: user.upiId || "",
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileFormValues) => {
      const res = await apiRequest("PATCH", "/api/user/profile", data);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to update profile");
      }
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Update failed",
        description: error instanceof Error ? error.message : "Failed to update profile",
        variant: "destructive",
      });
    },
  });

  const updateUpiMutation = useMutation({
    mutationFn: async (data: UpiFormValues) => {
      const res = await apiRequest("POST", "/api/upi-connect", data);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to update UPI ID");
      }
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      toast({
        title: "UPI ID updated",
        description: "Your UPI ID has been updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Update failed",
        description: error instanceof Error ? error.message : "Failed to update UPI ID",
        variant: "destructive",
      });
    },
  });

  const uploadProfileImage = async () => {
    if (!selectedImage) return;

    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append("profile", selectedImage);

      const res = await fetch("/api/upload/profile", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to upload profile image");
      }

      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      toast({
        title: "Profile image updated",
        description: "Your profile image has been updated successfully.",
      });
      setSelectedImage(null);
    } catch (error) {
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload profile image",
        variant: "destructive",
      });
    } finally {
      setUploadingImage(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const cancelImageSelection = () => {
    setSelectedImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleProfileSubmit = (data: ProfileFormValues) => {
    updateProfileMutation.mutate(data);
  };

  const handleUpiSubmit = (data: UpiFormValues) => {
    updateUpiMutation.mutate(data);
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-1/3 left-1/4 w-[400px] h-[400px] bg-purple-900/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/3 right-1/4 w-[300px] h-[300px] bg-amber-900/10 rounded-full blur-3xl"></div>
      </div>
      
      <div className="relative z-10 max-w-3xl mx-auto">
        <div className="flex items-center mb-2 space-x-2">
          <UserCircle2 className="h-6 w-6 text-primary" />
          <h1 className="text-3xl font-bold bg-gradient-to-r from-amber-400 to-amber-200 text-transparent bg-clip-text">Account Settings</h1>
        </div>
        <p className="text-gray-400 mb-8">Manage your profile, payment methods, and security settings</p>
        
        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid grid-cols-3 bg-gray-900/40 backdrop-blur-sm">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="payments">Payments</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
          </TabsList>
          
          <TabsContent value="profile">
            <Card className="bg-gray-900/40 border-gray-800/40 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white">Profile Settings</CardTitle>
                <CardDescription className="text-gray-400">
                  Update your profile information and profile picture
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Profile Image */}
                <div className="flex flex-col items-center space-y-4 sm:flex-row sm:space-y-0 sm:space-x-6">
                  <Avatar className="h-24 w-24 border-2 border-primary/20">
                    {selectedImage ? (
                      <AvatarImage src={URL.createObjectURL(selectedImage)} alt="Preview" />
                    ) : (
                      <>
                        {(user as any).profilePicture ? (
                          <AvatarImage src={(user as any).profilePicture} alt={user.username} />
                        ) : (
                          <AvatarFallback className="bg-gray-800 text-primary text-xl">
                            {getInitials(user.username)}
                          </AvatarFallback>
                        )}
                      </>
                    )}
                  </Avatar>
                  
                  <div className="flex flex-col space-y-2">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleImageChange}
                      accept="image/*"
                      className="hidden"
                    />
                    
                    {!selectedImage ? (
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={triggerFileInput}
                        className="text-sm"
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Upload new picture
                      </Button>
                    ) : (
                      <div className="flex space-x-2">
                        <Button 
                          type="button" 
                          variant="default" 
                          onClick={uploadProfileImage}
                          disabled={uploadingImage}
                          className="text-sm"
                        >
                          {uploadingImage ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <Upload className="h-4 w-4 mr-2" />
                          )}
                          Save
                        </Button>
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={cancelImageSelection}
                          className="text-sm"
                        >
                          <X className="h-4 w-4 mr-2" />
                          Cancel
                        </Button>
                      </div>
                    )}
                    
                    <p className="text-xs text-gray-500">
                      JPG, PNG or GIF. Maximum size 5MB.
                    </p>
                  </div>
                </div>
                
                <Separator className="bg-gray-800" />
                
                {/* Profile Form */}
                <form onSubmit={profileForm.handleSubmit(handleProfileSubmit)} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="username" className="text-gray-300">Username</Label>
                      <Input
                        id="username"
                        className="bg-gray-800/60 border-gray-700 text-gray-200"
                        {...profileForm.register("username")}
                      />
                      {profileForm.formState.errors.username && (
                        <p className="text-xs text-red-500">{profileForm.formState.errors.username.message}</p>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-gray-300">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        className="bg-gray-800/60 border-gray-700 text-gray-200"
                        {...profileForm.register("email")}
                      />
                      {profileForm.formState.errors.email && (
                        <p className="text-xs text-red-500">{profileForm.formState.errors.email.message}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="bio" className="text-gray-300">Bio</Label>
                    <Textarea
                      id="bio"
                      className="bg-gray-800/60 border-gray-700 text-gray-200 min-h-[100px]"
                      placeholder="Tell us about yourself..."
                      {...profileForm.register("bio")}
                    />
                    {profileForm.formState.errors.bio && (
                      <p className="text-xs text-red-500">{profileForm.formState.errors.bio.message}</p>
                    )}
                  </div>
                  
                  <div className="flex justify-end">
                    <Button 
                      type="submit"
                      disabled={updateProfileMutation.isPending}
                      className="flex items-center"
                    >
                      {updateProfileMutation.isPending && (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      )}
                      Save Profile
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="payments">
            <div className="grid grid-cols-1 gap-6">
              <Card className="bg-gray-900/40 border-gray-800/40 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-white">Wallet Connection</CardTitle>
                  <CardDescription className="text-gray-400">
                    Connect your crypto wallet to receive and send payments
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <WalletConnect />
                </CardContent>
              </Card>
              
              <Card className="bg-gray-900/40 border-gray-800/40 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-white">UPI Payment Settings</CardTitle>
                  <CardDescription className="text-gray-400">
                    Update your UPI ID for receiving payments
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={upiForm.handleSubmit(handleUpiSubmit)} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="upiId" className="text-gray-300">UPI ID</Label>
                      <Input
                        id="upiId"
                        placeholder="yourname@upi"
                        className="bg-gray-800/60 border-gray-700 text-gray-200"
                        {...upiForm.register("upiId")}
                      />
                      {upiForm.formState.errors.upiId && (
                        <p className="text-xs text-red-500">{upiForm.formState.errors.upiId.message}</p>
                      )}
                      <p className="text-xs text-gray-500">
                        Enter your UPI ID to receive payments from investors.
                      </p>
                    </div>
                    
                    <div className="flex justify-end">
                      <Button 
                        type="submit"
                        disabled={updateUpiMutation.isPending}
                        className="flex items-center"
                      >
                        {updateUpiMutation.isPending && (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        )}
                        Save UPI ID
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="security">
            <Card className="bg-gray-900/40 border-gray-800/40 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white">Security Settings</CardTitle>
                <CardDescription className="text-gray-400">
                  Manage your password and account security
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-gray-800/60 rounded-md p-4">
                  <p className="text-xs text-gray-400">
                    Security features coming soon! This section will include:
                  </p>
                  <ul className="text-xs text-gray-500 list-disc pl-4 space-y-1 mt-2">
                    <li>Password reset functionality</li>
                    <li>Two-factor authentication</li>
                    <li>Login activity logs</li>
                    <li>Account recovery options</li>
                  </ul>
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full" disabled>
                  Update Security Settings (Coming Soon)
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
        
        {(user.role === "admin" || user.role === "startup" || user.role === "investor") && (
          <div className="mt-6 flex justify-center">
            <Link href="/admin">
              <Button variant="ghost" className="text-gray-400 hover:text-gray-300 group flex items-center">
                <Shield className="h-4 w-4 mr-2" />
                Admin Dashboard
                <ArrowRight className="h-4 w-4 ml-2 transform group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}