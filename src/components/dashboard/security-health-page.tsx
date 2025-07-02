
'use client';

import { useState } from 'react';
import type { Credential } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { AlertCircle, CheckCircle2, ShieldAlert, ShieldCheck, Loader2 } from 'lucide-react';
import { analyzeCredentials, type SecurityReport } from '@/lib/security';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

type SecurityHealthPageProps = {
    credentials: Credential[];
    onEditCredential: (credential: Credential) => void;
};

export function SecurityHealthPage({ credentials, onEditCredential }: SecurityHealthPageProps) {
  const [report, setReport] = useState<SecurityReport | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleStartScan = async () => {
    setIsScanning(true);
    setReport(null);
    setProgress(0);
    
    // This is a dummy progress updater for better UX.
    const interval = setInterval(() => {
        setProgress(p => Math.min(p + Math.random() * 10, 90));
    }, 200);

    const analysisResult = await analyzeCredentials(credentials);
    
    clearInterval(interval);
    setProgress(100);
    setReport(analysisResult);
    setIsScanning(false);
  };

  const totalIssues = report ? report.pwned.length + report.reused.length + report.weak.length : 0;
  const healthScore = credentials.length > 0 ? Math.max(0, 100 - (totalIssues / credentials.length) * 50) : 100;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Security Health Check</CardTitle>
          <CardDescription>
            Scan your saved credentials for vulnerabilities like data breaches, reused passwords, and weak passwords.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4">
          <p className="text-sm text-muted-foreground">
            This check is performed securely in your browser. Your passwords are never sent to any server.
          </p>
          <Button onClick={handleStartScan} disabled={isScanning || credentials.length === 0} size="lg">
            {isScanning && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isScanning ? 'Scanning...' : 'Start Security Scan'}
          </Button>
          {credentials.length === 0 && (
            <p className="text-sm text-center text-muted-foreground mt-2">
                You have no credentials to scan. Add some passwords first.
            </p>
          )}
        </CardContent>
      </Card>

      {isScanning && (
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <p className="font-semibold">Analyzing your passwords...</p>
              <Progress value={progress} className="w-full" />
              <p className="text-sm text-muted-foreground">Please wait, this may take a moment.</p>
            </div>
          </CardContent>
        </Card>
      )}

      {report && !isScanning && (
        <div className="space-y-6">
          <Card>
            <CardHeader className="text-center">
              <div className="flex justify-center mb-2">
                {healthScore > 80 ? <ShieldCheck className="h-16 w-16 text-green-500" /> : <ShieldAlert className="h-16 w-16 text-destructive" />}
              </div>
              <CardTitle>Security Score: {Math.round(healthScore)}%</CardTitle>
              <CardDescription>
                {totalIssues === 0 ? "Great job! No security issues found." : `Found ${totalIssues} potential issues.`}
              </CardDescription>
            </CardHeader>
          </Card>

          <Accordion type="multiple" className="w-full space-y-4">
             {report.pwned.length > 0 && (
                <Card>
                    <AccordionItem value="pwned" className="border-0">
                        <AccordionTrigger className="p-6 hover:no-underline">
                             <div className="flex items-center gap-4">
                                <AlertCircle className="h-6 w-6 text-destructive" />
                                <div>
                                    <h3 className="font-semibold text-left">Compromised Passwords</h3>
                                    <p className="text-sm text-muted-foreground text-left">{report.pwned.length} passwords found in data breaches.</p>
                                </div>
                            </div>
                        </AccordionTrigger>
                        <AccordionContent className="px-6 pb-6">
                            <p className="text-sm text-muted-foreground mb-4">These passwords have appeared in public data breaches. You should change them immediately everywhere they are used.</p>
                            <div className="border rounded-lg">
                                <ul className="divide-y">
                                    {report.pwned.map(cred => (
                                        <li key={cred.id} className="p-4 flex justify-between items-center">
                                            <div>
                                                <p className="font-medium">{cred.url}</p>
                                                <p className="text-sm text-muted-foreground">{cred.username}</p>
                                                <p className="text-xs text-destructive mt-1">Found in {cred.pwnedCount.toLocaleString()} breaches</p>
                                            </div>
                                            <Button variant="outline" size="sm" onClick={() => onEditCredential(cred)}>Change Password</Button>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                </Card>
             )}
             
             {report.reused.length > 0 && (
                <Card>
                    <AccordionItem value="reused" className="border-0">
                        <AccordionTrigger className="p-6 hover:no-underline">
                            <div className="flex items-center gap-4">
                                <AlertCircle className="h-6 w-6 text-yellow-500" />
                                <div>
                                    <h3 className="font-semibold text-left">Reused Passwords</h3>
                                    <p className="text-sm text-muted-foreground text-left">{report.reused.length} passwords used for multiple accounts.</p>
                                </div>
                            </div>
                        </AccordionTrigger>
                        <AccordionContent className="px-6 pb-6">
                            <p className="text-sm text-muted-foreground mb-4">Using the same password across multiple sites is risky. If one site is breached, all accounts with that password are vulnerable.</p>
                            {report.reused.map((group, index) => (
                                <div key={index} className="border rounded-lg mb-4">
                                    <p className="p-3 bg-muted text-sm font-medium">Used for {group.count} accounts:</p>
                                    <ul className="divide-y">
                                        {group.credentials.map(cred => (
                                             <li key={cred.id} className="p-4 flex justify-between items-center">
                                                <div>
                                                    <p className="font-medium">{cred.url}</p>
                                                    <p className="text-sm text-muted-foreground">{cred.username}</p>
                                                </div>
                                                <Button variant="outline" size="sm" onClick={() => onEditCredential(cred)}>Change Password</Button>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </AccordionContent>
                    </AccordionItem>
                </Card>
             )}
             
             {report.weak.length > 0 && (
                <Card>
                    <AccordionItem value="weak" className="border-0">
                        <AccordionTrigger className="p-6 hover:no-underline">
                           <div className="flex items-center gap-4">
                                <AlertCircle className="h-6 w-6 text-yellow-500" />
                                <div>
                                    <h3 className="font-semibold text-left">Weak Passwords</h3>
                                    <p className="text-sm text-muted-foreground text-left">{report.weak.length} passwords are too simple.</p>
                                </div>
                            </div>
                        </AccordionTrigger>
                        <AccordionContent className="px-6 pb-6">
                            <p className="text-sm text-muted-foreground mb-4">These passwords are too short (less than 8 characters) and can be easily guessed. You should make them longer and more complex.</p>
                            <div className="border rounded-lg">
                                <ul className="divide-y">
                                    {report.weak.map(cred => (
                                         <li key={cred.id} className="p-4 flex justify-between items-center">
                                            <div>
                                                <p className="font-medium">{cred.url}</p>
                                                <p className="text-sm text-muted-foreground">{cred.username}</p>
                                            </div>
                                            <Button variant="outline" size="sm" onClick={() => onEditCredential(cred)}>Change Password</Button>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                </Card>
             )}

            {totalIssues === 0 && (
                <Card className="border-green-500/50">
                    <CardContent className="p-6 flex items-center gap-4">
                        <CheckCircle2 className="h-8 w-8 text-green-500" />
                        <div>
                             <h3 className="font-semibold">All Clear!</h3>
                             <p className="text-sm text-muted-foreground">Your passwords are not compromised, reused, or weak according to our checks.</p>
                        </div>
                    </CardContent>
                </Card>
            )}
          </Accordion>
        </div>
      )}
    </div>
  );
}
