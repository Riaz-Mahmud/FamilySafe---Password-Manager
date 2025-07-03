
'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Copy, MoreHorizontal, Globe, Trash2, Edit, KeyRound, Github, Bot, Mail, AlertTriangle, Plane } from 'lucide-react';
import type { Credential } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { addMonths, differenceInDays, format, isPast } from 'date-fns';
import { useState } from 'react';

type PasswordListProps = {
  credentials: Credential[];
  onEdit: (credential: Credential) => void;
  onDelete: (id: string) => void;
  onSend: (credential: Credential) => void;
  isTravelModeActive?: boolean;
};

const iconMap: { [key: string]: React.ComponentType<any> } = {
  Github,
  Globe,
  Bot,
};

const ITEMS_PER_PAGE = 30;

const getExpiryStatus = (createdAt: string, expiryMonths: number | undefined) => {
  if (!expiryMonths || expiryMonths === 0 || !createdAt) {
    return { status: 'ok', message: null };
  }

  const createdDate = new Date(createdAt);
  if (isNaN(createdDate.getTime())) {
    return { status: 'ok', message: null };
  }
  
  const expiryDate = addMonths(createdDate, expiryMonths);
  const today = new Date();
  
  if (isPast(expiryDate)) {
    return { status: 'expired', message: `Expired on ${format(expiryDate, 'MMM d, yyyy')}` };
  }
  
  const daysRemaining = differenceInDays(expiryDate, today);
  
  if (daysRemaining <= 30) {
    return { status: 'expiring', message: `Expires in ${daysRemaining} day${daysRemaining !== 1 ? 's' : ''}` };
  }
  
  return { status: 'ok', message: `Expires on ${format(expiryDate, 'MMM d, yyyy')}` };
};

export function PasswordList({ credentials, onEdit, onDelete, onSend, isTravelModeActive }: PasswordListProps) {
  const { toast } = useToast();
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(credentials.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, credentials.length);
  const currentCredentials = credentials.slice(startIndex, endIndex);

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied to clipboard',
      description: `${field} has been copied successfully.`,
    });
  };

  const renderSiteCell = (credential: Credential) => {
    const expiry = getExpiryStatus(credential.createdAt, credential.expiryMonths);
    const ExpiryIndicator = () => {
      if (!expiry.message || expiry.status === 'ok') return null;
      return (
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="ml-2 flex-shrink-0">
              {expiry.status === 'expired' && <AlertTriangle className="h-4 w-4 text-destructive" />}
              {expiry.status === 'expiring' && <AlertTriangle className="h-4 w-4 text-yellow-500" />}
            </span>
          </TooltipTrigger>
          <TooltipContent>
            <p>{expiry.message}</p>
          </TooltipContent>
        </Tooltip>
      );
    };

    try {
        const urlObject = new URL(credential.url);
        return (
            <>
                <div className="flex items-center">
                  <a href={urlObject.href} target="_blank" rel="noopener noreferrer" className="font-medium truncate hover:underline">{urlObject.hostname}</a>
                  <ExpiryIndicator />
                </div>
                <span className="text-sm text-muted-foreground truncate">{urlObject.href}</span>
            </>
        )
    } catch (error) {
        return (
          <div className="flex items-center">
            <span className="font-medium truncate">{credential.url}</span>
            <ExpiryIndicator />
          </div>
        )
    }
  }

  if (credentials.length === 0) {
    const IconComponent = isTravelModeActive ? Plane : KeyRound;
    const title = isTravelModeActive ? "No Passwords for Travel" : "No Passwords Found";
    const description = isTravelModeActive 
        ? "Mark credentials as 'Safe for Travel' to see them here."
        : 'This vault is empty. Click "Add Credential" to save a password here.';
    
    return (
        <div className="flex flex-col items-center justify-center text-center p-8 border-2 border-dashed rounded-lg h-full min-h-[200px]">
            <IconComponent className="h-16 w-16 text-muted-foreground mb-4" />
            <h2 className="text-2xl font-headline font-bold">{title}</h2>
            <p className="text-muted-foreground mt-2">{description}</p>
        </div>
    );
  }

  const renderTags = (credential: Credential) => {
    if (!credential.tags || credential.tags.length === 0) return null;
    return (
        <div className="flex flex-wrap gap-1 mt-1">
            {credential.tags.map(tag => (
                <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
            ))}
        </div>
    )
  }

  return (
    <TooltipProvider>
      {/* Mobile View */}
      <div className="md:hidden space-y-4">
        {currentCredentials.map(credential => {
            const IconComponent = iconMap[credential.icon] || Globe;
            return (
                <Card key={credential.id} className="w-full">
                    <CardContent className="p-4 flex flex-col gap-4">
                        <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3 overflow-hidden">
                                <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-secondary shrink-0">
                                <IconComponent className="w-5 h-5 text-muted-foreground" />
                                </div>
                                <div className="flex flex-col overflow-hidden">
                                {renderSiteCell(credential)}
                                {renderTags(credential)}
                                </div>
                            </div>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                                    <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => onEdit(credential)}>
                                      <Edit className="mr-2 h-4 w-4" />
                                      Edit
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => onSend(credential)}>
                                      <Mail className="mr-2 h-4 w-4" />
                                      Send Email
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                    className="text-destructive focus:text-destructive"
                                    onClick={() => onDelete(credential.id)}
                                    >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                        
                        <div className="space-y-1">
                            <p className="text-sm font-medium text-muted-foreground">Username</p>
                            <div className="flex items-center gap-2">
                                <span className="truncate">{credential.username}</span>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-7 w-7"
                                            onClick={() => handleCopy(credential.username, 'Username')}
                                        >
                                            <Copy className="h-4 w-4" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Copy username</TooltipContent>
                                </Tooltip>
                            </div>
                        </div>

                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCopy(credential.password || '', 'Password')}
                            className="w-full"
                        >
                            <Copy className="h-4 w-4 mr-2" />
                            Copy password
                        </Button>
                    </CardContent>
                </Card>
            )
        })}
      </div>

      {/* Desktop View */}
      <div className="hidden md:block border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40%]">Site / Application</TableHead>
              <TableHead className="w-[30%]">Username</TableHead>
              <TableHead>Actions</TableHead>
              <TableHead className="text-right w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentCredentials.map(credential => {
              const IconComponent = iconMap[credential.icon] || Globe;
              return (
                <TableRow key={credential.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-secondary shrink-0">
                        <IconComponent className="w-5 h-5 text-muted-foreground" />
                      </div>
                      <div className="flex flex-col overflow-hidden">
                        {renderSiteCell(credential)}
                        {renderTags(credential)}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="truncate">{credential.username}</span>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => handleCopy(credential.username, 'Username')}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Copy username</TooltipContent>
                      </Tooltip>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Tooltip>
                      <TooltipTrigger asChild>
                      <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCopy(credential.password || '', 'Password')}
                      >
                          <Copy className="h-4 w-4 md:mr-2" />
                          <span className="hidden md:inline">Copy password</span>
                      </Button>
                      </TooltipTrigger>
                      <TooltipContent>Copy password</TooltipContent>
                    </Tooltip>
                  </TableCell>
                  <TableCell className="text-right">
                     <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                          </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => onEdit(credential)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onSend(credential)}>
                            <Mail className="mr-2 h-4 w-4" />
                            Send Email
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => onDelete(credential.id)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                      </DropdownMenuContent>
                     </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
      {credentials.length > 0 && (
        <div className="flex items-center justify-between py-4">
          <div className="text-sm text-muted-foreground">
            Showing {startIndex + 1} to {endIndex} of {credentials.length} credentials.
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
    </TooltipProvider>
  );
}
