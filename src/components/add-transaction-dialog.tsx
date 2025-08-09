
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
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import React from 'react';
import { ScrollArea } from './ui/scroll-area';

const formSchema = z.object({
  item: z.string().min(1, { message: 'A descrição é obrigatória.' }),
  quantity: z.coerce.number().int().min(1, { message: 'A quantidade deve ser pelo menos 1.' }),
  unitPrice: z.coerce.number().min(0.01, { message: 'O valor unitário deve ser maior que zero.' }),
  paymentMethod: z.enum(['Pix', 'Dinheiro', 'Cartão de Crédito', 'Cartão de Débito', 'Não selecionado'], { required_error: "Forma de pagamento é obrigatória."}),
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
      item: '',
      quantity: 1,
      unitPrice: 0,
      paymentMethod: 'Não selecionado',
      splitPurchase: false,
      installments: 1,
      installmentInterval: 30,
    }
  });

  const { watch, reset, control } = form;
  const splitPurchase = watch('splitPurchase');

  useEffect(() => {
    reset({ item: '', quantity: 1, unitPrice: 0, paymentMethod: 'Não selecionado', splitPurchase: false, installments: 1, installmentInterval: 30 });
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
                            <Input type="number" step="1" placeholder="1" {...field} />
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
                            <Input type="number" step="0.01" placeholder="0.00" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                </div>
                <FormField
                  control={form.control}
                  name="paymentMethod"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Forma de Pagamento</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione a forma de pagamento" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Não selecionado">Não selecionado</SelectItem>
                          <SelectItem value="Pix">Pix</SelectItem>
                          <SelectItem value="Dinheiro">Dinheiro</SelectItem>
                          <SelectItem value="Cartão de Crédito">Cartão de Crédito</SelectItem>
                          <SelectItem value="Cartão de Débito">Cartão de Débito</SelectItem>
                        </SelectContent>
                      </Select>
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
