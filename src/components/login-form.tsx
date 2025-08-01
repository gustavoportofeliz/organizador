
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
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useState } from 'react';
import { Loader2 } from 'lucide-react';


export function LoginForm() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();


  function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setIsLoading(true);
    // Simulate a successful login and redirect
    setTimeout(() => {
        router.push('/');
    }, 500)
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Acesso ao Sistema</CardTitle>
        <CardDescription>O acesso agora é direto. Clique para entrar.</CardDescription>
      </CardHeader>
        <form onSubmit={onSubmit}>
          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full" disabled={isLoading}>
               {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Entrar
            </Button>
          </CardFooter>
        </form>
    </Card>
  );
}
