'use client';

import { useEffect } from 'react';
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

const formSchema = z.object({
  name: z.string().min(1, { message: 'Name is required.' }),
  email: z.string().email({ message: 'Please enter a valid email.' }),
  sendInvite: z.boolean().default(true).optional(),
});

type AddFamilyMemberDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddFamilyMember: (member: Omit<FamilyMember, 'id' | 'avatar'> & { sendInvite?: boolean }) => void;
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

  useEffect(() => {
    if (open) {
      if (familyMemberToEdit) {
        form.reset({
          name: familyMemberToEdit.name,
          email: familyMemberToEdit.email,
          sendInvite: false, // Don't default to true when editing
        });
      } else {
        form.reset({
          name: '',
          email: '',
          sendInvite: true,
        });
      }
    }
  }, [open, familyMemberToEdit, form]);

  function onSubmit(values: z.infer<typeof formSchema>) {
    if (isEditing && familyMemberToEdit) {
      onUpdateFamilyMember({
        ...familyMemberToEdit,
        name: values.name,
        email: values.email,
      });
    } else {
      onAddFamilyMember({ name: values.name, email: values.email, sendInvite: values.sendInvite });
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
              ? "Update the family member's details."
              : 'Add a new member to your family group. They will be able to access shared passwords.'}
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
                  <FormLabel>Email Address</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. jane.doe@example.com" {...field} />
                  </FormControl>
                   <FormMessage />
                </FormItem>
              )}
            />
             {!isEditing && (
              <FormField
                control={form.control}
                name="sendInvite"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>
                        Send invitation email
                      </FormLabel>
                      <FormDescription>
                        An email will be sent to this address with a link to sign up.
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
