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

const formSchema = z.object({
  name: z.string().min(2, { message: 'Nome deve ter pelo menos 2 caracteres.' }),
  purchaseItem: z.string().optional(),
  purchaseValue: z.coerce.number().min(0).optional().default(0),
  paymentAmount: z.coerce.number().min(0).optional().default(0),
  splitPurchase: z.boolean().default(false),
  installments: z.coerce.number().min(1).max(6).optional(),
});

export type AddClientFormValues = z.infer<typeof formSchema> & {
  installmentDueDates?: (string | undefined)[];
};

interface AddClientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddClient: (data: AddClientFormValues) => void;
}

export function AddClientDialog({ open, onOpenChange, onAddClient }: AddClientDialogProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      purchaseItem: '',
      purchaseValue: 0,
      paymentAmount: 0,
      splitPurchase: false,
      installments: 1,
    },
  });

  const { watch, setValue } = form;
  const splitPurchase = watch('splitPurchase');
  const installments = watch('installments');

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    onAddClient(data);
    onOpenChange(false);
    form.reset();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Adicionar Novo Cliente</DialogTitle>
          <DialogDescription>
            Insira os detalhes do novo cliente e a primeira transação, se houver.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
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
              control={form.control}
              name="purchaseItem"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Item da Compra (Opcional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Produto X" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="purchaseValue"
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
                    control={form.control}
                    name="splitPurchase"
                    render={({ field }) => (
                        <FormItem>
                             <FormControl>
                                <Switch
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
                 <FormField
                    control={form.control}
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

            <FormField
              control={form.control}
              name="paymentAmount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Valor do Pagamento Inicial (R$)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="0.00" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" className="bg-accent hover:bg-accent/90 text-accent-foreground">
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
