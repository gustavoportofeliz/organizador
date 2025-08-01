
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
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export function SignupForm() {
  const router = useRouter();

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Acesso ao Sistema</CardTitle>
        <CardDescription>O sistema não requer mais cadastro. Você pode acessar diretamente.</CardDescription>
      </CardHeader>
      <CardFooter>
            <Button onClick={() => router.push('/')} className="w-full">
              Ir para a página inicial
            </Button>
      </CardFooter>
    </Card>
  );
}
