'use client';
import { useEffect, useState } from 'react';
import { arcSend } from '@/lib/arc';
import { useWallet } from '@/context/WalletContext';
import { callContract, CONTRACTS, RATES_ABI, INVOICE_ABI } from '@/lib/contracts';

const CURRENCIES = [
  { code: 'NGN', name: 'Nigerian Naira',     flag: '🇳🇬', color: '#0a8a4f' },
  { code: 'GHS', name: 'Ghanaian Cedi',      flag: '🇬🇭', color: '#0284c7' },
  { code: 'KES', name: 'Kenyan Shilling',    flag: '🇰🇪', color: '#b45f06' },
  { code: 'ZAR', name: 'South African Rand', flag: '🇿🇦', color: '#7c3aed' },
  { code: 'EUR', name: 'Euro',               flag: '🇪🇺', color: '#0891b2' },
  { code: 'GBP', name: 'British Pound',      flag: '🇬🇧', color: '#dc2626' },
  { code: 'CAD', name: 'Canadian Dollar',    flag: '🇨🇦', color: '#b45f06' },
  { code: 'AED', name: 'UAE Dirham',         flag: '🇦🇪', color: '#0a8a4f' },
];

// Core text tones tuned for a WHITE page background (was previously light-on-light)
const TEXT = {
  faint:  'rgba(15,26,20,0.45)',   // small labels / meta
  muted:  'rgba(15,26,20,0.62)',   // secondary copy
  strong: '#0d1f16',                // headings / primary values
};
const GREEN = '#059669';     // was #00ff88 — darker for AA contrast on white
const GREEN_BG = 'rgba(5,150,105,0.08)';
const GREEN_BORDER = 'rgba(5,150,105,0.28)';
const BLUE = '#0284c7';       // was #00aaff
const RED = '#dc2626';        // was #ff3355

type Direction = 'toUSDC' | 'fromUSDC';
type Step = 'form' | 'confirm' | 'success';

export default function ConvertPage() {
  const { address, connect } = useWallet();
  const [rates, setRates] = useState<Record<string, number>>({});
  const [loadingRates, setLoadingRates] = useState(true);
  const [selectedCurrency, setSelectedCurrency] = useState('NGN');
  const [amount, setAmount] = useState('');
  const [direction, setDirection] = useState<Direction>('toUSDC');
  const [recipientAddress, setRecipientAddress] = useState('');
  const [sending, setSending] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [explorerUrl, setExplorerUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<Step>('form');

  useEffect(() => {
    fetch('https://api.exchangerate-api.com/v4/latest/USD')
      .then(r => r.json())
      .then(d => {
        setRates(d.rates);
        setLoadingRates(false);
        // Record rates onchain
        const currencies = ['NGN', 'GHS', 'KES', 'EUR', 'GBP', 'ZAR'];
        currencies.forEach(async (code) => {
          const rateVal = d.rates[code];
          if (rateVal) {
            try {
              await callContract(
                CONTRACTS.ArcRatesRegistry,
                RATES_ABI,
                'recordRate',
                [code, BigInt(Math.floor(rateVal * 10000))]
              );
            } catch (e) {
              // Silent fail — rates recording is best effort
            }
          }
        });
      })
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
    if (!address) { await connect(); return; }
    if (!recipientAddress || !amount || usdcAmount <= 0) return;
    setSending(true);
    setError(null);
    try {
      const res = await arcSend(recipientAddress, usdcAmount.toFixed(6), 'USDC');

      // Record conversion on ArcRatesRegistry contract
      try {
        await callContract(
          CONTRACTS.ArcRatesRegistry,
          RATES_ABI,
          'recordConversion',
          [
            direction === 'toUSDC' ? selectedCurrency : 'USDC',
            direction === 'toUSDC' ? 'USDC' : selectedCurrency,
            BigInt(Math.floor(numAmount * 10000)),
            BigInt(Math.floor(usdcAmount * 10000)),
            BigInt(Math.floor(rate * 10000)),
            recipientAddress as `0x${string}`,
            res.txHash,
          ]
        );
      } catch (contractErr) {
        console.log('Contract record:', contractErr);
      }

      // Also create an invoice record on ArcInvoiceRegistry
      try {
        await callContract(
          CONTRACTS.ArcInvoiceRegistry,
          INVOICE_ABI,
          'createInvoice',
          [
            BigInt(Math.floor(usdcAmount * 100)),
            'USDC',
            `Convert ${numAmount} ${selectedCurrency} → USDC`,
            selectedCurrency,
            BigInt(Math.floor(rate * 10000)),
          ]
        );
      } catch (contractErr) {
        console.log('Invoice record:', contractErr);
      }

      setTxHash(res.txHash);
      setExplorerUrl(res.explorerUrl);
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
    setExplorerUrl(null);
    setError(null);
  }

  return (
    <>
      <style>{`
        .convert-grid { display: grid; grid-template-columns: 1fr 300px; gap: 20px; align-items: start; }
        @media (max-width: 900px) { .convert-grid { grid-template-columns: 1fr; } }
        @media (max-width: 480px) {
          .convert-page { padding: 16px 16px 60px !important; }
          .convert-page h1 { font-size: 22px !important; }
          .convert-header { flex-direction: column; align-items: stretch !important; }
          .convert-header .btn { width: 100%; text-align: center; }
          .row-toggle { flex-direction: column !important; }
          .amount-row { flex-direction: column !important; }
          .amount-row select { width: 100% !important; }
          .confirm-row { flex-direction: column !important; align-items: flex-start !important; gap: 4px !important; }
          .confirm-row span:last-child { font-size: 12px !important; word-break: break-all; }
          .action-row { flex-direction: column !important; }
        }
      `}</style>

      <div className="convert-page" style={{ padding: '24px 24px 60px', maxWidth: 1100, margin: '0 auto', position: 'relative', zIndex: 1 }}>

        {/* Header */}
        <div className="convert-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 10, color: TEXT.faint, letterSpacing: '0.2em', marginBottom: 6 }}>ARC TERMINAL · CONVERT</div>
            <h1 style={{ fontSize: 28, fontWeight: 700, color: TEXT.strong, letterSpacing: '-0.02em', marginBottom: 4 }}>Currency Converter</h1>
            <p style={{ fontSize: 13, color: TEXT.muted }}>Convert any currency to USDC and send via Arc — sub-second settlement</p>
          </div>
          {!address
            ? <button onClick={connect} className="btn btn-green" style={{ fontSize: 11 }}>🦊 CONNECT WALLET</button>
            : <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 11, color: GREEN, padding: '6px 12px', borderRadius: 6, background: GREEN_BG, border: `1px solid ${GREEN_BORDER}` }}>{address.slice(0, 6)}…{address.slice(-4)}</div>
          }
        </div>

        {/* SUCCESS */}
        {step === 'success' && (
          <div className="panel" style={{ padding: 40, textAlign: 'center', maxWidth: 560, margin: '0 auto' }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>✅</div>
            <div style={{ fontFamily: 'Space Mono, monospace', fontWeight: 700, fontSize: 20, color: GREEN, marginBottom: 8 }}>TRANSACTION SENT</div>
            <div style={{ fontSize: 14, color: TEXT.muted, marginBottom: 24 }}>{usdcDisplay} USDC sent successfully on Arc</div>
            <div style={{ background: 'rgba(15,26,20,0.04)', borderRadius: 8, padding: '14px 16px', marginBottom: 16, textAlign: 'left' }}>
              <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 10, color: TEXT.faint, marginBottom: 6 }}>TX HASH</div>
              <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 11, color: GREEN, wordBreak: 'break-all' }}>{txHash}</div>
            </div>
            <div style={{ background: 'rgba(2,132,199,0.06)', borderRadius: 8, padding: '10px 16px', marginBottom: 24, textAlign: 'left' }}>
              <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 10, color: TEXT.faint, marginBottom: 4 }}>RECORDED ON</div>
              <a href={`https://testnet.arcscan.app/address/${CONTRACTS.ArcRatesRegistry}`} target="_blank" rel="noopener noreferrer"
                style={{ fontFamily: 'Space Mono, monospace', fontSize: 11, color: BLUE, textDecoration: 'none' }}>
                ArcRatesRegistry ↗
              </a>
            </div>
            <div className="action-row" style={{ display: 'flex', gap: 10 }}>
              <a href={explorerUrl || '#'} target="_blank" rel="noopener noreferrer" className="btn btn-green" style={{ flex: 1, fontSize: 12 }}>VIEW ON ARCSCAN ↗</a>
              <button onClick={reset} className="btn btn-ghost" style={{ flex: 1, fontSize: 12 }}>NEW CONVERSION</button>
            </div>
          </div>
        )}

        {/* CONFIRM */}
        {step === 'confirm' && (
          <div className="panel" style={{ maxWidth: 560, margin: '0 auto' }}>
            <div className="panel-header"><div className="panel-title">CONFIRM TRANSACTION</div></div>
            <div style={{ padding: 24 }}>
              {[
                { label: 'YOU SEND', value: direction === 'fromUSDC' ? `${numAmount} USDC` : `${localDisplay} ${selectedCurrency}` },
                { label: 'RECIPIENT GETS', value: `${usdcDisplay} USDC` },
                { label: 'EXCHANGE RATE', value: `1 USDC = ${rate.toLocaleString()} ${selectedCurrency}` },
                { label: 'NETWORK FEE', value: '~$0.01 USDC (Arc Testnet)' },
                { label: 'RECIPIENT', value: `${recipientAddress.slice(0, 10)}...${recipientAddress.slice(-8)}` },
                { label: 'NETWORK', value: 'Arc Testnet' },
                { label: 'CONTRACT', value: 'ArcRatesRegistry' },
              ].map(row => (
                <div key={row.label} className="confirm-row" style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid rgba(15,26,20,0.08)', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                  <span style={{ fontFamily: 'Space Mono, monospace', fontSize: 10, color: TEXT.faint, letterSpacing: '0.1em' }}>{row.label}</span>
                  <span style={{ fontFamily: 'Space Mono, monospace', fontSize: 13, fontWeight: 700, color: TEXT.strong }}>{row.value}</span>
                </div>
              ))}
              {error && (
                <div style={{ marginTop: 14, padding: '10px 14px', background: 'rgba(220,38,38,0.06)', border: `1px solid rgba(220,38,38,0.25)`, borderRadius: 6, fontFamily: 'Space Mono, monospace', fontSize: 12, color: RED }}>⚠ {error}</div>
              )}
              <div className="action-row" style={{ display: 'flex', gap: 10, marginTop: 20 }}>
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
                  ? <span style={{ fontFamily: 'Space Mono, monospace', fontSize: 10, color: TEXT.faint }}>LOADING RATES...</span>
                  : <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span className="live-dot" style={{ width: 5, height: 5 }} /><span style={{ fontFamily: 'Space Mono, monospace', fontSize: 10, color: TEXT.faint }}>LIVE RATES</span></div>
                }
              </div>
              <div style={{ padding: 24 }}>
                <div className="row-toggle" style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
                  {(['toUSDC', 'fromUSDC'] as Direction[]).map(d => (
                    <button key={d} onClick={() => { setDirection(d); setAmount(''); }} className={direction === d ? 'btn btn-green' : 'btn btn-ghost'} style={{ flex: 1, fontSize: 11 }}>
                      {d === 'toUSDC' ? `${selectedCurrency} → USDC` : `USDC → ${selectedCurrency}`}
                    </button>
                  ))}
                </div>
                <div style={{ marginBottom: 16 }}>
                  <label className="label">{direction === 'toUSDC' ? `AMOUNT IN ${selectedCurrency}` : 'AMOUNT IN USDC'}</label>
                  <div className="amount-row" style={{ display: 'flex', gap: 10 }}>
                    <input className="input" type="number" min="0" step="any" placeholder="0.00" value={amount} onChange={e => setAmount(e.target.value)} style={{ flex: 1 }} />
                    {direction === 'toUSDC' && (
                      <select className="select" style={{ width: 110 }} value={selectedCurrency} onChange={e => setSelectedCurrency(e.target.value)}>
                        {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.flag} {c.code}</option>)}
                      </select>
                    )}
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
                  <button onClick={() => { setDirection(d => d === 'toUSDC' ? 'fromUSDC' : 'toUSDC'); setAmount(''); }} className="btn btn-ghost" style={{ fontSize: 18, padding: '6px 20px' }}>⇅</button>
                </div>
                <div style={{ marginBottom: 24 }}>
                  <label className="label">{direction === 'toUSDC' ? 'YOU GET (USDC)' : `EQUIVALENT IN ${selectedCurrency}`}</label>
                  <div style={{ background: GREEN_BG, border: `1px solid ${GREEN_BORDER}`, borderRadius: 6, padding: '14px 16px', fontFamily: 'Space Mono, monospace', fontWeight: 700, fontSize: 22, color: GREEN, overflowWrap: 'anywhere' }}>
                    {direction === 'toUSDC' ? usdcDisplay : localDisplay}
                    <span style={{ fontSize: 13, color: 'rgba(5,150,105,0.7)', marginLeft: 8 }}>{direction === 'toUSDC' ? 'USDC' : selectedCurrency}</span>
                  </div>
                </div>
                {direction === 'fromUSDC' && (
                  <div style={{ marginBottom: 24 }}>
                    <label className="label">TARGET CURRENCY</label>
                    <select className="select" value={selectedCurrency} onChange={e => setSelectedCurrency(e.target.value)}>
                      {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.flag} {c.code} — {c.name}</option>)}
                    </select>
                  </div>
                )}
                {!loadingRates && (
                  <div style={{ background: 'rgba(15,26,20,0.03)', borderRadius: 6, padding: '10px 14px', marginBottom: 20, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 6 }}>
                    <span style={{ fontFamily: 'Space Mono, monospace', fontSize: 11, color: TEXT.faint }}>EXCHANGE RATE</span>
                    <span style={{ fontFamily: 'Space Mono, monospace', fontSize: 12, fontWeight: 700, color: cur?.color }}>1 USDC = {rate.toLocaleString(undefined, { maximumFractionDigits: 4 })} {selectedCurrency}</span>
                  </div>
                )}
                <div style={{ marginBottom: 20 }}>
                  <label className="label">RECIPIENT WALLET ADDRESS (ARC)</label>
                  <input className="input" placeholder="0x..." value={recipientAddress} onChange={e => setRecipientAddress(e.target.value)} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20, fontSize: 12, color: TEXT.faint, fontFamily: 'Space Mono, monospace' }}>
                  <span>NETWORK FEE</span>
                  <span style={{ color: GREEN }}>~$0.01 USDC</span>
                </div>
                <button
                  onClick={() => {
                    if (!address) { connect(); return; }
                    if (!amount || !recipientAddress || usdcAmount <= 0) return;
                    setStep('confirm');
                  }}
                  className="btn btn-green"
                  style={{ width: '100%', fontSize: 14, padding: '14px' }}
                  disabled={!amount || !recipientAddress || usdcAmount <= 0 || loadingRates}
                >
                  {!address ? '🦊 CONNECT WALLET' : 'PREVIEW TRANSACTION →'}
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
                      <button key={c.code} onClick={() => { setSelectedCurrency(c.code); setAmount(''); }} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', background: selectedCurrency === c.code ? GREEN_BG : 'transparent', border: 'none', borderLeft: selectedCurrency === c.code ? `2px solid ${GREEN}` : '2px solid transparent', cursor: 'pointer', transition: 'all 0.15s' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 16 }}>{c.flag}</span>
                          <span style={{ fontFamily: 'Space Mono, monospace', fontSize: 12, fontWeight: 700, color: c.color }}>{c.code}</span>
                        </div>
                        <span style={{ fontFamily: 'Space Mono, monospace', fontSize: 12, color: TEXT.muted }}>
                          {r > 0 ? r.toLocaleString(undefined, { maximumFractionDigits: 2 }) : '—'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="panel" style={{ padding: 16 }}>
                <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 10, color: GREEN, letterSpacing: '0.15em', marginBottom: 10 }}>⚡ WHY ARC?</div>
                {[
                  { label: 'Settlement', value: '< 1 second' },
                  { label: 'Gas fee', value: '~$0.01' },
                  { label: 'Token', value: 'USDC / EURC' },
                  { label: 'Finality', value: 'Deterministic' },
                  { label: 'Contract', value: 'ArcRatesRegistry' },
                ].map(i => (
                  <div key={i.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid rgba(15,26,20,0.06)' }}>
                    <span style={{ fontFamily: 'Space Mono, monospace', fontSize: 10, color: TEXT.faint }}>{i.label}</span>
                    <span style={{ fontFamily: 'Space Mono, monospace', fontSize: 11, fontWeight: 700, color: TEXT.strong }}>{i.value}</span>
                  </div>
                ))}
                <a href={`https://testnet.arcscan.app/address/${CONTRACTS.ArcRatesRegistry}`} target="_blank" rel="noopener noreferrer"
                  style={{ display: 'block', marginTop: 12, fontFamily: 'Space Mono, monospace', fontSize: 10, color: BLUE, textDecoration: 'none' }}>
                  VIEW CONTRACT ↗
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}