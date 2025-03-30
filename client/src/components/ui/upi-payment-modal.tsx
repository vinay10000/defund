import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Startup, InsertTransaction } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatCurrency } from "@/lib/utils";

// Schema for UPI payment form
const upiPaymentSchema = z.object({
  fullName: z.string().min(1, "Full name is required"),
  transactionId: z.string().min(6, "Transaction ID must be at least 6 characters"),
});

type UpiPaymentModalProps = {
  isOpen: boolean;
  onClose: () => void;
  startup: Startup;
  amount: number;
  investorId: string | number;
};

export function UpiPaymentModal({ isOpen, onClose, startup, amount, investorId }: UpiPaymentModalProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof upiPaymentSchema>>({
    resolver: zodResolver(upiPaymentSchema),
    defaultValues: {
      fullName: "",
      transactionId: "",
    },
  });

  // Mutation for creating a transaction
  const createTransactionMutation = useMutation({
    mutationFn: async (data: InsertTransaction) => {
      const res = await apiRequest("POST", "/api/transactions", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/startups/${startup.id}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/transactions/investor/me"] });
      toast({
        title: "Payment submitted",
        description: "Your UPI payment is pending verification by the startup.",
      });
      form.reset();
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Payment submission failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = async (data: z.infer<typeof upiPaymentSchema>) => {
    setIsSubmitting(true);
    try {
      // Create transaction record with pending status
      createTransactionMutation.mutate({
        investorId: investorId,
        startupId: startup.id,
        amount: amount,
        method: "upi",
        status: "pending",
        transactionReference: data.transactionId,
      });
    } catch (error: any) {
      toast({
        title: "Payment failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>UPI Payment Confirmation</DialogTitle>
          <DialogDescription>
            Please complete the UPI payment and enter the payment details below.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <div className="mb-4 p-4 bg-muted rounded-lg">
            <div className="text-sm text-muted-foreground mb-2">Payment Information</div>
            <div className="flex justify-between mb-2">
              <span>Startup:</span>
              <span className="font-medium">{startup.name}</span>
            </div>
            <div className="flex justify-between mb-2">
              <span>UPI ID:</span>
              <span className="font-medium font-mono">{startup.upiId}</span>
            </div>
            <div className="flex justify-between mb-2">
              <span>Amount:</span>
              <span className="font-medium">{formatCurrency(amount)}</span>
            </div>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>UPI Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter the name used for UPI payment" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="transactionId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Transaction ID</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter UPI transaction ID" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter className="mt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                >
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Confirm Payment
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}