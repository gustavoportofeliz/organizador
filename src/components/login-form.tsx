
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
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';


export function LoginForm() {
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
        await signInWithEmailAndPassword(auth, email, password);
        toast({ title: 'Sucesso!', description: 'Login realizado com sucesso.', className: 'bg-accent text-accent-foreground' });
        router.push('/');
    } catch (e: any) {
        let errorMessage = "Ocorreu um erro ao tentar fazer login.";
        switch (e.code) {
          case 'auth/user-not-found':
            errorMessage = 'Nenhum usuário encontrado com este e-mail.';
            break;
          case 'auth/wrong-password':
            errorMessage = 'Senha incorreta. Por favor, tente novamente.';
            break;
          case 'auth/invalid-email':
            errorMessage = 'O formato do e-mail é inválido.';
            break;
          case 'auth/invalid-credential':
             errorMessage = 'Credenciais inválidas. Verifique seu e-mail e senha.';
             break;
          default:
            console.error(e);
            break;
        }
        setError(errorMessage);
    } finally {
        setIsLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Acesso ao Sistema</CardTitle>
        <CardDescription>Insira seu e-mail e senha para acessar sua conta.</CardDescription>
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
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              {error && <p className="text-sm font-medium text-destructive">{error}</p>}
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full" disabled={isLoading}>
               {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Entrar
            </Button>
            <CardDescription>
                Não tem uma conta?{' '}
                <Link href="/signup" className="underline text-primary">
                    Cadastre-se
                </Link>
            </CardDescription>
          </CardFooter>
        </form>
    </Card>
  );
}
