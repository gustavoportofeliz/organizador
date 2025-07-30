'use client';

import { useMemo } from 'react';
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
import { cn } from '@/lib/utils';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

interface ViewHistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client: Client | null;
}

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(amount);
  };
  
const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('pt-BR', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
}

const getStatusBadge = (status: Installment['status']) => {
    switch (status) {
        case 'paid':
            return <Badge className="bg-green-500 text-white">Quitado</Badge>;
        case 'pending':
            return <Badge variant="outline">A vencer</Badge>;
        case 'overdue':
            return <Badge variant="destructive">Vencido</Badge>;
        default:
            return null;
    }
}

export function ViewHistoryDialog({ open, onOpenChange, client }: ViewHistoryDialogProps) {

  const sortedPurchases = useMemo(() => {
    if (!client) return [];
    return [...client.purchases].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [client]);

  if (!client) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Histórico de Transações de {client.name}</DialogTitle>
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
