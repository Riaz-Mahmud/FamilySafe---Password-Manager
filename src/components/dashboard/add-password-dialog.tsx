
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import type { FamilyMember, Credential } from '@/types';
import { Check, ChevronsUpDown, X, Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Switch } from '@/components/ui/switch';
import { PassphraseGenerator } from './passphrase-generator';

const formSchema = z.object({
  url: z.string().min(1, { message: 'Website or Application name is required.' }),
  username: z.string().min(1, { message: 'Username is required.' }),
  password: z.string().min(1, { message: 'Password is required.' }),
  notes: z.string().optional(),
  sharedWith: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  expiryMonths: z.number().optional(),
  safeForTravel: z.boolean().optional(),
});

type AddPasswordDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddCredential: (credential: Omit<Credential, 'id' | 'lastModified' | 'createdAt'>) => void;
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
  const [tagInput, setTagInput] = useState('');
  const { toast } = useToast();
  const isEditing = !!credentialToEdit;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      url: '',
      username: '',
      password: '',
      notes: '',
      sharedWith: [],
      tags: [],
      expiryMonths: 0,
      safeForTravel: false,
    },
  });

  useEffect(() => {
    if (open) {
      setShowPassword(false);
      setTagInput('');
      if (credentialToEdit) {
        form.reset({
          url: credentialToEdit.url,
          username: credentialToEdit.username,
          password: credentialToEdit.password,
          notes: credentialToEdit.notes,
          sharedWith: credentialToEdit.sharedWith,
          tags: credentialToEdit.tags || [],
          expiryMonths: credentialToEdit.expiryMonths || 0,
          safeForTravel: credentialToEdit.safeForTravel || false,
        });
      } else {
        form.reset({
          url: '',
          username: '',
          password: '',
          notes: '',
          sharedWith: [],
          tags: [],
          expiryMonths: 0,
          safeForTravel: false,
        });
      }
    }
  }, [open, credentialToEdit, form]);
  
  function onSubmit(values: z.infer<typeof formSchema>) {
    const data = {
        ...values,
        notes: values.notes || '',
        sharedWith: values.sharedWith || [],
        tags: values.tags || [],
        expiryMonths: values.expiryMonths || 0,
        safeForTravel: values.safeForTravel || false,
    };

    if (credentialToEdit) {
      onUpdateCredential({
        ...credentialToEdit,
        ...data,
      });
    } else {
      onAddCredential({
        ...data,
        icon: 'Globe', // Default icon
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
              ? 'Update the details for this credential. All sensitive information is securely encrypted.'
              : 'Save a new credential. All sensitive information, including any notes, will be securely encrypted.'}
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-[70vh] overflow-y-auto p-1">
            <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} id="add-password-form" className="space-y-4 pr-3">
                <FormField
                control={form.control}
                name="url"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Website or Application Name</FormLabel>
                    <FormControl>
                        <Input placeholder="e.g., google.com or My Game Account" {...field} />
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
                            className="pr-10"
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

                <PassphraseGenerator form={form} />

                <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Secure Notes (optional)</FormLabel>
                    <FormControl>
                        <Textarea
                        placeholder="Encrypted notes, e.g., recovery codes, bank info..."
                        {...field}
                        />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <FormField
                control={form.control}
                name="expiryMonths"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Password Rotation</FormLabel>
                    <Select onValueChange={(value) => field.onChange(parseInt(value, 10))} defaultValue={String(field.value || 0)}>
                        <FormControl>
                        <SelectTrigger>
                            <SelectValue placeholder="Set a reminder to change this password" />
                        </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                        <SelectItem value="0">Never</SelectItem>
                        <SelectItem value="3">Every 3 months</SelectItem>
                        <SelectItem value="6">Every 6 months</SelectItem>
                        <SelectItem value="12">Every 12 months</SelectItem>
                        </SelectContent>
                    </Select>
                    <FormDescription>
                        Get a reminder to rotate this password periodically.
                    </FormDescription>
                    <FormMessage />
                    </FormItem>
                )}
                />
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
                            <Badge variant="secondary" key={index} className="gap-1.5">
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
                                    disabled={member.status === 'local'}
                                    onSelect={() => {
                                      if (member.status === 'local') return;
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
                                    {member.status === 'pending' && <span className="text-xs text-muted-foreground ml-auto">(Pending)</span>}
                                    {member.status === 'local' && <span className="text-xs text-muted-foreground ml-auto">(Local)</span>}
                                </CommandItem>
                                ))}
                            </CommandGroup>
                            </CommandList>
                        </Command>
                        </PopoverContent>
                    </Popover>
                    <FormDescription>
                      Select family members to share with. Active members will get access immediately. Local members cannot be selected.
                    </FormDescription>
                    <div className="pt-2 flex flex-wrap gap-2">
                        {field.value?.map(id => {
                            const member = familyMembers.find(m => m.id === id);
                            return member ? (
                                <Badge variant="secondary" key={id} className="gap-1.5">
                                    {member.name}
                                    <button onClick={() => form.setValue('sharedWith', form.getValues('sharedWith')?.filter(memberId => memberId !== id))}
                                    type="button"
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
                <FormField
                control={form.control}
                name="safeForTravel"
                render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                    <div className="space-y-0.5">
                        <FormLabel>Safe for Travel</FormLabel>
                        <FormDescription>
                        This item will be visible when Travel Mode is on.
                        </FormDescription>
                    </div>
                    <FormControl>
                        <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        />
                    </FormControl>
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
            <Button type="submit" form="add-password-form">{isEditing ? 'Save Changes' : 'Save Credential'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
