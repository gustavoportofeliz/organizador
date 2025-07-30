'use client';

import { useForm, useFieldArray } from 'react-hook-form';
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
import type { Client, Product } from '@/lib/types';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import React from 'react';

const formSchema = z.object({
  item: z.string().min(1, { message: 'A descrição é obrigatória.' }),
  amount: z.coerce.number().min(0.01, { message: 'O valor deve ser maior que zero.' }),
  splitPurchase: z.boolean().default(false),
  installments: z.coerce.number().min(1).max(6).optional(),
  installmentInterval: z.coerce.number().min(1).optional().default(30),
});

export type AddTransactionFormValues = z.infer<typeof formSchema>;

interface AddTransactionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddTransaction: (data: AddTransactionFormValues) => void;
  client: Client | null;
  products: Product[];
}

export function AddTransactionDialog({
  open,
  onOpenChange,
  onAddTransaction,
  client,
  products
}: AddTransactionDialogProps) {
  const form = useForm<AddTransactionFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: 0,
      item: '',
      splitPurchase: false,
      installments: 1,
      installmentInterval: 30,
    }
  });

  const { watch, reset, control } = form;
  const splitPurchase = watch('splitPurchase');

  useEffect(() => {
    reset({ amount: 0, item: '', splitPurchase: false, installments: 1, installmentInterval: 30 });
  }, [open, reset]);

  const onSubmit = (data: AddTransactionFormValues) => {
    onAddTransaction(data);
    onOpenChange(false);
  };

  if (!client) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Adicionar Compra para {client.name}</DialogTitle>
          <DialogDescription>
            Registre um novo produto comprado por este cliente.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4  max-h-[70vh] overflow-y-auto pr-4">
            <FormField
              control={control}
              name="item"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição da Compra</FormLabel>
                   <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder="Selecione um produto do estoque" />
                            </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            {products.map((product) => (
                                <SelectItem key={product.id} value={product.name} disabled={product.quantity === 0}>
                                    {product.name} (Estoque: {product.quantity})
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
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
                    <Input type="number" step="0.01" placeholder="0.00" {...field} />
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
                <div className="grid grid-cols-2 gap-4">
                    <FormField
                    control={control}
                    name="installments"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Número de Parcelas</FormLabel>
                        <Select onValueChange={(value) => field.onChange(parseInt(value, 10))} defaultValue={String(field.value)}>
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
                     <FormField
                        control={control}
                        name="installmentInterval"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Intervalo (dias)</FormLabel>
                            <FormControl>
                            <Input type="number" step="1" placeholder="30" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                </div>
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
