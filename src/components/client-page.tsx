'use client';

import { useState, useMemo, useEffect } from 'react';
import type { Client } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { AddClientDialog } from '@/components/add-client-dialog';
import { AddTransactionDialog } from '@/components/add-transaction-dialog';
import { ViewHistoryDialog } from '@/components/view-history-dialog';
import {
  DollarSign,
  Users,
  PlusCircle,
  MoreHorizontal,
  History,
  Plus,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const initialClientsData: Client[] = [
  {
    id: '1',
    name: 'João Silva',
    purchases: [
      { id: 'p1', item: 'Produto A', value: 150.0, date: new Date(2023, 10, 1).toISOString() },
      { id: 'p2', item: 'Produto B', value: 200.0, date: new Date(2023, 10, 15).toISOString() },
    ],
    payments: [{ id: 'pay1', amount: 300.0, date: new Date(2023, 10, 20).toISOString() }],
  },
  {
    id: '2',
    name: 'Maria Oliveira',
    purchases: [{ id: 'p3', item: 'Produto C', value: 500.0, date: new Date(2023, 11, 5).toISOString() }],
    payments: [],
  },
  {
    id: '3',
    name: 'Carlos Pereira',
    purchases: [{ id: 'p4', item: 'Serviço X', value: 1200.0, date: new Date(2023, 11, 10).toISOString() }],
    payments: [{ id: 'pay2', amount: 1200.0, date: new Date(2023, 11, 12).toISOString() }],
  },
];

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(amount);
};

export function ClientPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [isClientMounted, setIsClientMounted] = useState(false);
  const [isAddClientOpen, setAddClientOpen] = useState(false);
  const [isAddTransactionOpen, setAddTransactionOpen] = useState(false);
  const [isViewHistoryOpen, setViewHistoryOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  const { toast } = useToast();

  useEffect(() => {
    setClients(initialClientsData);
    setIsClientMounted(true);
  }, []);

  const totalOutstandingBalance = useMemo(() => {
    return clients.reduce((total, client) => {
      const totalPurchases = client.purchases.reduce((sum, p) => sum + p.value, 0);
      const totalPayments = client.payments.reduce((sum, p) => sum + p.amount, 0);
      return total + (totalPurchases - totalPayments);
    }, 0);
  }, [clients]);

  const handleAddClient = (data: { name: string; purchaseItem: string; purchaseValue: number; paymentAmount: number }) => {
    const newClient: Client = {
      id: crypto.randomUUID(),
      name: data.name,
      purchases: [],
      payments: [],
    };
    if (data.purchaseValue > 0) {
      newClient.purchases.push({
        id: crypto.randomUUID(),
        item: data.purchaseItem || 'Compra inicial',
        value: data.purchaseValue,
        date: new Date().toISOString(),
      });
    }
    if (data.paymentAmount > 0) {
      newClient.payments.push({
        id: crypto.randomUUID(),
        amount: data.paymentAmount,
        date: new Date().toISOString(),
      });
    }
    setClients(prev => [...prev, newClient]);
    toast({ title: 'Sucesso!', description: 'Novo cliente adicionado.', className: 'bg-accent text-accent-foreground' });
  };

  const handleAddTransaction = (data: { type: 'purchase' | 'payment'; item?: string; amount: number }) => {
    if (!selectedClient) return;

    setClients(prev =>
      prev.map(c => {
        if (c.id === selectedClient.id) {
          const updatedClient = { ...c };
          if (data.type === 'purchase') {
            updatedClient.purchases = [
              ...c.purchases,
              { id: crypto.randomUUID(), item: data.item || 'Nova Compra', value: data.amount, date: new Date().toISOString() },
            ];
          } else {
            updatedClient.payments = [
              ...c.payments,
              { id: crypto.randomUUID(), amount: data.amount, date: new Date().toISOString() },
            ];
          }
          return updatedClient;
        }
        return c;
      })
    );
    toast({ title: 'Sucesso!', description: 'Transação registrada.', className: 'bg-accent text-accent-foreground' });
  };

  const openTransactionDialog = (client: Client) => {
    setSelectedClient(client);
    setAddTransactionOpen(true);
  };

  const openHistoryDialog = (client: Client) => {
    setSelectedClient(client);
    setViewHistoryOpen(true);
  };

  const calculateBalance = (client: Client) => {
    const totalPurchases = client.purchases.reduce((sum, p) => sum + p.value, 0);
    const totalPayments = client.payments.reduce((sum, p) => sum + p.amount, 0);
    return totalPurchases - totalPayments;
  };

  if (!isClientMounted) {
    return null; // Or a loading spinner
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8 font-body bg-background min-h-screen">
      <header className="flex flex-col sm:flex-row items-center justify-between mb-8">
        <h1 className="text-4xl font-headline font-bold text-foreground mb-4 sm:mb-0">Organizador de Clientes</h1>
        <Button onClick={() => setAddClientOpen(true)} size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-md transition-transform hover:scale-105">
          <PlusCircle className="mr-2 h-5 w-5" />
          Adicionar Novo Cliente
        </Button>
      </header>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
        <Card className="shadow-lg border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldo Total Pendente</CardTitle>
            <DollarSign className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalOutstandingBalance)}</div>
            <p className="text-xs text-muted-foreground">Soma de todas as dívidas</p>
          </CardContent>
        </Card>
        <Card className="shadow-lg border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Clientes</CardTitle>
            <Users className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{clients.length}</div>
            <p className="text-xs text-muted-foreground">Clientes ativos no sistema</p>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-xl border-border">
        <CardHeader>
            <CardTitle>Visão Geral dos Clientes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-bold">Nome do Cliente</TableHead>
                  <TableHead className="text-right font-bold">Total Comprado</TableHead>
                  <TableHead className="text-right font-bold">Total Pago</TableHead>
                  <TableHead className="text-right font-bold">Saldo Pendente</TableHead>
                  <TableHead className="text-center font-bold">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clients.map(client => {
                  const balance = calculateBalance(client);
                  const totalPurchases = client.purchases.reduce((sum, p) => sum + p.value, 0);
                  const totalPayments = client.payments.reduce((sum, p) => sum + p.amount, 0);

                  return (
                    <TableRow key={client.id} className="hover:bg-secondary/50 transition-colors duration-300">
                      <TableCell className="font-medium">{client.name}</TableCell>
                      <TableCell className="text-right">{formatCurrency(totalPurchases)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(totalPayments)}</TableCell>
                      <TableCell className={cn('text-right font-semibold', balance > 0 ? 'text-destructive' : 'text-accent-foreground')}>
                        {formatCurrency(balance)}
                      </TableCell>
                      <TableCell className="text-center">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Abrir menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openTransactionDialog(client)}>
                              <Plus className="mr-2 h-4 w-4" />
                              <span>Adicionar Transação</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openHistoryDialog(client)}>
                              <History className="mr-2 h-4 w-4" />
                              <span>Ver Histórico</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <AddClientDialog
        open={isAddClientOpen}
        onOpenChange={setAddClientOpen}
        onAddClient={handleAddClient}
      />
      <AddTransactionDialog
        open={isAddTransactionOpen}
        onOpenChange={setAddTransactionOpen}
        onAddTransaction={handleAddTransaction}
        client={selectedClient}
      />
      <ViewHistoryDialog
        open={isViewHistoryOpen}
        onOpenChange={setViewHistoryOpen}
        client={selectedClient}
      />
    </div>
  );
}
