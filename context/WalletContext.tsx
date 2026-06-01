'use client';
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { connectWallet, getConnectedAddress, getAllBalances } from '@/lib/arc';

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
    const isDisconnected = typeof window !== 'undefined' && sessionStorage.getItem('disconnected') === 'true';
    if (isDisconnected) return;
    getConnectedAddress().then(async (addr) => {
      if (addr) {
        setAddress(addr);
        const bal = await getAllBalances(addr);
        setBalances(bal);
      }
    });
    const eth = (window as any).ethereum;
    if (!eth) return;
    const handler = (accounts: string[]) => {
      if (accounts.length === 0) { setAddress(null); setBalances(null); }
      else {
        setAddress(accounts[0]);
        sessionStorage.removeItem('disconnected');
        getAllBalances(accounts[0]).then(setBalances);
      }
    };
    eth.on('accountsChanged', handler);
    return () => eth.removeListener('accountsChanged', handler);
  }, []);

  async function connect() {
    setConnecting(true);
    try {
      sessionStorage.removeItem('disconnected');
      const addr = await connectWallet();
      setAddress(addr);
      const bal = await getAllBalances(addr);
      setBalances(bal);
    } finally { setConnecting(false); }
  }

  function disconnect() {
    setAddress(null);
    setBalances(null);
    sessionStorage.setItem('disconnected', 'true');
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