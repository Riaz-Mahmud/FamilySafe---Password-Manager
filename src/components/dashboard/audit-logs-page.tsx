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
import { useState } from 'react';
import { Button } from '@/components/ui/button';

type AuditLogsPageProps = {
  logs: AuditLog[];
};

const ITEMS_PER_PAGE = 30;

export function AuditLogsPage({ logs }: AuditLogsPageProps) {
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(logs.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, logs.length);
  const currentLogs = logs.slice(startIndex, endIndex);

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
        {currentLogs.map((log) => (
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
          {currentLogs.map((log) => (
            <TableRow key={log.id}>
              <TableCell className="font-medium">{log.action}</TableCell>
              <TableCell>{log.description}</TableCell>
              <TableCell className="text-right text-muted-foreground">{log.timestamp}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
    
    {logs.length > 0 && (
      <div className="flex items-center justify-between py-4">
        <div className="text-sm text-muted-foreground">
          Showing {startIndex + 1} to {endIndex} of {logs.length} logs.
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
    </>
  );
}
