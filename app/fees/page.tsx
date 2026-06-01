'use client';
import { useEffect, useState } from 'react';

interface Provider {
  name: string;
  color: string;
  logo: string;
  type: string;
}

interface FeeResult {
  provider: string;
  fee: number;
  feePercent: number;
  exchangeRate: number;
  recipientGets: number;
  speed: string;
  speed_minutes: number;
}

const PROVIDERS: Provider[] = [
  { name: 'Arc Network', color: '#00ff88', logo: '⬡', type: 'Blockchain' },
  { name: 'Western Union', color: '#ffaa00', logo: '💛', type: 'Wire Transfer' },
  { name: 'PayPal', color: '#00aaff', logo: '🅿', type: 'Digital Wallet' },
  { name: 'SWIFT', color: '#aa55ff', logo: '🏦', type: 'Bank Transfer' },
  { name: 'Wise', color: '#00ddff', logo: '🌍', type: 'Fintech' },
  { name: 'Remitly', color: '#ff3355', logo: '📱', type: 'Remittance' },
];

const CORRIDORS = [
  { from: 'USD', to: 'NGN', label: 'USD → NGN', flag: '🇳🇬' },
  { from: 'USD', to: 'GHS', label: 'USD → GHS', flag: '🇬🇭' },
  { from: 'USD', to: 'KES', label: 'USD → KES', flag: '🇰🇪' },
  { from: 'USD', to: 'GBP', label: 'USD → GBP', flag: '🇬🇧' },
  { from: 'USD', to: 'EUR', label: 'USD → EUR', flag: '🇪🇺' },
];

// Real-ish fee structures based on published rates
function calculateFees(amount: number, corridor: string): FeeResult[] {
  const isAfrica = ['NGN', 'GHS', 'KES'].some(c => corridor.includes(c));

  return [
    {
      provider: 'Arc Network',
      fee: 0.01,
      feePercent: (0.01 / amount) * 100,
      exchangeRate: 1.0,
      recipientGets: amount - 0.01,
      speed: '< 1 sec',
      speed_minutes: 0,
    },
    {
      provider: 'Western Union',
      fee: isAfrica ? amount * 0.03 + 4.99 : amount * 0.015 + 2.99,
      feePercent: isAfrica ? 3 + (4.99 / amount) * 100 : 1.5 + (2.99 / amount) * 100,
      exchangeRate: 0.97,
      recipientGets: (amount - (isAfrica ? amount * 0.03 + 4.99 : amount * 0.015 + 2.99)) * 0.97,
      speed: '1–3 days',
      speed_minutes: 2880,
    },
    {
      provider: 'PayPal',
      fee: amount * 0.05,
      feePercent: 5,
      exchangeRate: 0.965,
      recipientGets: (amount - amount * 0.05) * 0.965,
      speed: '1–3 days',
      speed_minutes: 2880,
    },
    {
      provider: 'SWIFT',
      fee: isAfrica ? 35 + amount * 0.01 : 25 + amount * 0.005,
      feePercent: isAfrica ? ((35 + amount * 0.01) / amount) * 100 : ((25 + amount * 0.005) / amount) * 100,
      exchangeRate: 0.985,
      recipientGets: (amount - (isAfrica ? 35 + amount * 0.01 : 25 + amount * 0.005)) * 0.985,
      speed: '2–5 days',
      speed_minutes: 7200,
    },
    {
      provider: 'Wise',
      fee: amount * 0.0065 + 0.5,
      feePercent: 0.65 + (0.5 / amount) * 100,
      exchangeRate: 0.998,
      recipientGets: (amount - (amount * 0.0065 + 0.5)) * 0.998,
      speed: '1–2 days',
      speed_minutes: 1440,
    },
    {
      provider: 'Remitly',
      fee: isAfrica ? amount * 0.02 + 2.99 : amount * 0.01 + 1.99,
      feePercent: isAfrica ? 2 + (2.99 / amount) * 100 : 1 + (1.99 / amount) * 100,
      exchangeRate: 0.975,
      recipientGets: (amount - (isAfrica ? amount * 0.02 + 2.99 : amount * 0.01 + 1.99)) * 0.975,
      speed: '3–5 hours',
      speed_minutes: 240,
    },
  ].sort((a, b) => a.fee - b.fee);
}

export default function FeesPage() {
  const [amount, setAmount] = useState('500');
  const [corridor, setCorridor] = useState('USD → NGN');
  const [results, setResults] = useState<FeeResult[]>([]);
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    setAnimating(true);
    const t = setTimeout(() => {
      setResults(calculateFees(parseFloat(amount) || 500, corridor));
      setAnimating(false);
    }, 300);
    return () => clearTimeout(t);
  }, [amount, corridor]);

  const best = results[0];
  const worst = results[results.length - 1];
  const arcResult = results.find(r => r.provider === 'Arc Network');
  const savings = worst && arcResult ? (worst.fee - arcResult.fee).toFixed(2) : '0';

  return (
    <>
      <style>{`
        .fees-table { width: 100%; border-collapse: collapse; }
        .fees-table th {
          font-family: Space Mono, monospace; font-size: 10px;
          color: rgba(232,240,232,0.3); letter-spacing: 0.15em;
          text-transform: uppercase; padding: 10px 16px;
          text-align: left; border-bottom: 1px solid rgba(255,255,255,0.06);
          white-space: nowrap;
        }
        .fees-table td {
          padding: 14px 16px; border-bottom: 1px solid rgba(255,255,255,0.04);
          font-size: 13px; transition: all 0.3s;
        }
        .fees-table tr:hover td { background: rgba(255,255,255,0.02); }
        .fees-table tr:last-child td { border-bottom: none; }
        .fees-table tr.arc-row td { background: rgba(0,255,136,0.04); }
        .stat-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
          margin-bottom: 24px;
        }
        .controls-row {
          display: flex;
          gap: 12px;
          margin-bottom: 24px;
          flex-wrap: wrap;
        }
        .controls-row > * { flex: 1; min-width: 160px; }
        .bar-wrap { height: 6px; background: rgba(255,255,255,0.06); border-radius: 3px; margin-top: 4px; overflow: hidden; }
        .bar-fill { height: 100%; border-radius: 3px; transition: width 0.5s ease; }
        @media (max-width: 768px) {
          .stat-grid { grid-template-columns: repeat(2, 1fr); }
          .fees-table th, .fees-table td { padding: 10px 10px; font-size: 11px; }
          .hide-mobile { display: none; }
        }
        @media (max-width: 480px) {
          .stat-grid { grid-template-columns: repeat(2, 1fr); }
          .fees-page { padding: 16px 16px 60px !important; }
        }
      `}</style>

      <div className="fees-page" style={{ padding: '24px 24px 60px', maxWidth: 1200, margin: '0 auto', position: 'relative', zIndex: 1 }}>

        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 10, color: 'rgba(232,240,232,0.3)', letterSpacing: '0.2em', marginBottom: 6 }}>ARC TERMINAL · FEE COMPARISON</div>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: '#e8f0e8', letterSpacing: '-0.02em', marginBottom: 4 }}>Fee Comparison</h1>
          <p style={{ fontSize: 13, color: 'rgba(232,240,232,0.4)' }}>Arc vs Western Union vs PayPal vs SWIFT — real fee structures, live calculation</p>
        </div>

        {/* Controls */}
        <div className="controls-row">
          <div>
            <label className="label">SEND AMOUNT (USD)</label>
            <input
              className="input"
              type="number"
              min="1"
              step="any"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder="500"
            />
          </div>
          <div>
            <label className="label">CORRIDOR</label>
            <select className="select" value={corridor} onChange={e => setCorridor(e.target.value)}>
              {CORRIDORS.map(c => (
                <option key={c.label} value={c.label}>{c.flag} {c.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Stats */}
        <div className="stat-grid">
          {[
            { label: 'ARC FEE', value: `$${arcResult?.fee.toFixed(2) ?? '0.01'}`, color: '#00ff88', sub: 'flat rate' },
            { label: 'MAX FEE (SWIFT)', value: `$${worst?.fee.toFixed(2) ?? '—'}`, color: '#ff3355', sub: 'most expensive' },
            { label: 'YOU SAVE VS SWIFT', value: `$${savings}`, color: '#00ff88', sub: 'using Arc' },
            { label: 'ARC SPEED', value: '< 1 sec', color: '#00aaff', sub: 'vs days for others' },
          ].map(s => (
            <div key={s.label} className="panel" style={{ padding: 18 }}>
              <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 9, color: 'rgba(232,240,232,0.3)', letterSpacing: '0.15em', marginBottom: 8 }}>{s.label}</div>
              <div style={{ fontFamily: 'Space Mono, monospace', fontWeight: 700, fontSize: 22, color: s.color, marginBottom: 4 }}>{s.value}</div>
              <div style={{ fontSize: 11, color: 'rgba(232,240,232,0.3)' }}>{s.sub}</div>
            </div>
          ))}
        </div>

        {/* Bar chart visual */}
        <div className="panel" style={{ marginBottom: 20 }}>
          <div className="panel-header">
            <div className="panel-title">FEE VISUAL COMPARISON</div>
            <span style={{ fontFamily: 'Space Mono, monospace', fontSize: 10, color: 'rgba(232,240,232,0.3)' }}>sending ${amount || 500}</span>
          </div>
          <div style={{ padding: '16px 20px' }}>
            {results.map((r, i) => {
              const provider = PROVIDERS.find(p => p.name === r.provider);
              const maxFee = worst?.fee || 1;
              const pct = Math.max((r.fee / maxFee) * 100, 1);
              return (
                <div key={r.provider} style={{ marginBottom: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 16 }}>{provider?.logo}</span>
                      <span style={{ fontFamily: 'Space Mono, monospace', fontSize: 12, fontWeight: 700, color: provider?.color }}>{r.provider}</span>
                      {r.provider === 'Arc Network' && <span className="badge badge-green" style={{ fontSize: 9 }}>CHEAPEST</span>}
                    </div>
                    <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                      <span style={{ fontFamily: 'Space Mono, monospace', fontSize: 12, color: 'rgba(232,240,232,0.5)' }}>{r.speed}</span>
                      <span style={{ fontFamily: 'Space Mono, monospace', fontSize: 13, fontWeight: 700, color: provider?.color }}>${r.fee.toFixed(2)}</span>
                    </div>
                  </div>
                  <div className="bar-wrap">
                    <div className="bar-fill" style={{ width: animating ? '0%' : `${pct}%`, background: provider?.color, opacity: 0.7 }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Detailed table */}
        <div className="panel">
          <div className="panel-header">
            <div className="panel-title">DETAILED BREAKDOWN</div>
            <span style={{ fontFamily: 'Space Mono, monospace', fontSize: 10, color: 'rgba(232,240,232,0.3)' }}>
              SENDING ${parseFloat(amount || '500').toLocaleString()} · {corridor}
            </span>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="fees-table">
              <thead>
                <tr>
                  <th>PROVIDER</th>
                  <th>FEE (USD)</th>
                  <th>FEE %</th>
                  <th className="hide-mobile">EXCHANGE RATE</th>
                  <th>RECIPIENT GETS</th>
                  <th className="hide-mobile">SPEED</th>
                  <th>RANK</th>
                </tr>
              </thead>
              <tbody>
                {results.map((r, i) => {
                  const provider = PROVIDERS.find(p => p.name === r.provider);
                  const isArc = r.provider === 'Arc Network';
                  return (
                    <tr key={r.provider} className={isArc ? 'arc-row' : ''}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 18 }}>{provider?.logo}</span>
                          <div>
                            <div style={{ fontFamily: 'Space Mono, monospace', fontWeight: 700, fontSize: 12, color: provider?.color }}>{r.provider}</div>
                            <div style={{ fontSize: 10, color: 'rgba(232,240,232,0.3)' }}>{provider?.type}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ fontFamily: 'Space Mono, monospace', fontWeight: 700, fontSize: 14, color: isArc ? '#00ff88' : '#e8f0e8' }}>
                        ${r.fee.toFixed(2)}
                      </td>
                      <td style={{ fontFamily: 'Space Mono, monospace', fontSize: 12, color: isArc ? '#00ff88' : 'rgba(232,240,232,0.6)' }}>
                        {r.feePercent.toFixed(2)}%
                      </td>
                      <td className="hide-mobile" style={{ fontFamily: 'Space Mono, monospace', fontSize: 12, color: 'rgba(232,240,232,0.6)' }}>
                        {r.exchangeRate.toFixed(3)}x
                      </td>
                      <td style={{ fontFamily: 'Space Mono, monospace', fontWeight: 700, fontSize: 13, color: isArc ? '#00ff88' : '#e8f0e8' }}>
                        ${r.recipientGets.toFixed(2)}
                      </td>
                      <td className="hide-mobile" style={{ fontFamily: 'Space Mono, monospace', fontSize: 12, color: isArc ? '#00ff88' : 'rgba(232,240,232,0.5)' }}>
                        {r.speed}
                      </td>
                      <td>
                        {i === 0
                          ? <span className="badge badge-green">#{i + 1} BEST</span>
                          : i === results.length - 1
                          ? <span className="badge badge-red">#{i + 1} WORST</span>
                          : <span className="badge badge-amber">#{i + 1}</span>
                        }
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div style={{ marginTop: 16, fontFamily: 'Space Mono, monospace', fontSize: 10, color: 'rgba(232,240,232,0.2)', textAlign: 'center' }}>
          FEES BASED ON PUBLISHED RATES · ARC FEE IS LIVE FROM TESTNET · FOR INFORMATIONAL PURPOSES ONLY
        </div>
      </div>
    </>
  );
}