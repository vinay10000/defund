import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Startup, Document } from "@shared/schema";
import { formatCurrency, truncateAddress, getStageColor } from "@/lib/utils";
import { Edit, Copy, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type StartupInfoProps = {
  startup: Startup;
  documents: Document[];
  onEditClick?: () => void;
};

export function StartupInfo({ startup, documents, onEditClick }: StartupInfoProps) {
  const { toast } = useToast();

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to clipboard",
      description: "The address has been copied to your clipboard.",
    });
  };

  const formatStage = (stage: string) => {
    return stage.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const getFileIcon = (type: string | null | undefined) => {
    if (!type) return "ri-file-line";
    if (type.includes('pdf')) return "ri-file-text-line";
    if (type.includes('excel') || type.includes('sheet')) return "ri-file-chart-line";
    if (type.includes('word') || type.includes('document')) return "ri-file-list-3-line";
    return "ri-file-line";
  };
  
  const getFileSize = (sizeInMb?: number) => {
    if (sizeInMb === undefined || sizeInMb === null) {
      return 'Unknown size';
    }
    return sizeInMb < 1 
      ? `${Math.round(sizeInMb * 1000)} KB` 
      : `${sizeInMb.toFixed(1)} MB`;
  };
  
  const formatDateAgo = (date?: Date) => {
    if (!date) {
      return 'Unknown date';
    }
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - new Date(date).getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return "Today";
    if (diffInDays === 1) return "Yesterday";
    if (diffInDays < 7) return `${diffInDays} days ago`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
    if (diffInDays < 365) return `${Math.floor(diffInDays / 30)} months ago`;
    return `${Math.floor(diffInDays / 365)} years ago`;
  };

  return (
    <Card className="border border-neutral-200">
      <CardContent className="pt-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-neutral-800">Startup Information</h2>
          {onEditClick && (
            <Button variant="ghost" className="text-primary-500 hover:text-primary-700" onClick={onEditClick}>
              <Edit className="h-4 w-4 mr-1" />
              <span className="text-sm font-medium">Edit Details</span>
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-bold text-neutral-800 mb-1">{startup.name}</h3>
            <p className="text-neutral-600 text-sm mb-4">{startup.description}</p>

            <div className="mb-4">
              <div className="text-xs text-neutral-500 mb-1">Investment Stage</div>
              <div className={`inline-block text-xs font-medium px-2 py-1 rounded ${getStageColor(startup.stage)}`}>
                {formatStage(startup.stage)}
              </div>
            </div>

            <div className="text-xs text-neutral-500 mb-1">Elevator Pitch</div>
            <p className="text-sm text-neutral-700 mb-4">{startup.pitch}</p>

            <div className="text-xs text-neutral-500 mb-1">Wallet Address</div>
            <div className="flex items-center bg-neutral-100 px-3 py-2 rounded-md mb-4">
              <span className="text-sm font-mono text-neutral-700 overflow-hidden wallet-address">
                {startup.walletAddress || "Not connected"}
              </span>
              {startup.walletAddress && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="ml-2 text-neutral-500 hover:text-neutral-700 p-0 h-auto"
                  onClick={() => copyToClipboard(startup.walletAddress || "")}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              )}
            </div>

            <div className="text-xs text-neutral-500 mb-1">UPI ID</div>
            <p className="text-sm text-neutral-700">{startup.upiId || "Not provided"}</p>
          </div>

          <div>
            <div className="text-xs text-neutral-500 mb-1">Uploaded Documents</div>
            <div className="space-y-3">
              {documents.length === 0 ? (
                <p className="text-sm text-neutral-500">No documents uploaded.</p>
              ) : (
                documents.map((document) => (
                  <div key={document.id} className="flex items-center bg-neutral-50 p-3 rounded-md border border-neutral-200">
                    <i className={`${getFileIcon(document.type)} text-neutral-500 mr-2`}></i>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-neutral-800 truncate">{document.name}</div>
                      <div className="text-xs text-neutral-500">
                        {getFileSize(document.sizeInMb)} • Uploaded {formatDateAgo(document.uploadedAt)}
                      </div>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-primary-500 hover:text-primary-700 p-1 h-auto"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                ))
              )}
            </div>
            <div className="mt-4">
              <Button variant="ghost" className="text-primary-500 hover:text-primary-700 p-0">
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
                  className="h-4 w-4 mr-1"
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
                <span className="text-sm font-medium">Upload New Document</span>
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
