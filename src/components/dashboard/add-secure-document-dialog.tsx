
'use client';

import { useState, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import type { FamilyMember, SecureDocument } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { Upload, File as FileIcon } from 'lucide-react';
import Image from 'next/image';
import { Checkbox } from '../ui/checkbox';
import { ScrollArea } from '../ui/scroll-area';

const MAX_FILE_SIZE = 750 * 1024; // 750KB limit (before Base64 encoding)

// We can't use `File` object in Zod for server components, so we use `any` and validate manually.
const formSchema = z.object({
  name: z.string().min(1, { message: 'Document name is required.' }),
  notes: z.string().optional(),
  file: z.any().optional(),
  sharedWith: z.array(z.string()).optional(),
});

type AddSecureDocumentDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddDocument: (document: Omit<SecureDocument, 'id' | 'lastModified' | 'createdAt' | 'vaultId'>) => void;
  onUpdateDocument: (document: SecureDocument) => void;
  documentToEdit: SecureDocument | null;
  vaultId: string | null;
  familyMembers: FamilyMember[];
};

export function AddSecureDocumentDialog({
  open,
  onOpenChange,
  onAddDocument,
  onUpdateDocument,
  documentToEdit,
  vaultId,
  familyMembers,
}: AddSecureDocumentDialogProps) {
  const [selectedFile, setSelectedFile] = useState<{
    name: string;
    type: string;
    size: number;
    dataUrl: string;
  } | null>(null);
  const { toast } = useToast();
  const isEditing = !!documentToEdit;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      notes: '',
      file: null,
      sharedWith: [],
    },
  });

  useEffect(() => {
    if (open) {
      if (documentToEdit) {
        form.reset({
          name: documentToEdit.name,
          notes: documentToEdit.notes,
          file: null, // File cannot be re-edited, only replaced
          sharedWith: documentToEdit.sharedWith || [],
        });
        setSelectedFile({
          name: documentToEdit.name,
          type: documentToEdit.fileType,
          size: documentToEdit.fileSize,
          dataUrl: documentToEdit.fileDataUrl,
        });
      } else {
        form.reset({
          name: '',
          notes: '',
          file: null,
          sharedWith: [],
        });
        setSelectedFile(null);
      }
    }
  }, [open, documentToEdit, form]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > MAX_FILE_SIZE) {
        toast({
          variant: 'destructive',
          title: 'File too large',
          description: `Please select a file smaller than ${MAX_FILE_SIZE / 1024}KB.`,
        });
        form.setValue('file', null);
        event.target.value = ''; // Reset file input
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        setSelectedFile({
          name: file.name,
          type: file.type,
          size: file.size,
          dataUrl: e.target?.result as string,
        });
        if (!isEditing) {
          form.setValue('name', file.name, { shouldValidate: true });
        }
        form.setValue('file', file);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const getFileIconName = (fileType: string): string => {
    if (fileType.startsWith('image/')) return 'ImageIcon';
    if (fileType === 'application/pdf') return 'FileText';
    return 'File';
  };

  function onSubmit(values: z.infer<typeof formSchema>) {
    if (isEditing && documentToEdit) {
      const docToUpdate: SecureDocument = {
        ...documentToEdit,
        name: values.name,
        notes: values.notes || '',
        sharedWith: values.sharedWith || [],
      };
      // If a new file was selected, update file-related fields
      if (selectedFile && values.file) {
        docToUpdate.fileDataUrl = selectedFile.dataUrl;
        docToUpdate.fileSize = selectedFile.size;
        docToUpdate.fileType = selectedFile.type;
        docToUpdate.icon = getFileIconName(selectedFile.type);
      }
      onUpdateDocument(docToUpdate);
    } else {
      if (!selectedFile) {
        toast({ variant: 'destructive', title: 'No file selected', description: 'Please select a file to upload.' });
        return;
      }
      onAddDocument({
        name: values.name,
        notes: values.notes || '',
        fileDataUrl: selectedFile.dataUrl,
        fileType: selectedFile.type,
        fileSize: selectedFile.size,
        icon: getFileIconName(selectedFile.type),
        sharedWith: values.sharedWith || [],
      });
    }
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle className="font-headline">{isEditing ? 'Edit Secure Document' : 'Add a New Secure Document'}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the details for this secure document."
              : 'Upload a new document. It will be encrypted before being saved.'}
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-[70vh] overflow-y-auto p-1">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} id="add-document-form" className="space-y-4 pr-3">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Document Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Passport Scan" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Secure Notes (optional)</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Encrypted notes about this document..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="file"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{isEditing ? 'Replace File (optional)' : 'File'}</FormLabel>
                    <FormControl>
                      <Input type="file" onChange={handleFileChange} />
                    </FormControl>
                    <FormDescription>
                      Max file size: {MAX_FILE_SIZE / 1024}KB. The file never leaves your browser unencrypted.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {selectedFile && (
                <div className="space-y-2 rounded-lg border p-3">
                  <h4 className="text-sm font-medium">Preview</h4>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    {selectedFile.type.startsWith('image/') ? (
                      <Image
                        src={selectedFile.dataUrl}
                        alt="File preview"
                        width={48}
                        height={48}
                        className="rounded-md object-cover h-12 w-12"
                      />
                    ) : (
                      <div className="flex h-12 w-12 items-center justify-center rounded-md bg-muted">
                        <FileIcon className="h-6 w-6" />
                      </div>
                    )}
                    <div className="overflow-hidden">
                        <p className="font-medium text-foreground truncate">{selectedFile.name}</p>
                        <p>{selectedFile.type}</p>
                        <p>{(selectedFile.size / 1024).toFixed(2)} KB</p>
                    </div>
                  </div>
                </div>
              )}
               <FormField
                  control={form.control}
                  name="sharedWith"
                  render={() => (
                    <FormItem>
                      <FormLabel>Share With</FormLabel>
                       <FormDescription>
                        Select family members to share this document with.
                      </FormDescription>
                      <ScrollArea className="h-40 rounded-md border">
                        <div className="p-4">
                        {familyMembers.filter(m => m.email).length > 0 ? (
                          familyMembers
                            .filter(member => member.email)
                            .map((member) => (
                              <FormField
                                key={member.id}
                                control={form.control}
                                name="sharedWith"
                                render={({ field }) => {
                                  return (
                                    <FormItem
                                      key={member.id}
                                      className="flex flex-row items-start space-x-3 space-y-0 mb-4"
                                    >
                                      <FormControl>
                                        <Checkbox
                                          checked={field.value?.includes(member.id)}
                                          onCheckedChange={(checked) => {
                                            return checked
                                              ? field.onChange([...(field.value || []), member.id])
                                              : field.onChange(
                                                  field.value?.filter(
                                                    (value) => value !== member.id
                                                  )
                                                )
                                          }}
                                        />
                                      </FormControl>
                                      <FormLabel className="font-normal w-full cursor-pointer">
                                        <div className="flex flex-col">
                                          <span>{member.name}</span>
                                          <span className="text-xs text-muted-foreground">
                                            {member.email}
                                          </span>
                                        </div>
                                      </FormLabel>
                                    </FormItem>
                                  )
                                }}
                              />
                            ))
                        ) : (
                          <div className="text-center text-sm text-muted-foreground py-4">
                            No family members with an email address found. Add one on the Family Members page to enable sharing.
                          </div>
                        )}
                        </div>
                      </ScrollArea>
                      <FormMessage />
                    </FormItem>
                  )}
                />
            </form>
          </Form>
        </div>
        <DialogFooter>
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" form="add-document-form" disabled={!vaultId}>
            {isEditing ? 'Save Changes' : 'Save Document'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
