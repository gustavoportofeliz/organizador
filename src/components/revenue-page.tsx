'use client';
import { useState, useMemo, useEffect } from 'react';
import type { Client, Purchase, Installment } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { DollarSign, CheckCircle } from 'lucide-react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(amount);
};

const getMonthYear = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('pt-BR', { month: 'long', year: 'numeric' });
}

export function RevenuePage() {
    const [clients, setClients] = useState<Client[]>([]);
    const [isClientMounted, setIsClientMounted] = useState(false);

    useEffect(() => {
        const storedClients = localStorage.getItem('clients');
        if (storedClients) {
            setClients(JSON.parse(storedClients));
        }
        setIsClientMounted(true);
    }, []);

    const monthlyData = useMemo(() => {
        const data: { 
            [key: string]: { 
                paid: number; 
                details: { client: string; value: number; status: string }[] 
            } 
        } = {};

        clients.forEach(client => {
            client.purchases.forEach(purchase => {
                purchase.installments.forEach(installment => {
                    const monthYear = getMonthYear(installment.dueDate);
                    if (!data[monthYear]) {
                        data[monthYear] = { paid: 0, details: [] };
                    }
                    if (installment.status === 'paid') {
                        data[monthYear].paid += installment.value;
                    }
                    
                    data[monthYear].details.push({
                        client: client.name,
                        value: installment.value,
                        status: installment.status === 'paid' 
                            ? 'Quitado' 
                            : installment.status === 'overdue' 
                            ? 'Vencido' 
                            : 'Pendente'
                    });
                });
            });
        });
        
        // Sort months in ascending order (oldest first)
        return Object.entries(data).sort(([a], [b]) => new Date(a.split(' de ')[1], getMonthIndex(a.split(' de ')[0])).getTime() - new Date(b.split(' de ')[1], getMonthIndex(b.split(' de ')[0])).getTime());

    }, [clients]);

    const totalDue = useMemo(() => {
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

    if (!isClientMounted) {
        return null;
    }

    return (
        <div className="space-y-8">
            <header>
                <h1 className="text-4xl font-headline font-bold text-foreground mb-2">Visão de Faturamento</h1>
                <p className="text-muted-foreground">Acompanhe os valores quitados e devidos de cada mês.</p>
            </header>

            <Card className="shadow-lg border-destructive">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-destructive">Saldo Total Devedor</CardTitle>
                    <DollarSign className="h-5 w-5 text-destructive" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-destructive">{formatCurrency(totalDue)}</div>
                    <p className="text-xs text-muted-foreground">Soma de todas as parcelas pendentes e vencidas.</p>
                </CardContent>
            </Card>

            <div className="space-y-6">
                {monthlyData.map(([monthYear, data]) => (
                    <Card key={monthYear} className="shadow-lg border-border">
                        <CardHeader>
                            <CardTitle className="capitalize">{monthYear}</CardTitle>
                            <CardDescription>Resumo financeiro do mês.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-4 md:grid-cols-1">
                                <div className="flex items-center gap-4 rounded-lg bg-green-50 dark:bg-green-900/30 p-4">
                                    <CheckCircle className="h-8 w-8 text-green-600" />
                                    <div>
                                        <p className="text-sm text-green-700 dark:text-green-300">Total Quitado no Mês</p>
                                        <p className="text-xl font-bold text-green-800 dark:text-green-200">{formatCurrency(data.paid)}</p>
                                    </div>
                                </div>
                            </div>
                             <details className="mt-4">
                                <summary className="cursor-pointer text-sm font-medium text-primary hover:underline">Ver detalhes do mês</summary>
                                <div className="mt-2 overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Cliente</TableHead>
                                                <TableHead>Status</TableHead>
                                                <TableHead className="text-right">Valor da Parcela</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {data.details.map((detail, index) => (
                                                <TableRow key={index}>
                                                    <TableCell>{detail.client}</TableCell>
                                                    <TableCell>
                                                        <span className={`font-semibold ${detail.status === 'Quitado' ? 'text-green-600' : detail.status === 'Vencido' ? 'text-red-600' : 'text-yellow-600'}`}>
                                                          {detail.status}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell className="text-right">{formatCurrency(detail.value)}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </details>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {monthlyData.length === 0 && (
                <p className="text-center text-muted-foreground col-span-full py-8">
                    Nenhum dado de faturamento para exibir.
                </p>
            )}

        </div>
    )
}


function getMonthIndex(monthName: string): number {
    const months = [
      'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
      'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'
    ];
    return months.indexOf(monthName.toLowerCase());
}
