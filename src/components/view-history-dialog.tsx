'use client';

import { useMemo } from 'react';
import type { Client } from '@/lib/types';
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
    return new Date(dateString).toLocaleDateString('pt-BR', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
}

export function ViewHistoryDialog({ open, onOpenChange, client }: ViewHistoryDialogProps) {
  const transactions = useMemo(() => {
    if (!client) return [];

    const allTransactions = [
      ...client.purchases.map(p => ({ ...p, type: 'purchase' as const, amount: p.value, description: p.item })),
      ...client.payments.map(p => ({ ...p, type: 'payment' as const, description: 'Pagamento recebido' })),
    ];

    return allTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [client]);

  if (!client) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Histórico de Transações</DialogTitle>
          <DialogDescription>
            Exibindo histórico completo para {client.name}.
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-[60vh] overflow-y-auto pr-4">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Data</TableHead>
                        <TableHead>Descrição</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead className="text-right">Valor</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {transactions.map(tx => (
                        <TableRow key={tx.id}>
                            <TableCell>{formatDate(tx.date)}</TableCell>
                            <TableCell>{tx.description}</TableCell>
                            <TableCell>
                                <Badge variant={tx.type === 'purchase' ? 'destructive' : 'default'} className={cn(tx.type === 'payment' && 'bg-accent text-accent-foreground')}>
                                    {tx.type === 'purchase' ? 'Compra' : 'Pagamento'}
                                </Badge>
                            </TableCell>
                            <TableCell className={cn('text-right font-medium', tx.type === 'purchase' ? 'text-destructive' : 'text-accent-foreground')}>
                                {formatCurrency(tx.amount)}
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
            {transactions.length === 0 && (
                <p className="text-center text-muted-foreground p-8">Nenhuma transação registrada.</p>
            )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
