import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import Link from 'next/link';
import { Users, Calendar, Archive, DollarSign } from 'lucide-react';

export const metadata = {
  title: 'Organizador de Clientes',
  description: 'Gerencie seus clientes e finanças com facilidade.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased">
          <div className="flex flex-col min-h-screen">
            <header className="sticky top-0 z-10 flex items-center justify-between w-full h-16 px-4 border-b shrink-0 bg-background md:px-6">
              <Link href="/" className="flex items-center gap-2 font-bold">
                 <Users className="w-6 h-6" />
                 <span className="text-lg">Organizador</span>
              </Link>

              <nav className="flex gap-6 text-lg font-medium md:gap-5 md:text-sm lg:gap-6">
                 <Link href="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
                      <Users />
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
              </nav>

            </header>

            <main className="flex-1 p-4 md:p-6 lg:p-8">
              {children}
            </main>
          </div>
        <Toaster />
      </body>
    </html>
  );
}
