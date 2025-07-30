'use client';

import { useMemo, useState, useEffect } from 'react';
import type { Client, Purchase, Installment } from '@/lib/types';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
  } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

interface ViewHistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client: Client | null;
  onPayInstallment: (clientId: string, purchaseId: string, installmentId: string) => void;
}

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(amount);
  };
  
const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    // Handles both ISO strings and "YYYY-MM-DD"
    const date = new Date(dateString);
    // Add time to date to avoid timezone issues with date-only strings
    const adjustedDate = new Date(date.valueOf() + date.getTimezoneOffset() * 60 * 1000);
    return adjustedDate.toLocaleDateString('pt-BR', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
}

const getStatusBadge = (status: Installment['status']) => {
    switch (status) {
        case 'paid':
            return <Badge className="bg-green-600 hover:bg-green-700 text-white capitalize">Quitado</Badge>;
        case 'pending':
            return <Badge className="bg-yellow-500 hover:bg-yellow-600 text-white capitalize">A Vencer</Badge>;
        case 'overdue':
            return <Badge variant="destructive" className="capitalize bg-red-600 hover:bg-red-700">Vencido</Badge>;
        default:
            return null;
    }
}

export function ViewHistoryDialog({ open, onOpenChange, client, onPayInstallment }: ViewHistoryDialogProps) {

  // Local state to reflect UI changes immediately
  const [internalClient, setInternalClient] = useState(client);

  useEffect(() => {
    setInternalClient(client);
  }, [client, open]);


  const sortedPurchases = useMemo(() => {
    if (!internalClient) return [];
    return [...internalClient.purchases].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [internalClient]);

  const handlePay = (purchaseId: string, installmentId: string) => {
    if (client) {
      // Optimistic update
      setInternalClient(prevClient => {
          if (!prevClient) return null;
          const newClient = { ...prevClient };
          newClient.purchases = newClient.purchases.map(p => {
              if (p.id === purchaseId) {
                  return {
                      ...p,
                      installments: p.installments.map(i => {
                          if (i.id === installmentId) {
                              return { ...i, status: 'paid', paidDate: new Date().toISOString() };
                          }
                          return i;
                      })
                  };
              }
              return p;
          });
          return newClient;
      });

      // Call the actual update function
      onPayInstallment(client.id, purchaseId, installmentId);
    }
  }

  if (!internalClient) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Histórico de Transações de {internalClient.name}</DialogTitle>
          <DialogDescription>
            Exibindo histórico completo de compras e pagamentos.
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-[60vh] overflow-y-auto pr-4">
            {sortedPurchases.length === 0 && (
                 <p className="text-center text-muted-foreground p-8">Nenhuma compra registrada.</p>
            )}
            <Accordion type="multiple" className="w-full">
                {sortedPurchases.map(purchase => (
                    <AccordionItem value={purchase.id} key={purchase.id}>
                        <AccordionTrigger>
                            <div className="flex justify-between w-full pr-4">
                                <span>{formatDate(purchase.date)} - {purchase.item}</span>
                                <span className="font-semibold">{formatCurrency(purchase.totalValue)}</span>
                            </div>
                        </AccordionTrigger>
                        <AccordionContent>
                             <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Parcela</TableHead>
                                        <TableHead>Vencimento</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Valor</TableHead>
                                        <TableHead className="text-center">Ação</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {purchase.installments.map(inst => (
                                        <TableRow key={inst.id}>
                                            <TableCell>{inst.installmentNumber} / {purchase.installments.length}</TableCell>
                                            <TableCell>{formatDate(inst.dueDate)}</TableCell>
                                            <TableCell>{getStatusBadge(inst.status)}</TableCell>
                                            <TableCell className={cn('text-right font-medium', inst.status === 'overdue' ? 'text-destructive' : '')}>
                                                {formatCurrency(inst.value)}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                {inst.status !== 'paid' ? (
                                                    <Button size="sm" onClick={() => handlePay(purchase.id, inst.id)}>
                                                        Quitar
                                                    </Button>
                                                ) : (
                                                    <span className="text-sm font-semibold text-green-600">Quitado</span>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </AccordionContent>
                    </AccordionItem>
                ))}
            </Accordion>
        </div>
      </DialogContent>
    </Dialog>
  );
}
