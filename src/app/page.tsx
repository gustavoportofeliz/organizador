'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/firebase';
import { signInAnonymously } from 'firebase/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Loader2, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function WelcomePage() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const auth = useAuth();
  const { toast } = useToast();

  const handleEnter = async () => {
    setIsLoading(true);
    try {
      if (!auth) {
        throw new Error("Serviço de autenticação não está pronto.");
      }
      await signInAnonymously(auth);
      toast({
        title: 'Bem-vindo!',
        description: 'Acessando o painel de clientes.',
        className: 'bg-accent text-accent-foreground',
      });
      router.push('/dashboard');
    } catch (error) {
      console.error('Falha ao entrar:', error);
      toast({
        variant: 'destructive',
        title: 'Falha no acesso',
        description: 'Não foi possível iniciar a sessão. Por favor, tente novamente.',
      });
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
      <div className="flex items-center gap-3 mb-6">
        <Users className="h-10 w-10 text-primary" />
        <h1 className="text-3xl font-bold text-foreground">Organizador de Clientes</h1>
      </div>
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader>
          <CardTitle>Bem-vindo ao seu Painel</CardTitle>
          <CardDescription>Clique no botão abaixo para começar a gerenciar seus clientes.</CardDescription>
        </CardHeader>
        <CardContent>
            <p className="text-center text-muted-foreground">Acesse sua área de trabalho para organizar suas vendas e clientes.</p>
        </CardContent>
        <CardFooter>
          <Button onClick={handleEnter} className="w-full" disabled={isLoading}>
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Entrar no Painel'}
          </Button>
        </CardFooter>
      </Card>
      <p className="mt-4 text-xs text-muted-foreground">
        Cada sessão no seu navegador é um espaço de trabalho separado e seguro.
      </p>
    </div>
  );
}
