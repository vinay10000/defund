import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Startup } from "@shared/schema";
import { calculatePercentage, formatCurrency, getStageColor } from "@/lib/utils";
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";

type StartupCardProps = {
  startup: Startup;
  showInvestButton?: boolean;
};

export function StartupCard({ startup, showInvestButton = true }: StartupCardProps) {
  const percentFunded = calculatePercentage(startup.fundsRaised, startup.fundingGoal);
  const stageClassName = getStageColor(startup.stage);
  
  // Startup images based on name (deterministic choice)
  const images = [
    "https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1581291518633-83b4ebd1d83e?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1521737711867-e3b97375f902?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1557804506-669a67965ba0?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1576267423048-15c0040fec78?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1552664730-d307ca884978?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80"
  ];
  
  // Choose image based on startup id or name
  const imageIndex = (startup.id || startup.name.length) % images.length;
  const imageUrl = images[imageIndex];
  
  // Format stage name for display
  const formatStage = (stage: string) => {
    return stage.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <div className="h-40 bg-neutral-100 relative">
        <img 
          src={imageUrl} 
          alt={`${startup.name} Cover`} 
          className="w-full h-full object-cover"
        />
        <div className={`absolute top-4 right-4 text-xs font-bold px-2 py-1 rounded ${stageClassName}`}>
          {formatStage(startup.stage)}
        </div>
      </div>
      
      <CardContent className="p-5">
        <h3 className="font-bold text-lg text-neutral-800 mb-2">{startup.name}</h3>
        <p className="text-neutral-600 text-sm mb-4 line-clamp-2">{startup.description}</p>
        
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs text-neutral-500">Funding Goal</span>
          <span className="text-sm font-medium">{formatCurrency(startup.fundingGoal)}</span>
        </div>
        
        <div className="w-full bg-neutral-200 rounded-full h-2 mb-4">
          <div 
            className="bg-primary-500 h-2 rounded-full" 
            style={{ width: `${percentFunded}%` }}
          ></div>
        </div>
        
        <div className="flex justify-between text-sm mb-5">
          <span className="text-neutral-600">{formatCurrency(startup.fundsRaised)} raised</span>
          <span className="text-neutral-600">{percentFunded}%</span>
        </div>
        
        {showInvestButton ? (
          <Link href={`/investor/invest/${startup.id}`}>
            <Button className="w-full bg-primary-500 hover:bg-primary-600">
              Invest Now
            </Button>
          </Link>
        ) : (
          <Link href={`/startups/${startup.id}`}>
            <Button className="w-full bg-primary-500 hover:bg-primary-600">
              View Details
            </Button>
          </Link>
        )}
      </CardContent>
    </Card>
  );
}
