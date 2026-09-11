import type { Metadata } from 'next';
import './globals.css';
import Providers from './providers';

export const metadata: Metadata = {
  title: 'Inpainting Monitoring Dashboard',
  description: 'Enterprise-grade inpainting monitoring pipeline and asset dashboard.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased bg-background text-foreground selection:bg-blue-600/30 selection:text-blue-200">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
