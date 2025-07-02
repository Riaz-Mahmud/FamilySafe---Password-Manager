'use client';

import { useState, useEffect, useCallback } from 'react';
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
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { checkPasswordStrength } from '@/ai/flows/password-strength-checker';
import type { PasswordStrengthOutput } from '@/ai/flows/password-strength-checker';
import type { FamilyMember, Credential } from '@/types';
import { Check, ChevronsUpDown, Loader2, Info, Users, X } from 'lucide-react';
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
  familyMembers: FamilyMember[];
};

export function AddPasswordDialog({
  open,
  onOpenChange,
  onAddCredential,
  familyMembers,
}: AddPasswordDialogProps) {
  const [strengthResult, setStrengthResult] =
    useState<PasswordStrengthOutput | null>(null);
  const [isLoadingStrength, setIsLoadingStrength] = useState(false);

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

  const password = form.watch('password');

  const debounce = <F extends (...args: any[]) => any>(
    func: F,
    waitFor: number
  ) => {
    let timeout: ReturnType<typeof setTimeout> | null = null;
    return (...args: Parameters<F>): Promise<ReturnType<F>> =>
      new Promise(resolve => {
        if (timeout) {
          clearTimeout(timeout);
        }
        timeout = setTimeout(() => resolve(func(...args)), waitFor);
      });
  };

  const checkStrength = async (pass: string) => {
    if (!pass) {
      setStrengthResult(null);
      return;
    }
    setIsLoadingStrength(true);
    try {
      const result = await checkPasswordStrength({ password: pass });
      setStrengthResult(result);
    } catch (error) {
      console.error('Error checking password strength:', error);
      setStrengthResult(null);
    } finally {
      setIsLoadingStrength(false);
    }
  };

  const debouncedCheckStrength = useCallback(debounce(checkStrength, 500), []);

  useEffect(() => {
    debouncedCheckStrength(password);
  }, [password, debouncedCheckStrength]);

  const getStrengthStyle = () => {
    if (!strengthResult?.strength) return { color: 'hsl(var(--muted))', value: 0 };
    switch (strengthResult.strength.toLowerCase()) {
      case 'weak':
        return { color: 'hsl(var(--destructive))', value: 33 };
      case 'moderate':
        return { color: 'hsl(var(--chart-4))', value: 66 };
      case 'strong':
        return { color: 'hsl(var(--chart-2))', value: 100 };
      default:
        return { color: 'hsl(var(--muted))', value: 0 };
    }
  };
  const { color: strengthColor, value: strengthValue } = getStrengthStyle();

  function onSubmit(values: z.infer<typeof formSchema>) {
    onAddCredential({
      url: values.url,
      username: values.username,
      password: values.password,
      notes: values.notes || '',
      icon: Users, // Placeholder icon
      sharedWith: values.sharedWith || [],
    });
    form.reset();
    setStrengthResult(null);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle className="font-headline">Add a New Credential</DialogTitle>
          <DialogDescription>
            Enter the details for the new password you want to save.
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
                  <FormControl>
                    <Input type="password" {...field} />
                  </FormControl>
                  <div className="pt-2 space-y-2">
                    <div className="flex items-center gap-2">
                      <Progress value={strengthValue} className="h-2" style={{'--primary': strengthColor} as React.CSSProperties} />
                      {isLoadingStrength && <Loader2 className="h-4 w-4 animate-spin" />}
                    </div>
                    {strengthResult && !isLoadingStrength && (
                       <div className="text-xs p-3 bg-secondary rounded-md border">
                          <p className="font-semibold flex items-center gap-1.5"><Info className="h-3 w-3" /> {strengthResult.reason}</p>
                          <p className="text-muted-foreground mt-1">{strengthResult.suggestions}</p>
                       </div>
                    )}
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
              <Button type="submit">Save Credential</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
