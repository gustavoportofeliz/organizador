'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import type { Client, Purchase, Product, ProductHistoryEntry, Relative } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { AddClientDialog, type AddClientFormValues } from '@/components/add-client-dialog';
import { AddTransactionDialog, type AddTransactionFormValues } from '@/components/add-transaction-dialog';
import { ViewHistoryDialog } from '@/components/view-history-dialog';
import { EditClientDialog, type EditClientFormValues } from '@/components/edit-client-dialog';
import { DeleteConfirmationDialog } from '@/components/delete-confirmation-dialog';
import {
  DollarSign,
  Users,
  PlusCircle,
  MoreHorizontal,
  History,
  Plus,
  Trash2,
  Edit,
  Search,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { addDays, format, parseISO } from 'date-fns';


const initialClientsData: Client[] = [];

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(amount);
};

export function ClientPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isClientMounted, setIsClientMounted] = useState(false);
  const [isAddClientOpen, setAddClientOpen] = useState(false);
  const [isAddTransactionOpen, setAddTransactionOpen] = useState(false);
  const [isViewHistoryOpen, setViewHistoryOpen] = useState(false);
  const [isEditClientOpen, setEditClientOpen] = useState(false);
  const [isDeleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const { toast } = useToast();

  const updateInstallmentStatuses = useCallback((clientsToUpdate: Client[]): Client[] => {
    const now = new Date();
    return clientsToUpdate.map(client => ({
      ...client,
      purchases: client.purchases.map(purchase => ({
        ...purchase,
        installments: purchase.installments.map(inst => {
          if (inst.status === 'paid') return inst;
          try {
            const dueDate = parseISO(inst.dueDate);
            if (now > dueDate) {
              return { ...inst, status: 'overdue' };
            }
          } catch(e) {
             // Ignore invalid date formats during checks
          }
          return inst;
        })
      }))
    }));
  }, []);

  useEffect(() => {
    const storedClients = localStorage.getItem('clients');
    const initialClients = storedClients ? JSON.parse(storedClients) : initialClientsData;
    const storedProducts = localStorage.getItem('products');
    if (storedProducts) {
        setProducts(JSON.parse(storedProducts));
    }
    setClients(updateInstallmentStatuses(initialClients));
    setIsClientMounted(true);
  }, [updateInstallmentStatuses]);

  useEffect(() => {
    if(isClientMounted) {
      localStorage.setItem('clients', JSON.stringify(clients));
      localStorage.setItem('products', JSON.stringify(products));
      const interval = setInterval(() => {
        setClients(prevClients => updateInstallmentStatuses(prevClients));
      }, 60000); // Check for overdue installments every minute
      return () => clearInterval(interval);
    }
  }, [clients, products, isClientMounted, updateInstallmentStatuses]);


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
      phone: data.phone,
      birthDate: data.birthDate,
      address: data.address,
      neighborhood: data.neighborhood,
      childrenInfo: data.childrenInfo,
      preferences: data.preferences,
      purchases: [],
      payments: [],
      relatives: [],
    };

    if (data.purchaseValue && data.purchaseValue > 0 && data.purchaseItem) {
        const newPurchase: Purchase = {
            id: crypto.randomUUID(),
            item: data.purchaseItem,
            totalValue: data.purchaseValue,
            date: new Date().toISOString(),
            installments: [],
        };
        
        const installmentsCount = data.splitPurchase && data.installments ? data.installments : 1;
        const installmentValue = data.purchaseValue / installmentsCount;
        const intervalDays = data.installmentInterval || 30;

        for (let i = 0; i < installmentsCount; i++) {
            const dueDate = addDays(new Date(), (i + 1) * intervalDays);
            newPurchase.installments.push({
                id: crypto.randomUUID(),
                installmentNumber: i + 1,
                value: installmentValue,
                dueDate: dueDate.toISOString(),
                status: 'pending',
            });
        }
        newClient.purchases.push(newPurchase);
        updateProductStock(data.purchaseItem, 1, newClient.name, installmentValue);
    }

    if (data.paymentAmount && data.paymentAmount > 0) {
      // Find the first pending installment and apply the payment
      let remainingPayment = data.paymentAmount;
      for (const purchase of newClient.purchases) {
        if (remainingPayment <= 0) break;
        for (const installment of purchase.installments) {
          if (remainingPayment <= 0) break;
          if (installment.status === 'pending' && remainingPayment >= installment.value) {
            remainingPayment -= installment.value;
            installment.status = 'paid';
            installment.paidDate = new Date().toISOString();
             newClient.payments.push({
                id: crypto.randomUUID(),
                amount: installment.value,
                date: new Date().toISOString(),
                installmentId: installment.id,
            });
          }
        }
      }
    }
    setClients(prev => [newClient, ...prev]);
    toast({ title: 'Sucesso!', description: 'Novo cliente adicionado.', className: 'bg-accent text-accent-foreground' });
  };
  
  const handleEditClient = (data: EditClientFormValues) => {
    if (!selectedClient) return;
    setClients(prev => 
      prev.map(c => 
        c.id === selectedClient.id ? { ...c, ...data } : c
      )
    );
    toast({ title: 'Sucesso!', description: 'Dados do cliente atualizados.', className: 'bg-accent text-accent-foreground' });
  };

  const handleDeleteClient = () => {
    if (!selectedClient) return;
    setClients(prev => prev.filter(c => c.id !== selectedClient.id));
    toast({ title: 'Sucesso!', description: 'Cliente removido.', className: 'bg-destructive text-destructive-foreground' });
  };
  
  const updateProductStock = (productName: string, quantitySold: number, clientName: string, unitPrice: number) => {
      setProducts(prevProducts => {
        const productIndex = prevProducts.findIndex(p => p.name.toLowerCase() === productName.toLowerCase());
        if (productIndex === -1) {
          toast({ variant: 'destructive', title: 'Erro!', description: `Produto "${productName}" não encontrado no estoque.` });
          return prevProducts;
        }
    
        const updatedProducts = [...prevProducts];
        const productToUpdate = { ...updatedProducts[productIndex] };
    
        if (productToUpdate.quantity < quantitySold) {
          toast({
            variant: "destructive",
            title: "Estoque insuficiente!",
            description: `Só existem ${productToUpdate.quantity} unidades de ${productName}.`,
          })
        }
    
        productToUpdate.quantity -= quantitySold;
    
        const newHistoryEntry: ProductHistoryEntry = {
          id: crypto.randomUUID(),
          date: new Date().toISOString(),
          type: 'sale',
          quantity: quantitySold,
          unitPrice: unitPrice,
          notes: `Venda para ${clientName}`,
          clientName: clientName
        };
        productToUpdate.history = [newHistoryEntry, ...productToUpdate.history];
    
        updatedProducts[productIndex] = productToUpdate;
        return updatedProducts;
      });
  }

  const handleAddTransaction = (data: AddTransactionFormValues) => {
    if (!selectedClient) return;
  
    const productInStock = products.find(p => p.name.toLowerCase() === data.item.toLowerCase());
    if (!productInStock || productInStock.quantity < 1) {
      toast({
        variant: "destructive",
        title: "Estoque insuficiente!",
        description: `Não há estoque disponível para ${data.item}.`,
      });
      return;
    }
  
    setClients(prev =>
      prev.map(c => {
        if (c.id === selectedClient.id) {
          const updatedClient = { ...c, purchases: [...c.purchases] };
          const newPurchase: Purchase = {
            id: crypto.randomUUID(),
            item: data.item,
            totalValue: data.amount,
            date: new Date().toISOString(),
            installments: [],
          };
  
          const installmentsCount = data.splitPurchase && data.installments ? data.installments : 1;
          const installmentValue = data.amount / installmentsCount;
          const intervalDays = data.installmentInterval || 30;
  
          for (let i = 0; i < installmentsCount; i++) {
            const dueDate = addDays(new Date(), (i + 1) * intervalDays);
            newPurchase.installments.push({
              id: crypto.randomUUID(),
              installmentNumber: i + 1,
              value: installmentValue,
              dueDate: dueDate.toISOString(),
              status: 'pending',
            });
          }
  
          updatedClient.purchases.push(newPurchase);
          if (selectedClient && selectedClient.id === updatedClient.id) {
            setSelectedClient(updatedClient);
          }
          updateProductStock(data.item, 1, updatedClient.name, installmentValue);
          return updatedClient;
        }
        return c;
      })
    );
    toast({ title: 'Sucesso!', description: 'Nova compra registrada.', className: 'bg-accent text-accent-foreground' });
  };

  
  const handlePayInstallment = (clientId: string, purchaseId: string, installmentId: string) => {
    setClients(prevClients => {
      const updatedClients = prevClients.map(client => {
        if (client.id === clientId) {
          const newClient = { ...client };
          let paidAmount = 0;
          let paidDate = new Date().toISOString();
          newClient.purchases = newClient.purchases.map(purchase => {
            if (purchase.id === purchaseId) {
              const newPurchase = { ...purchase };
              newPurchase.installments = newPurchase.installments.map(inst => {
                if (inst.id === installmentId && inst.status !== 'paid') {
                  paidAmount = inst.value;
                  return { ...inst, status: 'paid', paidDate: paidDate };
                }
                return inst;
              });
              return newPurchase;
            }
            return purchase;
          });
          
          if(paidAmount > 0) {
            newClient.payments.push({
                id: crypto.randomUUID(),
                amount: paidAmount,
                date: paidDate,
                installmentId: installmentId,
            });
          }

           if (selectedClient && selectedClient.id === newClient.id) {
            setSelectedClient(newClient);
          }
          return newClient;
        }
        return client;
      });
      return updateInstallmentStatuses(updatedClients);
    });
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

  const openEditDialog = (client: Client) => {
    setSelectedClient(client);
    setEditClientOpen(true);
  };
  
  const openDeleteDialog = (client: Client) => {
    setSelectedClient(client);
    setDeleteConfirmOpen(true);
  };

  const getClientTotals = (client: Client) => {
    const totalPurchases = client.purchases.reduce((sum, p) => sum + p.totalValue, 0);
    const totalPayments = client.payments.reduce((sum, p) => sum + p.amount, 0);
    const balance = totalPurchases - totalPayments;
    return { totalPurchases, totalPayments, balance };
  }
  
  const filteredClients = useMemo(() => {
    return clients.filter(client => {
      const search = searchTerm.toLowerCase();
      return (
        client.name.toLowerCase().includes(search) ||
        (client.phone && client.phone.includes(search)) ||
        (client.address && client.address.toLowerCase().includes(search)) ||
        (client.neighborhood && client.neighborhood.toLowerCase().includes(search)) ||
        (client.childrenInfo && client.childrenInfo.toLowerCase().includes(search)) ||
        (client.preferences && client.preferences.toLowerCase().includes(search))
      );
    });
  }, [clients, searchTerm]);


  if (!isClientMounted) {
    return null; // Or a loading spinner
  }

  return (
    <div className="font-body bg-background min-h-screen">
      <header className="flex flex-col sm:flex-row items-center justify-between mb-8 gap-4">
        <h1 className="text-4xl font-headline font-bold text-foreground">Visão Geral dos Clientes</h1>
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
            <CardTitle>Filtro de Clientes</CardTitle>
            <div className="relative mt-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Busque por nome, telefone, endereço..."
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
                  <TableHead className="text-right font-bold">Total Comprado</TableHead>
                  <TableHead className="text-right font-bold">Total Pago</TableHead>
                  <TableHead className="text-right font-bold">Saldo Pendente</TableHead>
                  <TableHead className="text-center font-bold">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClients.map(client => {
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
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => openEditDialog(client)}>
                                <Edit className="mr-2 h-4 w-4" />
                                <span>Editar Cliente</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openDeleteDialog(client)} className="text-destructive focus:text-destructive">
                                <Trash2 className="mr-2 h-4 w-4" />
                                <span>Excluir Cliente</span>
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
        products={products}
      />
      <AddTransactionDialog
        open={isAddTransactionOpen}
        onOpenChange={setAddTransactionOpen}
        onAddTransaction={handleAddTransaction}
        client={selectedClient}
        products={products}
      />
       <ViewHistoryDialog
        open={isViewHistoryOpen}
        onOpenChange={setViewHistoryOpen}
        client={selectedClient}
        onPayInstallment={handlePayInstallment}
      />
      <EditClientDialog
        open={isEditClientOpen}
        onOpenChange={setEditClientOpen}
        onEditClient={handleEditClient}
        client={selectedClient}
      />
      <DeleteConfirmationDialog
        open={isDeleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        onConfirm={handleDeleteClient}
        clientName={selectedClient?.name}
      />
    </div>
  );
}
