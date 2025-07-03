
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Logo } from '@/components/logo';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ShieldQuestion } from 'lucide-react';
import { recoverAccountAction } from '@/app/actions';

export default function RecoverAccountPage() {
  const [email, setEmail] = useState('');
  const [secretKey, setSecretKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleRecovery = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Call the secure server action
    await recoverAccountAction({ email, secretKey });

    // For security, always show a generic message to the user to prevent
    // email enumeration or key-guessing attacks. The actual success/failure
    // is handled on the server.
    toast({
      title: 'Check Your Email',
      description: 'If your email and secret key are valid, you will receive a password reset link.',
    });
    
    setIsLoading(false);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <Card className="mx-auto w-full max-w-sm">
        <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
                <Logo />
            </div>
          <CardTitle className="text-2xl font-bold flex items-center justify-center gap-2">
            <ShieldQuestion /> Account Recovery
          </CardTitle>
          <CardDescription>
            Enter your email and the Secret Key from your Recovery Kit.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleRecovery} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
              />
            </div>
             <div className="space-y-2">
              <Label htmlFor="secretKey">Secret Recovery Key</Label>
              <Input
                id="secretKey"
                type="text"
                placeholder="Enter your secret key"
                required
                value={secretKey}
                onChange={(e) => setSecretKey(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Start Recovery
            </Button>
          </form>
          <div className="mt-4 text-center text-sm">
            Remembered your password?{' '}
            <Link href="/login" className="underline">
              Sign in
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
