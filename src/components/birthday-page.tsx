'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import type { Client, Relative } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Gift, PlusCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { isToday, isFuture, differenceInDays, parse, isValid, getMonth } from 'date-fns';
import { AddRelativeDialog, type AddRelativeFormValues } from '@/components/add-relative-dialog';
import { Button } from './ui/button';
import { getClients, addRelative } from '@/lib/firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { useUser } from '@/firebase';

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
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isAddRelativeOpen, setAddRelativeOpen] = useState(false);
    const { toast } = useToast();
    const { user } = useUser();

    const fetchClients = useCallback(async () => {
        if (!user) return;
        setIsLoading(true);
        try {
            const clientsData = await getClients();
            setClients(clientsData);
        } catch (error) {
            console.error("Error fetching clients:", error);
            toast({ variant: "destructive", title: "Erro ao buscar clientes" });
        } finally {
            setIsLoading(false);
        }
    }, [toast, user]);
    
    useEffect(() => {
        if(user) {
            fetchClients();
        }
    }, [fetchClients, user]);

    const handleAddRelative = async (data: AddRelativeFormValues) => {
        try {
            await addRelative(data.client, data);
            toast({ title: 'Sucesso!', description: 'Novo parente adicionado.', className: 'bg-accent text-accent-foreground' });
            fetchClients();
        } catch (error) {
            console.error("Error adding relative:", error);
            // Error is handled globally
        }
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
            const tzoffset = (new Date()).getTimezoneOffset() * 60000;
            return new Date(date.getTime() + tzoffset);
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
                    } else if (getMonth(nextBirthday) === currentMonth) {
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

    if (isLoading) {
        return (
          <div className="flex justify-center items-center h-[calc(100vh-8rem)]">
            <Loader2 className="h-16 w-16 animate-spin" />
          </div>
        );
    }

    const getDaysUntilText = (days: number, status: string, nextBirthday: Date) => {
        if (status === 'today') {
            return "Hoje é o dia!";
        }
        if (status === 'week') {
            if (days === 1) {
                return "Falta 1 dia";
            }
            return `Faltam ${days} dias`;
        }
        if (status === 'month') {
            return "Aniversário este mês";
        }
        return ``;
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
                                            {getDaysUntilText(person.daysUntilBirthday, person.status, person.nextBirthday)}
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
