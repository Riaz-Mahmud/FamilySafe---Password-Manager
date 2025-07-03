
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
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
import type { User } from 'firebase/auth';
import { QRCodeSVG } from 'qrcode.react';
import { AlertTriangle, Copy, Printer, ShieldCheck, Loader2 } from 'lucide-react';
import { saveRecoveryKeyHash } from '@/services/firestore';
import { useAuth } from '@/context/auth-provider';

type RecoveryKitDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User | null;
};

export function RecoveryKitDialog({
  open,
  onOpenChange,
  user,
}: RecoveryKitDialogProps) {
  const [secretKey, setSecretKey] = useState('');
  const [isSavingKey, setIsSavingKey] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open && user) {
      setIsSavingKey(true);
      // Generate a new key each time the dialog is opened for security.
      const newSecretKey = crypto.randomUUID();
      setSecretKey(newSecretKey);
      
      saveRecoveryKeyHash(user.uid, newSecretKey)
        .then(() => {
          setIsSavingKey(false);
        })
        .catch((error) => {
          console.error("Failed to save recovery key hash:", error);
          setIsSavingKey(false);
          toast({
            title: 'Error',
            description: 'Could not prepare recovery kit. Please try again.',
            variant: 'destructive',
          });
        });
    }
  }, [open, user, toast]);

  const handlePrint = () => {
    window.print();
  };

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied to Clipboard',
      description: `${field} has been copied.`,
    });
  };

  if (!user) return null;

  const qrCodeValue = JSON.stringify({
    email: user.email,
    secretKey,
  });

  return (
    <>
      <style jsx global>{`
        @media print {
          body > *:not(.printable-recovery-kit) {
            display: none !important;
          }
          .printable-recovery-kit {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            width: 100%;
            height: 100%;
            display: block !important;
            page-break-after: auto;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-2xl printable-recovery-kit">
          <div id="recovery-kit-content" className="space-y-6 max-h-[80vh] overflow-y-auto p-1 pr-4 print:max-h-none print:overflow-visible">
            <DialogHeader className="text-left">
              <DialogTitle className="font-headline flex items-center gap-2">
                <ShieldCheck className="h-7 w-7 text-primary" />
                FamilySafe Recovery Kit
              </DialogTitle>
              <DialogDescription>
                Print this kit and store it in a safe physical location, such as a safe deposit box.
              </DialogDescription>
            </DialogHeader>
            
            <div className="p-4 bg-destructive/10 border border-destructive/50 text-destructive rounded-lg flex items-start gap-3">
              <AlertTriangle className="h-6 w-6 mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-bold">Important: Do Not Lose This Kit</h3>
                <p className="text-sm">This is the only way to recover your account if you forget your master password. Do not save this as a digital file on your computer. Keep it offline and secure.</p>
              </div>
            </div>

            <div className="space-y-4">
               <div>
                <h4 className="font-semibold">Account Email</h4>
                <p className="text-muted-foreground">{user.email}</p>
              </div>
              
              <div>
                 <h4 className="font-semibold">Secret Recovery Key</h4>
                 <div className="flex items-center gap-2 mt-1">
                    <p className="text-muted-foreground font-mono p-2 bg-secondary rounded-md text-sm w-full break-all">
                      {isSavingKey ? 'Generating...' : secretKey}
                    </p>
                    <Button variant="outline" size="icon" className="no-print" onClick={() => handleCopy(secretKey, 'Secret Key')} disabled={isSavingKey}>
                        <Copy className="h-4 w-4" />
                    </Button>
                 </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Emergency QR Code</h4>
                <div className="p-4 bg-white rounded-lg inline-block">
                    {isSavingKey ? (
                        <div className="h-[160px] w-[160px] flex items-center justify-center bg-gray-200 rounded-md">
                            <Loader2 className="h-8 w-8 animate-spin" />
                        </div>
                    ) : (
                        <QRCodeSVG value={qrCodeValue} size={160} />
                    )}
                </div>
                 <p className="text-xs text-muted-foreground mt-2">
                    A trusted family member can scan this code to help you start the recovery process.
                </p>
              </div>
            </div>

            <div className="text-sm space-y-2 pt-4 border-t">
                <h3 className="font-bold">How to Use This Kit</h3>
                <p>1. Go to the <Link href="/recover-account" className="font-medium text-primary underline underline-offset-4">FamilySafe account recovery page</Link>.</p>
                <p>2. Scan the QR code or manually enter your Account Email and Secret Recovery Key.</p>
                <p>3. Follow the on-screen instructions to reset your master password and regain access to your vault.</p>
            </div>
          </div>
          <DialogFooter className="no-print pt-6">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Close
            </Button>
            <Button type="button" onClick={handlePrint} disabled={isSavingKey}>
              {isSavingKey && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Print Kit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
