
'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import type { SecureDocument } from '@/types';
import Image from 'next/image';
import { Download, File as FileIcon } from 'lucide-react';

type SecureDocumentPreviewDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  document: SecureDocument | null;
};

export function SecureDocumentPreviewDialog({
  open,
  onOpenChange,
  document,
}: SecureDocumentPreviewDialogProps) {
  if (!document) {
    return null;
  }

  const handleDownload = () => {
    if (!document) return;
    const link = document.createElement('a');
    link.href = document.fileDataUrl;
    link.download = document.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const isImage = document.fileType.startsWith('image/');
  const isPdf = document.fileType === 'application/pdf';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl h-[90vh]">
        <DialogHeader>
          <DialogTitle className="font-headline truncate">{document.name}</DialogTitle>
          <DialogDescription>
            {document.fileType} - {(document.fileSize / 1024).toFixed(2)} KB
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 h-full overflow-auto my-4 bg-muted/20 rounded-md">
          {isImage ? (
            <div className="relative w-full h-full flex items-center justify-center">
                <Image
                    src={document.fileDataUrl}
                    alt={document.name}
                    width={1000}
                    height={1000}
                    className="rounded-md max-w-full max-h-full object-contain"
                />
            </div>
          ) : isPdf ? (
            <iframe
              src={document.fileDataUrl}
              className="w-full h-full border-0"
              title={document.name}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center p-8 border-2 border-dashed rounded-lg">
                <FileIcon className="h-16 w-16 text-muted-foreground mb-4" />
                <h2 className="text-2xl font-headline font-bold">No Preview Available</h2>
                <p className="text-muted-foreground mt-2">
                    A preview is not available for this file type. You can download it to view its content.
                </p>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={handleDownload}>
            <Download className="mr-2 h-4 w-4" />
            Download
          </Button>
          <Button type="button" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
