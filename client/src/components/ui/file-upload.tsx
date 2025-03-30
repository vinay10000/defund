import { useState, useCallback, ReactNode } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Loader2, Upload, X, CheckCircle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface FileUploadProps {
  onFileUpload: (file: File) => Promise<void>;
  className?: string;
  acceptedFileTypes?: string[];
  maxSize?: number; // in MB
  label?: string;
  icon?: ReactNode;
  previewUrl?: string;
  showPreview?: boolean;
}

export function FileUpload({
  onFileUpload,
  className,
  acceptedFileTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/svg+xml'],
  maxSize = 5, // 5MB default for images, but 1MB for documents
  label = 'Drag & drop a file here, or click to select',
  icon,
  previewUrl,
  showPreview = true,
}: FileUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [preview, setPreview] = useState<string | null>(previewUrl || null);
  const { toast } = useToast();

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        const file = acceptedFiles[0];
        setIsUploading(true);
        setUploadError(null);
        setUploadSuccess(false);

        // Create preview for images
        if (file.type.startsWith('image/')) {
          const reader = new FileReader();
          reader.onload = () => {
            setPreview(reader.result as string);
          };
          reader.readAsDataURL(file);
        }

        try {
          await onFileUpload(file);
          setUploadSuccess(true);
          toast({
            title: 'Upload successful',
            description: 'Your file has been uploaded successfully.',
          });
        } catch (error) {
          console.error('Upload error:', error);
          setUploadError(error instanceof Error ? error.message : 'Failed to upload file');
          toast({
            title: 'Upload failed',
            description: error instanceof Error ? error.message : 'Failed to upload file',
            variant: 'destructive',
          });
        } finally {
          setIsUploading(false);
        }
      }
    },
    [onFileUpload, toast]
  );

  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    onDrop,
    accept: acceptedFileTypes.reduce((obj, type) => {
      return { ...obj, [type]: [] };
    }, {}),
    maxSize: maxSize * 1024 * 1024,
    multiple: false,
  });

  const removeFile = () => {
    setPreview(null);
    setUploadSuccess(false);
  };

  // Check for file rejections
  const fileError = fileRejections.length > 0 
    ? fileRejections[0].errors[0].message 
    : uploadError;

  return (
    <div className={cn('w-full', className)}>
      {preview && showPreview ? (
        <div className="relative mb-4">
          <div className="relative w-full h-40 rounded-md overflow-hidden">
            <img src={preview} alt="Preview" className="w-full h-full object-cover" />
            <Button
              variant="destructive"
              size="icon"
              className="absolute top-2 right-2 h-8 w-8 rounded-full"
              onClick={removeFile}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : (
        <div
          {...getRootProps()}
          className={cn(
            'border-2 border-dashed rounded-md p-8 text-center cursor-pointer transition-colors',
            isDragActive
              ? 'border-primary-400 bg-primary-50 dark:bg-primary-950/20'
              : 'border-muted-foreground/25 hover:border-primary-300 hover:bg-muted/10',
            fileError && 'border-destructive/50 hover:border-destructive',
            className
          )}
        >
          <input {...getInputProps()} />
          
          <div className="flex flex-col items-center justify-center space-y-2 text-muted-foreground">
            {icon || <Upload className="h-8 w-8 mb-2 text-muted-foreground/60" />}
            
            {isUploading ? (
              <div className="flex flex-col items-center">
                <Loader2 className="h-6 w-6 animate-spin mb-2" />
                <p className="text-sm">Uploading...</p>
              </div>
            ) : uploadSuccess ? (
              <div className="flex flex-col items-center">
                <CheckCircle className="h-6 w-6 text-success mb-2" />
                <p className="text-sm">File uploaded successfully</p>
              </div>
            ) : (
              <div>
                <p className="text-sm font-medium">{label}</p>
                <p className="text-xs mt-1">
                  {acceptedFileTypes.map(type => type.replace('image/', '.')).join(', ')} (Max: {maxSize}MB)
                </p>
              </div>
            )}

            {fileError && (
              <div className="flex items-center text-destructive mt-2 text-xs">
                <AlertCircle className="h-4 w-4 mr-1" />
                <span>{fileError}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}