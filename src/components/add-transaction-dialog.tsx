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
import { useEffect } from 'react';
import type { Client } from '@/lib/types';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const formSchema = z.object({
  item: z.string().min(1, { message: 'A descrição é obrigatória.' }),
  amount: z.coerce.number().min(0.01, { message: 'O valor deve ser maior que zero.' }),
  splitPurchase: z.boolean().default(false),
  installments: z.coerce.number().min(1).max(6).optional(),
});

export type AddTransactionFormValues = z.infer<typeof formSchema> & {
  installmentDueDates?: (string | undefined)[];
};

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
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: 0,
      item: '',
      splitPurchase: false,
      installments: 1,
    }
  });

  const { watch, reset, control } = form;
  const splitPurchase = watch('splitPurchase');

  useEffect(() => {
    reset({ amount: 0, item: '', splitPurchase: false, installments: 1 });
  }, [open, reset]);

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    onAddTransaction(data);
    onOpenChange(false);
  };

  if (!client) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Adicionar Compra para {client.name}</DialogTitle>
          <DialogDescription>
            Registre um novo produto comprado por este cliente.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={control}
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
             <FormField
              control={control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Valor da Compra (R$)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="0.00" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex items-center space-x-2">
                <FormField
                control={control}
                name="splitPurchase"
                render={({ field }) => (
                    <FormItem>
                          <FormControl>
                            <Switch
                                id="split-purchase-transaction"
                                checked={field.value}
                                onCheckedChange={field.onChange}
                            />
                        </FormControl>
                    </FormItem>
                )}
              />
              <Label htmlFor="split-purchase-transaction">Dividir compra em parcelas</Label>
            </div>
            {splitPurchase && (
                <FormField
                  control={control}
                  name="installments"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Número de Parcelas</FormLabel>
                      <Select onValueChange={(value) => field.onChange(parseInt(value))} defaultValue={String(field.value)}>
                          <FormControl>
                              <SelectTrigger>
                                  <SelectValue placeholder="Selecione o número de parcelas" />
                              </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                              {[...Array(6)].map((_, i) => (
                                  <SelectItem key={i + 1} value={String(i + 1)}>{i + 1}x</SelectItem>
                              ))}
                          </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
            )}
            <DialogFooter>
              <Button type="submit" className="bg-accent hover:bg-accent/90 text-accent-foreground">
                Registrar Compra
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

    