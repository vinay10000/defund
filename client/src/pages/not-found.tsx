import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";
import { Link } from "wouter";

export default function NotFound() {
  return (
    <div className="min-h-[calc(100vh-80px)] w-full flex items-center justify-center">
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-1/4 left-1/3 w-[300px] h-[300px] bg-red-900/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/3 right-1/4 w-[250px] h-[250px] bg-purple-900/10 rounded-full blur-3xl"></div>
      </div>
      
      <Card className="w-full max-w-md mx-4 card-gradient border-0">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center text-center mb-6">
            <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
              <AlertCircle className="h-10 w-10 text-red-400" />
            </div>
            <h1 className="text-3xl font-bold gradient-text mb-2">404 Not Found</h1>
            <p className="text-gray-400 mt-2">
              The page you're looking for doesn't exist or has been moved.
            </p>
          </div>

          <div className="flex justify-center mt-6">
            <Link href="/">
              <Button className="gradient-btn px-8 py-6">
                Return to Home
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
