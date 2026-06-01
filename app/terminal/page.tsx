'use client';
import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { arcSend, arcSwap, arcBridge, BRIDGE_CHAINS } from '@/lib/arc';
import { saveTx } from '@/lib/supabase';
import { useWallet } from '@/context/WalletContext';

type Tab = 'send' | 'swap' | 'bridge';

function TerminalContent() {
  const params = useSearchParams();
  const { address, balances, connect, refreshBalances } = useWallet();
  const [tab, setTab] = useState<Tab>((params.get('tab') as Tab) || 'send');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ txHash: string; explorerUrl: string; amount: string; token?: string } | null>(null);
  const [error, setError] = useState('');

  const [sendTo, setSendTo] = useState('');
  const [sendAmount, setSendAmount] = useState('');
  const [sendToken, setSendToken] = useState<'USDC' | 'EURC'>('USDC');

  const [swapIn, setSwapIn] = useState<'USDC' | 'EURC'>('USDC');
  const [swapOut, setSwapOut] = useState<'EURC' | 'USDC'>('EURC');
  const [swapAmount, setSwapAmount] = useState('');
  const [kitKey] = useState(process.env.NEXT_PUBLIC_CIRCLE_KIT_KEY || '');

  const [bridgeFrom, setBridgeFrom] = useState('Ethereum_Sepolia');
  const [bridgeTo, setBridgeTo] = useState('Arc_Testnet');
  const [bridgeAmount, setBridgeAmount] = useState('');
  const [bridgeRecipient, setBridgeRecipient] = useState(address || '');

  async function handleSend() {
    if (!address) { await connect(); return; }
    if (!sendTo || !sendAmount) { setError('Enter recipient and amount'); return; }
    setLoading(true); setError(''); setResult(null);
    try {
      const res = await arcSend(sendTo, sendAmount, sendToken);
      await saveTx({ wallet: address.toLowerCase(), type: 'send', token_in: sendToken, token_out: sendToken, amount: sendAmount, from_chain: 'Arc_Testnet', to_chain: 'Arc_Testnet', to_address: sendTo, tx_hash: res.txHash, explorer_url: res.explorerUrl, status: 'success' });
      setResult({ txHash: res.txHash, explorerUrl: res.explorerUrl, amount: sendAmount, token: sendToken });
      await refreshBalances();
      setSendTo(''); setSendAmount('');
    } catch (e: unknown) { setError(e instanceof Error ? e.message : 'Send failed'); }
    finally { setLoading(false); }
  }

  async function handleSwap() {
    if (!address) { await connect(); return; }
    if (!swapAmount) { setError('Enter amount'); return; }
    if (!kitKey) { setError('Circle API key not configured'); return; }
    setLoading(true); setError(''); setResult(null);
    try {
      const res = await arcSwap(swapIn, swapOut, swapAmount, kitKey);
      await saveTx({ wallet: address.toLowerCase(), type: 'swap', token_in: swapIn, token_out: swapOut, amount: swapAmount, from_chain: 'Arc_Testnet', to_chain: 'Arc_Testnet', to_address: address, tx_hash: res.txHash, explorer_url: res.explorerUrl, status: 'success' });
      setResult({ txHash: res.txHash, explorerUrl: res.explorerUrl, amount: swapAmount, token: `${swapIn} → ${swapOut}` });
      await refreshBalances();
      setSwapAmount('');
    } catch (e: unknown) { setError(e instanceof Error ? e.message : 'Swap failed'); }
    finally { setLoading(false); }
  }

  async function handleBridge() {
    if (!address) { await connect(); return; }
    if (!bridgeAmount || !bridgeRecipient) { setError('Enter amount and recipient'); return; }
    setLoading(true); setError(''); setResult(null);
    try {
      const res = await arcBridge(bridgeFrom, bridgeTo, bridgeAmount, bridgeRecipient);
      await saveTx({ wallet: address.toLowerCase(), type: 'bridge', token_in: 'USDC', token_out: 'USDC', amount: bridgeAmount, from_chain: bridgeFrom, to_chain: bridgeTo, to_address: bridgeRecipient, tx_hash: res.txHash, explorer_url: res.explorerUrl, status: 'success' });
      setResult({ txHash: res.txHash, explorerUrl: res.explorerUrl, amount: bridgeAmount, token: `${bridgeFrom} → ${bridgeTo}` });
      setBridgeAmount('');
    } catch (e: unknown) { setError(e instanceof Error ? e.message : 'Bridge failed'); }
    finally { setLoading(false); }
  }

  const tabs: { id: Tab; label: string; color: string }[] = [
    { id: 'send', label: 'SEND', color: '#00ff88' },
    { id: 'swap', label: 'SWAP', color: '#00aaff' },
    { id: 'bridge', label: 'BRIDGE', color: '#ffaa00' },
  ];

  const displayBalances = balances || { usdc: '0.00', eurc: '0.00' };

  return (
    <div className="wrap" style={{ padding: '32px 24px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 20, alignItems: 'start' }}>
        <div>
          <div className="panel" style={{ marginBottom: 16, padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: 32 }}>
              {[
                { label: 'USDC BALANCE', value: `$${displayBalances.usdc}`, color: '#00ff88' },
                { label: 'EURC BALANCE', value: `€${displayBalances.eurc}`, color: '#00aaff' },
              ].map(b => (
                <div key={b.label}>
                  <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 9, color: 'rgba(232,240,232,0.3)', letterSpacing: '0.1em', marginBottom: 3 }}>{b.label}</div>
                  <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 20, fontWeight: 700, color: b.color }}>{b.value}</div>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              {address ? (
                <>
                  <button className="btn btn-ghost" onClick={refreshBalances} style={{ fontSize: 11, padding: '6px 14px' }}>↻ REFRESH</button>
                  <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 11, color: '#00ff88', padding: '6px 12px', borderRadius: 6, background: 'rgba(0,255,136,0.06)', border: '1px solid rgba(0,255,136,0.2)' }}>
                    {address.slice(0, 6)}…{address.slice(-4)}
                  </div>
                </>
              ) : (
                <button className="btn btn-green" onClick={connect} style={{ fontSize: 11 }}>🦊 CONNECT</button>
              )}
            </div>
          </div>

          <div className="panel" style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
              {tabs.map(t => (
                <button key={t.id} onClick={() => { setTab(t.id); setResult(null); setError(''); }}
                  style={{ flex: 1, padding: '14px', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Space Mono, monospace', fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', color: tab === t.id ? t.color : 'rgba(232,240,232,0.3)', borderBottom: tab === t.id ? `2px solid ${t.color}` : '2px solid transparent', transition: 'all 0.15s' }}>
                  {t.label}
                </button>
              ))}
            </div>

            <div style={{ padding: 24 }}>
              {tab === 'send' && (
                <div className="animate-fade-in">
                  <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 10, color: 'rgba(232,240,232,0.3)', marginBottom: 20, lineHeight: 1.6 }}>
                    Transfer USDC or EURC to any Arc wallet. Settles in under 1 second.
                  </div>
                  <div style={{ marginBottom: 16 }}>
                    <label className="label">TOKEN</label>
                    <div style={{ display: 'flex', gap: 8 }}>
                      {(['USDC', 'EURC'] as const).map(t => (
                        <button key={t} onClick={() => setSendToken(t)}
                          style={{ flex: 1, padding: '10px', borderRadius: 6, border: sendToken === t ? `1px solid ${t === 'USDC' ? '#00ff88' : '#00aaff'}` : '1px solid rgba(255,255,255,0.07)', background: sendToken === t ? (t === 'USDC' ? 'rgba(0,255,136,0.08)' : 'rgba(0,170,255,0.08)') : 'transparent', color: sendToken === t ? (t === 'USDC' ? '#00ff88' : '#00aaff') : 'rgba(232,240,232,0.4)', fontFamily: 'Space Mono, monospace', fontWeight: 700, fontSize: 13, cursor: 'pointer', transition: 'all 0.15s' }}>
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div style={{ marginBottom: 16 }}>
                    <label className="label">RECIPIENT ADDRESS</label>
                    <input className="input" value={sendTo} onChange={e => setSendTo(e.target.value)} placeholder="0x…" />
                  </div>
                  <div style={{ marginBottom: 20 }}>
                    <label className="label">AMOUNT ({sendToken})</label>
                    <input className="input" type="number" value={sendAmount} onChange={e => setSendAmount(e.target.value)} placeholder="1.00" min="0.01" step="0.01" />
                  </div>
                  <button className="btn btn-green" style={{ width: '100%', fontSize: 13, padding: '13px' }} onClick={handleSend} disabled={loading}>
                    {loading ? <><span className="spinner" /> SENDING…</> : `⚡ SEND ${sendAmount || '0'} ${sendToken}`}
                  </button>
                </div>
              )}

              {tab === 'swap' && (
                <div className="animate-fade-in">
                  <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 10, color: 'rgba(232,240,232,0.3)', marginBottom: 20, lineHeight: 1.6 }}>
                    Swap USDC↔EURC on Arc — powered by Circle.
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 10, alignItems: 'end', marginBottom: 16 }}>
                    <div>
                      <label className="label">FROM</label>
                      <select className="select" value={swapIn} onChange={e => { setSwapIn(e.target.value as 'USDC' | 'EURC'); setSwapOut(e.target.value === 'USDC' ? 'EURC' : 'USDC'); }}>
                        <option value="USDC">USDC</option>
                        <option value="EURC">EURC</option>
                      </select>
                    </div>
                    <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 18, color: '#00aaff', paddingBottom: 2 }}>⇄</div>
                    <div>
                      <label className="label">TO</label>
                      <div className="input" style={{ color: '#00aaff', display: 'flex', alignItems: 'center' }}>{swapOut}</div>
                    </div>
                  </div>
                  <div style={{ marginBottom: 20 }}>
                    <label className="label">AMOUNT ({swapIn})</label>
                    <input className="input" type="number" value={swapAmount} onChange={e => setSwapAmount(e.target.value)} placeholder="1.00" />
                  </div>
                  <button className="btn btn-blue" style={{ width: '100%', fontSize: 13, padding: '13px' }} onClick={handleSwap} disabled={loading}>
                    {loading ? <><span className="spinner" style={{ borderTopColor: '#00aaff' }} /> SWAPPING…</> : `🔄 SWAP ${swapAmount || '0'} ${swapIn} → ${swapOut}`}
                  </button>
                </div>
              )}

              {tab === 'bridge' && (
                <div className="animate-fade-in">
                  <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 10, color: 'rgba(232,240,232,0.3)', marginBottom: 20, lineHeight: 1.6 }}>
                    Bridge USDC cross-chain via Circle CCTP. Native USDC — no wrapped tokens.
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 10, alignItems: 'end', marginBottom: 16 }}>
                    <div>
                      <label className="label">FROM CHAIN</label>
                      <select className="select" value={bridgeFrom} onChange={e => setBridgeFrom(e.target.value)}>
                        {BRIDGE_CHAINS.map(c => <option key={c.id} value={c.id}>{c.icon} {c.label}</option>)}
                      </select>
                    </div>
                    <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 16, color: '#ffaa00', paddingBottom: 2 }}>→</div>
                    <div>
                      <label className="label">TO CHAIN</label>
                      <select className="select" value={bridgeTo} onChange={e => setBridgeTo(e.target.value)}>
                        {BRIDGE_CHAINS.map(c => <option key={c.id} value={c.id}>{c.icon} {c.label}</option>)}
                      </select>
                    </div>
                  </div>
                  <div style={{ marginBottom: 16 }}>
                    <label className="label">AMOUNT (USDC)</label>
                    <input className="input" type="number" value={bridgeAmount} onChange={e => setBridgeAmount(e.target.value)} placeholder="10.00" />
                  </div>
                  <div style={{ marginBottom: 20 }}>
                    <label className="label">RECIPIENT ADDRESS</label>
                    <input className="input" value={bridgeRecipient} onChange={e => setBridgeRecipient(e.target.value)} placeholder="0x…" />
                  </div>
                  <div style={{ marginBottom: 16, padding: '10px 14px', borderRadius: 6, background: 'rgba(255,170,0,0.06)', border: '1px solid rgba(255,170,0,0.15)', fontFamily: 'Space Mono, monospace', fontSize: 11, color: 'rgba(232,240,232,0.4)', lineHeight: 1.5 }}>
                    ⚠ Bridge uses CCTP attestation — may take 10–20 seconds for cross-chain confirmation
                  </div>
                  <button className="btn btn-amber" style={{ width: '100%', fontSize: 13, padding: '13px' }} onClick={handleBridge} disabled={loading}>
                    {loading ? <><span className="spinner" style={{ borderTopColor: '#ffaa00' }} /> BRIDGING…</> : `🌉 BRIDGE ${bridgeAmount || '0'} USDC`}
                  </button>
                </div>
              )}

              {error && (
                <div className="animate-fade-in" style={{ marginTop: 16, padding: '12px 16px', borderRadius: 6, background: 'rgba(255,51,85,0.08)', border: '1px solid rgba(255,51,85,0.2)', fontFamily: 'Space Mono, monospace', fontSize: 12, color: '#ff3355' }}>
                  ✗ {error}
                </div>
              )}

              {result && (
                <div className="animate-fade-in" style={{ marginTop: 16, padding: '16px', borderRadius: 6, background: 'rgba(0,255,136,0.06)', border: '1px solid rgba(0,255,136,0.25)' }}>
                  <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 11, color: '#00ff88', fontWeight: 700, marginBottom: 8 }}>✓ TRANSACTION CONFIRMED</div>
                  <div style={{ fontSize: 11, color: 'rgba(232,240,232,0.4)', marginBottom: 6, fontFamily: 'Space Mono, monospace' }}>
                    {result.amount} {result.token} · Arc Network · &lt;1s settlement
                  </div>
                  <a href={result.explorerUrl} target="_blank" rel="noopener noreferrer" style={{ fontFamily: 'Space Mono, monospace', fontSize: 11, color: '#00aaff' }}>
                    ↗ {result.txHash.slice(0, 28)}…
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="panel">
            <div className="panel-header">
              <div className="panel-title">QUICK LINKS</div>
            </div>
            <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { href: '/portfolio', label: '📊 View Portfolio', color: '#aa55ff' },
                { href: '/history', label: '📜 Transaction History', color: '#00ddff' },
                { href: '/markets', label: '📈 Market Stats', color: '#ff3355' },
                { href: 'https://faucet.circle.com', label: '💧 Get Testnet USDC', color: '#ffaa00' },
                { href: 'https://testnet.arcscan.app', label: '🔍 Arcscan Explorer', color: '#00aaff' },
              ].map(l => (
                <a key={l.label} href={l.href} target={l.href.startsWith('http') ? '_blank' : '_self'} rel="noopener noreferrer"
                  style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 6, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', fontFamily: 'Space Mono, monospace', fontSize: 11, color: l.color, textDecoration: 'none', transition: 'all 0.15s' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(255,255,255,0.05)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(255,255,255,0.02)'; }}>
                  {l.label}
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TerminalPage() {
  return (
    <Suspense fallback={<div className="wrap" style={{ padding: '32px 24px', color: 'rgba(232,240,232,0.4)', fontFamily: 'Space Mono, monospace' }}>Loading terminal…</div>}>
      <TerminalContent />
    </Suspense>
  );
}