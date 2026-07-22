import type { Metadata } from 'next';
import './globals.css';
import Nav from '@/components/Nav';
import { WalletProvider } from '@/context/WalletContext';

export const metadata: Metadata = {
  title: 'Fluxa — Autonomous Stablecoin Agent',
  description: 'AI-powered autonomous agent that sends, swaps, and bridges USDC on Arc Network based on real market signals. Built for the Agentic Economy.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />

        {/* PWA */}
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#2563eb" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Fluxa" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body>
        <WalletProvider>
          <Nav />
          <main style={{ position: 'relative', zIndex: 1 }}>
            {children}
          </main>
        </WalletProvider>
      </body>
    </html>
  );
}