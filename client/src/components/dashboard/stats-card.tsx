import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, calculatePercentage, getInitials, getRandomColor } from "@/lib/utils";
import { Startup, Transaction, User } from "@shared/schema";

type StatCardProps = {
  title: string;
  value: string | number;
  change?: {
    value: string;
    positive: boolean;
  };
  children?: React.ReactNode;
  startup?: Startup;
};

function StatCard({ title, value, change, children, startup }: StatCardProps) {
  return (
    <Card className="border border-neutral-200">
      <CardContent className="pt-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-neutral-500">{title}</h3>
          {change && (
            <Badge variant={change.positive ? "default" : "destructive"} className={`text-xs ${change.positive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              {change.value}
            </Badge>
          )}
        </div>
        <div className="flex items-baseline">
          <span className="text-2xl font-bold text-neutral-800">{value}</span>
          {title === "Total Raised" && startup && (
            <span className="ml-2 text-sm text-neutral-500">of {formatCurrency(startup.fundingGoal)} goal</span>
          )}
        </div>
        {children}
      </CardContent>
    </Card>
  );
}

export function TotalRaisedCard({ startup }: { startup: Startup }) {
  const percentFunded = calculatePercentage(startup.fundsRaised, startup.fundingGoal);
  
  return (
    <StatCard 
      title="Total Raised" 
      value={formatCurrency(startup.fundsRaised)} 
      change={{ value: "+12% this month", positive: true }}
      startup={startup}
    >
      <div className="mt-4 w-full bg-neutral-200 rounded-full h-2">
        <div 
          className="bg-primary-500 h-2 rounded-full" 
          style={{ width: `${percentFunded}%` }}
        ></div>
      </div>
      <div className="mt-2 text-right">
        <span className="text-sm text-neutral-600">{percentFunded}% completed</span>
      </div>
    </StatCard>
  );
}

export function TotalInvestorsCard({ investors }: { investors: User[] }) {
  const visibleInvestors = investors.slice(0, 8);
  const remainingCount = investors.length - visibleInvestors.length;
  
  return (
    <StatCard 
      title="Total Investors" 
      value={investors.length} 
      change={{ value: `+${investors.length > 3 ? 3 : investors.length} this week`, positive: true }}
    >
      <div className="mt-4 grid grid-cols-8 gap-1">
        {visibleInvestors.map((investor, index) => (
          <div 
            key={investor.id} 
            className={`h-8 w-8 rounded-full ${getRandomColor(index)} flex items-center justify-center text-xs font-medium`}
          >
            {getInitials(investor.username)}
          </div>
        ))}
        {remainingCount > 0 && (
          <div className="h-8 w-8 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-700 text-xs">
            +{remainingCount}
          </div>
        )}
      </div>
    </StatCard>
  );
}

export function InvestmentSourcesCard({ transactions }: { transactions: Transaction[] }) {
  const totalAmount = transactions.reduce((sum, t) => sum + t.amount, 0);
  
  // Group by payment method
  const methodSums = transactions.reduce((acc, t) => {
    acc[t.method] = (acc[t.method] || 0) + t.amount;
    return acc;
  }, {} as Record<string, number>);
  
  const metamaskAmount = methodSums['metamask'] || 0;
  const upiAmount = methodSums['upi'] || 0;
  
  const metamaskPercent = calculatePercentage(metamaskAmount, totalAmount);
  const upiPercent = calculatePercentage(upiAmount, totalAmount);
  
  return (
    <StatCard title="Investment Sources" value={formatCurrency(totalAmount)}>
      <div className="mt-4">
        <div className="flex justify-between mb-1 text-sm">
          <span className="text-neutral-600">MetaMask</span>
          <span className="text-neutral-800 font-medium">{formatCurrency(metamaskAmount)}</span>
        </div>
        <div className="w-full bg-neutral-200 rounded-full h-2 mb-3">
          <div 
            className="bg-amber-500 h-2 rounded-full" 
            style={{ width: `${metamaskPercent}%` }}
          ></div>
        </div>
        
        <div className="flex justify-between mb-1 text-sm">
          <span className="text-neutral-600">UPI</span>
          <span className="text-neutral-800 font-medium">{formatCurrency(upiAmount)}</span>
        </div>
        <div className="w-full bg-neutral-200 rounded-full h-2">
          <div 
            className="bg-indigo-500 h-2 rounded-full" 
            style={{ width: `${upiPercent}%` }}
          ></div>
        </div>
      </div>
    </StatCard>
  );
}

export function PortfolioCard({ investments }: { investments: { startup: Startup, amount: number, percentChange: number }[] }) {
  return (
    <StatCard 
      title="Your Portfolio" 
      value={investments.length} 
    >
      <span className="ml-2 text-sm text-neutral-500">active investments</span>
      <div className="mt-4 space-y-3">
        {investments.map((investment, index) => (
          <div key={index} className="flex items-center justify-between">
            <div className="flex items-center">
              <div className={`h-10 w-10 bg-neutral-100 rounded-md flex items-center justify-center ${getRandomColor(index)}`}>
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
                  className="h-5 w-5"
                >
                  <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                  <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                </svg>
              </div>
              <div className="ml-3">
                <div className="text-sm font-medium text-neutral-800">{investment.startup.name}</div>
                <div className="text-xs text-neutral-500">{investment.startup.stage.replace('-', ' ')}</div>
              </div>
            </div>
            <div className={`text-sm font-medium ${investment.percentChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {investment.percentChange >= 0 ? '+' : ''}{investment.percentChange}%
            </div>
          </div>
        ))}
      </div>
    </StatCard>
  );
}

export function WalletStatusCard({ user }: { user: User }) {
  return (
    <StatCard title="Wallet Status" value="">
      {user.walletAddress ? (
        <div className="flex items-center mb-4">
          <div className="bg-green-100 w-10 h-10 flex items-center justify-center rounded-full mr-3">
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
              className="h-5 w-5 text-green-600"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <div>
            <div className="text-sm font-medium text-neutral-800">MetaMask Connected</div>
            <div className="text-xs text-neutral-500 font-mono truncate w-48">
              {user.walletAddress}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex items-center mb-4">
          <div className="bg-yellow-100 w-10 h-10 flex items-center justify-center rounded-full mr-3">
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
              className="h-5 w-5 text-yellow-600"
            >
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </div>
          <div>
            <div className="text-sm font-medium text-neutral-800">Wallet Not Connected</div>
            <div className="text-xs text-neutral-500">Connect your wallet to invest</div>
          </div>
        </div>
      )}
      
      <div className="border-t border-neutral-200 pt-4 mt-4">
        <div className="text-sm font-medium mb-2">Payment Methods</div>
        <div className="flex space-x-2">
          <div className={`border rounded-md p-2 flex items-center ${user.walletAddress ? 'border-green-300 bg-green-50' : 'border-neutral-200'}`}>
            <img src="https://metamask.io/images/metamask-fox.svg" alt="MetaMask" className="h-6 w-6" />
          </div>
          <div className={`border rounded-md p-2 flex items-center ${user.upiId ? 'border-green-300 bg-green-50' : 'border-neutral-200'}`}>
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
              className="h-5 w-5 text-indigo-500 mr-1"
            >
              <rect x="2" y="5" width="20" height="14" rx="2" />
              <line x1="2" y1="10" x2="22" y2="10" />
            </svg>
            <span className="text-sm">UPI</span>
          </div>
        </div>
      </div>
    </StatCard>
  );
}
