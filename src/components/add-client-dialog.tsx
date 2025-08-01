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
import { PlusCircle } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Product } from '@/lib/types';
import React from 'react';
import { ScrollArea } from './ui/scroll-area';

const formSchema = z.object({
  name: z.string().min(2, { message: 'Nome deve ter pelo menos 2 caracteres.' }),
  phone: z.string().optional(),
  birthDate: z.string().optional(),
  address: z.string().optional(),
  neighborhood: z.string().optional(),
  childrenInfo: z.string().optional(),
  preferences: z.string().optional(),
  purchaseItem: z.string().optional(),
  purchaseValue: z.coerce.number().min(0).optional().default(0),
  paymentAmount: z.coerce.number().min(0).optional().default(0),
  paymentMethod: z.enum(['Pix', 'Dinheiro', 'Cartão de Crédito', 'Cartão de Débito']).optional(),
  splitPurchase: z.boolean().default(false),
  installments: z.coerce.number().min(1).max(6).optional(),
  installmentInterval: z.coerce.number().min(1).optional().default(30),
});

export type AddClientFormValues = z.infer<typeof formSchema>;

interface AddClientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddClient: (data: AddClientFormValues) => void;
  products: Product[];
}

export function AddClientDialog({ open, onOpenChange, onAddClient, products }: AddClientDialogProps) {
  const form = useForm<AddClientFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      phone: '',
      birthDate: '',
      address: '',
      neighborhood: '',
      childrenInfo: '',
      preferences: '',
      purchaseItem: '',
      purchaseValue: 0,
      paymentAmount: 0,
      splitPurchase: false,
      installments: 1,
      installmentInterval: 30,
    },
  });

  const { watch, control } = form;
  const splitPurchase = watch('splitPurchase');
  const purchaseValue = watch('purchaseValue');
  const purchaseItem = watch('purchaseItem');

  const onSubmit = (data: AddClientFormValues) => {
    onAddClient(data);
    onOpenChange(false);
    form.reset();
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) {
        form.reset();
      }
      onOpenChange(isOpen);
    }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Adicionar Novo Cliente</DialogTitle>
          <DialogDescription>
            Insira os detalhes do novo cliente e a primeira transação, se houver.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <ScrollArea className="h-[60vh] sm:h-auto sm:max-h-[70vh] pr-6">
              <div className="space-y-4">
                <FormField
                  control={control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome do Cliente</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: João da Silva" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Telefone</FormLabel>
                      <FormControl>
                        <Input placeholder="(00) 00000-0000" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={control}
                  name="birthDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data de Nascimento</FormLabel>
                      <FormControl>
                        <Input type="text" placeholder="DD/MM/AAAA" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Endereço</FormLabel>
                      <FormControl>
                        <Input placeholder="Rua, Número, Complemento" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={control}
                  name="neighborhood"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bairro</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Centro" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={control}
                  name="childrenInfo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Filhos (quantidade)</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: 2" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={control}
                  name="preferences"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Gostos / Preferências (Produto)</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Camiseta Estampada" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={control}
                  name="purchaseItem"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Item da Compra (Opcional)</FormLabel>
                       <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione um produto do estoque" />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                {products.map((product) => (
                                    <SelectItem key={product.id} value={product.name}>
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
                  name="purchaseValue"
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
                                        id="split-purchase"
                                        checked={field.value}
                                        onCheckedChange={field.onChange}
                                    />
                                </FormControl>
                            </FormItem>
                        )}
                    />
                    <Label htmlFor="split-purchase">Dividir compra em parcelas</Label>
                </div>
    
                {splitPurchase && (
                    <div className="grid grid-cols-2 gap-4">
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
    
                <FormField
                  control={control}
                  name="paymentAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Valor do Pagamento Inicial (R$)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" placeholder="0.00" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {(purchaseValue > 0 || purchaseItem) && (
                <FormField
                  control={control}
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
                )}
              </div>
            </ScrollArea>
            <DialogFooter className="pt-4 mt-4 border-t">
              <Button type="submit" className="w-full sm:w-auto bg-accent hover:bg-accent/90 text-accent-foreground">
                <PlusCircle className="mr-2 h-4 w-4" />
                Adicionar Cliente
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
