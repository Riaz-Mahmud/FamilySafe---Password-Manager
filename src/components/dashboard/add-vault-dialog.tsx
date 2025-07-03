
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

const formSchema = z.object({
  name: z.string().min(1, { message: 'Vault name is required.' }).max(50, { message: 'Vault name is too long.' }),
});

type AddVaultDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddVault: (name: string) => void;
};

export function AddVaultDialog({
  open,
  onOpenChange,
  onAddVault,
}: AddVaultDialogProps) {

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: '' },
  });

  useEffect(() => {
    if (open) {
      form.reset({ name: '' });
    }
  }, [open, form]);

  function onSubmit(values: z.infer<typeof formSchema>) {
    onAddVault(values.name);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="font-headline">Create New Vault</DialogTitle>
          <DialogDescription>
            Vaults help you organize your passwords and secure documents.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Vault Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Work or Finances" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit">Create Vault</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
