
'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useAuth } from '@/firebase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useState } from 'react';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function SignupForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const auth = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
        await createUserWithEmailAndPassword(auth, email, password);
        toast({ title: 'Sucesso!', description: 'Sua conta foi criada.', className: 'bg-accent text-accent-foreground' });
        router.push('/');
    } catch (e: any) {
        let errorMessage = "Ocorreu um erro ao criar a conta.";
        switch (e.code) {
          case 'auth/email-already-in-use':
            errorMessage = 'Este e-mail já está em uso por outra conta.';
            break;
          case 'auth/invalid-email':
            errorMessage = 'O formato do e-mail é inválido.';
            break;
          case 'auth/weak-password':
            errorMessage = 'A senha é muito fraca. Ela deve ter pelo menos 6 caracteres.';
            break;
          default:
            console.error(e);
        }
        setError(errorMessage);
    } finally {
        setIsLoading(false);
    }
  }


  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Criar Nova Conta</CardTitle>
        <CardDescription>Insira seu e-mail e crie uma senha para começar a usar.</CardDescription>
      </CardHeader>
      <form onSubmit={onSubmit}>
        <CardContent className="space-y-4">
            <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <Input 
                id="email" 
                type="email" 
                placeholder="seu@email.com" 
                required 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
            />
            </div>
            <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
            <Input 
                id="password" 
                type="password" 
                required 
                placeholder="Mínimo de 6 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
            />
            </div>
             {error && <p className="text-sm font-medium text-destructive">{error}</p>}
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Criar Conta
            </Button>
            <CardDescription>
                Já tem uma conta?{' '}
                <Link href="/login" className="underline text-primary">
                    Faça login
                </Link>
            </CardDescription>
        </CardFooter>
      </form>
    </Card>
  );
}
