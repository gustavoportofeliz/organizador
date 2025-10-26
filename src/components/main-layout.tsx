'use client';

import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { Users, Calendar, Archive, DollarSign, PanelLeft, Home, HelpCircle, FileText, ClipboardList, LogOut, Loader2 } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from '@/components/ui/button';
import { useAuth, useUser } from '@/firebase';
import { useEffect, useState } from 'react';
import { signOut } from 'firebase/auth';

export function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const router = useRouter();
  const pathname = usePathname();
  const auth = useAuth();
  const { user, isUserLoading } = useUser();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (isClient && !isUserLoading && !user) {
      router.push('/');
    }
  }, [user, isUserLoading, router, isClient]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

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
             <Button variant="ghost" size="sm" onClick={handleLogout} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
                  <LogOut className="h-5 w-5" />
                  <span>Sair</span>
                </Button>
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
                <Button variant="ghost" onClick={handleLogout} className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground justify-start mt-auto">
                  <LogOut className="h-5 w-5" />
                  Sair
                </Button>
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
