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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Product } from '@/lib/types';

const formSchema = z.object({
  name: z.string().min(2, { message: 'Nome do produto deve ter pelo menos 2 caracteres.' }),
  quantity: z.coerce.number().int().min(1, { message: 'A quantidade deve ser pelo menos 1.' }),
  unitPrice: z.coerce.number().min(0.01, { message: 'O preço deve ser maior que zero.' }),
  type: z.enum(['purchase', 'sale'], { required_error: 'Você deve selecionar o tipo de movimento.' }),
  isNewProduct: z.boolean().default(true),
});

export type AddProductFormValues = z.infer<typeof formSchema>;

interface AddProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddProduct: (data: AddProductFormValues) => void;
  products: Product[];
}

export function AddProductDialog({ open, onOpenChange, onAddProduct, products }: AddProductDialogProps) {
  const form = useForm<AddProductFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      quantity: 1,
      unitPrice: 0,
      type: 'purchase',
      isNewProduct: true,
    },
  });

  const { watch, setValue } = form;
  const isNewProduct = watch('isNewProduct');

  const onSubmit = (data: AddProductFormValues) => {
    onAddProduct(data);
    onOpenChange(false);
    form.reset({ name: '', quantity: 1, unitPrice: 0, type: 'purchase', isNewProduct: true });
  };
  
  const handleProductSelection = (productName: string) => {
    setValue('name', productName);
    if(productName) {
        setValue('isNewProduct', false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) {
        form.reset({ name: '', quantity: 1, unitPrice: 0, type: 'purchase', isNewProduct: true });
      }
      onOpenChange(isOpen);
    }}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Movimentar Produto</DialogTitle>
          <DialogDescription>
            Registre uma nova compra ou venda para seu estoque.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Produto</FormLabel>
                    <Select onValueChange={handleProductSelection} defaultValue={field.value}>
                        <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder="Selecione um produto existente" />
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
                     <Input 
                        {...field}
                        placeholder="Ou digite o nome de um novo produto" 
                        className="mt-2"
                        onChange={(e) => {
                            field.onChange(e);
                            setValue('isNewProduct', !products.some(p => p.name.toLowerCase() === e.target.value.toLowerCase()));
                        }}
                     />
                    <FormMessage />
                    </FormItem>
                )}
            />

            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Tipo de Movimentação</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex flex-row space-x-4"
                    >
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="purchase" id="r1" />
                        </FormControl>
                        <Label htmlFor="r1">Compra (Entrada)</Label>
                      </FormItem>
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="sale" id="r2" disabled={isNewProduct}/>
                        </FormControl>
                        <Label htmlFor="r2">Venda (Saída)</Label>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="quantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quantidade</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="1" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="unitPrice"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Preço Unitário (R$)</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" placeholder="0.00" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="pt-4">
              <Button type="submit" className="bg-accent hover:bg-accent/90 text-accent-foreground">
                <PlusCircle className="mr-2 h-4 w-4" />
                Registrar Movimentação
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
