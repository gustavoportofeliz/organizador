'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Users, Calendar, Archive, DollarSign, PanelLeft, Home, HelpCircle, FileText } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from '@/components/ui/button';

export function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const router = useRouter();

  return (
    <>
      <div className="flex flex-col min-h-screen">
        <header className="sticky top-0 z-10 flex items-center justify-between w-full h-16 px-4 border-b shrink-0 bg-background md:px-6">
          <Link href="/" className="flex items-center gap-2 font-bold">
             <Users className="w-6 h-6" />
             <span className="text-lg">Organizador</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="items-center hidden gap-6 text-lg font-medium md:flex md:gap-5 md:text-sm lg:gap-6">
             <Link href="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
                  <Home />
                  <span>Clientes</span>
              </Link>
              <Link href="/aniversarios" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
                  <Calendar />
                  <span>Aniversários</span>
              </Link>
              <Link href="/estoque" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
                  <Archive />
                  <span>Estoque</span>
              </Link>
               <Link href="/faturamento" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
                  <DollarSign />
                  <span>Faturamento</span>
               </Link>
                <Link href="/dividas" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
                    <FileText />
                    <span>Dívidas</span>
                </Link>
                <Link href="/ajuda" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
                  <HelpCircle />
                  <span>Ajuda</span>
                </Link>
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
              <nav className="grid gap-6 text-lg font-medium">
                <Link href="/" className="flex items-center gap-2 text-lg font-semibold">
                     <Users className="w-6 h-6" />
                     <span className="sr-only">Organizador</span>
                </Link>
                <Link href="/" className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground">
                    <Home className="h-5 w-5" />
                    Clientes
                </Link>
                <Link href="/aniversarios" className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground">
                    <Calendar className="h-5 w-5" />
                    Aniversários
                </Link>
                <Link href="/estoque" className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground">
                    <Archive className="h-5 w-5" />
                    Estoque
                </Link>
                <Link href="/faturamento" className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground">
                    <DollarSign className="h-5 w-5" />
                    Faturamento
                </Link>
                <Link href="/dividas" className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground">
                    <FileText className="h-5 w-5" />
                    Dívidas
                </Link>
                <Link href="/ajuda" className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground">
                    <HelpCircle className="h-5 w-5" />
                    Ajuda
                </Link>
              </nav>
            </SheetContent>
          </Sheet>

        </header>

        <main className="flex-1 p-4 sm:p-6 md:p-8">
          {children}
        </main>
      </div>
    </>
  );
}
