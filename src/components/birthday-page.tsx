'use client';

import { useState, useEffect, useMemo } from 'react';
import type { Client } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Gift } from 'lucide-react';
import { cn } from '@/lib/utils';
import { isToday, isFuture, differenceInDays, parse, isValid } from 'date-fns';

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
        
        // Handle YYYY-MM-DD from <input type="date">
        let date = parse(dateString, 'yyyy-MM-dd', new Date());
        if (isValid(date)) {
            return date;
        }

        // Handle DD/MM/YYYY for older data
        date = parse(dateString, 'dd/MM/yyyy', new Date());
        if(isValid(date)) {
            return date;
        }
        
        return null;
    }

    const filteredAndSortedClients = useMemo(() => {
        const now = new Date();
        now.setHours(0, 0, 0, 0); // Normalize 'now' to the start of the day
        const currentMonth = now.getMonth();

        return clients
            .filter(client => {
                const birthDate = parseDate(client.birthDate);
                return birthDate && client.name.toLowerCase().includes(searchTerm.toLowerCase());
            })
            .map(client => {
                const birthDate = parseDate(client.birthDate)!;
                birthDate.setHours(0, 0, 0, 0);
                const birthMonth = birthDate.getMonth();
                const birthDay = birthDate.getDate();
                const currentYear = now.getFullYear();

                let nextBirthday = new Date(currentYear, birthMonth, birthDay);

                // If birthday has already passed this year, check for next year's birthday
                if (nextBirthday < now) {
                    nextBirthday.setFullYear(currentYear + 1);
                }

                const diffDays = differenceInDays(nextBirthday, now);
                
                let status: 'default' | 'month' | 'week' | 'today' = 'default';

                if (isToday(nextBirthday)) {
                    status = 'today';
                } else if (isFuture(nextBirthday)) {
                    if (diffDays <= 7) {
                        status = 'week';
                    } else if (birthMonth === currentMonth) {
                        status = 'month';
                    }
                }

                return { ...client, status, daysUntilBirthday: diffDays, birthDateObj: birthDate, nextBirthday };
            })
            // Sort by upcoming birthdays first, then by name
            .sort((a, b) => {
                if (a.daysUntilBirthday < b.daysUntilBirthday) return -1;
                if (a.daysUntilBirthday > b.daysUntilBirthday) return 1;
                return a.name.localeCompare(b.name);
            });
    }, [clients, searchTerm]);

    if (!isClientMounted) {
        return null; // Or a loading spinner
    }

    const getDaysUntilText = (days: number, nextBirthday: Date) => {
        if (isToday(nextBirthday)) {
            return "Hoje é o dia!";
        }
        if (days === 1) {
            return "Falta 1 dia";
        }
        return `Faltam ${days} dias`;
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
                            'bg-green-100 dark:bg-green-900/30 border-green-500': client.status === 'today',
                        })}>
                            <CardHeader>
                                <CardTitle>{client.name}</CardTitle>
                                <CardDescription>{client.birthDate ? parseDate(client.birthDate)?.toLocaleDateString('pt-BR') : 'Data inválida'}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center space-x-2">
                                     <Gift className={cn("h-5 w-5", {
                                        'text-yellow-600': client.status === 'month',
                                        'text-red-600': client.status === 'week',
                                        'text-green-600': client.status === 'today',
                                        'text-muted-foreground': client.status === 'default',
                                    })} />
                                    <span>
                                        {getDaysUntilText(client.daysUntilBirthday, client.nextBirthday)}
                                    </span>
                                </div>
                            </CardContent>
                           
                            {client.status === 'week' && (
                                <CardFooter>
                                    <Badge variant="destructive">Aniversário em breve!</Badge>
                                </CardFooter>
                            )}
                             {client.status === 'today' && (
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
