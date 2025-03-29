import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
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
import { Startup } from "@shared/schema";
import { Loader2 } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/utils";

const upiPaymentSchema = z.object({
  amount: z.coerce.number().positive("Amount must be greater than 0"),
  transactionReference: z.string().min(5, "Transaction ID must be at least 5 characters"),
});

type UpiPaymentProps = {
  startup: Startup;
  onSuccess?: () => void;
};

export function UpiPayment({ startup, onSuccess }: UpiPaymentProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof upiPaymentSchema>>({
    resolver: zodResolver(upiPaymentSchema),
    defaultValues: {
      amount: 0,
      transactionReference: "",
    },
  });

  const onSubmit = async (data: z.infer<typeof upiPaymentSchema>) => {
    setIsSubmitting(true);
    try {
      await apiRequest("POST", "/api/transactions", {
        startupId: startup.id,
        amount: data.amount,
        method: "upi",
        status: "completed",
        transactionReference: data.transactionReference,
      });

      toast({
        title: "Payment Successful",
        description: `You have successfully invested ${formatCurrency(data.amount)} in ${startup.name}.`,
      });

      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ["/api/transactions/investor/me"] });
      
      // Reset form
      form.reset();
      
      // Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      toast({
        title: "Payment Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full">
      <CardContent className="pt-6">
        <h3 className="text-lg font-bold mb-4">Pay via UPI</h3>
        
        <div className="bg-neutral-50 p-4 rounded-md mb-4">
          <div className="flex justify-between mb-1">
            <span className="text-sm text-neutral-600">Startup</span>
            <span className="text-sm font-medium">{startup.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-neutral-600">UPI ID</span>
            <span className="text-sm font-medium font-mono">{startup.upiId || 'Not provided'}</span>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Investment Amount (USD)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="Enter amount"
                      {...field}
                      min={1}
                      step="0.01"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="transactionReference"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>UPI Transaction ID</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter UPI transaction ID"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button 
              type="submit" 
              className="w-full" 
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                "Complete Payment"
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
