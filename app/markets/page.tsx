'use client';
import { useEffect, useState } from 'react';
import { getNetworkStats } from '@/lib/arc';

interface Stats { blockNumber: number; gasPrice: string; txCount: number; timestamp: number; }
interface Block { number: number; timestamp: number; txCount: number; }

async function getRecentBlocks(count = 10): Promise<Block[]> {
  const rpc = 'https://rpc.testnet.arc.network';
  const latestRes = await fetch(rpc, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'eth_blockNumber', params: [] }),
  });
  const latestJson = await latestRes.json();
  const latest = parseInt(latestJson.result, 16);

  const blocks = await Promise.all(
    Array.from({ length: count }, (_, i) => latest - i).map(async (n) => {
      const res = await fetch(rpc, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'eth_getBlockByNumber', params: ['0x' + n.toString(16), false] }),
      });
      const json = await res.json();
      const b = json.result;
      return { number: n, timestamp: parseInt(b?.timestamp || '0', 16), txCount: b?.transactions?.length || 0 };
    })
  );
  return blocks;
}

const chains = [
  { chain: 'Arc Testnet', gas: '$0.000006', finality: '< 0.5s', color: '#00ff88', highlight: true, note: '✓ Arc gas paid in USDC — no volatile ETH needed for transactions' },
  { chain: 'Ethereum', gas: '~$2–30', finality: '~12s', color: 'rgba(232,240,232,0.4)', highlight: false, note: '✗ Ethereum gas paid in ETH — fees spike during congestion, unpredictable costs' },
  { chain: 'Base', gas: '~$0.01', finality: '~2s', color: 'rgba(232,240,232,0.4)', highlight: false, note: '✗ Base gas paid in ETH — cheaper than mainnet but still requires holding ETH' },
  { chain: 'Arbitrum', gas: '~$0.05', finality: '~1s', color: 'rgba(232,240,232,0.4)', highlight: false, note: '✗ Arbitrum gas paid in ETH — L2 scaling but ETH dependency remains' },
  { chain: 'Polygon', gas: '~$0.01', finality: '~2s', color: 'rgba(232,240,232,0.4)', highlight: false, note: '✗ Polygon gas paid in MATIC — separate token required just for fees' },
];

export default function MarketsPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [loading, setLoading] = useState(true);
  const [blockFlash, setBlockFlash] = useState(false);
  const [selectedChain, setSelectedChain] = useState(0);

  async function load() {
    try {
      const [s, b] = await Promise.all([getNetworkStats(), getRecentBlocks(12)]);
      setStats(prev => {
        if (prev && prev.blockNumber !== s.blockNumber) { setBlockFlash(true); setTimeout(() => setBlockFlash(false), 500); }
        return s;
      });
      setBlocks(b);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  useEffect(() => {
    load();
    const t = setInterval(load, 8000);
    return () => clearInterval(t);
  }, []);

  function timeAgo(ts: number) {
    if (!ts) return '—';
    const diff = Math.floor(Date.now() / 1000) - ts;
    if (diff < 5) return 'just now';
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    return `${Math.floor(diff / 3600)}h ago`;
  }

  const maxTx = Math.max(...blocks.map(b => b.txCount), 1);

  return (
    <>
      <style>{`
        .markets-metrics {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
          margin-bottom: 24px;
        }
        .markets-mid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin-bottom: 20px;
        }
        .markets-tokens {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          margin-top: 20px;
        }
        .chain-row {
          display: grid;
          grid-template-columns: 140px 90px 1fr;
          gap: 10px;
          padding: 10px 12px;
          border-radius: 6px;
          margin-bottom: 6px;
          align-items: center;
          cursor: pointer;
          transition: all 0.15s;
        }
        .blocks-table th, .blocks-table td {
          padding: 12px 18px;
          text-align: left;
        }
        .blocks-table th {
          font-family: 'Space Mono', monospace;
          font-size: 9px;
          color: rgba(232,240,232,0.25);
          letter-spacing: 0.12em;
          font-weight: 700;
        }

        @media (max-width: 1024px) {
          .markets-metrics {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 768px) {
          .markets-mid {
            grid-template-columns: 1fr;
          }
          .markets-tokens {
            grid-template-columns: 1fr;
          }
          .chain-row {
            grid-template-columns: 1fr 80px 70px;
            gap: 6px;
          }
          .blocks-table th, .blocks-table td {
            padding: 10px 12px;
          }
          .hide-mobile {
            display: none;
          }
        }

        @media (max-width: 480px) {
          .markets-metrics {
            grid-template-columns: repeat(2, 1fr);
            gap: 10px;
          }
          .markets-page-wrap {
            padding: 16px 12px 60px !important;
          }
          .metric-value {
            font-size: 16px !important;
          }
          .chain-row {
            grid-template-columns: 1fr 70px;
            gap: 6px;
          }
          .chain-finality {
            display: none;
          }
          .blocks-table th, .blocks-table td {
            padding: 8px 10px;
            font-size: 11px !important;
          }
          .block-bar {
            display: none;
          }
        }
      `}</style>

      <div className="markets-page-wrap wrap" style={{ padding: '32px 24px 60px' }}>

        <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 11, color: 'rgba(232,240,232,0.3)', letterSpacing: '0.2em', marginBottom: 24 }}>
          ── ARC NETWORK MARKETS ──
        </div>

        {/* Key metrics */}
        <div className="markets-metrics">
          {[
            { label: 'BLOCK HEIGHT', value: stats ? `#${stats.blockNumber.toLocaleString()}` : '—', color: '#00ff88', flash: blockFlash, icon: '⬡' },
            { label: 'GAS PRICE (USDC)', value: stats ? `$${stats.gasPrice}` : '—', color: '#00aaff', flash: false, icon: '⛽' },
            { label: 'FINALITY', value: '< 0.5s', color: '#aa55ff', flash: false, icon: '⚡' },
            { label: 'CONSENSUS', value: 'Malachite BFT', color: '#ffaa00', flash: false, icon: '🔒' },
          ].map((m, i) => (
            <div key={m.label} className={`panel animate-fade-up delay-${i + 1}`} style={{ padding: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
                <span style={{ fontFamily: 'Space Mono, monospace', fontSize: 9, color: 'rgba(232,240,232,0.3)', letterSpacing: '0.15em' }}>{m.label}</span>
                <span style={{ fontSize: 18 }}>{m.icon}</span>
              </div>
              <div className="metric-value" style={{ fontFamily: 'Space Mono, monospace', fontWeight: 700, fontSize: 22, color: m.color, transition: 'all 0.3s', textShadow: m.flash ? `0 0 16px ${m.color}` : 'none', wordBreak: 'break-all' }}>
                {loading ? <div className="skeleton" style={{ height: 22, width: 100 }} /> : m.value}
              </div>
            </div>
          ))}
        </div>

        {/* Block activity + Chain comparison */}
        <div className="markets-mid">

          {/* Block activity chart */}
          <div className="panel animate-fade-up delay-2">
            <div className="panel-header">
              <div className="panel-title">BLOCK ACTIVITY</div>
              <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 9, color: 'rgba(232,240,232,0.25)' }}>LAST 12 BLOCKS</div>
            </div>
            <div style={{ padding: '20px 18px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 100, marginBottom: 16, overflowX: 'auto' }}>
                {blocks.map((b, i) => (
                  <div key={b.number} style={{ flex: '1 0 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, minWidth: 20 }}>
                    <div style={{
                      width: '100%', borderRadius: '3px 3px 0 0',
                      height: `${Math.max(8, (b.txCount / maxTx) * 80)}px`,
                      background: i === 0 ? '#00ff88' : 'rgba(0,255,136,0.3)',
                      transition: 'height 0.4s, background 0.3s',
                      boxShadow: i === 0 ? '0 0 8px rgba(0,255,136,0.4)' : 'none',
                    }} />
                    <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 8, color: 'rgba(232,240,232,0.2)', writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>
                      {b.txCount}tx
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {[
                  { label: 'LATEST BLOCK', value: blocks[0] ? `#${blocks[0].number.toLocaleString()}` : '—', color: '#00ff88' },
                  { label: 'BLOCK TIME', value: blocks.length > 1 ? `${Math.abs(blocks[0].timestamp - blocks[1].timestamp)}s avg` : '—', color: '#00aaff' },
                  { label: 'TXS (LATEST)', value: blocks[0]?.txCount.toString() || '—', color: '#aa55ff' },
                  { label: 'LATEST AGO', value: blocks[0] ? timeAgo(blocks[0].timestamp) : '—', color: '#ffaa00' },
                ].map(item => (
                  <div key={item.label}>
                    <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 9, color: 'rgba(232,240,232,0.25)', letterSpacing: '0.1em', marginBottom: 3 }}>{item.label}</div>
                    <div style={{ fontFamily: 'Space Mono, monospace', fontWeight: 700, fontSize: 13, color: item.color }}>{item.value}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Chain comparison */}
          <div className="panel animate-fade-up delay-3">
            <div className="panel-header">
              <div className="panel-title">CHAIN COMPARISON</div>
              <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 9, color: 'rgba(232,240,232,0.25)' }}>GAS & FINALITY</div>
            </div>
            <div style={{ padding: 18 }}>
              {chains.map((c, i) => (
                <div key={c.chain}
                  className="chain-row"
                  onClick={() => setSelectedChain(i)}
                  style={{
                    background: selectedChain === i ? (c.highlight ? 'rgba(0,255,136,0.08)' : 'rgba(255,255,255,0.04)') : (c.highlight ? 'rgba(0,255,136,0.05)' : 'rgba(255,255,255,0.01)'),
                    border: selectedChain === i ? (c.highlight ? '1px solid rgba(0,255,136,0.3)' : '1px solid rgba(255,255,255,0.15)') : (c.highlight ? '1px solid rgba(0,255,136,0.15)' : '1px solid rgba(255,255,255,0.04)'),
                  }}>
                  <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 11, fontWeight: c.highlight ? 700 : 400, color: c.color, display: 'flex', alignItems: 'center', gap: 6 }}>
                    {c.highlight && <span className="live-dot" style={{ width: 5, height: 5 }} />}
                    {c.chain}
                  </div>
                  <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 11, fontWeight: 700, color: c.color }}>{c.gas}</div>
                  <div className="chain-finality" style={{ fontFamily: 'Space Mono, monospace', fontSize: 11, color: c.color }}>{c.finality}</div>
                </div>
              ))}
              <div style={{ marginTop: 12, padding: '10px 12px', borderRadius: 6, background: chains[selectedChain].highlight ? 'rgba(0,255,136,0.04)' : 'rgba(255,51,85,0.04)', border: chains[selectedChain].highlight ? '1px solid rgba(0,255,136,0.1)' : '1px solid rgba(255,51,85,0.1)', fontFamily: 'Space Mono, monospace', fontSize: 10, color: chains[selectedChain].highlight ? 'rgba(232,240,232,0.5)' : 'rgba(255,51,85,0.7)', lineHeight: 1.5, transition: 'all 0.2s' }}>
                {chains[selectedChain].note}
              </div>
            </div>
          </div>
        </div>

        {/* Recent blocks table */}
        <div className="panel animate-fade-up delay-4">
          <div className="panel-header">
            <div className="panel-title">RECENT BLOCKS</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'Space Mono, monospace', fontSize: 9, color: 'rgba(232,240,232,0.25)' }}>
              <span className="live-dot" style={{ width: 5, height: 5 }} />
              AUTO-REFRESH 8s
            </div>
          </div>
          <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
            <table className="blocks-table" style={{ width: '100%', borderCollapse: 'collapse', minWidth: 320 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                  <th>BLOCK</th>
                  <th>AGE</th>
                  <th>TRANSACTIONS</th>
                  <th className="hide-mobile">TIME</th>
                </tr>
              </thead>
              <tbody>
                {loading ? Array(8).fill(0).map((_, i) => (
                  <tr key={i}>
                    {Array(4).fill(0).map((_, j) => (
                      <td key={j}>
                        <div className="skeleton" style={{ height: 14, width: j === 0 ? 100 : 80 }} />
                      </td>
                    ))}
                  </tr>
                )) : blocks.map((b, i) => (
                  <tr key={b.number}
                    style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', transition: 'background 0.15s' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLTableRowElement).style.background = 'rgba(255,255,255,0.02)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLTableRowElement).style.background = 'transparent'; }}>
                    <td style={{ fontFamily: 'Space Mono, monospace', fontSize: 13, fontWeight: 700, color: i === 0 ? '#00ff88' : 'rgba(232,240,232,0.7)', textShadow: i === 0 && blockFlash ? '0 0 12px #00ff88' : 'none' }}>
                      #{b.number.toLocaleString()}
                    </td>
                    <td style={{ fontFamily: 'Space Mono, monospace', fontSize: 12, color: 'rgba(232,240,232,0.4)' }}>
                      {timeAgo(b.timestamp)}
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div className="block-bar" style={{ width: 60, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.06)' }}>
                          <div style={{ width: `${Math.max(4, (b.txCount / maxTx) * 100)}%`, height: '100%', borderRadius: 2, background: '#00ff88', opacity: 0.6 }} />
                        </div>
                        <span style={{ fontFamily: 'Space Mono, monospace', fontSize: 12, color: b.txCount > 0 ? '#00ff88' : 'rgba(232,240,232,0.3)' }}>
                          {b.txCount}
                        </span>
                      </div>
                    </td>
                    <td className="hide-mobile" style={{ fontFamily: 'Space Mono, monospace', fontSize: 11, color: 'rgba(232,240,232,0.35)' }}>
                      {b.timestamp ? new Date(b.timestamp * 1000).toLocaleTimeString() : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Token info */}
        <div className="markets-tokens">
          {[
            { token: 'USDC', address: '0x3600000000000000000000000000000000000000', decimals: 6, color: '#00ff88', desc: 'Native gas token on Arc. USD-pegged stablecoin by Circle.' },
            { token: 'EURC', address: '0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a', decimals: 6, color: '#00aaff', desc: 'Euro-pegged stablecoin by Circle. Swap USDC↔EURC on Arc.' },
          ].map(t => (
            <div key={t.token} className="panel animate-fade-up delay-5" style={{ padding: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div style={{ fontFamily: 'Space Mono, monospace', fontWeight: 700, fontSize: 18, color: t.color }}>{t.token}</div>
                <span className="badge" style={{ background: `${t.color}12`, color: t.color, border: `1px solid ${t.color}25` }}>ERC-20</span>
              </div>
              <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 10, color: 'rgba(232,240,232,0.3)', marginBottom: 8, wordBreak: 'break-all', lineHeight: 1.6 }}>{t.address}</div>
              <div style={{ fontSize: 13, color: 'rgba(232,240,232,0.45)', lineHeight: 1.5 }}>{t.desc}</div>
              <div style={{ marginTop: 12, display: 'flex', gap: 16, fontFamily: 'Space Mono, monospace', fontSize: 10, color: 'rgba(232,240,232,0.3)', flexWrap: 'wrap' }}>
                <span>DECIMALS: {t.decimals}</span>
                <span>ISSUER: Circle</span>
              </div>
            </div>
          ))}
        </div>

      </div>
    </>
  );
}
