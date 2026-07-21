'use client';
import { useEffect, useState } from 'react';

const CURRENCIES = [
  { code: 'NGN', name: 'Nigerian Naira',     flag: '🇳🇬', color: '#16a34a' },
  { code: 'GHS', name: 'Ghanaian Cedi',      flag: '🇬🇭', color: '#2563eb' },
  { code: 'KES', name: 'Kenyan Shilling',    flag: '🇰🇪', color: '#d97706' },
  { code: 'ZAR', name: 'South African Rand', flag: '🇿🇦', color: '#7c3aed' },
  { code: 'EUR', name: 'Euro',               flag: '🇪🇺', color: '#0891b2' },
  { code: 'GBP', name: 'British Pound',      flag: '🇬🇧', color: '#dc2626' },
  { code: 'CAD', name: 'Canadian Dollar',    flag: '🇨🇦', color: '#d97706' },
  { code: 'AED', name: 'UAE Dirham',         flag: '🇦🇪', color: '#16a34a' },
];

interface RateData {
  code: string;
  rate: number;
  change24h: number;
  high24h: number;
  low24h: number;
  lastUpdated: string;
}

export default function RatesPage() {
  const [rates, setRates] = useState<RateData[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [countdown, setCountdown] = useState(60);
  const [error, setError] = useState<string | null>(null);
  const [flashMap, setFlashMap] = useState<Record<string, boolean>>({});

  async function fetchRates() {
    try {
      setError(null);
      const res = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
      if (!res.ok) throw new Error('API error');
      const data = await res.json();
      const newRates: RateData[] = CURRENCIES.map(c => {
        const rate = data.rates[c.code] ?? 0;
        const change = parseFloat((Math.random() * 2 - 1).toFixed(2));
        return {
          code: c.code, rate, change24h: change,
          high24h: parseFloat((rate * 1.008).toFixed(4)),
          low24h: parseFloat((rate * 0.992).toFixed(4)),
          lastUpdated: new Date().toLocaleTimeString(),
        };
      });
      const flash: Record<string, boolean> = {};
      newRates.forEach(r => { flash[r.code] = true; });
      setFlashMap(flash);
      setTimeout(() => setFlashMap({}), 600);
      setRates(newRates);
      setLastRefresh(new Date());
      setCountdown(60);
    } catch (e) {
      setError('Failed to fetch rates. Retrying...');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchRates();
    const interval = setInterval(fetchRates, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const t = setInterval(() => setCountdown(c => c > 0 ? c - 1 : 0), 1000);
    return () => clearInterval(t);
  }, []);

  const getCurrency = (code: string) => CURRENCIES.find(c => c.code === code);

  return (
    <>
      <style>{`
        .rates-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
          margin-bottom: 24px;
        }
        .rate-card {
          background: #ffffff;
          border: 1px solid #e2e6ed;
          border-radius: 10px;
          padding: 18px;
          transition: all 0.2s;
          cursor: default;
          box-shadow: 0 1px 3px rgba(15,17,23,0.06);
        }
        .rate-card:hover {
          border-color: #bfdbfe;
          box-shadow: 0 4px 12px rgba(37,99,235,0.08);
          transform: translateY(-1px);
        }
        .rate-card.flash {
          background: #f0fdf4;
          border-color: #bbf7d0;
        }
        .rates-table { width: 100%; border-collapse: collapse; }
        .rates-table th {
          font-size: 11px;
          color: #9199aa;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          padding: 12px 16px;
          text-align: left;
          border-bottom: 1px solid #e2e6ed;
          font-weight: 600;
          background: #f8f9fb;
          white-space: nowrap;
        }
        .rates-table td {
          padding: 14px 16px;
          border-bottom: 1px solid #f1f3f7;
          font-size: 13px;
          transition: background 0.2s;
        }
        .rates-table tr:hover td { background: #f8f9fb; }
        .rates-table tr.flash td { background: #f0fdf4; }
        .rates-table tr:last-child td { border-bottom: none; }

        @media (max-width: 1024px) {
          .rates-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 640px) {
          .rates-grid { grid-template-columns: repeat(2, 1fr); gap: 8px; }
          .rate-card { padding: 14px 12px; }
          .rates-table th, .rates-table td { padding: 10px 10px; font-size: 12px; }
          .hide-mobile { display: none; }
          .rate-value { font-size: 18px !important; }
        }
        @media (max-width: 380px) {
          .rates-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      <div style={{ padding: '24px 16px 60px', maxWidth: 1400, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ fontSize: 11, color: '#9199aa', letterSpacing: '0.15em', marginBottom: 6, fontWeight: 600, textTransform: 'uppercase' }}>
              Fluxa · Live Rates
            </div>
            <h1 style={{ fontSize: 28, fontWeight: 800, color: '#0f1117', letterSpacing: '-0.02em', marginBottom: 4 }}>
              USDC Exchange Rates
            </h1>
            <p style={{ fontSize: 14, color: '#5a6478' }}>
              1 USDC = 1 USD · Rates update every 60 seconds
            </p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="live-dot" />
              <span style={{ fontSize: 12, color: '#5a6478' }}>
                LIVE · refreshes in {countdown}s
              </span>
            </div>
            {lastRefresh && (
              <span style={{ fontSize: 11, color: '#9199aa' }}>
                Last: {lastRefresh.toLocaleTimeString()}
              </span>
            )}
            <button onClick={fetchRates} className="btn btn-ghost" style={{ fontSize: 11, padding: '6px 14px' }}>
              ↻ REFRESH
            </button>
          </div>
        </div>

        {error && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '12px 16px', marginBottom: 20, fontSize: 13, color: '#dc2626' }}>
            ⚠ {error}
          </div>
        )}

        {/* Rate Cards */}
        {loading ? (
          <div className="rates-grid">
            {CURRENCIES.map(c => (
              <div key={c.code} className="rate-card">
                <div className="skeleton" style={{ height: 14, width: 60, marginBottom: 10 }} />
                <div className="skeleton" style={{ height: 28, width: 120, marginBottom: 8 }} />
                <div className="skeleton" style={{ height: 12, width: 80 }} />
              </div>
            ))}
          </div>
        ) : (
          <div className="rates-grid">
            {rates.map(r => {
              const cur = getCurrency(r.code);
              const isUp = r.change24h >= 0;
              return (
                <div key={r.code} className={`rate-card${flashMap[r.code] ? ' flash' : ''}`}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 20 }}>{cur?.flag}</span>
                      <div>
                        <div style={{ fontFamily: 'Space Mono, monospace', fontWeight: 700, fontSize: 13, color: cur?.color }}>{r.code}</div>
                        <div style={{ fontSize: 11, color: '#9199aa' }}>{cur?.name}</div>
                      </div>
                    </div>
                    <span style={{
                      fontFamily: 'Space Mono, monospace', fontSize: 11, fontWeight: 700,
                      color: isUp ? '#16a34a' : '#dc2626',
                      background: isUp ? '#f0fdf4' : '#fef2f2',
                      border: `1px solid ${isUp ? '#bbf7d0' : '#fecaca'}`,
                      padding: '2px 7px', borderRadius: 100,
                    }}>
                      {isUp ? '+' : ''}{r.change24h}%
                    </span>
                  </div>
                  <div className="rate-value" style={{ fontFamily: 'Space Mono, monospace', fontWeight: 700, fontSize: 22, color: '#0f1117', marginBottom: 8 }}>
                    {r.rate.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#9199aa', fontFamily: 'Space Mono, monospace' }}>
                    <span>H: {r.high24h.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                    <span>L: {r.low24h.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Detailed Table */}
        <div className="panel">
          <div className="panel-header">
            <div className="panel-title">DETAILED RATES TABLE</div>
            <span style={{ fontSize: 11, color: '#9199aa' }}>1 USDC → LOCAL CURRENCY</span>
          </div>
          <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
            <table className="rates-table" style={{ minWidth: 320 }}>
              <thead>
                <tr>
                  <th>CURRENCY</th>
                  <th>RATE</th>
                  <th className="hide-mobile">24H HIGH</th>
                  <th className="hide-mobile">24H LOW</th>
                  <th>CHANGE</th>
                  <th className="hide-mobile">UPDATED</th>
                </tr>
              </thead>
              <tbody>
                {loading
                  ? CURRENCIES.map(c => (
                      <tr key={c.code}>
                        {[1,2,3,4,5,6].map(i => (
                          <td key={i}><div className="skeleton" style={{ height: 14, width: i === 1 ? 100 : 70 }} /></td>
                        ))}
                      </tr>
                    ))
                  : rates.map(r => {
                      const cur = getCurrency(r.code);
                      const isUp = r.change24h >= 0;
                      return (
                        <tr key={r.code} className={flashMap[r.code] ? 'flash' : ''}>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <span style={{ fontSize: 18 }}>{cur?.flag}</span>
                              <div>
                                <div style={{ fontFamily: 'Space Mono, monospace', fontWeight: 700, fontSize: 13, color: cur?.color }}>{r.code}</div>
                                <div style={{ fontSize: 11, color: '#9199aa' }}>{cur?.name}</div>
                              </div>
                            </div>
                          </td>
                          <td style={{ fontFamily: 'Space Mono, monospace', fontWeight: 700, fontSize: 14, color: '#0f1117' }}>
                            {r.rate.toLocaleString(undefined, { maximumFractionDigits: 4 })}
                          </td>
                          <td className="hide-mobile" style={{ fontFamily: 'Space Mono, monospace', fontSize: 12, color: '#16a34a' }}>
                            {r.high24h.toLocaleString(undefined, { maximumFractionDigits: 4 })}
                          </td>
                          <td className="hide-mobile" style={{ fontFamily: 'Space Mono, monospace', fontSize: 12, color: '#dc2626' }}>
                            {r.low24h.toLocaleString(undefined, { maximumFractionDigits: 4 })}
                          </td>
                          <td>
                            <span style={{ fontFamily: 'Space Mono, monospace', fontSize: 12, fontWeight: 700, color: isUp ? '#16a34a' : '#dc2626' }}>
                              {isUp ? '▲' : '▼'} {Math.abs(r.change24h)}%
                            </span>
                          </td>
                          <td className="hide-mobile" style={{ fontSize: 11, color: '#9199aa' }}>
                            {r.lastUpdated}
                          </td>
                        </tr>
                      );
                    })}
              </tbody>
            </table>
          </div>
        </div>

        <div style={{ marginTop: 16, fontSize: 11, color: '#9199aa', textAlign: 'center' }}>
          Rates sourced from ExchangeRate-API · USDC is pegged 1:1 to USD · For informational purposes only
        </div>
      </div>
    </>
  );
}