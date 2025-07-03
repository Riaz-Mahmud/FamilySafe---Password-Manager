
'use client';

import type { AuditLog } from '@/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { History } from 'lucide-react';

type AuditLogsPageProps = {
  logs: AuditLog[];
};

export function AuditLogsPage({ logs }: AuditLogsPageProps) {
  if (logs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center p-8 border-2 border-dashed rounded-lg h-full">
        <History className="h-16 w-16 text-muted-foreground mb-4" />
        <h2 className="text-2xl font-headline font-bold">No Activity Yet</h2>
        <p className="text-muted-foreground mt-2">
          Your account activity will be recorded here as you use the application.
        </p>
      </div>
    );
  }

  return (
    <>
    {/* Mobile View */}
    <div className="md:hidden space-y-3">
        {logs.map((log) => (
            <Card key={log.id}>
                <CardContent className="p-4 space-y-2">
                    <div className="flex justify-between items-start gap-4">
                        <p className="font-medium">{log.action}</p>
                        <p className="text-sm text-muted-foreground text-right shrink-0">{log.timestamp}</p>
                    </div>
                    <p className="text-sm text-muted-foreground">{log.description}</p>
                </CardContent>
            </Card>
        ))}
    </div>

    {/* Desktop View */}
    <div className="hidden md:block border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[25%]">Action</TableHead>
            <TableHead className="w-[50%]">Description</TableHead>
            <TableHead className="text-right">Date</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {logs.map((log) => (
            <TableRow key={log.id}>
              <TableCell className="font-medium">{log.action}</TableCell>
              <TableCell>{log.description}</TableCell>
              <TableCell className="text-right text-muted-foreground">{log.timestamp}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
    </>
  );
}
