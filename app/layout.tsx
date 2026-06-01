import type { Metadata } from 'next';
import './globals.css';
import Nav from '@/components/Nav';
import { WalletProvider } from '@/context/WalletContext';

export const metadata: Metadata = {
  title: 'Arc Terminal — DeFi Trading Dashboard',
  description: 'Send, Swap, Bridge USDC & EURC on Arc Network. Professional trading dashboard powered by Arc SDK.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
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