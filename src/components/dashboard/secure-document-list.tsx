
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
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Trash2, Edit, Download, File as FileIcon, FileText as FileTextIcon, Image as ImageIcon, FolderLock } from 'lucide-react';
import type { SecureDocument } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { useState } from 'react';
import Image from 'next/image';

type SecureDocumentListProps = {
  documents: SecureDocument[];
  onEdit: (document: SecureDocument) => void;
  onDelete: (id: string) => void;
};

const iconMap: { [key: string]: React.ComponentType<any> } = {
  File: FileIcon,
  FileText: FileTextIcon,
  ImageIcon: ImageIcon,
};

const ITEMS_PER_PAGE = 30;

export function SecureDocumentList({ documents, onEdit, onDelete }: SecureDocumentListProps) {
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(documents.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, documents.length);
  const currentDocuments = documents.slice(startIndex, endIndex);

  const handleDownload = (doc: SecureDocument) => {
    const link = document.createElement('a');
    link.href = doc.fileDataUrl;
    link.download = doc.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (documents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center p-8 border-2 border-dashed rounded-lg h-full">
        <FolderLock className="h-16 w-16 text-muted-foreground mb-4" />
        <h2 className="text-2xl font-headline font-bold">No Secure Documents Yet</h2>
        <p className="text-muted-foreground mt-2">
          Click "Add Document" to upload your first encrypted file.
        </p>
      </div>
    );
  }

  return (
    <TooltipProvider>
      {/* Mobile View */}
      <div className="md:hidden space-y-4">
        {currentDocuments.map(doc => {
            const IconComponent = iconMap[doc.icon] || FileIcon;
            const isImage = doc.icon === 'ImageIcon';
            return (
                <Card key={doc.id} className="w-full">
                    <CardContent className="p-4 flex flex-col gap-4">
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex items-center gap-3 overflow-hidden">
                                {isImage ? (
                                    <Image
                                        src={doc.fileDataUrl}
                                        alt={doc.name}
                                        width={40}
                                        height={40}
                                        className="h-10 w-10 rounded-lg object-cover shrink-0"
                                    />
                                ) : (
                                    <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-secondary shrink-0">
                                        <IconComponent className="w-5 h-5 text-muted-foreground" />
                                    </div>
                                )}
                                <div className="flex flex-col overflow-hidden">
                                    <p className="font-medium truncate">{doc.name}</p>
                                    <p className="text-sm text-muted-foreground">{formatFileSize(doc.fileSize)}</p>
                                </div>
                            </div>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                                    <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => onEdit(doc)}>
                                      <Edit className="mr-2 h-4 w-4" />
                                      Edit
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                    className="text-destructive focus:text-destructive"
                                    onClick={() => onDelete(doc.id)}
                                    >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                        
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDownload(doc)}
                            className="w-full"
                        >
                            <Download className="h-4 w-4 mr-2" />
                            Download
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
              <TableHead className="w-[50%]">Name</TableHead>
              <TableHead>File Size</TableHead>
              <TableHead>Last Modified</TableHead>
              <TableHead className="text-right w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentDocuments.map(doc => {
              const IconComponent = iconMap[doc.icon] || FileIcon;
              const isImage = doc.icon === 'ImageIcon';
              return (
                <TableRow key={doc.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {isImage ? (
                          <Image
                              src={doc.fileDataUrl}
                              alt={doc.name}
                              width={40}
                              height={40}
                              className="h-10 w-10 rounded-lg object-cover shrink-0"
                          />
                      ) : (
                        <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-secondary shrink-0">
                          <IconComponent className="w-5 h-5 text-muted-foreground" />
                        </div>
                      )}
                      <div className="flex flex-col overflow-hidden">
                        <span className="font-medium truncate">{doc.name}</span>
                        <span className="text-sm text-muted-foreground">{doc.fileType}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{formatFileSize(doc.fileSize)}</TableCell>
                  <TableCell className="text-muted-foreground">{doc.lastModified}</TableCell>
                  <TableCell className="text-right">
                     <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                          </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleDownload(doc)}>
                            <Download className="mr-2 h-4 w-4" />
                            Download
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onEdit(doc)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => onDelete(doc.id)}
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
      {documents.length > 0 && (
        <div className="flex items-center justify-between py-4">
          <div className="text-sm text-muted-foreground">
            Showing {startIndex + 1} to {endIndex} of {documents.length} documents.
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
