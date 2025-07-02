
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Copy, MoreHorizontal, Globe, Trash2, Edit, KeyRound, Github, Bot, Mail } from 'lucide-react';
import type { Credential, FamilyMember } from '@/types';

type PasswordListProps = {
  credentials: Credential[];
  familyMembers: FamilyMember[];
  onEdit: (credential: Credential) => void;
  onDelete: (id: string) => void;
  onSend: (credential: Credential) => void;
};

const iconMap: { [key: string]: React.ComponentType<any> } = {
  Github,
  Globe,
  Bot,
};

export function PasswordList({ credentials, familyMembers, onEdit, onDelete, onSend }: PasswordListProps) {
  const { toast } = useToast();

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied to clipboard',
      description: `${field} has been copied successfully.`,
    });
  };

  if (credentials.length === 0) {
    return (
        <div className="flex flex-col items-center justify-center text-center p-8 border-2 border-dashed rounded-lg h-full">
            <KeyRound className="h-16 w-16 text-muted-foreground mb-4" />
            <h2 className="text-2xl font-headline font-bold">No Passwords Found</h2>
            <p className="text-muted-foreground mt-2">
                Click "Add Credential" to save your first password.
            </p>
        </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40%]">Site</TableHead>
              <TableHead className="w-[30%]">Username</TableHead>
              <TableHead>Sharing</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {credentials.map(credential => {
              const sharedWithMembers = familyMembers.filter(member =>
                credential.sharedWith.includes(member.id)
              );
              const IconComponent = iconMap[credential.icon] || Globe;


              return (
                <TableRow key={credential.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-secondary shrink-0">
                        <IconComponent className="w-5 h-5 text-muted-foreground" />
                      </div>
                      <div className="flex flex-col overflow-hidden">
                        <a href={credential.url} target="_blank" rel="noopener noreferrer" className="font-medium truncate hover:underline">{new URL(credential.url).hostname}</a>
                        <span className="text-sm text-muted-foreground truncate">{credential.url}</span>
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
                    {sharedWithMembers.length > 0 ? (
                      <div className="flex items-center">
                        {sharedWithMembers.slice(0, 3).map((member, index) => (
                           <Tooltip key={member.id}>
                            <TooltipTrigger asChild>
                              <Avatar className={`h-8 w-8 border-2 border-background -ml-2 first:ml-0`}>
                                <AvatarImage src={member.avatar} alt={member.name} />
                                <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                              </Avatar>
                            </TooltipTrigger>
                            <TooltipContent>{member.name}</TooltipContent>
                           </Tooltip>
                        ))}
                         {sharedWithMembers.length > 3 && (
                            <div className="h-8 w-8 rounded-full bg-secondary border-2 border-background -ml-2 flex items-center justify-center text-xs font-semibold">
                                +{sharedWithMembers.length - 3}
                            </div>
                        )}
                      </div>
                    ) : (
                      <Badge variant="outline">Only You</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                     <div className="flex items-center justify-end gap-2">
                        <Tooltip>
                            <TooltipTrigger asChild>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleCopy(credential.password || '', 'Password')}
                            >
                                <Copy className="h-4 w-4 mr-2" />
                                Copy password
                            </Button>
                            </TooltipTrigger>
                            <TooltipContent>Copy password</TooltipContent>
                        </Tooltip>
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
                     </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </TooltipProvider>
  );
}
