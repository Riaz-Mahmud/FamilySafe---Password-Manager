
'use client';

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
import { AlertTriangle, Copy, Printer, ShieldCheck } from 'lucide-react';

type RecoveryKitDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User | null;
  secretKey: string;
};

export function RecoveryKitDialog({
  open,
  onOpenChange,
  user,
  secretKey,
}: RecoveryKitDialogProps) {
  const { toast } = useToast();

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

  if (!user || !secretKey) {
    return null;
  }

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
                Your New FamilySafe Recovery Kit
              </DialogTitle>
              <DialogDescription>
                This new kit replaces any previous one you may have saved. Print this and store it in a safe place.
              </DialogDescription>
            </DialogHeader>
            
            <div className="p-4 bg-destructive/10 border border-destructive/50 text-destructive rounded-lg flex items-start gap-3">
              <AlertTriangle className="h-6 w-6 mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-bold">Important: Your Old Kit Is Now Invalid</h3>
                <p className="text-sm">This is now the only secret key that can be used to recover your account. Your old kit, if you had one, is now useless. Do not save this as a digital file on your computer. Keep it offline and secure.</p>
              </div>
            </div>

            <div className="space-y-4">
               <div>
                <h4 className="font-semibold">Account Email</h4>
                <p className="text-muted-foreground">{user.email}</p>
              </div>
              
              <div>
                 <h4 className="font-semibold">Your New Secret Recovery Key</h4>
                 <div className="flex items-center gap-2 mt-1">
                    <p className="text-muted-foreground font-mono p-2 bg-secondary rounded-md text-sm w-full break-all">
                      {secretKey}
                    </p>
                    <Button variant="outline" size="icon" className="no-print" onClick={() => handleCopy(secretKey, 'Secret Key')}>
                        <Copy className="h-4 w-4" />
                    </Button>
                 </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Emergency QR Code</h4>
                <div className="p-4 bg-white rounded-lg inline-block">
                  <QRCodeSVG value={qrCodeValue} size={160} />
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
            <Button type="button" onClick={handlePrint}>
              <Printer className="mr-2 h-4 w-4" />
              Print Kit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
