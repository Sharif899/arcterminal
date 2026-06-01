'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { connectWallet, getConnectedAddress, getAllBalances, EXPLORER } from '@/lib/arc';
import { getTxHistory, type TxRecord } from '@/lib/supabase';

export default function PortfolioPage() {
  const [wallet, setWallet] = useState('');
  const [balances, setBalances] = useState({ usdc: '0.00', eurc: '0.00' });
  const [history, setHistory] = useState<TxRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    getConnectedAddress().then(async (addr) => {
      if (addr) { setWallet(addr); await loadData(addr); }
    });
  }, []);

  async function loadData(addr: string) {
    setLoading(true);
    try {
      const [bal, hist] = await Promise.all([getAllBalances(addr), getTxHistory(addr, 20)]);
      setBalances(bal);
      setHistory(hist);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  async function connect() {
    setConnecting(true);
    try {
      const addr = await connectWallet();
      setWallet(addr);
      await loadData(addr);
    } catch (e) { console.error(e); }
    finally { setConnecting(false); }
  }

  const usdc = parseFloat(balances.usdc);
  const eurc = parseFloat(balances.eurc);
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

  if (!wallet) return (
    <div style={{ padding: '80px 24px', textAlign: 'center' }}>
      <div style={{ fontSize: 48, marginBottom: 20 }}>📊</div>
      <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 16, color: 'rgba(232,240,232,0.5)', marginBottom: 8 }}>
        CONNECT WALLET TO VIEW PORTFOLIO
      </div>
      <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 11, color: 'rgba(232,240,232,0.3)', marginBottom: 32 }}>
        See your USDC & EURC balances, allocation, and transaction history
      </div>
      <button className="btn btn-green" onClick={connect} disabled={connecting} style={{ fontSize: 13 }}>
        {connecting ? <><span className="spinner" /> CONNECTING…</> : '🦊 CONNECT METAMASK'}
      </button>
    </div>
  );

  return (
    <>
      <style>{`
        .portfolio-balance-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
          margin-bottom: 20px;
        }
        .portfolio-mid-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin-bottom: 20px;
        }
        .portfolio-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
          flex-wrap: wrap;
          gap: 12px;
        }
        .portfolio-header-actions {
          display: flex;
          gap: 10px;
        }
        .tx-row {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 12px 18px;
        }
        .tx-chain {
          display: block;
        }

        @media (max-width: 1024px) {
          .portfolio-balance-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 640px) {
          .portfolio-balance-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 10px;
          }
          .portfolio-mid-grid {
            grid-template-columns: 1fr;
          }
          .portfolio-wrap {
            padding: 20px 16px 60px !important;
          }
          .portfolio-header {
            flex-direction: column;
            align-items: flex-start;
          }
          .balance-card-value {
            font-size: 18px !important;
          }
          .tx-row {
            padding: 10px 14px;
            gap: 10px;
          }
          .tx-chain {
            display: none;
          }
        }

        @media (max-width: 400px) {
          .portfolio-balance-grid {
            grid-template-columns: 1fr 1fr;
          }
          .balance-card-value {
            font-size: 15px !important;
          }
        }
      `}</style>

      <div className="portfolio-wrap" style={{ padding: '32px 24px', maxWidth: 1200, margin: '0 auto' }}>

        {/* Header */}
        <div className="portfolio-header">
          <div>
            <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 10, color: 'rgba(232,240,232,0.3)', letterSpacing: '0.15em', marginBottom: 4 }}>PORTFOLIO</div>
            <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 13, color: '#00ff88' }}>{short(wallet)}</div>
          </div>
          <div className="portfolio-header-actions">
            <button className="btn btn-ghost" onClick={() => loadData(wallet)} style={{ fontSize: 11 }}>↻ REFRESH</button>
            <Link href="/terminal" className="btn btn-green" style={{ fontSize: 11 }}>TRADE →</Link>
          </div>
        </div>

        {/* Balance cards */}
        <div className="portfolio-balance-grid">
          {[
            { label: 'TOTAL VALUE', value: `$${total.toFixed(2)}`, sub: 'USD equivalent', color: '#e8f0e8', icon: '💼' },
            { label: 'USDC', value: `$${balances.usdc}`, sub: `${usdcPct}% of portfolio`, color: '#00ff88', icon: '💵' },
            { label: 'EURC', value: `€${balances.eurc}`, sub: `${eurcPct}% of portfolio`, color: '#00aaff', icon: '💶' },
            { label: 'TX VOLUME', value: `$${txVolume.toFixed(2)}`, sub: `${history.length} transactions`, color: '#aa55ff', icon: '📊' },
          ].map((card, i) => (
            <div key={card.label} className={`panel animate-fade-up delay-${i + 1}`} style={{ padding: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                <span style={{ fontFamily: 'Space Mono, monospace', fontSize: 9, color: 'rgba(232,240,232,0.3)', letterSpacing: '0.15em' }}>{card.label}</span>
                <span style={{ fontSize: 18 }}>{card.icon}</span>
              </div>
              <div className="balance-card-value" style={{ fontFamily: 'Space Mono, monospace', fontWeight: 700, fontSize: 24, color: card.color, marginBottom: 4 }}>
                {loading ? <div className="skeleton" style={{ height: 24, width: 80 }} /> : card.value}
              </div>
              <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 10, color: 'rgba(232,240,232,0.3)' }}>{card.sub}</div>
            </div>
          ))}
        </div>

        {/* Allocation + Activity */}
        <div className="portfolio-mid-grid">

          {/* Allocation bar */}
          <div className="panel animate-fade-up delay-2">
            <div className="panel-header"><div className="panel-title">ALLOCATION</div></div>
            <div style={{ padding: 20 }}>
              <div style={{ display: 'flex', height: 12, borderRadius: 6, overflow: 'hidden', marginBottom: 16, gap: 1 }}>
                <div style={{ flex: usdcPct, background: 'linear-gradient(90deg, #00ff88, #00cc66)', transition: 'flex 0.5s' }} />
                <div style={{ flex: eurcPct, background: 'linear-gradient(90deg, #0088cc, #00aaff)', transition: 'flex 0.5s' }} />
              </div>
              {[
                { label: 'USDC', pct: usdcPct, value: balances.usdc, color: '#00ff88' },
                { label: 'EURC', pct: eurcPct, value: balances.eurc, color: '#00aaff' },
              ].map(item => (
                <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 10, height: 10, borderRadius: 2, background: item.color }} />
                    <span style={{ fontFamily: 'Space Mono, monospace', fontSize: 12, fontWeight: 700, color: item.color }}>{item.label}</span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 13, fontWeight: 700, color: item.color }}>${item.value}</div>
                    <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 10, color: 'rgba(232,240,232,0.3)' }}>{item.pct}%</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Activity breakdown */}
          <div className="panel animate-fade-up delay-3">
            <div className="panel-header"><div className="panel-title">ACTIVITY</div></div>
            <div style={{ padding: 20 }}>
              {[
                { label: 'SENDS', count: sends, color: '#00ff88', icon: '⚡' },
                { label: 'SWAPS', count: swaps, color: '#00aaff', icon: '🔄' },
                { label: 'BRIDGES', count: bridges, color: '#ffaa00', icon: '🌉' },
                { label: 'TOTAL', count: history.length, color: '#aa55ff', icon: '📊' },
              ].map(item => (
                <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 16 }}>{item.icon}</span>
                    <span style={{ fontFamily: 'Space Mono, monospace', fontSize: 11, color: 'rgba(232,240,232,0.4)', letterSpacing: '0.1em' }}>{item.label}</span>
                  </div>
                  <span style={{ fontFamily: 'Space Mono, monospace', fontWeight: 700, fontSize: 18, color: item.color }}>{item.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent transactions */}
        <div className="panel animate-fade-up delay-4">
          <div className="panel-header">
            <div className="panel-title">RECENT TRANSACTIONS</div>
            <Link href="/history" style={{ fontFamily: 'Space Mono, monospace', fontSize: 10, color: '#00aaff', textDecoration: 'none' }}>VIEW ALL →</Link>
          </div>
          {loading ? (
            <div style={{ padding: 24 }}>
              {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 40, marginBottom: 8 }} />)}
            </div>
          ) : history.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', fontFamily: 'Space Mono, monospace', fontSize: 12, color: 'rgba(232,240,232,0.3)' }}>
              No transactions yet — <Link href="/terminal" style={{ color: '#00ff88' }}>go to terminal</Link>
            </div>
          ) : history.slice(0, 8).map((tx, i) => {
            const typeColor = tx.type === 'send' ? '#00ff88' : tx.type === 'swap' ? '#00aaff' : '#ffaa00';
            return (
              <div key={tx.id} className="tx-row" style={{ borderBottom: i < 7 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                <span className="badge" style={{ background: `${typeColor}15`, color: typeColor, border: `1px solid ${typeColor}30`, minWidth: 56, justifyContent: 'center', flexShrink: 0 }}>
                  {tx.type.toUpperCase()}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 12, color: 'rgba(232,240,232,0.6)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {tx.amount} {tx.token_in}{tx.token_out !== tx.token_in ? ` → ${tx.token_out}` : ''}
                  </div>
                  <div className="tx-chain" style={{ fontFamily: 'Space Mono, monospace', fontSize: 10, color: 'rgba(232,240,232,0.3)', marginTop: 2 }}>
                    {tx.from_chain}{tx.to_chain !== tx.from_chain ? ` → ${tx.to_chain}` : ''}
                  </div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 10, color: 'rgba(232,240,232,0.3)' }}>{timeAgo(tx.created_at)}</div>
                  <a href={tx.explorer_url} target="_blank" rel="noopener noreferrer" style={{ fontFamily: 'Space Mono, monospace', fontSize: 10, color: '#00aaff' }}>
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