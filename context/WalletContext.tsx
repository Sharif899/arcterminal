'use client';
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { connectWallet, getAllBalances } from '@/lib/arc';

interface Balances { usdc: string; eurc: string; }
interface WalletContextType {
  address: string | null;
  balances: Balances | null;
  connecting: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
  refreshBalances: () => Promise<void>;
}

const WalletContext = createContext<WalletContextType | null>(null);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);
  const [balances, setBalances] = useState<Balances | null>(null);
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    // NEVER auto-reconnect — user must always click connect manually
    const eth = (window as any).ethereum;
    if (!eth) return;

    // Only listen for account changes if already connected in this session
    const handler = (accounts: string[]) => {
      if (accounts.length === 0) {
        setAddress(null);
        setBalances(null);
        localStorage.setItem('fluxa_disconnected', 'true');
      }
    };
    eth.on('accountsChanged', handler);
    return () => eth.removeListener('accountsChanged', handler);
  }, []);

  async function connect() {
    setConnecting(true);
    try {
      // This triggers the MetaMask popup every time
      localStorage.removeItem('fluxa_disconnected');
      const addr = await connectWallet();
      setAddress(addr);
      const bal = await getAllBalances(addr);
      setBalances(bal);
    } finally {
      setConnecting(false);
    }
  }

  function disconnect() {
    setAddress(null);
    setBalances(null);
    localStorage.setItem('fluxa_disconnected', 'true');
    // Clear any session data
    sessionStorage.removeItem('disconnected');
  }

  async function refreshBalances() {
    if (!address) return;
    const bal = await getAllBalances(address);
    setBalances(bal);
  }

  return (
    <WalletContext.Provider value={{ address, balances, connecting, connect, disconnect, refreshBalances }}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error('useWallet must be used inside WalletProvider');
  return ctx;
}