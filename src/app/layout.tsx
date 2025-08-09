
import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster"; // Import Toaster

export const metadata: Metadata = {
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
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if (window.ethereum) {
                delete window.ethereum;
              }
            `,
          }}
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=PT+Sans:wght@400;700&display=swap" rel="stylesheet" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </head>
      <body className="font-body antialiased">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
