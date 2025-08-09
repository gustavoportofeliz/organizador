'use client';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { ProductHistoryEntry } from '@/lib/types';

const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('pt-BR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
}
interface DeleteMovementConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  movementInfo?: ProductHistoryEntry | null;
}

export function DeleteMovementConfirmationDialog({
  open,
  onOpenChange,
  onConfirm,
  movementInfo,
}: DeleteMovementConfirmationDialogProps) {
  const handleConfirm = () => {
    onConfirm();
    onOpenChange(false);
  };

  const description = movementInfo
    ? movementInfo.type === 'sale'
      ? `Isso irá reverter a venda, devolvendo ${movementInfo.quantity} unidade(s) ao estoque e excluindo a compra do histórico do cliente ${movementInfo.clientName || ''}.`
      : `Isso irá reverter a compra, removendo ${movementInfo.quantity} unidade(s) do estoque.`
    : '';

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div>
              <p>Você está prestes a cancelar a movimentação de <span className="font-bold">{movementInfo?.type === 'sale' ? 'Venda' : 'Compra'}</span> de <span className="font-bold">{movementInfo?.quantity}</span> unidade(s) do dia <span className="font-bold">{movementInfo ? formatDate(movementInfo.date) : ''}</span>.</p>
              <p className="mt-2">{description}</p>
              <p className="font-bold mt-2">Essa ação não pode ser desfeita.</p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            className={cn(buttonVariants({ variant: 'destructive' }))}
          >
            Confirmar Cancelamento
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
