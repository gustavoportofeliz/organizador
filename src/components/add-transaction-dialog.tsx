'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useEffect } from 'react';
import type { Client } from '@/lib/types';

const formSchema = z.object({
  type: z.enum(['purchase', 'payment'], {
    required_error: 'Você precisa selecionar um tipo de transação.',
  }),
  item: z.string().optional(),
  amount: z.coerce.number().min(0.01, { message: 'O valor deve ser maior que zero.' }),
});

type AddTransactionFormValues = z.infer<typeof formSchema>;

interface AddTransactionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddTransaction: (data: AddTransactionFormValues) => void;
  client: Client | null;
}

export function AddTransactionDialog({
  open,
  onOpenChange,
  onAddTransaction,
  client,
}: AddTransactionDialogProps) {
  const form = useForm<AddTransactionFormValues>({
    resolver: zodResolver(formSchema),
  });

  const transactionType = form.watch('type');

  useEffect(() => {
    form.reset({ type: 'purchase', amount: 0, item: '' });
  }, [open, form]);

  const onSubmit = (data: AddTransactionFormValues) => {
    onAddTransaction(data);
    onOpenChange(false);
  };

  if (!client) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Adicionar Transação para {client.name}</DialogTitle>
          <DialogDescription>
            Registre uma nova compra ou pagamento para este cliente.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Tipo de Transação</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex flex-col space-y-1"
                    >
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="purchase" />
                        </FormControl>
                        <FormLabel className="font-normal">Compra</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="payment" />
                        </FormControl>
                        <FormLabel className="font-normal">Pagamento</FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {transactionType === 'purchase' && (
              <FormField
                control={form.control}
                name="item"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição da Compra</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Produto Y" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Valor (R$)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="0.00" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" className="bg-accent hover:bg-accent/90 text-accent-foreground">
                Registrar Transação
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
