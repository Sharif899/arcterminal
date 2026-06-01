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
    { label: 'BLOCK', value: stats ? `#${stats.blockNumber.toLocaleString()}` : '—', color: '#00ff88' },
    { label: 'GAS', value: stats ? `$${stats.gasPrice} USDC` : '—', color: '#00aaff' },
    { label: 'FINALITY', value: '~0.5s', color: '#00ff88' },
    { label: 'CHAIN', value: '5042002 · ARC TESTNET', color: '#ffaa00' },
    { label: 'USDC', value: '≈ $1.00', color: '#00ff88' },
    { label: 'EURC', value: '≈ $1.09', color: '#00aaff' },
    { label: 'EVM', value: 'COMPATIBLE', color: '#aa55ff' },
    { label: 'STATUS', value: '● LIVE', color: '#00ff88' },
  ];

  const repeated = [...items, ...items]; // duplicate for seamless scroll

  return (
    <div style={{
      height: 28,
      borderBottom: '1px solid rgba(0,255,136,0.08)',
      background: 'rgba(0,255,136,0.03)',
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
            <span style={{ color: 'rgba(232,240,232,0.3)', fontSize: 10, letterSpacing: '0.1em' }}>{item.label}</span>
            <span style={{ fontWeight: 700, fontSize: 11 }}>{item.value}</span>
            <span style={{ color: 'rgba(232,240,232,0.15)', marginLeft: 10 }}>|</span>
          </div>
        ))}
      </div>

      {/* Right: clock */}
      <div style={{
        position: 'absolute', right: 0,
        background: 'linear-gradient(to left, #040608 60%, transparent)',
        paddingLeft: 40, paddingRight: 16,
        fontFamily: 'Space Mono, monospace',
        fontSize: 10, color: 'rgba(232,240,232,0.3)',
        letterSpacing: '0.08em',
      }}>
        {time}
      </div>
    </div>
  );
}
