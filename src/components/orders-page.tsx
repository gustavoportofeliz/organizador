'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Order } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
  ClipboardList,
  Loader2,
  CheckCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getOrders, addOrder, completeOrder } from '@/lib/firebase/firestore';
import { AddOrderDialog, type AddOrderFormValues } from '@/components/add-order-dialog';
import { useUser } from '@/firebase';

const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('pt-BR', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

export function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddOrderOpen, setAddOrderOpen] = useState(false);
  const { toast } = useToast();
  const { user } = useUser();

  const fetchOrders = useCallback(async () => {
    if(!user) return;
    setIsLoading(true);
    try {
      const ordersData = await getOrders();
      setOrders(ordersData);
    } catch (error) {
      console.error("Error fetching orders:", error);
      toast({ variant: "destructive", title: "Erro ao buscar pedidos" });
    } finally {
      setIsLoading(false);
    }
  }, [toast, user]);

  useEffect(() => {
    if (user) {
        fetchOrders();
    }
  }, [fetchOrders, user]);

  const handleAddOrder = async (data: AddOrderFormValues) => {
    try {
      await addOrder(data);
      toast({ title: 'Sucesso!', description: 'Novo pedido registrado.', className: 'bg-accent text-accent-foreground' });
      fetchOrders();
    } catch (error) {
      console.error("Error adding order:", error);
      // Error is handled globally
    }
  };

  const handleCompleteOrder = async (orderId: string) => {
    try {
        await completeOrder(orderId);
        toast({ title: 'Pedido Concluído!', description: 'O pedido foi marcado como entregue.', className: 'bg-green-600 text-white' });
        fetchOrders();
    } catch (error) {
        console.error("Error completing order:", error);
        // Error is handled globally
    }
  }

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
            <ClipboardList className="h-10 w-10 text-primary" />
            <div>
                <h1 className="text-3xl sm:text-4xl font-headline font-bold text-foreground">Pedidos Pendentes</h1>
                <p className="text-muted-foreground">Gerencie as solicitações dos seus clientes.</p>
            </div>
        </div>
        <Button onClick={() => setAddOrderOpen(true)} size="lg" className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground shadow-md transition-transform hover:scale-105">
          <PlusCircle className="mr-2 h-5 w-5" />
          Registrar Pedido
        </Button>
      </header>
      
      <Card className="shadow-xl border-border">
        <CardHeader>
            <CardTitle>Lista de Pedidos</CardTitle>
            <CardDescription>Aqui estão todos os pedidos que precisam ser preparados e entregues.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
             
                <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead className="font-bold">Cliente</TableHead>
                    <TableHead className="font-bold">Produto Solicitado</TableHead>
                    <TableHead className="font-bold hidden sm:table-cell">Data do Pedido</TableHead>
                    <TableHead className="text-center font-bold">Ação</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {orders.length > 0 ? (
                    orders.map(order => (
                        <TableRow key={order.id} className="hover:bg-secondary/50 transition-colors duration-300">
                            <TableCell className="font-medium">{order.customerName}</TableCell>
                            <TableCell>{order.productName}</TableCell>
                            <TableCell className="hidden sm:table-cell">{formatDate(order.createdAt)}</TableCell>
                            <TableCell className="text-center">
                                <Button variant="ghost" size="sm" onClick={() => handleCompleteOrder(order.id)} className="text-green-600 hover:text-green-700 hover:bg-green-50">
                                    <CheckCircle className="mr-2 h-4 w-4"/>
                                    Marcar como Concluído
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))
                    ) : (
                    <TableRow>
                        <TableCell colSpan={4} className="text-center text-muted-foreground h-24">
                        Nenhum pedido pendente.
                        </TableCell>
                    </TableRow>
                    )}
                </TableBody>
                </Table>
             
          </div>
        </CardContent>
      </Card>
      <AddOrderDialog
        open={isAddOrderOpen}
        onOpenChange={setAddOrderOpen}
        onAddOrder={handleAddOrder}
      />
    </div>
  );
}
