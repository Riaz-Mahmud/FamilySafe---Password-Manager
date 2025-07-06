
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import type { Credential, FamilyMember } from '@/types';
import { X, Eye, EyeOff, Copy } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Switch } from '@/components/ui/switch';
import { PassphraseGenerator } from './passphrase-generator';
import { PasswordGenerator } from './password-generator';
import { Checkbox } from '../ui/checkbox';
import { ScrollArea } from '../ui/scroll-area';
import { useDebounce } from '@/hooks/use-debounce';
import { PasswordStrengthMeter, type PasswordStrengthOutput } from './password-strength-meter';

const formSchema = z.object({
  url: z.string().min(1, { message: 'Website or Application name is required.' }),
  username: z.string().min(1, { message: 'Username is required.' }),
  password: z.string().min(1, { message: 'Password is required.' }),
  notes: z.string().optional(),
  tags: z.array(z.string()).optional(),
  expiryMonths: z.number().optional(),
  safeForTravel: z.boolean().optional(),
  sharedWith: z.array(z.string()).optional(),
});

type AddPasswordDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddCredential: (credential: Omit<Credential, 'id' | 'lastModified' | 'createdAt' | 'vaultId'>) => void;
  onUpdateCredential: (credential: Credential) => void;
  credentialToEdit: Credential | null;
  vaultId: string | null;
  familyMembers: FamilyMember[];
};

function checkPasswordStrength(password: string): PasswordStrengthOutput {
  let score = 0;
  const suggestions: string[] = [];

  if (!password || password.length === 0) {
    return {
      strength: 'Weak',
      suggestions: ['Enter a password to check its strength.'],
    };
  }
  
  if (password.length < 8) {
    suggestions.push('Use 8 or more characters.');
  } else if (password.length >= 12) {
    score += 2;
  } else {
    score += 1;
  }

  if (/[A-Z]/.test(password)) {
    score++;
  } else {
    suggestions.push('Add an uppercase letter.');
  }

  if (/[a-z]/.test(password)) {
    score++;
  } else {
     suggestions.push('Add a lowercase letter.');
  }

  if (/\d/.test(password)) {
    score++;
  } else {
    suggestions.push('Add a number.');
  }

  if (/[^A-Za-z0-9]/.test(password)) {
    score++;
  } else {
    suggestions.push('Add a special character (e.g., !@#).');
  }

  let strength: PasswordStrengthOutput['strength'] = 'Weak';
  if (score >= 6) {
    strength = 'Very Strong';
  } else if (score >= 5) {
    strength = 'Strong';
  } else if (score >= 3) {
    strength = 'Moderate';
  }

  if (strength === 'Very Strong') {
    return { strength, suggestions: [] };
  }
  
  return { strength, suggestions };
}


export function AddPasswordDialog({
  open,
  onOpenChange,
  onAddCredential,
  onUpdateCredential,
  credentialToEdit,
  vaultId,
  familyMembers,
}: AddPasswordDialogProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const { toast } = useToast();
  const isEditing = !!credentialToEdit;

  const [strengthResult, setStrengthResult] = useState<PasswordStrengthOutput | null>(null);
  const [isCheckingStrength, setIsCheckingStrength] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      url: '',
      username: '',
      password: '',
      notes: '',
      tags: [],
      expiryMonths: 0,
      safeForTravel: false,
      sharedWith: [],
    },
  });

  const passwordValue = form.watch('password');
  const debouncedPassword = useDebounce(passwordValue, 500);

  useEffect(() => {
    setIsCheckingStrength(true);
  }, [passwordValue]);

  useEffect(() => {
    if (open) {
      if (debouncedPassword && debouncedPassword.length > 0) {
        const result = checkPasswordStrength(debouncedPassword);
        setStrengthResult(result);
      } else {
        setStrengthResult(null);
      }
      setIsCheckingStrength(false);
    }
  }, [debouncedPassword, open]);

  useEffect(() => {
    if (open) {
      setShowPassword(false);
      setTagInput('');
      setStrengthResult(null);
      setIsCheckingStrength(false);
      if (credentialToEdit) {
        form.reset({
          url: credentialToEdit.url,
          username: credentialToEdit.username,
          password: credentialToEdit.password,
          notes: credentialToEdit.notes,
          tags: credentialToEdit.tags || [],
          expiryMonths: credentialToEdit.expiryMonths || 0,
          safeForTravel: credentialToEdit.safeForTravel || false,
          sharedWith: credentialToEdit.sharedWith || [],
        });
      } else {
        form.reset({
          url: '',
          username: '',
          password: '',
          notes: '',
          tags: [],
          expiryMonths: 0,
          safeForTravel: false,
          sharedWith: [],
        });
      }
    }
  }, [open, credentialToEdit, form]);
  
  const handleCopy = () => {
    const password = form.getValues('password');
    if (password) {
        navigator.clipboard.writeText(password);
        toast({
          title: 'Copied to clipboard',
          description: `Password has been copied successfully.`,
        });
    } else {
        toast({
          title: 'Nothing to Copy',
          description: `The password field is empty.`,
          variant: 'destructive'
        });
    }
  };

  function onSubmit(values: z.infer<typeof formSchema>) {
    const data = {
        ...values,
        notes: values.notes || '',
        tags: values.tags || [],
        expiryMonths: values.expiryMonths || 0,
        safeForTravel: values.safeForTravel || false,
        sharedWith: values.sharedWith || [],
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
      <DialogContent className="sm:max-w-4xl">
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
                
                <PasswordStrengthMeter strengthResult={strengthResult} isChecking={isCheckingStrength} />

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <PassphraseGenerator form={form} />
                  <PasswordGenerator form={form} />
                </div>
                
                <Button type="button" size="sm" variant="secondary" className="w-full" onClick={handleCopy}>
                    <Copy className="mr-2 h-4 w-4" /> Copy Current Password
                </Button>

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
                  render={() => (
                    <FormItem>
                      <FormLabel>Share With</FormLabel>
                       <FormDescription>
                        Select family members to share this credential with.
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
                            No family members found. Add one on the Family Members page to enable sharing.
                          </div>
                        )}
                        </div>
                      </ScrollArea>
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
            <Button type="submit" form="add-password-form" disabled={!vaultId}>{isEditing ? 'Save Changes' : 'Save Credential'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
