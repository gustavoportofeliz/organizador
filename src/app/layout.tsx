
import type { Metadata } from 'next';
import './globals.css';
import { MainLayout } from '@/components/main-layout';
import { AuthProvider } from '@/lib/firebase/auth'; // Import AuthProvider

export const metadata: Metadata = {
  title: 'Organizador de Clientes',
  description: 'Gerencie seus clientes e finanças com facilidade.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Check if the current route is login or signup
  // This is a workaround to conditionally apply MainLayout
  // A better approach in a real app might involve route groups
  return (
    <html lang="en" suppressHydrationWarning>
       <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=PT+Sans:wght@400;700&display=swap" rel="stylesheet" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </head>
      <body className="font-body antialiased">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
