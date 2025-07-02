
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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import type { FamilyMember, Credential } from '@/types';
import { Check, ChevronsUpDown, X, Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';


const formSchema = z.object({
  url: z.string().url({ message: 'Please enter a valid URL.' }),
  username: z.string().min(1, { message: 'Username is required.' }),
  password: z.string().min(1, { message: 'Password is required.' }),
  notes: z.string().optional(),
  sharedWith: z.array(z.string()).optional(),
});

type AddPasswordDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddCredential: (credential: Omit<Credential, 'id' | 'lastModified'>) => void;
  onUpdateCredential: (credential: Credential) => void;
  familyMembers: FamilyMember[];
  credentialToEdit: Credential | null;
};

export function AddPasswordDialog({
  open,
  onOpenChange,
  onAddCredential,
  onUpdateCredential,
  familyMembers,
  credentialToEdit,
}: AddPasswordDialogProps) {
  const [showPassword, setShowPassword] = useState(false);
  const isEditing = !!credentialToEdit;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      url: '',
      username: '',
      password: '',
      notes: '',
      sharedWith: [],
    },
  });

  useEffect(() => {
    if (open) {
      setShowPassword(false);
      if (credentialToEdit) {
        form.reset({
          url: credentialToEdit.url,
          username: credentialToEdit.username,
          password: credentialToEdit.password,
          notes: credentialToEdit.notes,
          sharedWith: credentialToEdit.sharedWith,
        });
      } else {
        form.reset({
          url: '',
          username: '',
          password: '',
          notes: '',
          sharedWith: [],
        });
      }
    }
  }, [open, credentialToEdit, form]);
  
  function onSubmit(values: z.infer<typeof formSchema>) {
    if (credentialToEdit) {
      onUpdateCredential({
        ...credentialToEdit,
        ...values,
        notes: values.notes || '',
        sharedWith: values.sharedWith || [],
        lastModified: new Date().toLocaleDateString(),
      });
    } else {
      onAddCredential({
        url: values.url,
        username: values.username,
        password: values.password,
        notes: values.notes || '',
        icon: 'Globe', // Default icon
        sharedWith: values.sharedWith || [],
      });
    }
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle className="font-headline">{isEditing ? 'Edit Credential' : 'Add a New Credential'}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Update the details for this credential.'
              : 'Enter the details for the new password you want to save.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Website URL</FormLabel>
                  <FormControl>
                    <Input placeholder="https://example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username or Email</FormLabel>
                  <FormControl>
                    <Input placeholder="user@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                   <div className="relative">
                    <FormControl>
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        {...field}
                        className="pr-12"
                      />
                    </FormControl>
                    <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setShowPassword(!showPassword)}
                        tabIndex={-1}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                        <span className="sr-only">
                          {showPassword ? 'Hide password' : 'Show password'}
                        </span>
                      </Button>
                    </div>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="e.g. Security questions, recovery codes..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="sharedWith"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Share with (optional)</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          role="combobox"
                          className={cn(
                            'w-full justify-between',
                            !field.value?.length && 'text-muted-foreground'
                          )}
                        >
                          {field.value && field.value.length > 0
                            ? `${field.value.length} member(s) selected`
                            : 'Select family members'}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                      <Command>
                        <CommandInput placeholder="Search members..." />
                        <CommandList>
                          <CommandEmpty>No members found.</CommandEmpty>
                          <CommandGroup>
                            {familyMembers.map(member => (
                              <CommandItem
                                value={member.name}
                                key={member.id}
                                onSelect={() => {
                                  const selectedValues = field.value || [];
                                  const isSelected = selectedValues.includes(member.id);
                                  form.setValue(
                                    'sharedWith',
                                    isSelected
                                      ? selectedValues.filter(id => id !== member.id)
                                      : [...selectedValues, member.id]
                                  );
                                }}
                              >
                                <Check
                                  className={cn(
                                    'mr-2 h-4 w-4',
                                    field.value?.includes(member.id) ? 'opacity-100' : 'opacity-0'
                                  )}
                                />
                                {member.name}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <div className="pt-2 flex flex-wrap gap-2">
                    {field.value?.map(id => {
                        const member = familyMembers.find(m => m.id === id);
                        return member ? (
                            <Badge variant="secondary" key={id} className="gap-1.5">
                                {member.name}
                                <button onClick={() => form.setValue('sharedWith', form.getValues('sharedWith')?.filter(memberId => memberId !== id))}
                                  className="rounded-full hover:bg-muted-foreground/20"
                                >
                                    <X className="h-3 w-3" />
                                </button>
                            </Badge>
                        ) : null;
                    })}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit">{isEditing ? 'Save Changes' : 'Save Credential'}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
