'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import type { Client, Product } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  PlusCircle,
  Search,
  Loader2,
  FileText
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { getClients, getClientTotals, addDebt, addPaymentToDebt, getProducts } from '@/lib/firebase/firestore';
import { AddDebtPaymentDialog, type AddDebtPaymentFormValues } from '@/components/add-debt-payment-dialog';

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(amount);
};

export function DebtPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddDebtPaymentOpen, setAddDebtPaymentOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const { toast } = useToast();

  const fetchAllData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [clientsData, productsData] = await Promise.all([getClients(), getProducts()]);
      setClients(clientsData);
      setProducts(productsData);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast({ variant: "destructive", title: "Erro ao buscar dados", description: "Não foi possível carregar as informações do banco de dados." });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  const handleAddDebtPayment = async (data: AddDebtPaymentFormValues) => {
    if (!data.clientId) {
        toast({ variant: "destructive", title: "Erro", description: "Nenhum cliente selecionado."});
        return;
    }

    try {
        if (data.type === 'debt') {
            if (!data.productName || !data.quantity || !data.unitPrice) {
                toast({ variant: "destructive", title: "Erro", description: "Detalhes do produto são necessários para adicionar uma dívida."});
                return;
            }
            await addDebt(data.clientId, data.productName, data.quantity, data.unitPrice);
            toast({ title: 'Sucesso!', description: 'Nova dívida adicionada.', className: 'bg-accent text-accent-foreground' });
        } else {
            if (!data.value || !data.paymentMethod) {
              toast({ variant: "destructive", title: "Erro", description: "Valor e forma de pagamento são necessários."});
              return;
            }
            await addPaymentToDebt(data.clientId, data.value, data.paymentMethod);
            toast({ title: 'Sucesso!', description: 'Pagamento registrado.', className: 'bg-accent text-accent-foreground' });
        }
        fetchAllData();
        setAddDebtPaymentOpen(false);
    } catch(error) {
         console.error("Error adding debt/payment:", error);
         toast({ variant: "destructive", title: "Erro!", description: "Não foi possível registrar a operação." });
    }
  };

  const openAddDebtPaymentDialog = (client: Client | null = null) => {
    setSelectedClient(client);
    setAddDebtPaymentOpen(true);
  };
  
  const filteredClients = useMemo(() => {
    if (isLoading) return [];
    return clients
        .map(c => ({...c, ...getClientTotals(c)}))
        .filter(client => {
            const search = searchTerm.toLowerCase();
            return (
                client.name.toLowerCase().includes(search) ||
                (client.phone && client.phone.includes(search))
            );
    }).sort((a,b) => b.balance - a.balance);
  }, [clients, searchTerm, isLoading]);


  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-8rem)]">
        <Loader2 className="h-16 w-16 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
            <FileText className="h-10 w-10 text-primary" />
            <div>
                <h1 className="text-3xl sm:text-4xl font-headline font-bold text-foreground">Dívidas e Pagamentos</h1>
                <p className="text-muted-foreground">Gerencie a conta corrente dos seus clientes.</p>
            </div>
        </div>
        <Button onClick={() => openAddDebtPaymentDialog()} size="lg" className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground shadow-md transition-transform hover:scale-105">
          <PlusCircle className="mr-2 h-5 w-5" />
          Adicionar Dívida/Pagamento
        </Button>
      </header>
      
      <Card className="shadow-xl border-border">
        <CardHeader>
            <CardTitle>Clientes com Saldo Devedor</CardTitle>
            <CardDescription>Busque um cliente para adicionar uma dívida ou registrar um pagamento.</CardDescription>
            <div className="relative mt-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Busque por nome ou telefone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
             
                <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead className="font-bold">Nome do Cliente</TableHead>
                    <TableHead className="text-right font-bold">Saldo Devedor</TableHead>
                    <TableHead className="text-center font-bold">Ação Rápida</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {filteredClients.length > 0 ? (
                    filteredClients.map(client => (
                        <TableRow key={client.id} className="hover:bg-secondary/50 transition-colors duration-300">
                            <TableCell className="font-medium">{client.name}</TableCell>
                            <TableCell className={cn('text-right font-semibold', client.balance > 0 ? 'text-destructive' : 'text-accent-foreground')}>
                                {formatCurrency(client.balance)}
                            </TableCell>
                            <TableCell className="text-center">
                                <Button variant="outline" size="sm" onClick={() => openAddDebtPaymentDialog(client)}>
                                    Adicionar Dívida/Pgto.
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))
                    ) : (
                    <TableRow>
                        <TableCell colSpan={3} className="text-center text-muted-foreground h-24">
                        Nenhum cliente encontrado.
                        </TableCell>
                    </TableRow>
                    )}
                </TableBody>
                </Table>
             
          </div>
        </CardContent>
      </Card>
      <AddDebtPaymentDialog
        open={isAddDebtPaymentOpen}
        onOpenChange={setAddDebtPaymentOpen}
        onAddDebtPayment={handleAddDebtPayment}
        clients={clients}
        products={products}
        selectedClient={selectedClient}
      />
    </div>
  );
}
