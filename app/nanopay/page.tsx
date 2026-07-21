'use client';
import { useState, useEffect, useRef } from 'react';
import { arcSend } from '@/lib/arc';
import { useWallet } from '@/context/WalletContext';
import { callContract, CONTRACTS, NANOPAY_ABI } from '@/lib/contracts';

interface NanoService {
  id: string;
  name: string;
  description: string;
  pricePerCall: number;
  category: string;
  icon: string;
  calls: number;
  earned: number;
  wallet: string;
}

interface NanoTransaction {
  id: string;
  from: string;
  to: string;
  service: string;
  amount: number;
  timestamp: string;
  txHash: string;
  explorerUrl: string;
  status: 'confirmed';
}

interface StreamSession {
  serviceId: string;
  serviceName: string;
  pricePerCall: number;
  callsThisSession: number;
  totalSpent: number;
  active: boolean;
  contractSessionId?: number;
}

function shortId() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

const DEMO_SERVICES: NanoService[] = [
  { id: shortId(), name: 'Arc Price Oracle', description: 'Real-time USDC price feeds. Pay per query.', pricePerCall: 0.01, category: 'Data', icon: '📡', calls: 0, earned: 0, wallet: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48' },
  { id: shortId(), name: 'AI Translation API', description: 'Translate text to any language. Pay per call.', pricePerCall: 0.01, category: 'AI', icon: '🌍', calls: 0, earned: 0, wallet: '0xB8c77482e45F1F44dE1745F52C74426C631bDD52' },
  { id: shortId(), name: 'KYC Verification', description: 'Instant wallet risk scoring. Pay per check.', pricePerCall: 0.05, category: 'Compliance', icon: '🔒', calls: 0, earned: 0, wallet: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2' },
  { id: shortId(), name: 'Weather Data Feed', description: 'Live weather for any city. Pay per API call.', pricePerCall: 0.01, category: 'Data', icon: '🌤', calls: 0, earned: 0, wallet: '0xdAC17F958D2ee523a2206206994597C13D831ec7' },
  { id: shortId(), name: 'Agent Compute Unit', description: 'Serverless compute for AI agents. Pay per execution.', pricePerCall: 0.02, category: 'Compute', icon: '⚙️', calls: 0, earned: 0, wallet: '0xE41d2489571d322189246DaFA5ebDe1F4699F498' },
  { id: shortId(), name: 'USDC Routing Engine', description: 'Optimal payment routing across chains. Pay per route.', pricePerCall: 0.03, category: 'Finance', icon: '🔀', calls: 0, earned: 0, wallet: '0xF629cBd94d3791C9250152BD8dfBDF380E2a3B9c' },
];

const CATEGORY_COLORS: Record<string, string> = {
  Data: '#2563eb', AI: '#7c3aed', Compliance: '#d97706', Compute: '#0891b2', Finance: '#16a34a',
};

export default function NanopayPage() {
  const { address, connect } = useWallet();
  const [services, setServices] = useState<NanoService[]>(DEMO_SERVICES);
  const [transactions, setTransactions] = useState<NanoTransaction[]>([]);
  const [session, setSession] = useState<StreamSession | null>(null);
  const [totalSpent, setTotalSpent] = useState(0);
  const [totalCalls, setTotalCalls] = useState(0);
  const [view, setView] = useState<'marketplace' | 'stream' | 'history'>('marketplace');
  const [paying, setPaying] = useState<string | null>(null);
  const [error, setError] = useState('');
  const sessionRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => { if (sessionRef.current) clearInterval(sessionRef.current); };
  }, []);

  async function singleCall(service: NanoService) {
    if (!address) { await connect(); return; }
    setPaying(service.id); setError('');
    try {
      const res = await arcSend(service.wallet, service.pricePerCall.toFixed(6), 'USDC');
      try {
        await callContract(CONTRACTS.ArcNanopayRegistry, NANOPAY_ABI, 'recordNanoPayment', [BigInt(0), service.wallet as `0x${string}`, BigInt(Math.floor(service.pricePerCall * 1000000)), res.txHash, 'single']);
      } catch (contractErr) { console.log('Contract record:', contractErr); }
      const tx: NanoTransaction = { id: shortId(), from: address, to: service.wallet.slice(0, 12) + '...', service: service.name, amount: service.pricePerCall, timestamp: new Date().toLocaleTimeString(), txHash: res.txHash, explorerUrl: res.explorerUrl, status: 'confirmed' };
      setTransactions(prev => [tx, ...prev.slice(0, 49)]);
      setServices(prev => prev.map(s => s.id === service.id ? { ...s, calls: s.calls + 1, earned: s.earned + s.pricePerCall } : s));
      setTotalSpent(t => t + service.pricePerCall);
      setTotalCalls(t => t + 1);
    } catch (e: any) { setError(e?.message || 'Payment failed'); }
    setPaying(null);
  }

  async function startStream(service: NanoService) {
    if (!address) { await connect(); return; }
    if (session?.active) stopStream();
    setView('stream'); setError('');
    let contractSessionId = 0;
    try { await callContract(CONTRACTS.ArcNanopayRegistry, NANOPAY_ABI, 'startStream', [BigInt(0)]); } catch (e) { console.log(e); }
    setSession({ serviceId: service.id, serviceName: service.name, pricePerCall: service.pricePerCall, callsThisSession: 0, totalSpent: 0, active: true, contractSessionId });
    try {
      const res = await arcSend(service.wallet, service.pricePerCall.toFixed(6), 'USDC');
      try { await callContract(CONTRACTS.ArcNanopayRegistry, NANOPAY_ABI, 'recordNanoPayment', [BigInt(0), service.wallet as `0x${string}`, BigInt(Math.floor(service.pricePerCall * 1000000)), res.txHash, 'stream']); } catch (e) { console.log(e); }
      const tx: NanoTransaction = { id: shortId(), from: address, to: service.wallet.slice(0, 12) + '...', service: service.name, amount: service.pricePerCall, timestamp: new Date().toLocaleTimeString(), txHash: res.txHash, explorerUrl: res.explorerUrl, status: 'confirmed' };
      setTransactions(prev => [tx, ...prev.slice(0, 49)]);
      setServices(prev => prev.map(s => s.id === service.id ? { ...s, calls: s.calls + 1, earned: s.earned + s.pricePerCall } : s));
      setTotalSpent(t => t + service.pricePerCall); setTotalCalls(t => t + 1);
      setSession(prev => prev ? { ...prev, callsThisSession: 1, totalSpent: service.pricePerCall } : null);
    } catch (e: any) { setError(e?.message || 'Stream failed'); setSession(prev => prev ? { ...prev, active: false } : null); return; }
    sessionRef.current = setInterval(async () => {
      try {
        const res = await arcSend(service.wallet, service.pricePerCall.toFixed(6), 'USDC');
        try { await callContract(CONTRACTS.ArcNanopayRegistry, NANOPAY_ABI, 'recordNanoPayment', [BigInt(0), service.wallet as `0x${string}`, BigInt(Math.floor(service.pricePerCall * 1000000)), res.txHash, 'stream']); } catch (e) { console.log(e); }
        const tx: NanoTransaction = { id: shortId(), from: address, to: service.wallet.slice(0, 12) + '...', service: service.name, amount: service.pricePerCall, timestamp: new Date().toLocaleTimeString(), txHash: res.txHash, explorerUrl: res.explorerUrl, status: 'confirmed' };
        setTransactions(prev => [tx, ...prev.slice(0, 49)]);
        setServices(prev => prev.map(s => s.id === service.id ? { ...s, calls: s.calls + 1, earned: s.earned + s.pricePerCall } : s));
        setTotalSpent(t => t + service.pricePerCall); setTotalCalls(t => t + 1);
        setSession(prev => prev ? { ...prev, callsThisSession: prev.callsThisSession + 1, totalSpent: prev.totalSpent + prev.pricePerCall } : null);
      } catch (e: any) { setError(e?.message || 'Stream payment failed'); stopStream(); }
    }, 10000);
  }

  function stopStream() {
    if (sessionRef.current) clearInterval(sessionRef.current);
    if (session) {
      callContract(CONTRACTS.ArcNanopayRegistry, NANOPAY_ABI, 'endStream', [BigInt(session.contractSessionId || 0), BigInt(session.callsThisSession), BigInt(Math.floor(session.totalSpent * 1000000))]).catch(e => console.log(e));
    }
    setSession(prev => prev ? { ...prev, active: false } : null);
  }

  return (
    <>
      <style>{`
        .nano-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 24px; }
        .nano-marketplace { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
        .nano-stream-grid { display: grid; grid-template-columns: 1fr 320px; gap: 20px; align-items: start; }
        .nano-stream-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 24px; }
        .nano-tabs { display: flex; gap: 8px; flex-wrap: wrap; }
        .hide-mobile { display: table-cell; }
        .nano-page { box-sizing: border-box; overflow-x: hidden; }
        .nano-page * { box-sizing: border-box; }

        @media (max-width: 1024px) {
          .nano-stream-grid { grid-template-columns: 1fr; }
        }

        @media (max-width: 768px) {
          .nano-marketplace { grid-template-columns: repeat(2, 1fr); }
          .nano-stats { grid-template-columns: repeat(2, 1fr); }
          .nano-stream-stats { grid-template-columns: 1fr; }
          .hide-mobile { display: none; }
          .nano-header-row { flex-direction: column; align-items: stretch !important; }
          .nano-tabs { width: 100%; }
          .nano-tabs button { flex: 1 1 auto; }
        }

        @media (max-width: 480px) {
          .nano-marketplace { grid-template-columns: 1fr; }
          .nano-stats { grid-template-columns: 1fr 1fr; gap: 8px; }
          .nano-page { padding: 16px 16px 60px !important; }
          .nano-tabs { flex-direction: column; }
          .nano-tabs button { width: 100%; font-size: 11px !important; padding: 10px !important; }
          .nano-actions-row { flex-direction: column; }
          h1 { font-size: 22px !important; }
        }
      `}</style>

      <div className="nano-page" style={{ padding: '24px 24px 60px', maxWidth: 1200, margin: '0 auto' }}>

        {/* Header */}
        <div className="nano-header-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ fontSize: 11, color: '#5a6478', letterSpacing: '0.15em', marginBottom: 6, fontWeight: 700, textTransform: 'uppercase' }}>Fluxa · Circle Nanopayments</div>
            <h1 style={{ fontSize: 28, fontWeight: 800, color: '#0f1117', letterSpacing: '-0.02em', marginBottom: 4 }}>Nanopayments</h1>
            <p style={{ fontSize: 13, color: '#42495a', maxWidth: 500 }}>Pay-per-use micro-transactions between agents and services on Arc</p>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', width: '100%', maxWidth: 420 }}>
            {!address
              ? <button onClick={connect} className="btn btn-primary" style={{ fontSize: 11 }}>🦊 CONNECT WALLET</button>
              : <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 11, color: '#16a34a', padding: '6px 12px', borderRadius: 6, background: '#f0fdf4', border: '1px solid #bbf7d0' }}>{address.slice(0, 6)}…{address.slice(-4)}</div>
            }
            <div className="nano-tabs">
              {[
                { id: 'marketplace', label: '🛒 MARKETPLACE' },
                { id: 'stream', label: `⚡ STREAM ${session?.active ? '●' : ''}` },
                { id: 'history', label: `📜 HISTORY (${transactions.length})` },
              ].map(t => (
                <button key={t.id} onClick={() => setView(t.id as any)}
                  className={view === t.id ? 'btn btn-primary' : 'btn btn-ghost'}
                  style={{ fontSize: 11 }}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {error && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '12px 16px', marginBottom: 20, fontSize: 12, color: '#dc2626' }}>
            ⚠ {error} <button onClick={() => setError('')} style={{ marginLeft: 12, background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer' }}>✕</button>
          </div>
        )}

        {/* Stats */}
        <div className="nano-stats">
          {[
            { label: 'TOTAL CALLS', value: String(totalCalls), color: '#2563eb' },
            { label: 'TOTAL SPENT', value: `$${totalSpent.toFixed(4)} USDC`, color: '#16a34a' },
            { label: 'AVG PER CALL', value: totalCalls > 0 ? `$${(totalSpent / totalCalls).toFixed(4)}` : '$0.0000', color: '#d97706' },
            { label: 'SERVICES', value: String(services.length), color: '#7c3aed' },
          ].map(s => (
            <div key={s.label} className="panel" style={{ padding: 16 }}>
              <div style={{ fontSize: 9, color: '#5a6478', letterSpacing: '0.15em', marginBottom: 6, fontWeight: 700, textTransform: 'uppercase' }}>{s.label}</div>
              <div style={{ fontFamily: 'Space Mono, monospace', fontWeight: 700, fontSize: 18, color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Marketplace */}
        {view === 'marketplace' && (
          <div className="nano-marketplace">
            {services.map(service => (
              <div key={service.id} className="panel" style={{ overflow: 'hidden' }}>
                <div style={{ padding: '20px 20px 0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                    <span style={{ fontSize: 32 }}>{service.icon}</span>
                    <span className="badge" style={{ fontSize: 10, background: `${CATEGORY_COLORS[service.category]}15`, color: CATEGORY_COLORS[service.category], border: `1px solid ${CATEGORY_COLORS[service.category]}30` }}>
                      {service.category}
                    </span>
                  </div>
                  <div style={{ fontWeight: 700, fontSize: 13, color: '#0f1117', marginBottom: 6 }}>{service.name}</div>
                  <div style={{ fontSize: 12, color: '#42495a', lineHeight: 1.5, marginBottom: 14 }}>{service.description}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
                    <div>
                      <div style={{ fontSize: 9, color: '#5a6478', marginBottom: 2, fontWeight: 700, textTransform: 'uppercase' }}>PRICE PER CALL</div>
                      <div style={{ fontFamily: 'Space Mono, monospace', fontWeight: 700, fontSize: 15, color: '#16a34a' }}>${service.pricePerCall} USDC</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 9, color: '#5a6478', marginBottom: 2, fontWeight: 700, textTransform: 'uppercase' }}>TOTAL CALLS</div>
                      <div style={{ fontFamily: 'Space Mono, monospace', fontWeight: 700, fontSize: 15, color: '#2563eb' }}>{service.calls.toLocaleString()}</div>
                    </div>
                  </div>
                </div>
                <div className="nano-actions-row" style={{ padding: '0 20px 20px', display: 'flex', gap: 8 }}>
                  <button onClick={() => singleCall(service)} disabled={paying === service.id} className="btn btn-green" style={{ flex: 1, fontSize: 11 }}>
                    {paying === service.id ? <><span className="spinner" /> PAYING...</> : '⚡ CALL'}
                  </button>
                  <button onClick={() => startStream(service)} className="btn btn-blue" style={{ flex: 1, fontSize: 11 }}>▶ STREAM</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Stream */}
        {view === 'stream' && (
          <div className="nano-stream-grid">
            <div className="panel" style={{ overflow: 'hidden' }}>
              <div className="panel-header">
                <div className="panel-title">
                  {session?.active && <span className="live-dot" style={{ width: 6, height: 6 }} />}
                  PAYMENT STREAM
                </div>
                {session?.active && (
                  <button onClick={stopStream} className="btn btn-amber" style={{ fontSize: 11, padding: '6px 14px' }}>⏹ STOP</button>
                )}
              </div>
              {!session ? (
                <div style={{ padding: 48, textAlign: 'center' }}>
                  <div style={{ fontSize: 48, marginBottom: 16 }}>⚡</div>
                  <div style={{ fontSize: 13, color: '#5a6478', marginBottom: 12 }}>No active stream</div>
                  <button onClick={() => setView('marketplace')} className="btn btn-primary" style={{ fontSize: 12 }}>BROWSE SERVICES</button>
                </div>
              ) : (
                <div style={{ padding: 20 }}>
                  <div className="nano-stream-stats">
                    {[
                      { label: 'SERVICE', value: session.serviceName },
                      { label: 'CALLS', value: String(session.callsThisSession) },
                      { label: 'SPENT', value: `$${session.totalSpent.toFixed(4)}` },
                    ].map(s => (
                      <div key={s.label} style={{ background: '#eff4ff', border: '1px solid #bfdbfe', borderRadius: 8, padding: 14 }}>
                        <div style={{ fontSize: 9, color: '#5a6478', marginBottom: 6, fontWeight: 700, textTransform: 'uppercase' }}>{s.label}</div>
                        <div style={{ fontFamily: 'Space Mono, monospace', fontWeight: 700, fontSize: 13, color: '#2563eb', wordBreak: 'break-word' }}>{s.value}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ fontSize: 10, color: '#5a6478', letterSpacing: '0.15em', marginBottom: 10, fontWeight: 700, textTransform: 'uppercase' }}>LIVE TRANSACTION FEED</div>
                  <div style={{ height: 280, overflowY: 'auto', background: '#f8f9fb', border: '1px solid #e2e6ed', borderRadius: 8, padding: 12 }}>
                    {transactions.filter(t => t.service === session.serviceName).slice(0, 20).map(tx => (
                      <div key={tx.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f1f3f7', alignItems: 'center', flexWrap: 'wrap', gap: 4 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                          <span style={{ color: '#16a34a', fontSize: 10 }}>✓</span>
                          <span style={{ color: '#5a6478', fontSize: 10 }}>{tx.timestamp}</span>
                          <a href={tx.explorerUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#2563eb', fontSize: 10, textDecoration: 'none' }}>
                            {tx.txHash.slice(0, 10)}... ↗
                          </a>
                        </div>
                        <span style={{ fontFamily: 'Space Mono, monospace', fontWeight: 700, fontSize: 11, color: '#16a34a' }}>${tx.amount.toFixed(4)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div className="panel" style={{ padding: 20 }}>
                <div style={{ fontSize: 11, color: '#2563eb', letterSpacing: '0.12em', marginBottom: 12, fontWeight: 700, textTransform: 'uppercase' }}>⚡ What is Nanopay?</div>
                <div style={{ fontSize: 13, color: '#42495a', lineHeight: 1.7, marginBottom: 16 }}>
                  Pay per API call — fractions of a cent at a time. No subscriptions. No invoices. Pay exactly for what you use.
                </div>
                {[
                  { label: 'Min payment', value: '$0.01 USDC' },
                  { label: 'Settlement', value: '< 1 second' },
                  { label: 'Gas fee', value: '~$0.01' },
                  { label: 'Network', value: 'Arc Testnet' },
                  { label: 'Contract', value: 'ArcNanopayRegistry' },
                ].map(i => (
                  <div key={i.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid #f1f3f7' }}>
                    <span style={{ fontSize: 11, color: '#5a6478' }}>{i.label}</span>
                    <span style={{ fontFamily: 'Space Mono, monospace', fontSize: 11, fontWeight: 700, color: '#0f1117' }}>{i.value}</span>
                  </div>
                ))}
                <a href={`https://testnet.arcscan.app/address/${CONTRACTS.ArcNanopayRegistry}`} target="_blank" rel="noopener noreferrer"
                  style={{ display: 'block', marginTop: 12, fontSize: 11, color: '#2563eb', textDecoration: 'none', fontWeight: 600 }}>
                  VIEW CONTRACT ↗
                </a>
              </div>
              <div className="panel" style={{ padding: 20 }}>
                <div style={{ fontSize: 11, color: '#7c3aed', letterSpacing: '0.12em', marginBottom: 10, fontWeight: 700, textTransform: 'uppercase' }}>Use Cases</div>
                {['AI agent pays per LLM token', 'Bot pays per price feed update', 'Agent pays per compute task', 'Service pays per data query', 'Agent-to-agent commerce'].map(u => (
                  <div key={u} style={{ fontSize: 12, color: '#42495a', padding: '5px 0', borderBottom: '1px solid #f1f3f7' }}>→ {u}</div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* History */}
        {view === 'history' && (
          <div className="panel">
            <div className="panel-header">
              <div className="panel-title">TRANSACTION HISTORY</div>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <span style={{ fontSize: 11, color: '#5a6478' }}>{transactions.length} TXS</span>
                <a href={`https://testnet.arcscan.app/address/${CONTRACTS.ArcNanopayRegistry}`} target="_blank" rel="noopener noreferrer"
                  style={{ fontSize: 11, color: '#2563eb', textDecoration: 'none', fontWeight: 600 }}>CONTRACT ↗</a>
              </div>
            </div>
            {transactions.length === 0 ? (
              <div style={{ padding: 48, textAlign: 'center', fontSize: 13, color: '#5a6478' }}>
                No transactions yet — call a service to get started
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#f8f9fb', borderBottom: '1px solid #e2e6ed' }}>
                      {['TIME', 'SERVICE', 'AMOUNT', 'FROM', 'TX HASH', 'STATUS'].map((h, i) => (
                        <th key={h} className={i > 2 ? 'hide-mobile' : ''} style={{ fontSize: 10, color: '#5a6478', letterSpacing: '0.1em', padding: '10px 16px', textAlign: 'left', fontWeight: 700, whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map(tx => (
                      <tr key={tx.id} style={{ borderBottom: '1px solid #f1f3f7' }}
                        onMouseEnter={e => { (e.currentTarget as HTMLTableRowElement).style.background = '#f8f9fb'; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLTableRowElement).style.background = 'transparent'; }}>
                        <td style={{ padding: '12px 16px', fontFamily: 'Space Mono, monospace', fontSize: 11, color: '#5a6478', whiteSpace: 'nowrap' }}>{tx.timestamp}</td>
                        <td style={{ padding: '12px 16px', fontSize: 12, fontWeight: 700, color: '#0f1117' }}>{tx.service}</td>
                        <td style={{ padding: '12px 16px', fontFamily: 'Space Mono, monospace', fontSize: 12, fontWeight: 700, color: '#16a34a', whiteSpace: 'nowrap' }}>${tx.amount.toFixed(4)}</td>
                        <td className="hide-mobile" style={{ padding: '12px 16px', fontFamily: 'Space Mono, monospace', fontSize: 11, color: '#5a6478' }}>{tx.from.slice(0, 10)}...</td>
                        <td className="hide-mobile" style={{ padding: '12px 16px' }}>
                          <a href={tx.explorerUrl} target="_blank" rel="noopener noreferrer" style={{ fontFamily: 'Space Mono, monospace', fontSize: 11, color: '#2563eb', textDecoration: 'none' }}>
                            {tx.txHash.slice(0, 14)}... ↗
                          </a>
                        </td>
                        <td className="hide-mobile" style={{ padding: '12px 16px' }}>
                          <span className="badge badge-green" style={{ fontSize: 10 }}>CONFIRMED</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}