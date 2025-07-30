'use client';

import { useState, useEffect, useMemo } from 'react';
import type { Client, Relative } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Gift, PlusCircle, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { isToday, isFuture, differenceInDays, parse, isValid } from 'date-fns';
import { AddRelativeDialog, type AddRelativeFormValues } from '@/components/add-relative-dialog';
import { Button } from './ui/button';

interface BirthdayPerson {
    id: string;
    name: string;
    birthDate: string;
    isRelative: boolean;
    relationship?: string;
    clientName?: string;
}

export function BirthdayPage() {
    const [clients, setClients] = useState<Client[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isClientMounted, setIsClientMounted] = useState(false);
    const [isAddRelativeOpen, setAddRelativeOpen] = useState(false);

    useEffect(() => {
        const storedClients = localStorage.getItem('clients');
        if (storedClients) {
            setClients(JSON.parse(storedClients));
        }
        setIsClientMounted(true);
    }, []);
    
    useEffect(() => {
        if(isClientMounted) {
            localStorage.setItem('clients', JSON.stringify(clients));
        }
    }, [clients, isClientMounted]);

    const handleAddRelative = (data: AddRelativeFormValues) => {
        const { client: clientId, name, birthDate, relationship } = data;
    
        setClients(prevClients => {
            const newClients = prevClients.map(c => {
                if (c.id === clientId) {
                    const selectedClient = c;
    
                    const newRelative: Relative = {
                        id: crypto.randomUUID(),
                        name,
                        birthDate,
                        relationship,
                        clientId: selectedClient.id,
                        clientName: selectedClient.name,
                    };
    
                    // Create a new relatives array by cloning the existing one (or starting fresh)
                    // and adding the new relative.
                    const updatedRelatives = [...(selectedClient.relatives || []), newRelative];
    
                    // Return a new client object with the updated relatives array.
                    return { ...selectedClient, relatives: updatedRelatives };
                }
                return c; // Return other clients unmodified.
            });
            return newClients;
        });
    };
    

    const birthdayPeople = useMemo(() => {
        const people: BirthdayPerson[] = [];
        clients.forEach(client => {
            if (client.birthDate) {
                people.push({
                    id: `client-${client.id}`,
                    name: client.name,
                    birthDate: client.birthDate,
                    isRelative: false,
                });
            }
            if (client.relatives) {
                client.relatives.forEach(relative => {
                    people.push({
                        id: `relative-${relative.id}`,
                        name: relative.name,
                        birthDate: relative.birthDate,
                        isRelative: true,
                        relationship: relative.relationship,
                        clientName: relative.clientName
                    });
                });
            }
        });
        return people;
    }, [clients]);

    const parseDate = (dateString?: string): Date | null => {
        if (!dateString) return null;
        
        let date = parse(dateString, 'yyyy-MM-dd', new Date());
        if (isValid(date)) {
            return date;
        }

        date = parse(dateString, 'dd/MM/yyyy', new Date());
        if(isValid(date)) {
            return date;
        }
        
        return null;
    }

    const filteredAndSortedBirthdays = useMemo(() => {
        const now = new Date();
        now.setHours(0, 0, 0, 0); 
        const currentMonth = now.getMonth();

        return birthdayPeople
            .filter(person => {
                const birthDate = parseDate(person.birthDate);
                return birthDate && person.name.toLowerCase().includes(searchTerm.toLowerCase());
            })
            .map(person => {
                const birthDate = parseDate(person.birthDate)!;
                birthDate.setHours(0, 0, 0, 0);
                const birthMonth = birthDate.getMonth();
                const birthDay = birthDate.getDate();
                const currentYear = now.getFullYear();

                let nextBirthday = new Date(currentYear, birthMonth, birthDay);

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

                return { ...person, status, daysUntilBirthday: diffDays, birthDateObj: birthDate, nextBirthday };
            })
            .sort((a, b) => {
                if (a.daysUntilBirthday < b.daysUntilBirthday) return -1;
                if (a.daysUntilBirthday > b.daysUntilBirthday) return 1;
                return a.name.localeCompare(b.name);
            });
    }, [birthdayPeople, searchTerm]);

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
             <header className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <h1 className="text-4xl font-headline font-bold text-foreground">Aniversariantes</h1>
                 <div className="flex w-full sm:w-auto gap-4">
                    <Input
                        placeholder="Filtrar por nome..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="max-w-sm"
                    />
                    <Button onClick={() => setAddRelativeOpen(true)}>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Adicionar Parente
                    </Button>
                </div>
            </header>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filteredAndSortedBirthdays.length === 0 ? (
                     <p className="text-center text-muted-foreground col-span-full">Nenhum aniversariante encontrado.</p>
                ) : (
                    filteredAndSortedBirthdays.map(person => (
                        <Card key={person.id} className={cn('transition-all', {
                            'bg-yellow-100 dark:bg-yellow-900/30 border-yellow-400': person.status === 'month',
                            'bg-red-100 dark:bg-red-900/30 border-red-500': person.status === 'week',
                            'bg-green-100 dark:bg-green-900/30 border-green-500': person.status === 'today',
                        })}>
                            <CardHeader>
                                <CardTitle>{person.name}</CardTitle>
                                {person.isRelative && (
                                     <CardDescription className="font-semibold text-primary">
                                         {person.relationship} de {person.clientName}
                                     </CardDescription>
                                )}
                                <CardDescription>{person.birthDate ? parseDate(person.birthDate)?.toLocaleDateString('pt-BR') : 'Data inválida'}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {person.status !== 'default' && (
                                    <div className="flex items-center space-x-2">
                                        <Gift className={cn("h-5 w-5", {
                                            'text-yellow-600': person.status === 'month',
                                            'text-red-600': person.status === 'week',
                                            'text-green-600': person.status === 'today',
                                        })} />
                                        <span>
                                            {getDaysUntilText(person.daysUntilBirthday, person.nextBirthday)}
                                        </span>
                                    </div>
                                )}
                            </CardContent>
                           
                            {person.status === 'week' && (
                                <CardFooter>
                                    <Badge variant="destructive">Aniversário em breve!</Badge>
                                </CardFooter>
                            )}
                             {person.status === 'today' && (
                                <CardFooter>
                                     <Badge className="bg-green-500 text-white">Feliz Aniversário!</Badge>
                                </CardFooter>
                            )}
                        </Card>
                    ))
                )}
            </div>
            <AddRelativeDialog 
                open={isAddRelativeOpen}
                onOpenChange={setAddRelativeOpen}
                onAddRelative={handleAddRelative}
                clients={clients}
            />
        </div>
    );
}
