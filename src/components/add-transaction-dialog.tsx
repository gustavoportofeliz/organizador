
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
import type { Client, Product } from '@/lib/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import React from 'react';
import { ScrollArea } from './ui/scroll-area';

const formSchema = z.object({
  item: z.string().min(1, { message: 'A descrição é obrigatória.' }),
  quantity: z.coerce.number().int().min(1, { message: 'A quantidade deve ser pelo menos 1.' }),
  unitPrice: z.coerce.number().min(0.01, { message: 'O valor unitário deve ser maior que zero.' }),
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
      item: '',
      quantity: 1,
      unitPrice: 0,
    }
  });

  const { reset, control } = form;

  useEffect(() => {
    reset({ item: '', quantity: 1, unitPrice: 0 });
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
          <DialogTitle>Adicionar Venda para {client.name}</DialogTitle>
          <DialogDescription>
            Registre um novo produto vendido para este cliente.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <ScrollArea className="h-[60vh] sm:h-auto sm:max-h-[70vh] pr-6">
              <div className="space-y-4">
                <FormField
                  control={control}
                  name="item"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descrição da Venda</FormLabel>
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
                <div className="grid grid-cols-2 gap-4">
                    <FormField
                    control={control}
                    name="quantity"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Quantidade</FormLabel>
                        <FormControl>
                            <Input type="number" step="1" placeholder="1" {...field} onChange={e => field.onChange(parseInt(e.target.value) || 0)}/>
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <FormField
                    control={control}
                    name="unitPrice"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Valor Unitário (R$)</FormLabel>
                        <FormControl>
                            <Input type="number" step="0.01" placeholder="0.00" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                </div>
              </div>
            </ScrollArea>
            <DialogFooter className="pt-4 mt-4 border-t">
              <Button type="submit" className="w-full sm:w-auto bg-accent hover:bg-accent/90 text-accent-foreground">
                Registrar Venda
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
