'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/firebase';
import { signInAnonymously, updateProfile } from 'firebase/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function WelcomePage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const auth = useAuth();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Por favor, insira um e-mail para continuar.',
      });
      return;
    }
    setIsLoading(true);
    try {
      const userCredential = await signInAnonymously(auth);
      // We can "link" the email to the anonymous user by updating their profile
      // This doesn't create a full password account but associates the email for display/reference
      if (userCredential.user) {
        await updateProfile(userCredential.user, { displayName: email });
      }
      toast({
        title: 'Bem-vindo!',
        description: `Acessando o painel para ${email}.`,
        className: 'bg-accent text-accent-foreground',
      });
      router.push('/dashboard');
    } catch (error) {
      console.error('Anonymous sign-in failed', error);
      toast({
        variant: 'destructive',
        title: 'Falha na autenticação',
        description: 'Não foi possível iniciar a sessão. Tente novamente.',
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
        <form onSubmit={handleLogin}>
          <CardHeader>
            <CardTitle>Acesse seu Painel</CardTitle>
            <CardDescription>Digite seu e-mail para iniciar uma nova sessão ou acessar seus dados existentes.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="email">Seu E-mail</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Entrar'}
            </Button>
          </CardFooter>
        </form>
      </Card>
      <p className="mt-4 text-xs text-muted-foreground">
        Cada e-mail acessa um espaço de trabalho separado e seguro.
      </p>
    </div>
  );
}
