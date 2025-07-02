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

type SendEmailDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  credential: Credential | null;
  familyMembers: FamilyMember[];
  user: User | null;
  onSendEmail: (emails: string[], credential: Credential) => Promise<void>;
};

export function SendEmailDialog({
  open,
  onOpenChange,
  credential,
  familyMembers,
  user,
  onSendEmail,
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
    await onSendEmail(selectedEmails, credential);
    setIsSending(false);
    onOpenChange(false);
  };

  if (!credential) return null;

  const sharedWithMembers = familyMembers.filter((member) =>
    credential.sharedWith.includes(member.id)
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="font-headline">Send Credential via Email</DialogTitle>
          <DialogDescription>
            Select who should receive the credentials for{' '}
            <strong>{new URL(credential.url).hostname}</strong>.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <p className="text-sm">
            <strong>URL:</strong> {credential.url}
            <br />
            <strong>Username:</strong> {credential.username}
          </p>
          <div className="space-y-2">
            <h4 className="font-medium text-sm">Recipients</h4>
            {user?.email && (
              <div className="flex items-center space-x-2">
                <Checkbox
                  id={user.email}
                  onCheckedChange={(checked) => handleEmailSelection(user.email!, !!checked)}
                  checked={selectedEmails.includes(user.email)}
                />
                <Label htmlFor={user.email} className="font-normal">
                  {user.email} (You)
                </Label>
              </div>
            )}
            {sharedWithMembers.map((member) => (
              <div key={member.id} className="flex items-center space-x-2">
                <Checkbox
                  id={member.id}
                  onCheckedChange={(checked) => handleEmailSelection(member.email, !!checked)}
                  checked={selectedEmails.includes(member.email)}
                />
                <Label htmlFor={member.id} className="font-normal">
                  {member.email} ({member.name})
                </Label>
              </div>
            ))}
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
