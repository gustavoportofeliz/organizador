'use client';

import { useState, useMemo, useEffect } from 'react';
import type { Client, Purchase, Installment } from '@/lib/types';
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
import { AddClientDialog, type AddClientFormValues } from '@/components/add-client-dialog';
import { AddTransactionDialog, type AddTransactionFormValues } from '@/components/add-transaction-dialog';
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
import { addMonths } from 'date-fns';


const initialClientsData: Client[] = [
  // {
  //   id: '1',
  //   name: 'João Silva',
  //   purchases: [
  //     { id: 'p1', item: 'Produto A', value: 150.0, date: new Date(2023, 10, 1).toISOString() },
  //     { id: 'p2', item: 'Produto B', value: 200.0, date: new Date(2023, 10, 15).toISOString() },
  //   ],
  //   payments: [{ id: 'pay1', amount: 300.0, date: new Date(2023, 10, 20).toISOString() }],
  // },
  // {
  //   id: '2',
  //   name: 'Maria Oliveira',
  //   purchases: [{ id: 'p3', item: 'Produto C', value: 500.0, date: new Date(2023, 11, 5).toISOString() }],
  //   payments: [],
  // },
  // {
  //   id: '3',
  //   name: 'Carlos Pereira',
  //   purchases: [{ id: 'p4', item: 'Serviço X', value: 1200.0, date: new Date(2023, 11, 10).toISOString() }],
  //   payments: [{ id: 'pay2', amount: 1200.0, date: new Date(2023, 11, 12).toISOString() }],
  // },
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

  const updateInstallmentStatuses = (clients: Client[]): Client[] => {
    const now = new Date();
    return clients.map(client => ({
      ...client,
      purchases: client.purchases.map(purchase => ({
        ...purchase,
        installments: purchase.installments.map(inst => {
          if (inst.status === 'paid') return inst;
          const dueDate = new Date(inst.dueDate);
          if (now > dueDate) {
            return { ...inst, status: 'overdue' };
          }
          return inst;
        })
      }))
    }));
  };

  useEffect(() => {
    const storedClients = localStorage.getItem('clients');
    const initialClients = storedClients ? JSON.parse(storedClients) : initialClientsData;
    setClients(updateInstallmentStatuses(initialClients));
    setIsClientMounted(true);
  }, []);

  useEffect(() => {
    if(isClientMounted) {
      localStorage.setItem('clients', JSON.stringify(clients));
      const interval = setInterval(() => {
        setClients(prevClients => updateInstallmentStatuses(prevClients));
      }, 60000); // Check for overdue installments every minute
      return () => clearInterval(interval);
    }
  }, [clients, isClientMounted]);


  const totalOutstandingBalance = useMemo(() => {
    return clients.reduce((total, client) => {
      const clientBalance = client.purchases.reduce((purchaseTotal, purchase) => {
        const purchaseBalance = purchase.installments
          .filter(inst => inst.status !== 'paid')
          .reduce((sum, inst) => sum + inst.value, 0);
        return purchaseTotal + purchaseBalance;
      }, 0);
      return total + clientBalance;
    }, 0);
  }, [clients]);

  const handleAddClient = (data: AddClientFormValues) => {
    const newClient: Client = {
      id: crypto.randomUUID(),
      name: data.name,
      purchases: [],
      payments: [],
    };

    if (data.purchaseValue && data.purchaseValue > 0) {
        const newPurchase: Purchase = {
            id: crypto.randomUUID(),
            item: data.purchaseItem || 'Compra inicial',
            totalValue: data.purchaseValue,
            date: new Date().toISOString(),
            installments: [],
        };

        if (data.splitPurchase && data.installments && data.installments > 1) {
            const installmentValue = data.purchaseValue / data.installments;
            for (let i = 1; i <= data.installments; i++) {
                newPurchase.installments.push({
                    id: crypto.randomUUID(),
                    installmentNumber: i,
                    value: installmentValue,
                    dueDate: addMonths(new Date(), i).toISOString(),
                    status: 'pending',
                });
            }
        } else {
            newPurchase.installments.push({
                id: crypto.randomUUID(),
                installmentNumber: 1,
                value: data.purchaseValue,
                dueDate: addMonths(new Date(), 1).toISOString(),
                status: 'pending',
            });
        }
        newClient.purchases.push(newPurchase);
    }

    if (data.paymentAmount && data.paymentAmount > 0) {
      newClient.payments.push({
        id: crypto.randomUUID(),
        amount: data.paymentAmount,
        date: new Date().toISOString(),
      });
      // Logic to apply initial payment to installments would go here
    }
    setClients(prev => [...prev, newClient]);
    toast({ title: 'Sucesso!', description: 'Novo cliente adicionado.', className: 'bg-accent text-accent-foreground' });
  };

  const handleAddTransaction = (data: AddTransactionFormValues) => {
    if (!selectedClient) return;

    setClients(prev =>
      prev.map(c => {
        if (c.id === selectedClient.id) {
          const updatedClient = { ...c };
            const newPurchase: Purchase = {
                id: crypto.randomUUID(),
                item: data.item || 'Nova Compra',
                totalValue: data.amount,
                date: new Date().toISOString(),
                installments: [],
            };
    
            if (data.splitPurchase && data.installments && data.installments > 1) {
                const installmentValue = data.amount / data.installments;
                for (let i = 1; i <= data.installments; i++) {
                    newPurchase.installments.push({
                        id: crypto.randomUUID(),
                        installmentNumber: i,
                        value: installmentValue,
                        dueDate: addMonths(new Date(), i).toISOString(),
                        status: 'pending',
                    });
                }
            } else {
                newPurchase.installments.push({
                    id: crypto.randomUUID(),
                    installmentNumber: 1,
                    value: data.amount,
                    dueDate: addMonths(new Date(), 1).toISOString(),
                    status: 'pending',
                });
            }
            updatedClient.purchases.push(newPurchase);
          
            updatedClient.payments.push({ 
                id: crypto.randomUUID(), 
                amount: data.amount, 
                date: new Date().toISOString() 
            });
          
          return updatedClient;
        }
        return c;
      })
    );
    toast({ title: 'Sucesso!', description: 'Transação registrada.', className: 'bg-accent text-accent-foreground' });
  };
  
  const handlePayInstallment = (clientId: string, purchaseId: string, installmentId: string) => {
    setClients(prevClients => 
      prevClients.map(client => {
        if (client.id === clientId) {
          const newClient = { ...client };
          newClient.purchases = newClient.purchases.map(purchase => {
            if (purchase.id === purchaseId) {
              const newPurchase = { ...purchase };
              newPurchase.installments = newPurchase.installments.map(inst => {
                if (inst.id === installmentId && inst.status !== 'paid') {
                  return { ...inst, status: 'paid', paidDate: new Date().toISOString() };
                }
                return inst;
              });
              return newPurchase;
            }
            return purchase;
          });
          // Optionally add a payment record
          const purchase = newClient.purchases.find(p => p.id === purchaseId);
          const installment = purchase?.installments.find(i => i.id === installmentId);
          if (installment) {
            newClient.payments.push({
                id: crypto.randomUUID(),
                amount: installment.value,
                date: new Date().toISOString(),
                installmentId: installmentId,
            });
          }
          return newClient;
        }
        return client;
      })
    );
    toast({ title: 'Sucesso!', description: 'Parcela quitada.', className: 'bg-accent text-accent-foreground' });
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
    const totalPurchases = client.purchases.reduce((sum, p) => sum + p.totalValue, 0);
    const totalPayments = client.payments.reduce((sum, p) => sum + p.amount, 0);
    return totalPurchases - totalPayments;
  };

  const getClientTotals = (client: Client) => {
    const totalPurchases = client.purchases.reduce((sum, p) => sum + p.totalValue, 0);
    const totalPayments = client.payments.reduce((sum, p) => sum + p.amount, 0);
    const balance = totalPurchases - totalPayments;
    return { totalPurchases, totalPayments, balance };
  }


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
                  const { totalPurchases, totalPayments, balance } = getClientTotals(client);
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
                              <span>Adicionar Compra</span>
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
        onPayInstallment={handlePayInstallment}
      />
    </div>
  );
}

    