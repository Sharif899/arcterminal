'use client';
import { useEffect, useState } from 'react';
import { getNetworkStats } from '@/lib/arc';

interface Stats { blockNumber: number; gasPrice: string; txCount: number; timestamp: number; }

export default function NetworkTicker() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [time, setTime] = useState('');

  useEffect(() => {
    const loadStats = () => getNetworkStats().then(setStats).catch(() => {});
    loadStats();
    const si = setInterval(loadStats, 8000);
    const ti = setInterval(() => setTime(new Date().toUTCString().slice(17, 25) + ' UTC'), 1000);
    return () => { clearInterval(si); clearInterval(ti); };
  }, []);

  const items = [
    { label: 'BLOCK', value: stats ? `#${stats.blockNumber.toLocaleString()}` : '—', color: '#16a34a' },
    { label: 'GAS', value: stats ? `$${stats.gasPrice} USDC` : '—', color: '#2563eb' },
    { label: 'FINALITY', value: '~0.5s', color: '#16a34a' },
    { label: 'CHAIN', value: '5042002 · ARC TESTNET', color: '#d97706' },
    { label: 'USDC', value: '≈ $1.00', color: '#16a34a' },
    { label: 'EURC', value: '≈ $1.09', color: '#2563eb' },
    { label: 'EVM', value: 'COMPATIBLE', color: '#7c3aed' },
    { label: 'STATUS', value: '● LIVE', color: '#16a34a' },
  ];

  const repeated = [...items, ...items];

  return (
    <div style={{
      height: 28,
      borderBottom: '1px solid #e2e6ed',
      background: '#f8f9fb',
      overflow: 'hidden',
      display: 'flex',
      alignItems: 'center',
      position: 'relative',
    }}>
      {/* Scrolling ticker */}
      <div style={{
        display: 'flex',
        animation: 'ticker 40s linear infinite',
        whiteSpace: 'nowrap',
      }}>
        {repeated.map((item, i) => (
          <div key={i} className="ticker-item" style={{ color: item.color }}>
            <span style={{ color: '#9199aa', fontSize: 10, letterSpacing: '0.1em' }}>{item.label}</span>
            <span style={{ fontWeight: 700, fontSize: 11 }}>{item.value}</span>
            <span style={{ color: '#e2e6ed', marginLeft: 10 }}>|</span>
          </div>
        ))}
      </div>

      {/* Right: clock */}
      <div style={{
        position: 'absolute', right: 0,
        background: 'linear-gradient(to left, #f8f9fb 60%, transparent)',
        paddingLeft: 40, paddingRight: 16,
        fontFamily: 'Space Mono, monospace',
        fontSize: 10, color: '#9199aa',
        letterSpacing: '0.08em',
      }}>
        {time}
      </div>
    </div>
  );
}