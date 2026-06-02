'use client';
import { useEffect, useState } from 'react';

const CURRENCIES = [
  { code: 'NGN', name: 'Nigerian Naira',     flag: '🇳🇬', color: '#00ff88' },
  { code: 'GHS', name: 'Ghanaian Cedi',      flag: '🇬🇭', color: '#00aaff' },
  { code: 'KES', name: 'Kenyan Shilling',    flag: '🇰🇪', color: '#ffaa00' },
  { code: 'ZAR', name: 'South African Rand', flag: '🇿🇦', color: '#aa55ff' },
  { code: 'EUR', name: 'Euro',               flag: '🇪🇺', color: '#00ddff' },
  { code: 'GBP', name: 'British Pound',      flag: '🇬🇧', color: '#ff3355' },
  { code: 'CAD', name: 'Canadian Dollar',    flag: '🇨🇦', color: '#ffaa00' },
  { code: 'AED', name: 'UAE Dirham',         flag: '🇦🇪', color: '#00ff88' },
];

export default function ConvertPage() {
  const [rates, setRates] = useState<Record<string, number>>({});
  const [loadingRates, setLoadingRates] = useState(true);
  const [selectedCurrency, setSelectedCurrency] = useState('NGN');
  const [amount, setAmount] = useState('');
  const [direction, setDirection] = useState<'toUSDC' | 'fromUSDC'>('toUSDC');
  const [recipientAddress, setRecipientAddress] = useState('');
  const [sending, setSending] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<'form' | 'confirm' | 'success'>('form');

  useEffect(() => {
    fetch('https://api.exchangerate-api.com/v4/latest/USD')
      .then(r => r.json())
      .then(d => { setRates(d.rates); setLoadingRates(false); })
      .catch(() => setLoadingRates(false));
  }, []);

  const rate = rates[selectedCurrency] ?? 1;
  const cur = CURRENCIES.find(c => c.code === selectedCurrency);
  const numAmount = parseFloat(amount) || 0;
  const usdcAmount = direction === 'toUSDC' ? numAmount / rate : numAmount;
  const localAmount = direction === 'fromUSDC' ? numAmount * rate : numAmount;
  const usdcDisplay = usdcAmount > 0 ? usdcAmount.toFixed(6) : '0.000000';
  const localDisplay = localAmount > 0 ? localAmount.toLocaleString(undefined, { maximumFractionDigits: 2 }) : '0.00';

  async function handleSend() {
    setSending(true);
    setError(null);
    try {
      await new Promise(r => setTimeout(r, 2000));
      const mockHash = '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
      setTxHash(mockHash);
      setStep('success');
    } catch (e: any) {
      setError(e?.message || 'Transaction failed');
    } finally {
      setSending(false);
    }
  }

  function reset() {
    setStep('form');
    setAmount('');
    setRecipientAddress('');
    setTxHash(null);
    setError(null);
  }

  return (
    <>
      <style>{`
        .convert-grid {
          display: grid;
          grid-template-columns: 1fr 300px;
          gap: 20px;
          align-items: start;
        }
        @media (max-width: 900px) { .convert-grid { grid-template-columns: 1fr; } }
        @media (max-width: 480px) { .convert-page { padding: 16px 16px 60px !important; } }
      `}</style>

      <div className="convert-page" style={{ padding: '24px 24px 60px', maxWidth: 1100, margin: '0 auto', position: 'relative', zIndex: 1 }}>

        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 10, color: 'rgba(232,240,232,0.3)', letterSpacing: '0.2em', marginBottom: 6 }}>ARC TERMINAL · CONVERT</div>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: '#e8f0e8', letterSpacing: '-0.02em', marginBottom: 4 }}>Currency Converter</h1>
          <p style={{ fontSize: 13, color: 'rgba(232,240,232,0.4)' }}>Convert any currency to USDC and send via Arc — sub-second settlement</p>
        </div>

        {/* SUCCESS */}
        {step === 'success' && (
          <div className="panel" style={{ padding: 40, textAlign: 'center', maxWidth: 560, margin: '0 auto' }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>✅</div>
            <div style={{ fontFamily: 'Space Mono, monospace', fontWeight: 700, fontSize: 20, color: '#00ff88', marginBottom: 8 }}>TRANSACTION SENT</div>
            <div style={{ fontSize: 14, color: 'rgba(232,240,232,0.5)', marginBottom: 24 }}>{usdcDisplay} USDC sent successfully</div>
            <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: 8, padding: '14px 16px', marginBottom: 24, textAlign: 'left' }}>
              <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 10, color: 'rgba(232,240,232,0.3)', marginBottom: 6 }}>TX HASH</div>
              <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 11, color: '#00ff88', wordBreak: 'break-all' }}>{txHash}</div>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <a href={`https://testnet.arcscan.app/tx/${txHash}`} target="_blank" rel="noopener noreferrer" className="btn btn-green" style={{ flex: 1, fontSize: 12 }}>VIEW ON ARCSCAN ↗</a>
              <button onClick={reset} className="btn btn-ghost" style={{ flex: 1, fontSize: 12 }}>NEW CONVERSION</button>
            </div>
          </div>
        )}

        {/* CONFIRM */}
        {step === 'confirm' && (
          <div className="panel" style={{ maxWidth: 560, margin: '0 auto' }}>
            <div className="panel-header">
              <div className="panel-title">CONFIRM TRANSACTION</div>
            </div>
            <div style={{ padding: 24 }}>
              {[
                { label: 'YOU SEND', value: direction === 'fromUSDC' ? `${numAmount} USDC` : `${localDisplay} ${selectedCurrency}` },
                { label: 'RECIPIENT GETS', value: `${usdcDisplay} USDC` },
                { label: 'EXCHANGE RATE', value: `1 USDC = ${rate.toLocaleString()} ${selectedCurrency}` },
                { label: 'NETWORK FEE', value: '~$0.01 USDC' },
                { label: 'RECIPIENT', value: `${recipientAddress.slice(0, 10)}...${recipientAddress.slice(-8)}` },
                { label: 'NETWORK', value: 'Arc Testnet' },
              ].map(row => (
                <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.05)', alignItems: 'center' }}>
                  <span style={{ fontFamily: 'Space Mono, monospace', fontSize: 10, color: 'rgba(232,240,232,0.35)', letterSpacing: '0.1em' }}>{row.label}</span>
                  <span style={{ fontFamily: 'Space Mono, monospace', fontSize: 13, fontWeight: 700, color: '#e8f0e8' }}>{row.value}</span>
                </div>
              ))}
              {error && (
                <div style={{ marginTop: 14, padding: '10px 14px', background: 'rgba(255,51,85,0.08)', border: '1px solid rgba(255,51,85,0.2)', borderRadius: 6, fontFamily: 'Space Mono, monospace', fontSize: 12, color: '#ff3355' }}>⚠ {error}</div>
              )}
              <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                <button onClick={() => setStep('form')} className="btn btn-ghost" style={{ flex: 1 }} disabled={sending}>← BACK</button>
                <button onClick={handleSend} className="btn btn-green" style={{ flex: 1 }} disabled={sending}>
                  {sending ? <><span className="spinner" /> SENDING...</> : 'CONFIRM & SEND'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* FORM */}
        {step === 'form' && (
          <div className="convert-grid">
            <div className="panel">
              <div className="panel-header">
                <div className="panel-title">CONVERT & SEND</div>
                {loadingRates
                  ? <span style={{ fontFamily: 'Space Mono, monospace', fontSize: 10, color: 'rgba(232,240,232,0.3)' }}>LOADING RATES...</span>
                  : <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span className="live-dot" style={{ width: 5, height: 5 }} /><span style={{ fontFamily: 'Space Mono, monospace', fontSize: 10, color: 'rgba(232,240,232,0.3)' }}>LIVE RATES</span></div>
                }
              </div>
              <div style={{ padding: 24 }}>

                {/* Direction toggle */}
                <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
                  {(['toUSDC', 'fromUSDC'] as const).map(d => (
                    <button key={d} onClick={() => { setDirection(d); setAmount(''); }} className={direction === d ? 'btn btn-green' : 'btn btn-ghost'} style={{ flex: 1, fontSize: 11 }}>
                      {d === 'toUSDC' ? `${selectedCurrency} → USDC` : `USDC → ${selectedCurrency}`}
                    </button>
                  ))}
                </div>

                {/* Amount input */}
                <div style={{ marginBottom: 16 }}>
                  <label className="label">{direction === 'toUSDC' ? `AMOUNT IN ${selectedCurrency}` : 'AMOUNT IN USDC'}</label>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <input className="input" type="number" min="0" step="any" placeholder="0.00" value={amount} onChange={e => setAmount(e.target.value)} style={{ flex: 1 }} />
                    {direction === 'toUSDC' && (
                      <select className="select" style={{ width: 110 }} value={selectedCurrency} onChange={e => setSelectedCurrency(e.target.value)}>
                        {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.flag} {c.code}</option>)}
                      </select>
                    )}
                  </div>
                </div>

                {/* Flip */}
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
                  <button onClick={() => { setDirection(d => d === 'toUSDC' ? 'fromUSDC' : 'toUSDC'); setAmount(''); }} className="btn btn-ghost" style={{ fontSize: 18, padding: '6px 20px' }}>⇅</button>
                </div>

                {/* Output */}
                <div style={{ marginBottom: 24 }}>
                  <label className="label">{direction === 'toUSDC' ? 'YOU GET (USDC)' : `EQUIVALENT IN ${selectedCurrency}`}</label>
                  <div style={{ background: 'rgba(0,255,136,0.04)', border: '1px solid rgba(0,255,136,0.15)', borderRadius: 6, padding: '14px 16px', fontFamily: 'Space Mono, monospace', fontWeight: 700, fontSize: 22, color: '#00ff88' }}>
                    {direction === 'toUSDC' ? usdcDisplay : localDisplay}
                    <span style={{ fontSize: 13, color: 'rgba(0,255,136,0.5)', marginLeft: 8 }}>{direction === 'toUSDC' ? 'USDC' : selectedCurrency}</span>
                  </div>
                </div>

                {/* Currency selector for fromUSDC */}
                {direction === 'fromUSDC' && (
                  <div style={{ marginBottom: 24 }}>
                    <label className="label">TARGET CURRENCY</label>
                    <select className="select" value={selectedCurrency} onChange={e => setSelectedCurrency(e.target.value)}>
                      {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.flag} {c.code} — {c.name}</option>)}
                    </select>
                  </div>
                )}

                {/* Rate info */}
                {!loadingRates && (
                  <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 6, padding: '10px 14px', marginBottom: 20, display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontFamily: 'Space Mono, monospace', fontSize: 11, color: 'rgba(232,240,232,0.35)' }}>EXCHANGE RATE</span>
                    <span style={{ fontFamily: 'Space Mono, monospace', fontSize: 12, fontWeight: 700, color: cur?.color }}>1 USDC = {rate.toLocaleString(undefined, { maximumFractionDigits: 4 })} {selectedCurrency}</span>
                  </div>
                )}

                {/* Recipient */}
                <div style={{ marginBottom: 20 }}>
                  <label className="label">RECIPIENT WALLET ADDRESS (ARC)</label>
                  <input className="input" placeholder="0x..." value={recipientAddress} onChange={e => setRecipientAddress(e.target.value)} />
                </div>

                {/* Fee */}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20, fontSize: 12, color: 'rgba(232,240,232,0.35)', fontFamily: 'Space Mono, monospace' }}>
                  <span>NETWORK FEE</span>
                  <span style={{ color: '#00ff88' }}>~$0.01 USDC</span>
                </div>

                <button
                  onClick={() => setStep('confirm')}
                  className="btn btn-green"
                  style={{ width: '100%', fontSize: 14, padding: '14px' }}
                  disabled={!amount || !recipientAddress || usdcAmount <= 0 || loadingRates}
                >
                  PREVIEW TRANSACTION →
                </button>
              </div>
            </div>

            {/* Side panel */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div className="panel">
                <div className="panel-header"><div className="panel-title">QUICK RATES</div></div>
                <div style={{ padding: '8px 0' }}>
                  {CURRENCIES.map(c => {
                    const r = rates[c.code] ?? 0;
                    return (
                      <button key={c.code} onClick={() => { setSelectedCurrency(c.code); setAmount(''); }} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', background: selectedCurrency === c.code ? 'rgba(0,255,136,0.06)' : 'transparent', border: 'none', borderLeft: selectedCurrency === c.code ? '2px solid #00ff88' : '2px solid transparent', cursor: 'pointer', transition: 'all 0.15s' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 16 }}>{c.flag}</span>
                          <span style={{ fontFamily: 'Space Mono, monospace', fontSize: 12, fontWeight: 700, color: c.color }}>{c.code}</span>
                        </div>
                        <span style={{ fontFamily: 'Space Mono, monospace', fontSize: 12, color: 'rgba(232,240,232,0.5)' }}>{r > 0 ? r.toLocaleString(undefined, { maximumFractionDigits: 2 }) : '—'}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="panel" style={{ padding: 16 }}>
                <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 10, color: '#00ff88', letterSpacing: '0.15em', marginBottom: 10 }}>⚡ WHY ARC?</div>
                {[
                  { label: 'Settlement', value: '< 1 second' },
                  { label: 'Gas fee', value: '~$0.01' },
                  { label: 'Token', value: 'USDC / EURC' },
                  { label: 'Finality', value: 'Deterministic' },
                ].map(i => (
                  <div key={i.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <span style={{ fontFamily: 'Space Mono, monospace', fontSize: 10, color: 'rgba(232,240,232,0.3)' }}>{i.label}</span>
                    <span style={{ fontFamily: 'Space Mono, monospace', fontSize: 11, fontWeight: 700, color: '#e8f0e8' }}>{i.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}