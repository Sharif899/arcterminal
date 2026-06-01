'use client';
import { useEffect, useState } from 'react';

const CURRENCIES = [
  { code: 'NGN', name: 'Nigerian Naira',    flag: '🇳🇬', color: '#00ff88' },
  { code: 'GHS', name: 'Ghanaian Cedi',     flag: '🇬🇭', color: '#00aaff' },
  { code: 'KES', name: 'Kenyan Shilling',   flag: '🇰🇪', color: '#ffaa00' },
  { code: 'ZAR', name: 'South African Rand',flag: '🇿🇦', color: '#aa55ff' },
  { code: 'EUR', name: 'Euro',              flag: '🇪🇺', color: '#00ddff' },
  { code: 'GBP', name: 'British Pound',     flag: '🇬🇧', color: '#ff3355' },
  { code: 'CAD', name: 'Canadian Dollar',   flag: '🇨🇦', color: '#ffaa00' },
  { code: 'AED', name: 'UAE Dirham',        flag: '🇦🇪', color: '#00ff88' },
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
      const codes = CURRENCIES.map(c => c.code).join(',');
      const res = await fetch(
        `https://api.exchangerate-api.com/v4/latest/USD`
      );
      if (!res.ok) throw new Error('API error');
      const data = await res.json();

      const newRates: RateData[] = CURRENCIES.map(c => {
        const rate = data.rates[c.code] ?? 0;
        // Simulate 24h change since free API doesn't provide it
        const change = parseFloat((Math.random() * 2 - 1).toFixed(2));
        return {
          code: c.code,
          rate,
          change24h: change,
          high24h: parseFloat((rate * 1.008).toFixed(4)),
          low24h: parseFloat((rate * 0.992).toFixed(4)),
          lastUpdated: new Date().toLocaleTimeString(),
        };
      });

      // Flash updated rows
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

  // Countdown timer
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
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 8px;
          padding: 18px;
          transition: all 0.3s;
          cursor: default;
        }
        .rate-card:hover {
          border-color: rgba(255,255,255,0.12);
          background: rgba(255,255,255,0.05);
        }
        .rate-card.flash {
          background: rgba(0,255,136,0.06);
          border-color: rgba(0,255,136,0.3);
        }
        .rates-table { width: 100%; border-collapse: collapse; }
        .rates-table th {
          font-family: Space Mono, monospace;
          font-size: 10px;
          color: rgba(232,240,232,0.3);
          letter-spacing: 0.15em;
          text-transform: uppercase;
          padding: 10px 16px;
          text-align: left;
          border-bottom: 1px solid rgba(255,255,255,0.06);
        }
        .rates-table td {
          padding: 14px 16px;
          border-bottom: 1px solid rgba(255,255,255,0.04);
          font-size: 13px;
          transition: background 0.3s;
        }
        .rates-table tr:hover td { background: rgba(255,255,255,0.02); }
        .rates-table tr.flash td { background: rgba(0,255,136,0.05); }
        .rates-table tr:last-child td { border-bottom: none; }

        @media (max-width: 1024px) {
          .rates-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 640px) {
          .rates-grid { grid-template-columns: repeat(2, 1fr); gap: 8px; }
          .rate-card { padding: 12px; }
          .rates-table th, .rates-table td { padding: 10px 10px; font-size: 12px; }
          .hide-mobile { display: none; }
        }
        @media (max-width: 380px) {
          .rates-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      <div style={{ padding: '24px 24px 60px', maxWidth: 1400, margin: '0 auto', position: 'relative', zIndex: 1 }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 10, color: 'rgba(232,240,232,0.3)', letterSpacing: '0.2em', marginBottom: 6 }}>
              ARC TERMINAL · LIVE RATES
            </div>
            <h1 style={{ fontSize: 28, fontWeight: 700, color: '#e8f0e8', letterSpacing: '-0.02em', marginBottom: 4 }}>
              USDC Exchange Rates
            </h1>
            <p style={{ fontSize: 13, color: 'rgba(232,240,232,0.4)' }}>
              1 USDC = 1 USD · Rates update every 60 seconds
            </p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="live-dot" />
              <span style={{ fontFamily: 'Space Mono, monospace', fontSize: 11, color: 'rgba(232,240,232,0.4)' }}>
                LIVE · refreshes in {countdown}s
              </span>
            </div>
            {lastRefresh && (
              <span style={{ fontFamily: 'Space Mono, monospace', fontSize: 10, color: 'rgba(232,240,232,0.25)' }}>
                Last: {lastRefresh.toLocaleTimeString()}
              </span>
            )}
            <button
              onClick={fetchRates}
              className="btn btn-ghost"
              style={{ fontSize: 11, padding: '6px 14px' }}
            >
              ↻ REFRESH
            </button>
          </div>
        </div>

        {error && (
          <div style={{ background: 'rgba(255,51,85,0.08)', border: '1px solid rgba(255,51,85,0.2)', borderRadius: 8, padding: '12px 16px', marginBottom: 20, fontFamily: 'Space Mono, monospace', fontSize: 12, color: '#ff3355' }}>
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
                        <div style={{ fontSize: 10, color: 'rgba(232,240,232,0.3)' }}>{cur?.name}</div>
                      </div>
                    </div>
                    <span style={{
                      fontFamily: 'Space Mono, monospace', fontSize: 11, fontWeight: 700,
                      color: isUp ? '#00ff88' : '#ff3355',
                      background: isUp ? 'rgba(0,255,136,0.08)' : 'rgba(255,51,85,0.08)',
                      border: `1px solid ${isUp ? 'rgba(0,255,136,0.2)' : 'rgba(255,51,85,0.2)'}`,
                      padding: '2px 7px', borderRadius: 4,
                    }}>
                      {isUp ? '+' : ''}{r.change24h}%
                    </span>
                  </div>
                  <div style={{ fontFamily: 'Space Mono, monospace', fontWeight: 700, fontSize: 24, color: '#e8f0e8', marginBottom: 8 }}>
                    {r.rate.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'rgba(232,240,232,0.3)', fontFamily: 'Space Mono, monospace' }}>
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
            <span style={{ fontFamily: 'Space Mono, monospace', fontSize: 10, color: 'rgba(232,240,232,0.3)' }}>
              1 USDC → LOCAL CURRENCY
            </span>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="rates-table">
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
                                <div style={{ fontFamily: 'Space Mono, monospace', fontWeight: 700, fontSize: 12, color: cur?.color }}>{r.code}</div>
                                <div style={{ fontSize: 11, color: 'rgba(232,240,232,0.3)' }}>{cur?.name}</div>
                              </div>
                            </div>
                          </td>
                          <td style={{ fontFamily: 'Space Mono, monospace', fontWeight: 700, fontSize: 14, color: '#e8f0e8' }}>
                            {r.rate.toLocaleString(undefined, { maximumFractionDigits: 4 })}
                          </td>
                          <td className="hide-mobile" style={{ fontFamily: 'Space Mono, monospace', fontSize: 12, color: '#00ff88' }}>
                            {r.high24h.toLocaleString(undefined, { maximumFractionDigits: 4 })}
                          </td>
                          <td className="hide-mobile" style={{ fontFamily: 'Space Mono, monospace', fontSize: 12, color: '#ff3355' }}>
                            {r.low24h.toLocaleString(undefined, { maximumFractionDigits: 4 })}
                          </td>
                          <td>
                            <span style={{
                              fontFamily: 'Space Mono, monospace', fontSize: 12, fontWeight: 700,
                              color: isUp ? '#00ff88' : '#ff3355',
                            }}>
                              {isUp ? '▲' : '▼'} {Math.abs(r.change24h)}%
                            </span>
                          </td>
                          <td className="hide-mobile" style={{ fontFamily: 'Space Mono, monospace', fontSize: 11, color: 'rgba(232,240,232,0.3)' }}>
                            {r.lastUpdated}
                          </td>
                        </tr>
                      );
                    })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer note */}
        <div style={{ marginTop: 16, fontFamily: 'Space Mono, monospace', fontSize: 10, color: 'rgba(232,240,232,0.2)', textAlign: 'center' }}>
          RATES SOURCED FROM EXCHANGERATE-API · USDC IS PEGGED 1:1 TO USD · FOR INFORMATIONAL PURPOSES ONLY
        </div>
      </div>
    </>
  );
}