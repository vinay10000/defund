import { useState, useEffect } from "react";
import { useLocation, useSearch } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

// Login schema
const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

// Registration schema
const registerSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(6, "Confirm password must be at least 6 characters"),
  role: z.enum(["startup", "investor"], {
    required_error: "Please select an account type",
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export default function AuthPage() {
  const [activeTab, setActiveTab] = useState("login");
  const [, navigate] = useLocation();
  const search = useSearch();
  const { user, loginMutation, registerMutation } = useAuth();
  
  // Parse query parameters
  const searchParams = new URLSearchParams(search);
  const tabParam = searchParams.get("tab");
  const roleParam = searchParams.get("role");

  // Redirect if user is already logged in
  useEffect(() => {
    if (user) {
      navigate(user.role === "startup" ? "/startup/dashboard" : "/investor/dashboard");
    }
  }, [user, navigate]);

  // Set active tab based on URL parameters
  useEffect(() => {
    if (tabParam === "register") {
      setActiveTab("register");
    }
  }, [tabParam]);

  // Login form
  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // Register form
  const registerForm = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
      role: roleParam as "startup" | "investor" || "investor",
    },
  });

  const onLoginSubmit = (data: z.infer<typeof loginSchema>) => {
    loginMutation.mutate(data);
  };

  const onRegisterSubmit = (data: z.infer<typeof registerSchema>) => {
    const { confirmPassword, ...userData } = data;
    registerMutation.mutate(userData);
  };

  if (user) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-76px)]">
        <Loader2 className="h-8 w-8 animate-spin text-border" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto">
        {/* Auth Form */}
        <div>
          <Card className="border-transparent shadow-lg">
            <CardContent className="pt-6">
              <Tabs defaultValue={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid grid-cols-2 mb-6">
                  <TabsTrigger value="login">Sign In</TabsTrigger>
                  <TabsTrigger value="register">Create Account</TabsTrigger>
                </TabsList>
                
                {/* Login Tab */}
                <TabsContent value="login">
                  <div className="text-center mb-6">
                    <h2 className="text-2xl font-bold text-neutral-800">Welcome Back</h2>
                    <p className="text-neutral-500 mt-2">Sign in to your account</p>
                  </div>
                  
                  <Form {...loginForm}>
                    <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                      <FormField
                        control={loginForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email Address</FormLabel>
                            <FormControl>
                              <Input 
                                type="email" 
                                placeholder="you@example.com" 
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={loginForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <div className="flex items-center justify-between">
                              <FormLabel>Password</FormLabel>
                              <a href="#" className="text-sm text-primary-500 hover:text-primary-700">
                                Forgot password?
                              </a>
                            </div>
                            <FormControl>
                              <Input 
                                type="password" 
                                placeholder="••••••••" 
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="flex items-center">
                        <input 
                          id="remember" 
                          name="remember" 
                          type="checkbox" 
                          className="h-4 w-4 text-primary-500 border-neutral-300 rounded focus:ring-primary-500" 
                        />
                        <label htmlFor="remember" className="ml-2 block text-sm text-neutral-600">
                          Remember me
                        </label>
                      </div>
                      
                      <Button 
                        type="submit" 
                        className="w-full" 
                        disabled={loginMutation.isPending}
                      >
                        {loginMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Signing In...
                          </>
                        ) : (
                          "Sign In"
                        )}
                      </Button>
                      
                      <div className="text-center mt-6">
                        <p className="text-sm text-neutral-600">
                          Don't have an account?{" "}
                          <button
                            type="button"
                            className="text-primary-500 hover:text-primary-700 font-medium"
                            onClick={() => setActiveTab("register")}
                          >
                            Sign up
                          </button>
                        </p>
                        <div className="mt-4">
                          <button
                            type="button"
                            className="text-xs text-gray-500 hover:text-primary-500"
                            onClick={() => {
                              loginForm.setValue("email", "admin@deventure.io");
                              loginForm.setValue("password", "admin123");
                            }}
                          >
                            Continue as Admin
                          </button>
                        </div>
                      </div>
                    </form>
                  </Form>
                </TabsContent>

                {/* Register Tab */}
                <TabsContent value="register">
                  <div className="text-center mb-6">
                    <h2 className="text-2xl font-bold text-neutral-800">Create an Account</h2>
                    <p className="text-neutral-500 mt-2">Join our platform and start your journey</p>
                  </div>
                  
                  <Form {...registerForm}>
                    <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                      <FormField
                        control={registerForm.control}
                        name="role"
                        render={({ field }) => (
                          <FormItem>
                            <div className="mb-4">
                              <div className="flex">
                                <button
                                  type="button"
                                  className={cn(
                                    "flex-1 py-3 border-b-2 font-medium",
                                    field.value === "startup"
                                      ? "border-primary-500 text-primary-500"
                                      : "border-neutral-200 text-neutral-500 hover:text-neutral-700"
                                  )}
                                  onClick={() => field.onChange("startup")}
                                >
                                  Startup
                                </button>
                                <button
                                  type="button"
                                  className={cn(
                                    "flex-1 py-3 border-b-2 font-medium",
                                    field.value === "investor"
                                      ? "border-primary-500 text-primary-500"
                                      : "border-neutral-200 text-neutral-500 hover:text-neutral-700"
                                  )}
                                  onClick={() => field.onChange("investor")}
                                >
                                  Investor
                                </button>
                              </div>
                              <FormMessage />
                            </div>
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={registerForm.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Username</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="johndoe" 
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={registerForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email Address</FormLabel>
                            <FormControl>
                              <Input 
                                type="email" 
                                placeholder="you@example.com" 
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={registerForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Password</FormLabel>
                            <FormControl>
                              <Input 
                                type="password" 
                                placeholder="••••••••" 
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={registerForm.control}
                        name="confirmPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Confirm Password</FormLabel>
                            <FormControl>
                              <Input 
                                type="password" 
                                placeholder="••••••••" 
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="flex items-start mb-4">
                        <input 
                          id="terms" 
                          name="terms" 
                          type="checkbox" 
                          className="h-4 w-4 text-primary-500 border-neutral-300 rounded focus:ring-primary-500 mt-1" 
                          required 
                        />
                        <label htmlFor="terms" className="ml-2 block text-sm text-neutral-600">
                          I agree to the <a href="#" className="text-primary-500 hover:text-primary-700">Terms of Service</a> and <a href="#" className="text-primary-500 hover:text-primary-700">Privacy Policy</a>
                        </label>
                      </div>
                      
                      <Button 
                        type="submit" 
                        className="w-full" 
                        disabled={registerMutation.isPending}
                      >
                        {registerMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Creating Account...
                          </>
                        ) : (
                          "Create Account"
                        )}
                      </Button>
                      
                      <div className="mt-6 text-center">
                        <p className="text-sm text-neutral-600">
                          Already have an account?{" "}
                          <button
                            type="button"
                            className="text-primary-500 hover:text-primary-700 font-medium"
                            onClick={() => setActiveTab("login")}
                          >
                            Sign in
                          </button>
                        </p>
                      </div>
                    </form>
                  </Form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
        
        {/* Hero Section */}
        <div className="hidden md:flex flex-col justify-center">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-neutral-800 mb-4">Decentralized Startup Funding</h1>
            <p className="text-neutral-600">
              DeFund connects innovative startups with investors through a secure, blockchain-powered platform.
              Whether you're a startup seeking funding or an investor looking for opportunities, our platform
              provides the tools and security you need.
            </p>
          </div>
          
          <div className="bg-neutral-100 p-6 rounded-lg">
            <h3 className="font-bold text-neutral-800 mb-3">Platform Benefits</h3>
            <ul className="space-y-3">
              <li className="flex items-start">
                <svg className="w-5 h-5 text-primary-500 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                </svg>
                <span className="text-neutral-700">Secure MetaMask wallet integration</span>
              </li>
              <li className="flex items-start">
                <svg className="w-5 h-5 text-primary-500 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                </svg>
                <span className="text-neutral-700">Traditional UPI payment options</span>
              </li>
              <li className="flex items-start">
                <svg className="w-5 h-5 text-primary-500 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                </svg>
                <span className="text-neutral-700">Transparent investment tracking</span>
              </li>
              <li className="flex items-start">
                <svg className="w-5 h-5 text-primary-500 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                </svg>
                <span className="text-neutral-700">Startup progress updates</span>
              </li>
              <li className="flex items-start">
                <svg className="w-5 h-5 text-primary-500 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                </svg>
                <span className="text-neutral-700">Comprehensive dashboard analytics</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
