
'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import type { Credential } from '@/types';
import { Eye, EyeOff, Copy, Globe } from 'lucide-react';
import { Badge } from '../ui/badge';
import Link from 'next/link';

type PasswordPreviewDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  credential: Credential | null;
};

export function PasswordPreviewDialog({
  open,
  onOpenChange,
  credential,
}: PasswordPreviewDialogProps) {
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Hide password when dialog opens or changes
    if (open) {
      setShowPassword(false);
    }
  }, [open, credential]);

  if (!credential) {
    return null;
  }
  
  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied to clipboard',
      description: `${field} has been copied successfully.`,
    });
  };

  const renderLink = () => {
    try {
        const url = new URL(credential.url);
        return (
            <Link href={url.href} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                {url.href}
            </Link>
        )
    } catch {
        return <span>{credential.url}</span>
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="font-headline flex items-center gap-3">
             <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-secondary shrink-0">
                <Globe className="w-5 h-5 text-muted-foreground" />
             </div>
             <span className="truncate">{credential.url}</span>
          </DialogTitle>
          <DialogDescription>
            Viewing credential details. Last modified on {credential.lastModified ? new Date(credential.lastModified).toLocaleDateString() : 'N/A'}.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6 py-4 max-h-[60vh] overflow-y-auto px-1">
            <div className="space-y-2">
                <h4 className="font-semibold text-sm text-muted-foreground">Website / Application</h4>
                <p>{renderLink()}</p>
            </div>
            <div className="space-y-2">
                <h4 className="font-semibold text-sm text-muted-foreground">Username / Email</h4>
                <div className="flex items-center gap-2">
                    <p className="font-mono text-base bg-muted p-2 rounded-md flex-1 truncate">{credential.username}</p>
                    <Button variant="ghost" size="icon" onClick={() => handleCopy(credential.username, 'Username')}>
                        <Copy className="h-4 w-4" />
                    </Button>
                </div>
            </div>
             <div className="space-y-2">
                <h4 className="font-semibold text-sm text-muted-foreground">Password</h4>
                <div className="flex items-center gap-2">
                     <p className="font-mono text-base bg-muted p-2 rounded-md flex-1 truncate">
                        {showPassword ? credential.password : '••••••••••••'}
                     </p>
                    <Button variant="ghost" size="icon" onClick={() => setShowPassword(!showPassword)}>
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleCopy(credential.password, 'Password')}>
                        <Copy className="h-4 w-4" />
                    </Button>
                </div>
            </div>
            {credential.notes && (
                 <div className="space-y-2">
                    <h4 className="font-semibold text-sm text-muted-foreground">Secure Notes</h4>
                    <p className="text-sm bg-muted p-3 rounded-md whitespace-pre-wrap">{credential.notes}</p>
                </div>
            )}
             {credential.tags && credential.tags.length > 0 && (
                <div className="space-y-2">
                    <h4 className="font-semibold text-sm text-muted-foreground">Tags</h4>
                    <div className="flex flex-wrap gap-2">
                        {credential.tags.map(tag => (
                            <Badge key={tag} variant="secondary">{tag}</Badge>
                        ))}
                    </div>
                </div>
            )}
        </div>
        <DialogFooter>
          <Button type="button" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
