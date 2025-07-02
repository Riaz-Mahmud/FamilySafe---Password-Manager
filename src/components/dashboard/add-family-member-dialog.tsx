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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { FamilyMember } from '@/types';

const formSchema = z.object({
  name: z.string().min(1, { message: 'Name is required.' }),
  email: z.string().email({ message: 'Please enter a valid email.' }),
});

type AddFamilyMemberDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddFamilyMember: (member: Omit<FamilyMember, 'id' | 'avatar'>) => void;
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
    },
  });

  useEffect(() => {
    if (open) {
      if (familyMemberToEdit) {
        form.reset({
          name: familyMemberToEdit.name,
          email: familyMemberToEdit.email,
        });
      } else {
        form.reset({
          name: '',
          email: '',
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
      onAddFamilyMember({ name: values.name, email: values.email });
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
              : 'Invite a new member to your family group by email. They will be able to access shared passwords.'}
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
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit">{isEditing ? 'Save Changes' : 'Send Invite'}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
