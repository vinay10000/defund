import { Transaction, User, Startup } from "@shared/schema";
import { 
  Table, 
  TableHeader, 
  TableRow, 
  TableHead, 
  TableBody, 
  TableCell 
} from "@/components/ui/table";
import { formatCurrency, formatDate, getInitials, getStatusColor, truncateAddress } from "@/lib/utils";

type TransactionTableProps = {
  transactions: Transaction[];
  users?: Map<number, User>;
  startups?: Map<number, Startup>;
  type?: "startup" | "investor";
};

export function TransactionTable({ transactions, users, startups, type = "startup" }: TransactionTableProps) {
  if (!transactions || transactions.length === 0) {
    return (
      <div className="p-8 text-center">
        <p className="text-neutral-500">No transactions yet.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{type === "startup" ? "Investor" : "Startup"}</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Method</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.map((transaction) => {
            const user = users?.get(transaction.investorId);
            const startup = startups?.get(transaction.startupId);
            
            const statusClass = getStatusColor(transaction.status);
            
            return (
              <TableRow key={transaction.id}>
                <TableCell>
                  <div className="flex items-center">
                    <div className={`h-8 w-8 rounded-full bg-${type === "startup" ? "primary" : "secondary"}-100 flex items-center justify-center text-${type === "startup" ? "primary" : "secondary"}-700 text-xs font-medium`}>
                      {type === "startup" 
                        ? getInitials(user?.username) 
                        : getInitials(startup?.name)
                      }
                    </div>
                    <div className="ml-3">
                      <div className="text-sm font-medium text-neutral-800">
                        {type === "startup" 
                          ? user?.username || "Unknown Investor"
                          : startup?.name || "Unknown Startup"
                        }
                      </div>
                      <div className="text-xs text-neutral-500 font-mono truncate w-32">
                        {type === "startup" && user?.walletAddress 
                          ? truncateAddress(user.walletAddress) 
                          : type === "startup" 
                          ? user?.email 
                          : truncateAddress(startup?.userId.toString() || "") 
                        }
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-sm text-neutral-800">{formatCurrency(transaction.amount)}</div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center">
                    {transaction.method === "metamask" ? (
                      <>
                        <img src="https://metamask.io/images/metamask-fox.svg" alt="MetaMask" className="h-4 w-4 mr-1" />
                        <span className="text-sm text-neutral-600">MetaMask</span>
                      </>
                    ) : (
                      <>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="h-4 w-4 text-indigo-500 mr-1"
                        >
                          <rect x="2" y="5" width="20" height="14" rx="2" />
                          <line x1="2" y1="10" x2="22" y2="10" />
                        </svg>
                        <span className="text-sm text-neutral-600">UPI</span>
                      </>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-sm text-neutral-600">
                    {formatDate(transaction.createdAt)}
                  </div>
                </TableCell>
                <TableCell>
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusClass}`}>
                    {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                  </span>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
