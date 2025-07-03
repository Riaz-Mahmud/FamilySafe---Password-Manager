'use client';

import type { DeviceSession } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Monitor, Smartphone, Tablet } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import UAParser from 'ua-parser-js';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useState } from 'react';

type DeviceManagementPageProps = {
  sessions: DeviceSession[];
  onRevoke: (sessionId: string) => void;
};

const ITEMS_PER_PAGE = 30;

function getDeviceIcon(deviceType: string | undefined) {
    switch(deviceType) {
        case 'mobile':
            return <Smartphone className="h-10 w-10 text-muted-foreground" />;
        case 'tablet':
            return <Tablet className="h-10 w-10 text-muted-foreground" />;
        default:
            return <Monitor className="h-10 w-10 text-muted-foreground" />;
    }
}

export function DeviceManagementPage({ sessions, onRevoke }: DeviceManagementPageProps) {
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(sessions.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, sessions.length);
  const currentSessions = sessions.slice(startIndex, endIndex);

  if (sessions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center p-8 border-2 border-dashed rounded-lg h-full">
        <Monitor className="h-16 w-16 text-muted-foreground mb-4" />
        <h2 className="text-2xl font-headline font-bold">No Active Devices Found</h2>
        <p className="text-muted-foreground mt-2">
          Sign in from a new device to see it appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Active Sessions</CardTitle>
          <CardDescription>
            This is a list of devices that have recently signed into your account.
            Revoking a session will sign that device out.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="divide-y">
            {currentSessions.map((session) => {
              const parser = new UAParser(session.userAgent);
              const result = parser.getResult();
              const deviceName = result.browser.name ? `${result.browser.name} on ${result.os.name}` : 'Unknown Device';
              const Icon = getDeviceIcon(result.device.type);

              return (
                <li key={session.id} className="py-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-4">
                    {Icon}
                    <div className="overflow-hidden">
                      <div className="font-semibold flex items-center gap-2 flex-wrap">
                        <span className="truncate">{deviceName}</span>
                        {session.isCurrent && <Badge variant="outline">This Device</Badge>}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Last seen: {session.lastSeen?.toLocaleString()}
                      </p>
                       <p className="text-xs text-muted-foreground mt-1">
                        First signed in: {session.createdAt?.toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button 
                            variant="outline" 
                            size="sm"
                            disabled={session.isCurrent}
                            className="w-full sm:w-auto"
                        >
                            Revoke
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                        <AlertDialogTitle>Revoke Device Access?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to revoke access for this device? It will be signed out immediately.
                        </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => onRevoke(session.id)} className="bg-destructive hover:bg-destructive/90">
                            Revoke
                        </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </li>
              );
            })}
          </ul>
        </CardContent>
      </Card>
      {sessions.length > 0 && (
        <div className="flex items-center justify-between pt-4">
          <div className="text-sm text-muted-foreground">
            Showing {startIndex + 1} to {endIndex} of {sessions.length} sessions.
          </div>
          {totalPages > 1 && (
            <div className="space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
