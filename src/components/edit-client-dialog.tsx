
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
import { Edit } from 'lucide-react';
import type { Client } from '@/lib/types';
import { useEffect } from 'react';
import { parse, format } from 'date-fns';
import { ScrollArea } from './ui/scroll-area';

const formSchema = z.object({
  name: z.string().min(2, { message: 'Nome deve ter pelo menos 2 caracteres.' }),
  phone: z.string().optional(),
  birthDate: z.string().optional(),
  address: z.string().optional(),
  neighborhood: z.string().optional(),
  childrenInfo: z.string().optional(),
  preferences: z.string().optional(),
});

export type EditClientFormValues = z.infer<typeof formSchema>;

interface EditClientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEditClient: (data: EditClientFormValues) => void;
  client: Client | null;
}

export function EditClientDialog({ open, onOpenChange, onEditClient, client }: EditClientDialogProps) {
  const form = useForm<EditClientFormValues>({
    resolver: zodResolver(formSchema),
  });

  useEffect(() => {
    if (client) {
      let formattedBirthDate = '';
      if (client.birthDate) {
          try {
              // Try parsing as DD/MM/YYYY first
              let date = parse(client.birthDate, 'dd/MM/yyyy', new Date());
              if (isNaN(date.getTime())) {
                   // If that fails, try parsing as an ISO date (which is what input[type=date] produces)
                   date = new Date(client.birthDate);
              }
              if (!isNaN(date.getTime())) {
                  // Add timezone offset to prevent date from shifting
                  const tzoffset = (new Date()).getTimezoneOffset() * 60000;
                  const localISOTime = (new Date(date.getTime() - tzoffset)).toISOString().split('T')[0];
                  formattedBirthDate = localISOTime;
              }
          } catch(e) {
              console.error("Could not parse date:", client.birthDate);
          }
      }
      
      form.reset({
        name: client.name,
        phone: client.phone || '',
        birthDate: formattedBirthDate,
        address: client.address || '',
        neighborhood: client.neighborhood || '',
        childrenInfo: client.childrenInfo || '',
        preferences: client.preferences || '',
      });
    }
  }, [client, form, open]);

  const onSubmit = (data: EditClientFormValues) => {
    // Reformat date back to dd/MM/yyyy if needed, or keep as is.
    // Let's save as dd/MM/yyyy for consistency with the add form.
    if (data.birthDate) {
        try {
            const date = new Date(data.birthDate);
            const tzoffset = (new Date()).getTimezoneOffset() * 60000;
            const localDate = new Date(date.getTime() + tzoffset);
            data.birthDate = format(localDate, 'dd/MM/yyyy');
        } catch(e) {
            console.error("Could not format date on submit:", data.birthDate);
        }
    }
    onEditClient(data);
    onOpenChange(false);
  };

  if (!client) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Editar Cliente</DialogTitle>
          <DialogDescription>
            Atualize os dados de {client.name}.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <ScrollArea className="h-[60vh] sm:h-auto sm:max-h-[70vh] pr-6">
              <div className="space-y-4">
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
                    control={form.control}
                    name="birthDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Data de Nascimento</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
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
                    control={form.control}
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
                    control={form.control}
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
                    control={form.control}
                    name="preferences"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Gostos / Preferências (Produto)</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: Cores, estilos, etc." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
              </div>
            </ScrollArea>
            <DialogFooter className="pt-4 mt-4 border-t">
              <Button type="submit" className="w-full sm:w-auto">
                <Edit className="mr-2 h-4 w-4" />
                Salvar Alterações
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
