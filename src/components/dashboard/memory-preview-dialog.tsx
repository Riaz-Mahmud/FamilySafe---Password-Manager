
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
import type { Memory } from '@/types';
import Image from 'next/image';
import { Album, Calendar } from 'lucide-react';
import { Badge } from '../ui/badge';
import { ScrollArea } from '../ui/scroll-area';

type MemoryPreviewDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  memory: Memory | null;
};

export function MemoryPreviewDialog({
  open,
  onOpenChange,
  memory,
}: MemoryPreviewDialogProps) {
  if (!memory) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="font-headline truncate">{memory.title}</DialogTitle>
          <DialogDescription className="flex items-center gap-2 pt-1">
            <Calendar className="h-4 w-4" />
            {new Date(memory.memoryDate).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' })}
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="flex-1 -mx-6">
            <div className="px-6 space-y-6">
                {memory.photoUrl ? (
                    <div className="relative w-full aspect-video bg-muted rounded-lg overflow-hidden">
                        <Image
                            src={memory.photoUrl}
                            alt={memory.title}
                            fill
                            className="object-contain"
                        />
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-48 bg-muted/50 rounded-lg">
                        <Album className="h-16 w-16 text-muted-foreground/50" />
                        <p className="text-muted-foreground mt-2">No photo for this memory.</p>
                    </div>
                )}
                
                <div>
                    <h3 className="font-semibold text-lg mb-2 border-b pb-2">The Story</h3>
                    <p className="text-foreground/90 whitespace-pre-wrap leading-relaxed">{memory.story}</p>
                </div>
                
                {memory.tags?.length > 0 && (
                    <div>
                        <h3 className="font-semibold text-lg mb-2 border-b pb-2">Tags</h3>
                        <div className="flex flex-wrap gap-2">
                            {memory.tags.map(tag => (
                                <Badge key={tag} variant="secondary">{tag}</Badge>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </ScrollArea>
        <DialogFooter className="pt-4">
          <Button type="button" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
