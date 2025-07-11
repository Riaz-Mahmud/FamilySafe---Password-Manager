
'use client';

import { useEffect, useState } from 'react';
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
import type { FamilyMember } from '@/types';
import { Checkbox } from '@/components/ui/checkbox';
import { useDebounce } from '@/hooks/use-debounce';
import { checkIfEmailExists } from '@/services/auth';
import { Loader2 } from 'lucide-react';

const formSchema = z.object({
  name: z.string().min(1, { message: 'Name is required.' }),
  email: z.string().email({ message: 'Please enter a valid email.' }).optional().or(z.literal('')),
  sendInvite: z.boolean().default(true).optional(),
});

type AddFamilyMemberDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddFamilyMember: (member: Omit<FamilyMember, 'id' | 'avatar' | 'uid'> & { sendInvite?: boolean }) => void;
  onUpdateFamilyMember: (member: FamilyMember) => void;
  familyMemberToEdit: FamilyMember | null;
};

export function AddFamilyMemberDialog({
  open,
  onOpenChange,
  onAddFamilyMember,
  onUpdateFamilyMember,
  familyMemberToEdit,
}: AddFamilyMemberDialogProps) {
  const isEditing = !!familyMemberToEdit;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      sendInvite: true,
    },
  });
  
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const [emailExists, setEmailExists] = useState<boolean | null>(null);

  const emailValue = form.watch('email');
  const debouncedEmail = useDebounce(emailValue, 500);

  useEffect(() => {
    // Only check if it's a valid email format to avoid unnecessary API calls
    const emailCheck = z.string().email().safeParse(debouncedEmail);
    if (emailCheck.success && !isEditing) {
      setIsCheckingEmail(true);
      setEmailExists(null);
      checkIfEmailExists(emailCheck.data).then(exists => {
        setEmailExists(exists);
        if (exists) {
          // If email exists, automatically uncheck "send invite" as it's not needed.
          form.setValue('sendInvite', false);
        }
        setIsCheckingEmail(false);
      });
    } else {
      setEmailExists(null);
    }
  }, [debouncedEmail, form, isEditing]);


  useEffect(() => {
    if (open) {
      if (familyMemberToEdit) {
        form.reset({
          name: familyMemberToEdit.name,
          email: familyMemberToEdit.email || '',
          sendInvite: false, // Don't default to true when editing
        });
      } else {
        form.reset({
          name: '',
          email: '',
          sendInvite: true,
        });
      }
      setEmailExists(null);
    }
  }, [open, familyMemberToEdit, form]);

  function onSubmit(values: z.infer<typeof formSchema>) {
    if (isEditing && familyMemberToEdit) {
      onUpdateFamilyMember({
        ...familyMemberToEdit,
        name: values.name,
        email: values.email || undefined,
        status: values.email ? (familyMemberToEdit.uid ? 'active' : 'pending') : 'local',
      });
    } else {
      onAddFamilyMember({
        name: values.name,
        email: values.email || undefined,
        status: values.email ? 'pending' : 'local',
        sendInvite: values.email ? values.sendInvite : false
      });
    }
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="font-headline">{isEditing ? 'Edit Family Member' : 'Add Family Member'}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the family member's details. Email is required for password sharing."
              : 'Add a new member to your family group. Email can be left blank for local-only members.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Jane Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Address (optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. jane.doe@example.com" {...field} />
                  </FormControl>
                  <FormDescription>
                    Required to share passwords with this member.
                  </FormDescription>
                   <FormMessage />
                </FormItem>
              )}
            />
             {!isEditing && emailValue && (
              <FormField
                control={form.control}
                name="sendInvite"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={isCheckingEmail || emailExists === true}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="flex items-center">
                        Send invitation email
                        {isCheckingEmail && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                      </FormLabel>
                      <FormDescription>
                        {emailExists
                            ? "This user already has an account. No invitation is needed."
                            : "An email will be sent with a link to sign up."}
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
            )}
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit">{isEditing ? 'Save Changes' : 'Add Member'}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
