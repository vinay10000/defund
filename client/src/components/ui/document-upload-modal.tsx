import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FileUpload } from '@/components/ui/file-upload';
import { FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';

interface DocumentUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  startupId: string | number;
}

export function DocumentUploadModal({ isOpen, onClose, startupId }: DocumentUploadModalProps) {
  const [documentTitle, setDocumentTitle] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (file: File) => {
    if (!documentTitle.trim()) {
      toast({
        title: 'Missing document title',
        description: 'Please enter a title for your document',
        variant: 'destructive',
      });
      return;
    }

    setIsUploading(true);

    try {
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('document', file);
      formData.append('title', documentTitle);

      const response = await fetch('/api/upload/document', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to upload document');
      }

      await response.json();

      // Refresh the documents list after successful upload
      queryClient.invalidateQueries({ queryKey: ['/api/startups', startupId, 'documents'] });

      toast({
        title: 'Document uploaded',
        description: 'Your document has been uploaded successfully',
      });

      // Reset form and close modal
      setDocumentTitle('');
      onClose();
    } catch (error) {
      console.error('Document upload error:', error);
      toast({
        title: 'Upload failed',
        description: error instanceof Error ? error.message : 'Failed to upload document',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upload Document</DialogTitle>
          <DialogDescription>
            Upload supporting documents for your startup (Max: 1MB)
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="document-title">Document Title</Label>
            <Input
              id="document-title"
              placeholder="Enter document title"
              value={documentTitle}
              onChange={(e) => setDocumentTitle(e.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <Label>Document File</Label>
            <FileUpload
              onFileUpload={handleSubmit}
              acceptedFileTypes={[
                'application/pdf',
                'application/msword',
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'image/jpeg',
                'image/png'
              ]}
              maxSize={1} // Enforce 1MB limit for documents
              label="Drag & drop or click to upload document"
              icon={<FileText className="h-8 w-8 text-muted-foreground/60" />}
            />
          </div>
        </div>

        <DialogFooter className="flex justify-between sm:justify-between">
          <Button variant="outline" onClick={onClose} disabled={isUploading}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}