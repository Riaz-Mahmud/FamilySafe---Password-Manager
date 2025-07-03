
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
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import type { Credential, FamilyMember } from '@/types';
import type { User } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { sendCredentialEmailAction } from '@/app/actions';

type SendEmailDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  credential: Credential | null;
  familyMembers: FamilyMember[];
  user: User | null;
};

export function SendEmailDialog({
  open,
  onOpenChange,
  credential,
  familyMembers,
  user,
}: SendEmailDialogProps) {
  const [selectedEmails, setSelectedEmails] = useState<string[]>([]);
  const [isSending, setIsSending] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!open) {
      setSelectedEmails([]);
      setIsSending(false);
    }
  }, [open]);

  const handleEmailSelection = (email: string, checked: boolean) => {
    setSelectedEmails((prev) =>
      checked ? [...prev, email] : prev.filter((e) => e !== email)
    );
  };

  const handleSubmit = async () => {
    if (!credential || selectedEmails.length === 0) {
      toast({
        title: 'No Email Selected',
        description: 'Please select at least one email address to send the credentials to.',
        variant: 'destructive',
      });
      return;
    }
    setIsSending(true);
    const result = await sendCredentialEmailAction({
      emails: selectedEmails,
      url: credential.url,
      username: credential.username,
      password: credential.password,
    });
    
    if (result.success) {
      toast({
        title: 'Email Sent',
        description: result.message,
      });
    } else {
        toast({
            title: 'Error Sending Email',
            description: result.message,
            variant: 'destructive',
        });
    }

    setIsSending(false);
    onOpenChange(false);
  };

  if (!credential) return null;

  const siteOrAppName = (() => {
      try {
          return new URL(credential.url).hostname;
      } catch {
          return credential.url;
      }
  })();

  const sharedWithMembers = familyMembers.filter((member) =>
    credential.sharedWith.includes(member.id) && member.email
  );
  
  const allPossibleRecipients = (user?.email ? [{email: user.email, name: 'You', id: user.uid}] : []).concat(
    sharedWithMembers
  );


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="font-headline">Send Credential via Email</DialogTitle>
          <DialogDescription>
            Select who should receive the credentials for{' '}
            <strong>{siteOrAppName}</strong>.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <h4 className="font-medium text-sm">Recipients</h4>
            {allPossibleRecipients.length > 0 ? (
                <>
                {allPossibleRecipients.map((recipient) => (
                   <div key={recipient.id} className="flex items-center space-x-2">
                    <Checkbox
                    id={recipient.id}
                    onCheckedChange={(checked) => handleEmailSelection(recipient.email!, !!checked)}
                    checked={selectedEmails.includes(recipient.email!)}
                    />
                    <Label htmlFor={recipient.id} className="font-normal">
                    {recipient.email} ({recipient.name})
                    </Label>
                </div>
                ))}
            </>
            ) : (
                <p className="text-sm text-muted-foreground">No recipients available. Share this password with a family member (with an email) to be able to email them.</p>
            )}
            
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={isSending}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={isSending || selectedEmails.length === 0}>
            {isSending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Send Email
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
