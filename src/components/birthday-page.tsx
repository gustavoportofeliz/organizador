'use client';

import { useState, useEffect, useMemo } from 'react';
import type { Client } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Gift } from 'lucide-react';
import { cn } from '@/lib/utils';

export function BirthdayPage() {
    const [clients, setClients] = useState<Client[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isClientMounted, setIsClientMounted] = useState(false);

    useEffect(() => {
        const storedClients = localStorage.getItem('clients');
        if (storedClients) {
            setClients(JSON.parse(storedClients));
        }
        setIsClientMounted(true);
    }, []);

    const parseDate = (dateString?: string): Date | null => {
        if (!dateString) return null;
        const parts = dateString.split('/');
        if (parts.length === 3) {
            // Assuming DD/MM/YYYY
            const day = parseInt(parts[0], 10);
            const month = parseInt(parts[1], 10) - 1;
            const year = parseInt(parts[2], 10);
            if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
                return new Date(year, month, day);
            }
        }
        return null;
    }

    const filteredAndSortedClients = useMemo(() => {
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentDay = now.getDate();

        return clients
            .filter(client => {
                const birthDate = parseDate(client.birthDate);
                return birthDate && client.name.toLowerCase().includes(searchTerm.toLowerCase());
            })
            .map(client => {
                const birthDate = parseDate(client.birthDate)!;
                const birthMonth = birthDate.getMonth();
                const birthDay = birthDate.getDate();

                let nextBirthday = new Date(now.getFullYear(), birthMonth, birthDay);
                if (nextBirthday < now) {
                    nextBirthday.setFullYear(now.getFullYear() + 1);
                }

                const diffTime = nextBirthday.getTime() - now.getTime();
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                let status: 'default' | 'month' | 'week' = 'default';
                if (birthMonth === currentMonth) {
                    status = 'month';
                }
                if (diffDays >= 0 && diffDays <= 7) {
                    status = 'week';
                }

                return { ...client, status, daysUntilBirthday: diffDays, birthDateObj: birthDate };
            })
            .sort((a, b) => a.daysUntilBirthday - b.daysUntilBirthday);
    }, [clients, searchTerm]);

    if (!isClientMounted) {
        return null; // Or a loading spinner
    }

    return (
        <div className="space-y-8">
             <header className="flex flex-col sm:flex-row items-center justify-between">
                <h1 className="text-4xl font-headline font-bold text-foreground mb-4 sm:mb-0">Aniversariantes</h1>
                <div className="w-full sm:w-auto">
                    <Input
                        placeholder="Filtrar por nome..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="max-w-sm"
                    />
                </div>
            </header>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filteredAndSortedClients.length === 0 ? (
                     <p className="text-center text-muted-foreground col-span-full">Nenhum cliente com data de aniversário cadastrada.</p>
                ) : (
                    filteredAndSortedClients.map(client => (
                        <Card key={client.id} className={cn('transition-all', {
                            'bg-yellow-100 dark:bg-yellow-900/30 border-yellow-400': client.status === 'month',
                            'bg-red-100 dark:bg-red-900/30 border-red-500': client.status === 'week',
                        })}>
                            <CardHeader>
                                <CardTitle>{client.name}</CardTitle>
                                <CardDescription>{client.birthDate}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center space-x-2">
                                     <Gift className={cn("h-5 w-5", {
                                        'text-yellow-600': client.status === 'month',
                                        'text-red-600': client.status === 'week',
                                        'text-muted-foreground': client.status === 'default',
                                    })} />
                                    <span>
                                        {client.daysUntilBirthday === 0 ? "Hoje é o dia!" : `Faltam ${client.daysUntilBirthday} dias`}
                                    </span>
                                </div>
                            </CardContent>
                            {client.status === 'week' && client.daysUntilBirthday > 0 && (
                                <CardFooter>
                                    <Badge variant="destructive">Aniversário em breve!</Badge>
                                </CardFooter>
                            )}
                            {client.daysUntilBirthday === 0 && (
                                <CardFooter>
                                     <Badge className="bg-green-500 text-white">Feliz Aniversário!</Badge>
                                </CardFooter>
                            )}
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}
