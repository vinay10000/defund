import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Transaction } from "@shared/schema";
import { Loader2, Check, X, AlertCircle, IndianRupee } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function PendingPaymentsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [isVerifyDialogOpen, setIsVerifyDialogOpen] = useState(false);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);

  // Fetch transactions for this startup
  const { 
    data: transactions,
    isLoading,
    refetch
  } = useQuery<Transaction[]>({
    queryKey: ["/api/transactions/startup/me"],
    enabled: !!user,
  });

  // Filter for pending UPI transactions
  const pendingTransactions = transactions?.filter(
    (transaction) => transaction.method === "upi" && transaction.status === "pending"
  ) || [];

  // Filter for verified transactions
  const verifiedTransactions = transactions?.filter(
    (transaction) => transaction.method === "upi" && transaction.status === "completed"
  ) || [];

  // Mutation for approving a transaction
  const approveTransactionMutation = useMutation({
    mutationFn: async (id: string | number) => {
      const res = await apiRequest("PATCH", `/api/transactions/${id}/verify`, { status: "completed" });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/transactions/startup/me"] });
      queryClient.invalidateQueries({ queryKey: ["/api/startups/user/me"] });
      toast({
        title: "Payment verified",
        description: "The UPI payment has been verified successfully.",
      });
      setIsVerifyDialogOpen(false);
      setSelectedTransaction(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Verification failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mutation for rejecting a transaction
  const rejectTransactionMutation = useMutation({
    mutationFn: async (id: string | number) => {
      const res = await apiRequest("PATCH", `/api/transactions/${id}/verify`, { status: "failed" });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/transactions/startup/me"] });
      toast({
        title: "Payment rejected",
        description: "The UPI payment has been rejected.",
      });
      setIsRejectDialogOpen(false);
      setSelectedTransaction(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Rejection failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle approve action
  const handleApprove = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setIsVerifyDialogOpen(true);
  };

  // Handle reject action
  const handleReject = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setIsRejectDialogOpen(true);
  };

  // Handle confirmation of approval
  const confirmApprove = () => {
    if (selectedTransaction) {
      approveTransactionMutation.mutate(selectedTransaction.id);
    }
  };

  // Handle confirmation of rejection
  const confirmReject = () => {
    if (selectedTransaction) {
      rejectTransactionMutation.mutate(selectedTransaction.id);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4 flex items-center justify-center min-h-[70vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">UPI Payment Verification</h1>
          <p className="text-muted-foreground">Manage and verify UPI payments from investors</p>
        </div>
        <Button 
          variant="outline" 
          onClick={() => refetch()} 
          className="mt-2 md:mt-0"
        >
          <Loader2 className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <Tabs defaultValue="pending">
        <TabsList className="mb-4">
          <TabsTrigger value="pending">
            Pending Verification 
            {pendingTransactions.length > 0 && (
              <Badge variant="default" className="ml-2">
                {pendingTransactions.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="verified">
            Verified Payments
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending">
          <Card>
            <CardHeader>
              <CardTitle>Pending UPI Payments</CardTitle>
              <CardDescription>
                Verify these payments after confirming the UPI transaction in your payment account
              </CardDescription>
            </CardHeader>
            <CardContent>
              {pendingTransactions.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Transaction ID</TableHead>
                        <TableHead>Investor Name</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pendingTransactions.map((transaction) => (
                        <TableRow key={transaction.id}>
                          <TableCell className="font-medium">
                            {formatDate(transaction.createdAt.toString())}
                          </TableCell>
                          <TableCell className="font-mono text-xs">
                            {transaction.transactionReference}
                          </TableCell>
                          <TableCell>
                            {/* In a real app, we'd display the investor's name from a join query */}
                            Investor #{transaction.investorId.toString()}
                          </TableCell>
                          <TableCell>
                            {formatCurrency(transaction.amount)}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
                              Pending
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                                onClick={() => handleApprove(transaction)}
                              >
                                <Check className="h-4 w-4 mr-1" />
                                Verify
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
                                onClick={() => handleReject(transaction)}
                              >
                                <X className="h-4 w-4 mr-1" />
                                Reject
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="bg-primary/10 w-12 h-12 rounded-full mx-auto flex items-center justify-center mb-4">
                    <IndianRupee className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-medium">No Pending Payments</h3>
                  <p className="text-muted-foreground mt-1">
                    You don't have any pending UPI payments to verify
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="verified">
          <Card>
            <CardHeader>
              <CardTitle>Verified UPI Payments</CardTitle>
              <CardDescription>
                History of UPI payments that have been verified
              </CardDescription>
            </CardHeader>
            <CardContent>
              {verifiedTransactions.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Transaction ID</TableHead>
                        <TableHead>Investor Name</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {verifiedTransactions.map((transaction) => (
                        <TableRow key={transaction.id}>
                          <TableCell className="font-medium">
                            {formatDate(transaction.createdAt.toString())}
                          </TableCell>
                          <TableCell className="font-mono text-xs">
                            {transaction.transactionReference}
                          </TableCell>
                          <TableCell>
                            {/* In a real app, we'd display the investor's name from a join query */}
                            Investor #{transaction.investorId.toString()}
                          </TableCell>
                          <TableCell>
                            {formatCurrency(transaction.amount)}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="bg-green-100 text-green-800 hover:bg-green-100">
                              Verified
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="bg-gray-100 w-12 h-12 rounded-full mx-auto flex items-center justify-center mb-4">
                    <Check className="h-6 w-6 text-gray-500" />
                  </div>
                  <h3 className="text-lg font-medium">No Verified Payments</h3>
                  <p className="text-muted-foreground mt-1">
                    You haven't verified any UPI payments yet
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Verification Confirmation Dialog */}
      {selectedTransaction && (
        <Dialog open={isVerifyDialogOpen} onOpenChange={setIsVerifyDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Verify UPI Payment</DialogTitle>
              <DialogDescription>
                Are you sure you want to verify this payment? This will add the funds to your startup.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Amount:</span>
                  <span className="font-medium">{formatCurrency(selectedTransaction.amount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Transaction ID:</span>
                  <span className="font-mono text-xs">{selectedTransaction.transactionReference}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Date:</span>
                  <span>{formatDate(selectedTransaction.createdAt.toString())}</span>
                </div>
              </div>
              <Alert className="mt-4 bg-yellow-50 border-yellow-200">
                <AlertCircle className="h-4 w-4 text-yellow-600" />
                <AlertTitle className="text-yellow-800">Important</AlertTitle>
                <AlertDescription className="text-yellow-700">
                  Please verify this transaction in your UPI payment account before confirming.
                </AlertDescription>
              </Alert>
            </div>
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setIsVerifyDialogOpen(false)}
                disabled={approveTransactionMutation.isPending}
              >
                Cancel
              </Button>
              <Button 
                onClick={confirmApprove}
                disabled={approveTransactionMutation.isPending}
                className="bg-green-600 hover:bg-green-700"
              >
                {approveTransactionMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Confirm Verification
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Rejection Confirmation Dialog */}
      {selectedTransaction && (
        <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reject UPI Payment</DialogTitle>
              <DialogDescription>
                Are you sure you want to reject this payment? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Amount:</span>
                  <span className="font-medium">{formatCurrency(selectedTransaction.amount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Transaction ID:</span>
                  <span className="font-mono text-xs">{selectedTransaction.transactionReference}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Date:</span>
                  <span>{formatDate(selectedTransaction.createdAt.toString())}</span>
                </div>
              </div>
              <Alert variant="destructive" className="mt-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Warning</AlertTitle>
                <AlertDescription>
                  Rejecting a payment means it will be marked as failed and won't be added to your startup funds.
                </AlertDescription>
              </Alert>
            </div>
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setIsRejectDialogOpen(false)}
                disabled={rejectTransactionMutation.isPending}
              >
                Cancel
              </Button>
              <Button 
                onClick={confirmReject}
                disabled={rejectTransactionMutation.isPending}
                variant="destructive"
              >
                {rejectTransactionMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Confirm Rejection
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}