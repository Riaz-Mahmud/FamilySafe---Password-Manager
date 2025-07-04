
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
import type { FamilyMember, Memory } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { Upload, File as FileIcon, X, Badge } from 'lucide-react';
import Image from 'next/image';
import { Checkbox } from '../ui/checkbox';
import { ScrollArea } from '../ui/scroll-area';

const MAX_FILE_SIZE = 750 * 1024; // 750KB limit (before Base64 encoding)

const formSchema = z.object({
  title: z.string().min(1, { message: 'Title is required.' }),
  story: z.string().min(1, { message: 'Story is required.' }),
  memoryDate: z.string().min(1, { message: 'Date is required.' }),
  tags: z.array(z.string()).optional(),
  file: z.any().optional(),
  sharedWith: z.array(z.string()).optional(),
});

type AddMemoryDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddMemory: (memory: Omit<Memory, 'id' | 'lastModified' | 'createdAt' | 'vaultId'>) => void;
  onUpdateMemory: (memory: Memory) => void;
  memoryToEdit: Memory | null;
  vaultId: string | null;
  familyMembers: FamilyMember[];
};

export function AddMemoryDialog({
  open,
  onOpenChange,
  onAddMemory,
  onUpdateMemory,
  memoryToEdit,
  vaultId,
  familyMembers,
}: AddMemoryDialogProps) {
  const [selectedFile, setSelectedFile] = useState<{
    name: string;
    type: string;
    size: number;
    dataUrl: string;
  } | null>(null);
  const [tagInput, setTagInput] = useState('');
  const { toast } = useToast();
  const isEditing = !!memoryToEdit;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      story: '',
      memoryDate: '',
      tags: [],
      file: null,
      sharedWith: [],
    },
  });

  useEffect(() => {
    if (open) {
      setTagInput('');
      if (memoryToEdit) {
        form.reset({
          title: memoryToEdit.title,
          story: memoryToEdit.story,
          memoryDate: memoryToEdit.memoryDate,
          tags: memoryToEdit.tags || [],
          file: null, // File cannot be re-edited, only replaced
          sharedWith: memoryToEdit.sharedWith || [],
        });
        if (memoryToEdit.photoUrl && memoryToEdit.photoFileType && memoryToEdit.photoFileSize) {
          setSelectedFile({
            name: 'Stored Photo',
            type: memoryToEdit.photoFileType,
            size: memoryToEdit.photoFileSize,
            dataUrl: memoryToEdit.photoUrl,
          });
        } else {
            setSelectedFile(null);
        }
      } else {
        form.reset({
          title: '',
          story: '',
          memoryDate: '',
          tags: [],
          file: null,
          sharedWith: [],
        });
        setSelectedFile(null);
      }
    }
  }, [open, memoryToEdit, form]);

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
        form.setValue('file', file);
      };
      reader.readAsDataURL(file);
    }
  };

  function onSubmit(values: z.infer<typeof formSchema>) {
    if (isEditing && memoryToEdit) {
      const memToUpdate: Memory = {
        ...memoryToEdit,
        title: values.title,
        story: values.story,
        memoryDate: values.memoryDate,
        tags: values.tags || [],
        sharedWith: values.sharedWith || [],
      };
      if (selectedFile && values.file) {
        memToUpdate.photoUrl = selectedFile.dataUrl;
        memToUpdate.photoFileSize = selectedFile.size;
        memToUpdate.photoFileType = selectedFile.type;
      }
      onUpdateMemory(memToUpdate);
    } else {
      onAddMemory({
        title: values.title,
        story: values.story,
        memoryDate: values.memoryDate,
        tags: values.tags || [],
        photoUrl: selectedFile?.dataUrl,
        photoFileSize: selectedFile?.size,
        photoFileType: selectedFile?.type,
        sharedWith: values.sharedWith || [],
      });
    }
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-headline">{isEditing ? 'Edit Memory' : 'Create a New Memory'}</DialogTitle>
          <DialogDescription>
            {isEditing ? "Update this memory. All information is securely encrypted." : 'Preserve a new memory. All information will be securely encrypted.'}
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-[70vh] overflow-y-auto p-1">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} id="add-memory-form" className="space-y-4 pr-3">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Our First Family Vacation" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="memoryDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date of Memory</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                     <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="story"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Story</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Write the story behind this memory..." {...field} rows={6} />
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
                    <FormLabel>{isEditing ? 'Replace Photo (optional)' : 'Add a Photo (optional)'}</FormLabel>
                    <FormControl>
                      <Input type="file" accept="image/*" onChange={handleFileChange} />
                    </FormControl>
                    <FormDescription>Max file size: {MAX_FILE_SIZE / 1024}KB.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {selectedFile && (
                <div className="space-y-2 rounded-lg border p-3">
                  <h4 className="text-sm font-medium">Photo Preview</h4>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <Image
                        src={selectedFile.dataUrl}
                        alt="Photo preview"
                        width={48}
                        height={48}
                        className="rounded-md object-cover h-12 w-12"
                    />
                    <div className="overflow-hidden">
                        <p className="font-medium text-foreground truncate">{selectedFile.name}</p>
                        <p>{(selectedFile.size / 1024).toFixed(2)} KB</p>
                    </div>
                  </div>
                </div>
              )}
               <FormField
                control={form.control}
                name="tags"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Tags (optional)</FormLabel>
                    <FormControl>
                        <div>
                        <div className="flex flex-wrap gap-2 mb-2">
                            {field.value?.map((tag, index) => (
                            <Badge key={index} className="gap-1.5">
                                {tag}
                                <button
                                type="button"
                                onClick={() => {
                                    form.setValue(
                                    'tags',
                                    field.value?.filter((_, i) => i !== index)
                                    );
                                }}
                                className="rounded-full hover:bg-muted-foreground/20"
                                >
                                <X className="h-3 w-3" />
                                </button>
                            </Badge>
                            ))}
                        </div>
                        <Input
                            value={tagInput}
                            onChange={(e) => setTagInput(e.target.value)}
                            onKeyDown={(e) => {
                            if (e.key === 'Enter' && tagInput.trim()) {
                                e.preventDefault();
                                if (!field.value?.includes(tagInput.trim())) {
                                form.setValue('tags', [...(field.value || []), tagInput.trim()]);
                                }
                                setTagInput('');
                            }
                            }}
                            placeholder="Type a tag and press Enter"
                        />
                        </div>
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
               <FormField
                  control={form.control}
                  name="sharedWith"
                  render={() => (
                    <FormItem>
                      <FormLabel>Share With</FormLabel>
                       <FormDescription>
                        Select family members to share this memory with.
                      </FormDescription>
                      <ScrollArea className="h-40 rounded-md border">
                        <div className="p-4">
                        {familyMembers.length > 0 ? (
                          familyMembers
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
                                            {member.email || 'Local Member'}
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
                            No family members found to enable sharing.
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
          <Button type="submit" form="add-memory-form" disabled={!vaultId}>
            {isEditing ? 'Save Changes' : 'Save Memory'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
