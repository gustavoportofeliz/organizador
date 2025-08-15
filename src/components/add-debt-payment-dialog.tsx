'use client';

import React from 'react';
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
import { PlusCircle, MinusCircle } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Client } from '@/lib/types';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';


const formSchema = z.object({
  clientId: z.string({ required_error: 'Você deve selecionar um cliente.' }),
  type: z.enum(['debt', 'payment'], { required_error: 'Você deve selecionar o tipo de operação.' }),
  value: z.coerce.number().min(0.01, { message: 'O valor deve ser maior que zero.' }),
  description: z.string().optional(),
  paymentMethod: z.enum(['Pix', 'Dinheiro', 'Cartão de Crédito', 'Cartão de Débito', 'Não selecionado']).optional(),
}).refine(data => data.type !== 'payment' || (!!data.paymentMethod && data.paymentMethod !== 'Não selecionado'), {
    message: "Forma de pagamento é obrigatória para registrar um pagamento.",
    path: ["paymentMethod"],
});


export type AddDebtPaymentFormValues = z.infer<typeof formSchema>;

interface AddDebtPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddDebtPayment: (data: AddDebtPaymentFormValues) => void;
  clients: Client[];
  selectedClient?: Client | null;
}

export function AddDebtPaymentDialog({ open, onOpenChange, onAddDebtPayment, clients, selectedClient }: AddDebtPaymentDialogProps) {
  const form = useForm<AddDebtPaymentFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      clientId: selectedClient?.id || '',
      type: 'debt',
      value: 0,
      description: '',
      paymentMethod: 'Não selecionado'
    },
  });

  const { watch, setValue } = form;
  const operationType = watch('type');

  React.useEffect(() => {
    if (selectedClient) {
        setValue('clientId', selectedClient.id)
    }
     // Reset form when dialog opens or client changes, but keep client ID if selected
    form.reset({
        clientId: selectedClient?.id || '',
        type: 'debt',
        value: 0,
        description: '',
        paymentMethod: 'Não selecionado'
    });
  }, [open, selectedClient, form, setValue]);


  const onSubmit = (data: AddDebtPaymentFormValues) => {
    onAddDebtPayment(data);
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) {
        form.reset();
      }
      onOpenChange(isOpen);
    }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Adicionar Dívida ou Pagamento</DialogTitle>
          <DialogDescription>
            Registre uma nova dívida (compra) ou um pagamento para a conta de um cliente.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
             <FormField
              control={form.control}
              name="clientId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cliente</FormLabel>
                   <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!!selectedClient}>
                        <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder="Selecione o cliente" />
                            </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            {clients.map((client) => (
                                <SelectItem key={client.id} value={client.id}>
                                    {client.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Tipo de Operação</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="grid grid-cols-2 gap-4"
                    >
                      <FormItem>
                         <RadioGroupItem value="debt" id="debt" className="peer sr-only" />
                         <Label htmlFor="debt" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
                            <PlusCircle className="mb-3 h-6 w-6"/>
                            Adicionar Dívida
                        </Label>
                      </FormItem>
                       <FormItem>
                         <RadioGroupItem value="payment" id="payment" className="peer sr-only" />
                         <Label htmlFor="payment" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
                            <MinusCircle className="mb-3 h-6 w-6"/>
                            Registrar Pagamento
                        </Label>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="value"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Valor (R$)</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" placeholder="0.00" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {operationType === 'debt' && (
                 <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Descrição da Dívida (Opcional)</FormLabel>
                        <FormControl>
                            <Input placeholder="Ex: Compra de 2 camisetas" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
            )}
             {operationType === 'payment' && (
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
             )}


            <DialogFooter className="pt-4">
              <Button type="submit" className={cn("w-full", operationType === 'debt' ? 'bg-destructive hover:bg-destructive/90' : 'bg-green-600 hover:bg-green-700 text-white')}>
                {operationType === 'debt' ? 'Adicionar Dívida' : 'Registrar Pagamento'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
