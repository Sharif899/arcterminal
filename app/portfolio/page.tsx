'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useWallet } from '@/context/WalletContext';
import { getTxHistory, type TxRecord } from '@/lib/supabase';

export default function PortfolioPage() {
  const { address, balances, connecting, connect } = useWallet();
  const [history, setHistory] = useState<TxRecord[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (address) loadData(address);
  }, [address]);

  async function loadData(addr: string) {
    setLoading(true);
    try {
      const hist = await getTxHistory(addr, 20);
      setHistory(hist);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  const usdc = parseFloat(balances?.usdc || '0');
  const eurc = parseFloat(balances?.eurc || '0');
  const total = usdc + eurc * 1.09;
  const usdcPct = total > 0 ? Math.round((usdc / total) * 100) : 50;
  const eurcPct = 100 - usdcPct;
  const txVolume = history.reduce((s, t) => s + parseFloat(t.amount || '0'), 0);
  const sends = history.filter(t => t.type === 'send').length;
  const swaps = history.filter(t => t.type === 'swap').length;
  const bridges = history.filter(t => t.type === 'bridge').length;

  function short(addr: string) { return addr ? addr.slice(0, 8) + '…' + addr.slice(-6) : '—'; }
  function timeAgo(ts: string) {
    const diff = Math.floor((Date.now() - new Date(ts).getTime()) / 1000);
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  }

  if (!address) return (
    <div style={{ padding: '80px 24px', textAlign: 'center' }}>
      <div style={{ fontSize: 48, marginBottom: 20 }}>📊</div>
      <div style={{ fontSize: 16, color: '#0f1117', fontWeight: 700, marginBottom: 8 }}>Connect wallet to view Agent Wallet</div>
      <div style={{ fontSize: 13, color: '#5a6478', marginBottom: 32 }}>
        See your USDC & EURC balances, allocation, and agent action history
      </div>
      <button className="btn btn-primary" onClick={connect} disabled={connecting} style={{ fontSize: 13 }}>
        {connecting ? <><span className="spinner" /> CONNECTING…</> : '🦊 CONNECT METAMASK'}
      </button>
    </div>
  );

  return (
    <>
      <style>{`
        .portfolio-balance-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 20px; }
        .portfolio-mid-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }
        .portfolio-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; flex-wrap: wrap; gap: 12px; }
        .tx-row { display: flex; align-items: center; gap: 14px; padding: 12px 18px; }
        .tx-chain { display: block; }
        @media (max-width: 1024px) { .portfolio-balance-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 640px) {
          .portfolio-balance-grid { grid-template-columns: repeat(2, 1fr); gap: 10px; }
          .portfolio-mid-grid { grid-template-columns: 1fr; }
          .portfolio-wrap { padding: 20px 16px 60px !important; }
          .portfolio-header { flex-direction: column; align-items: flex-start; }
          .balance-card-value { font-size: 18px !important; }
          .tx-row { padding: 10px 14px; gap: 10px; }
          .tx-chain { display: none; }
        }
      `}</style>

      <div className="portfolio-wrap" style={{ padding: '32px 24px', maxWidth: 1200, margin: '0 auto' }}>
        <div className="portfolio-header">
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 4 }}>Agent Wallet</h1>
            <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 12, color: '#16a34a' }}>{short(address)}</div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-ghost" onClick={() => loadData(address)} style={{ fontSize: 11 }}>↻ REFRESH</button>
            <Link href="/terminal" className="btn btn-primary" style={{ fontSize: 11 }}>ACT →</Link>
          </div>
        </div>

        <div className="portfolio-balance-grid">
          {[
            { label: 'TOTAL VALUE', value: `$${total.toFixed(2)}`, sub: 'USD equivalent', color: '#0f1117', icon: '💼' },
            { label: 'USDC', value: `$${balances?.usdc || '0.00'}`, sub: `${usdcPct}% of wallet`, color: '#16a34a', icon: '💵' },
            { label: 'EURC', value: `€${balances?.eurc || '0.00'}`, sub: `${eurcPct}% of wallet`, color: '#2563eb', icon: '💶' },
            { label: 'TX VOLUME', value: `$${txVolume.toFixed(2)}`, sub: `${history.length} agent actions`, color: '#7c3aed', icon: '📊' },
          ].map((card) => (
            <div key={card.label} className="panel" style={{ padding: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                <span style={{ fontSize: 10, color: '#9199aa', letterSpacing: '0.12em', fontWeight: 600 }}>{card.label}</span>
                <span style={{ fontSize: 18 }}>{card.icon}</span>
              </div>
              <div className="balance-card-value" style={{ fontFamily: 'Space Mono, monospace', fontWeight: 700, fontSize: 24, color: card.color, marginBottom: 4 }}>
                {loading ? <div className="skeleton" style={{ height: 24, width: 80 }} /> : card.value}
              </div>
              <div style={{ fontSize: 11, color: '#9199aa' }}>{card.sub}</div>
            </div>
          ))}
        </div>

        <div className="portfolio-mid-grid">
          <div className="panel">
            <div className="panel-header"><div className="panel-title">ALLOCATION</div></div>
            <div style={{ padding: 20 }}>
              <div style={{ display: 'flex', height: 10, borderRadius: 6, overflow: 'hidden', marginBottom: 16, gap: 2 }}>
                <div style={{ flex: usdcPct, background: 'linear-gradient(90deg, #16a34a, #22c55e)', borderRadius: '6px 0 0 6px' }} />
                <div style={{ flex: eurcPct, background: 'linear-gradient(90deg, #2563eb, #60a5fa)', borderRadius: '0 6px 6px 0' }} />
              </div>
              {[
                { label: 'USDC', pct: usdcPct, value: balances?.usdc || '0.00', color: '#16a34a' },
                { label: 'EURC', pct: eurcPct, value: balances?.eurc || '0.00', color: '#2563eb' },
              ].map(item => (
                <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 10, height: 10, borderRadius: 3, background: item.color }} />
                    <span style={{ fontFamily: 'Space Mono, monospace', fontSize: 12, fontWeight: 700, color: item.color }}>{item.label}</span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 13, fontWeight: 700, color: item.color }}>${item.value}</div>
                    <div style={{ fontSize: 11, color: '#9199aa' }}>{item.pct}%</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="panel">
            <div className="panel-header"><div className="panel-title">AGENT ACTIVITY</div></div>
            <div style={{ padding: 20 }}>
              {[
                { label: 'SENDS', count: sends, color: '#16a34a', icon: '⚡' },
                { label: 'SWAPS', count: swaps, color: '#2563eb', icon: '🔄' },
                { label: 'BRIDGES', count: bridges, color: '#d97706', icon: '🌉' },
                { label: 'TOTAL', count: history.length, color: '#7c3aed', icon: '📊' },
              ].map(item => (
                <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #f1f3f7' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 16 }}>{item.icon}</span>
                    <span style={{ fontSize: 12, color: '#5a6478', fontWeight: 500 }}>{item.label}</span>
                  </div>
                  <span style={{ fontFamily: 'Space Mono, monospace', fontWeight: 700, fontSize: 18, color: item.color }}>{item.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="panel">
          <div className="panel-header">
            <div className="panel-title">RECENT AGENT ACTIONS</div>
            <Link href="/history" style={{ fontSize: 12, color: '#2563eb', textDecoration: 'none', fontWeight: 600 }}>VIEW ALL →</Link>
          </div>
          {loading ? (
            <div style={{ padding: 24 }}>
              {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 40, marginBottom: 8 }} />)}
            </div>
          ) : history.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', fontSize: 13, color: '#9199aa' }}>
              No agent actions yet — <Link href="/terminal" style={{ color: '#2563eb', fontWeight: 600 }}>run one now</Link>
            </div>
          ) : history.slice(0, 8).map((tx, i) => {
            const typeColor = tx.type === 'send' ? '#16a34a' : tx.type === 'swap' ? '#2563eb' : '#d97706';
            return (
              <div key={tx.id} className="tx-row"
                style={{ borderBottom: i < 7 ? '1px solid #f1f3f7' : 'none' }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = '#f8f9fb'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = 'transparent'; }}>
                <span className="badge" style={{ background: `${typeColor}15`, color: typeColor, border: `1px solid ${typeColor}30`, minWidth: 56, justifyContent: 'center', flexShrink: 0 }}>
                  {tx.type.toUpperCase()}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 12, color: '#0f1117', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {tx.amount} {tx.token_in}{tx.token_out !== tx.token_in ? ` → ${tx.token_out}` : ''}
                  </div>
                  <div className="tx-chain" style={{ fontSize: 11, color: '#9199aa', marginTop: 2 }}>
                    {tx.from_chain}{tx.to_chain !== tx.from_chain ? ` → ${tx.to_chain}` : ''}
                  </div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: 11, color: '#9199aa' }}>{timeAgo(tx.created_at)}</div>
                  <a href={tx.explorer_url} target="_blank" rel="noopener noreferrer"
                    style={{ fontFamily: 'Space Mono, monospace', fontSize: 11, color: '#2563eb', fontWeight: 600 }}>
                    ↗ {tx.tx_hash.slice(0, 10)}…
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}