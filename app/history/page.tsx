'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { connectWallet, getConnectedAddress } from '@/lib/arc';
import { getTxHistory, type TxRecord } from '@/lib/supabase';

export default function HistoryPage() {
  const [wallet, setWallet] = useState('');
  const [txs, setTxs] = useState<TxRecord[]>([]);
  const [filtered, setFiltered] = useState<TxRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'send' | 'swap' | 'bridge'>('all');
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    getConnectedAddress().then(async (addr) => {
      if (addr) { setWallet(addr); await load(addr); }
    });
  }, []);

  useEffect(() => {
    setFiltered(filter === 'all' ? txs : txs.filter(t => t.type === filter));
  }, [txs, filter]);

  async function load(addr: string) {
    setLoading(true);
    try {
      const data = await getTxHistory(addr, 100);
      setTxs(data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  async function connect() {
    setConnecting(true);
    try {
      const addr = await connectWallet();
      setWallet(addr);
      await load(addr);
    } catch (e) { console.error(e); }
    finally { setConnecting(false); }
  }

  function timeAgo(ts: string) {
    const diff = Math.floor((Date.now() - new Date(ts).getTime()) / 1000);
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return new Date(ts).toLocaleDateString();
  }

  const typeColor = (t: string) => ({ send: '#16a34a', swap: '#2563eb', bridge: '#d97706' }[t] || '#7c3aed');
  const totalVolume = filtered.reduce((s, t) => s + parseFloat(t.amount || '0'), 0);

  if (!wallet) return (
    <div className="wrap" style={{ padding: '80px 24px', textAlign: 'center' }}>
      <div style={{ fontSize: 48, marginBottom: 20 }}>📜</div>
      <div style={{ fontSize: 14, color: '#5a6478', marginBottom: 28 }}>
        Connect your wallet to view the agent action log
      </div>
      <button className="btn btn-primary" onClick={connect} disabled={connecting} style={{ fontSize: 13 }}>
        {connecting ? <><span className="spinner" /> CONNECTING…</> : '🦊 CONNECT METAMASK'}
      </button>
    </div>
  );

  return (
    <div className="wrap" style={{ padding: '32px 24px' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 4 }}>
            Agent Log
          </h1>
          <div style={{ fontSize: 12, color: '#9199aa', fontFamily: 'Space Mono, monospace' }}>
            {wallet.slice(0, 10)}…{wallet.slice(-8)} · {filtered.length} actions · ${totalVolume.toFixed(2)} USDC volume
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-ghost" onClick={() => load(wallet)} style={{ fontSize: 11 }}>↻ REFRESH</button>
          <Link href="/terminal" className="btn btn-primary" style={{ fontSize: 11 }}>NEW ACTION →</Link>
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'TOTAL', count: txs.length, vol: txs.reduce((s,t) => s+parseFloat(t.amount||'0'),0), color: '#7c3aed' },
          { label: 'SENDS', count: txs.filter(t=>t.type==='send').length, vol: txs.filter(t=>t.type==='send').reduce((s,t)=>s+parseFloat(t.amount||'0'),0), color: '#16a34a' },
          { label: 'SWAPS', count: txs.filter(t=>t.type==='swap').length, vol: txs.filter(t=>t.type==='swap').reduce((s,t)=>s+parseFloat(t.amount||'0'),0), color: '#2563eb' },
          { label: 'BRIDGES', count: txs.filter(t=>t.type==='bridge').length, vol: txs.filter(t=>t.type==='bridge').reduce((s,t)=>s+parseFloat(t.amount||'0'),0), color: '#d97706' },
        ].map(s => (
          <div key={s.label} className="panel" style={{ padding: '14px 16px' }}>
            <div style={{ fontSize: 9, color: '#9199aa', letterSpacing: '0.15em', marginBottom: 6, fontWeight: 600, textTransform: 'uppercase' }}>{s.label}</div>
            <div style={{ fontFamily: 'Space Mono, monospace', fontWeight: 700, fontSize: 22, color: s.color }}>{s.count}</div>
            <div style={{ fontSize: 11, color: '#9199aa', marginTop: 2 }}>${s.vol.toFixed(2)} vol</div>
          </div>
        ))}
      </div>

      {/* Filter tabs + table */}
      <div className="panel" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', borderBottom: '1px solid #e2e6ed' }}>
          {(['all', 'send', 'swap', 'bridge'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              style={{ flex: 1, padding: '12px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', color: filter === f ? typeColor(f) : '#9199aa', borderBottom: filter === f ? `2px solid ${typeColor(f)}` : '2px solid transparent', transition: 'all 0.15s' }}>
              {f.toUpperCase()} {f !== 'all' && `(${txs.filter(t=>t.type===f).length})`}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ padding: 24 }}>
            {[1,2,3,4,5].map(i => <div key={i} className="skeleton" style={{ height: 48, marginBottom: 8, borderRadius: 6 }} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center', fontSize: 13, color: '#9199aa' }}>
            No agent actions yet — <Link href="/terminal" style={{ color: '#2563eb', fontWeight: 600 }}>run one now</Link>
          </div>
        ) : (
          <div>
            {/* Table header */}
            <div style={{ display: 'grid', gridTemplateColumns: '90px 80px 120px 1fr 1fr 100px 140px', gap: 12, padding: '10px 18px', borderBottom: '1px solid #f1f3f7', background: '#f8f9fb' }}>
              {['TYPE','STATUS','AMOUNT','FROM','TO','CHAIN','TIME'].map(h => (
                <div key={h} style={{ fontSize: 10, color: '#9199aa', letterSpacing: '0.1em', fontWeight: 600 }}>{h}</div>
              ))}
            </div>

            {filtered.map((tx, i) => (
              <div key={tx.id}
                style={{ display: 'grid', gridTemplateColumns: '90px 80px 120px 1fr 1fr 100px 140px', gap: 12, padding: '13px 18px', borderBottom: i < filtered.length - 1 ? '1px solid #f1f3f7' : 'none', alignItems: 'center', transition: 'background 0.15s' }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = '#f8f9fb'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = 'transparent'; }}>

                <span className="badge" style={{ background: `${typeColor(tx.type)}15`, color: typeColor(tx.type), border: `1px solid ${typeColor(tx.type)}30`, justifyContent: 'center' }}>
                  {tx.type.toUpperCase()}
                </span>

                <span className="badge badge-green" style={{ justifyContent: 'center' }}>✓ OK</span>

                <div style={{ fontFamily: 'Space Mono, monospace', fontWeight: 700, fontSize: 12, color: typeColor(tx.type) }}>
                  {tx.amount} {tx.token_in}
                  {tx.token_out !== tx.token_in && <span style={{ color: '#9199aa' }}> → {tx.token_out}</span>}
                </div>

                <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 11, color: '#9199aa', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {tx.wallet.slice(0,8)}…{tx.wallet.slice(-4)}
                </div>

                <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 11, color: '#9199aa', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {tx.to_address.slice(0,8)}…{tx.to_address.slice(-4)}
                </div>

                <div style={{ fontSize: 11, color: '#9199aa' }}>
                  {tx.from_chain === tx.to_chain
                    ? tx.from_chain.replace('_Testnet','').replace('_Sepolia','')
                    : `${tx.from_chain.replace('_Testnet','').replace('_Sepolia','')}→${tx.to_chain.replace('_Testnet','').replace('_Sepolia','')}`}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 11, color: '#9199aa' }}>{timeAgo(tx.created_at)}</span>
                  <a href={tx.explorer_url} target="_blank" rel="noopener noreferrer"
                    style={{ fontSize: 12, color: '#2563eb', textDecoration: 'none', fontWeight: 600 }}>↗</a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}