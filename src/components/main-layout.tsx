'use client';

import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { Users, Calendar, Archive, DollarSign, PanelLeft, Home, HelpCircle, FileText, ClipboardList, Loader2, LogOut } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from '@/components/ui/button';
import { useAuth, useUser } from '@/firebase';
import { useEffect, useState } from 'react';
import { signInAnonymously } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';

export function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const auth = useAuth();
  const { user, isUserLoading } = useUser();
  const [isClient, setIsClient] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (isClient && !isUserLoading && !user && auth) {
      signInAnonymously(auth).catch((error) => {
        console.error('Falha na autenticação anônima:', error);
        toast({
            variant: 'destructive',
            title: 'Falha na autenticação',
            description: 'Não foi possível iniciar uma sessão segura. Por favor, recarregue a página.',
        });
      });
    }
  }, [user, isUserLoading, isClient, auth, toast]);

  if (isUserLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-16 w-16 animate-spin" />
      </div>
    )
  }

  const navLinks = [
      { href: "/dashboard", icon: Home, label: "Clientes" },
      { href: "/aniversarios", icon: Calendar, label: "Aniversários" },
      { href: "/estoque", icon: Archive, label: "Estoque" },
      { href: "/faturamento", icon: DollarSign, label: "Faturamento" },
      { href: "/dividas", icon: FileText, label: "Dívidas" },
      { href: "/pedidos", icon: ClipboardList, label: "Pedidos" },
      { href: "/ajuda", icon: HelpCircle, label: "Ajuda" },
  ];

  return (
    <>
      <div className="flex flex-col min-h-screen">
        <header className="sticky top-0 z-10 flex items-center justify-between w-full h-16 px-4 border-b shrink-0 bg-background md:px-6">
          <Link href="/dashboard" className="flex items-center gap-2 font-bold">
             <Users className="w-6 h-6" />
             <span className="text-lg">Organizador</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="items-center hidden gap-6 text-lg font-medium md:flex md:gap-5 md:text-sm lg:gap-6">
             {navLinks.map(link => (
                <Link key={link.href} href={link.href} className={`flex items-center gap-2 transition-colors ${pathname === link.href ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
                  <link.icon className="h-5 w-5" />
                  <span>{link.label}</span>
              </Link>
             ))}
          </nav>

          {/* Mobile Navigation */}
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="shrink-0 md:hidden"
              >
                <PanelLeft className="h-5 w-5" />
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left">
               <SheetHeader>
                <SheetTitle className="sr-only">Menu Principal</SheetTitle>
              </SheetHeader>
              <nav className="grid gap-6 text-lg font-medium">
                <Link href="/dashboard" className="flex items-center gap-2 text-lg font-semibold mb-4">
                     <Users className="w-6 h-6" />
                     <span className="sr-only">Organizador</span>
                </Link>
                 {navLinks.map(link => (
                    <Link key={link.href} href={link.href} className={`flex items-center gap-4 px-2.5 ${pathname === link.href ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
                        <link.icon className="h-5 w-5" />
                        {link.label}
                    </Link>
                 ))}
              </nav>
            </SheetContent>
          </Sheet>

        </header>

        <main className="flex-1">
          {children}
        </main>
      </div>
    </>
  );
}
