
'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import type { Client, Purchase, Product, ProductHistoryEntry, Relative, Installment } from '@/lib/types';
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
  Loader2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { addDays, format, parseISO } from 'date-fns';
import { 
  addClient, 
  addTransaction, 
  deleteClient as deleteClientFromDb, 
  editClient as editClientInDb, 
  getClient, 
  getClients, 
  payInstallment as payInstallmentInDb,
  getProducts,
} from '@/lib/firebase/firestore';


const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(amount);
};

const getClientTotals = (client: Client) => {
    const totalPurchases = client.purchases.reduce((sum, p) => sum + p.totalValue, 0);
    const totalPayments = client.payments.reduce((sum, p) => sum + p.amount, 0);
    const balance = totalPurchases - totalPayments;
    return { totalPurchases, totalPayments, balance };
};

export function ClientPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
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

  const fetchAllData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [clientsData, productsData] = await Promise.all([getClients(), getProducts()]);
      const updatedClients = updateInstallmentStatuses(clientsData);
      setClients(updatedClients);
      setProducts(productsData);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast({ variant: "destructive", title: "Erro ao buscar dados", description: "Não foi possível carregar as informações do banco de dados." });
    } finally {
      setIsLoading(false);
    }
  }, [toast, updateInstallmentStatuses]);

  useEffect(() => {
    fetchAllData();
    const interval = setInterval(() => {
      setClients(prevClients => updateInstallmentStatuses(prevClients));
    }, 60000); // Check for overdue installments every minute
    return () => clearInterval(interval);
  }, [fetchAllData, updateInstallmentStatuses]);


  const totalOutstandingBalance = useMemo(() => {
    return clients.reduce((total, client) => {
      const clientBalance = client.purchases.reduce((sum, purchase) => {
        const unpaidInstallments = purchase.installments.filter(i => i.status !== 'paid');
        const purchaseBalance = unpaidInstallments.reduce((installmentSum, installment) => installmentSum + installment.value, 0);
        return sum + purchaseBalance;
      }, 0);
      return total + clientBalance;
    }, 0);
  }, [clients]);

  const handleAddClient = async (data: AddClientFormValues) => {
    try {
      await addClient(data);
      toast({ title: 'Sucesso!', description: 'Novo cliente adicionado.', className: 'bg-accent text-accent-foreground' });
      fetchAllData();
    } catch (error) {
      console.error("Error adding client:", error);
      toast({ variant: "destructive", title: "Erro!", description: "Não foi possível adicionar o cliente." });
    }
  };
  
  const handleEditClient = async (data: EditClientFormValues) => {
    if (!selectedClient) return;
    try {
      await editClientInDb(selectedClient.id, data);
      toast({ title: 'Sucesso!', description: 'Dados do cliente atualizados.', className: 'bg-accent text-accent-foreground' });
      fetchAllData();
    } catch (error) {
       console.error("Error editing client:", error);
       toast({ variant: "destructive", title: "Erro!", description: "Não foi possível atualizar o cliente." });
    }
  };

  const handleDeleteClient = async () => {
    if (!selectedClient) return;
    try {
      await deleteClientFromDb(selectedClient.id);
      toast({ title: 'Sucesso!', description: 'Cliente removido.', className: 'bg-destructive text-destructive-foreground' });
      fetchAllData();
    } catch (error) {
       console.error("Error deleting client:", error);
       toast({ variant: "destructive", title: "Erro!", description: "Não foi possível remover o cliente." });
    }
  };

  const handleAddTransaction = async (data: AddTransactionFormValues) => {
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
  
    try {
      await addTransaction(selectedClient.id, data);
      toast({ title: 'Sucesso!', description: 'Nova compra registrada.', className: 'bg-accent text-accent-foreground' });
      fetchAllData();
      if(selectedClient){
        const updatedClient = await getClient(selectedClient.id);
        setSelectedClient(updatedClient);
      }
    } catch (error) {
      console.error("Error adding transaction:", error);
      toast({ variant: "destructive", title: "Erro!", description: "Não foi possível registrar a compra." });
    }
  };

  
  const handlePayInstallment = async (clientId: string, purchaseId: string, installmentId: string, paymentMethod: Installment['paymentMethod']) => {
    try {
      await payInstallmentInDb(clientId, purchaseId, installmentId, paymentMethod);
      toast({ title: 'Sucesso!', description: 'Parcela quitada.', className: 'bg-accent text-accent-foreground' });
      fetchAllData();
       if(selectedClient){
        const updatedClient = await getClient(selectedClient.id);
        setSelectedClient(updatedClient);
      }
    } catch(error) {
      console.error("Error paying installment:", error);
      toast({ variant: "destructive", title: "Erro!", description: "Não foi possível quitar a parcela." });
    }
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

  const filteredClients = useMemo(() => {
    if (isLoading) return [];
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
  }, [clients, searchTerm, isLoading]);


  return (
    <div className="font-body bg-background min-h-screen">
      <header className="flex flex-col sm:flex-row items-center justify-between mb-8 gap-4">
        <h1 className="text-3xl sm:text-4xl font-headline font-bold text-foreground">Visão Geral dos Clientes</h1>
        <Button onClick={() => setAddClientOpen(true)} size="lg" className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground shadow-md transition-transform hover:scale-105">
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
             {isLoading ? (
                <div className="flex justify-center items-center h-64">
                    <Loader2 className="h-16 w-16 animate-spin" />
                </div>
             ) : (
                <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead className="font-bold">Nome</TableHead>
                    <TableHead className="text-right font-bold hidden sm:table-cell">Comprado</TableHead>
                    <TableHead className="text-right font-bold hidden md:table-cell">Pago</TableHead>
                    <TableHead className="text-right font-bold">Saldo</TableHead>
                    <TableHead className="text-center font-bold">Ações</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {filteredClients.length > 0 ? (
                    filteredClients.map(client => {
                        const { totalPurchases, totalPayments, balance } = getClientTotals(client);
                        return (
                        <TableRow key={client.id} className="hover:bg-secondary/50 transition-colors duration-300">
                            <TableCell className="font-medium">{client.name}</TableCell>
                            <TableCell className="text-right hidden sm:table-cell">{formatCurrency(totalPurchases)}</TableCell>
                            <TableCell className="text-right hidden md:table-cell">{formatCurrency(totalPayments)}</TableCell>
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
                    })
                    ) : (
                    <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground h-24">
                        Nenhum cliente encontrado.
                        </TableCell>
                    </TableRow>
                    )}
                </TableBody>
                </Table>
             )}
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
