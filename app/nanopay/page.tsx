'use client';
import { useState, useEffect, useRef } from 'react';

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
  status: 'confirmed';
}

interface StreamSession {
  serviceId: string;
  serviceName: string;
  pricePerCall: number;
  callsThisSession: number;
  totalSpent: number;
  active: boolean;
  intervalId?: NodeJS.Timeout;
}

function shortId() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

function mockTxHash() {
  return '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
}

const DEMO_SERVICES: NanoService[] = [
  { id: shortId(), name: 'Arc Price Oracle', description: 'Real-time USDC price feeds. Pay per query.', pricePerCall: 0.001, category: 'Data', icon: '📡', calls: 0, earned: 0, wallet: '0xOracle1234567890abcdef1234567890abcdef12' },
  { id: shortId(), name: 'AI Translation API', description: 'Translate text to any language. Pay per character block.', pricePerCall: 0.0005, category: 'AI', icon: '🌍', calls: 0, earned: 0, wallet: '0xTranslate1234567890abcdef1234567890abcd' },
  { id: shortId(), name: 'KYC Verification', description: 'Instant wallet risk scoring. Pay per check.', pricePerCall: 0.005, category: 'Compliance', icon: '🔒', calls: 0, earned: 0, wallet: '0xKYC1234567890abcdef1234567890abcdef1234' },
  { id: shortId(), name: 'Weather Data Feed', description: 'Live weather for any city. Pay per API call.', pricePerCall: 0.0002, category: 'Data', icon: '🌤', calls: 0, earned: 0, wallet: '0xWeather1234567890abcdef1234567890abcde' },
  { id: shortId(), name: 'Agent Compute Unit', description: 'Serverless compute for AI agents. Pay per execution.', pricePerCall: 0.002, category: 'Compute', icon: '⚙️', calls: 0, earned: 0, wallet: '0xCompute1234567890abcdef1234567890abcde' },
  { id: shortId(), name: 'USDC Routing Engine', description: 'Optimal payment routing across chains. Pay per route.', pricePerCall: 0.003, category: 'Finance', icon: '🔀', calls: 0, earned: 0, wallet: '0xRouter1234567890abcdef1234567890abcdef' },
];

const CATEGORY_COLORS: Record<string, string> = {
  Data: '#00aaff',
  AI: '#aa55ff',
  Compliance: '#ffaa00',
  Compute: '#00ddff',
  Finance: '#00ff88',
};

export default function NanopayPage() {
  const [services, setServices] = useState<NanoService[]>(DEMO_SERVICES);
  const [transactions, setTransactions] = useState<NanoTransaction[]>([]);
  const [session, setSession] = useState<StreamSession | null>(null);
  const [myWallet] = useState('0xUser' + shortId() + '...Arc');
  const [totalSpent, setTotalSpent] = useState(0);
  const [totalCalls, setTotalCalls] = useState(0);
  const [view, setView] = useState<'marketplace' | 'stream' | 'history'>('marketplace');
  const [paying, setPaying] = useState<string | null>(null);
  const sessionRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => { if (sessionRef.current) clearInterval(sessionRef.current); };
  }, []);

  async function singleCall(service: NanoService) {
    setPaying(service.id);
    await new Promise(r => setTimeout(r, 800));
    const txHash = mockTxHash();
    const tx: NanoTransaction = {
      id: shortId(),
      from: myWallet,
      to: service.wallet.slice(0, 12) + '...',
      service: service.name,
      amount: service.pricePerCall,
      timestamp: new Date().toLocaleTimeString(),
      txHash,
      status: 'confirmed',
    };
    setTransactions(prev => [tx, ...prev.slice(0, 49)]);
    setServices(prev => prev.map(s => s.id === service.id ? { ...s, calls: s.calls + 1, earned: s.earned + s.pricePerCall } : s));
    setTotalSpent(t => t + service.pricePerCall);
    setTotalCalls(t => t + 1);
    setPaying(null);
  }

  function startStream(service: NanoService) {
    if (session?.active) stopStream();
    setView('stream');
    const newSession: StreamSession = {
      serviceId: service.id,
      serviceName: service.name,
      pricePerCall: service.pricePerCall,
      callsThisSession: 0,
      totalSpent: 0,
      active: true,
    };
    setSession(newSession);

    sessionRef.current = setInterval(() => {
      const txHash = mockTxHash();
      const tx: NanoTransaction = {
        id: shortId(),
        from: myWallet,
        to: service.wallet.slice(0, 12) + '...',
        service: service.name,
        amount: service.pricePerCall,
        timestamp: new Date().toLocaleTimeString(),
        txHash,
        status: 'confirmed',
      };
      setTransactions(prev => [tx, ...prev.slice(0, 49)]);
      setServices(prev => prev.map(s => s.id === service.id ? { ...s, calls: s.calls + 1, earned: s.earned + s.pricePerCall } : s));
      setTotalSpent(t => t + service.pricePerCall);
      setTotalCalls(t => t + 1);
      setSession(prev => prev ? {
        ...prev,
        callsThisSession: prev.callsThisSession + 1,
        totalSpent: prev.totalSpent + prev.pricePerCall,
      } : null);
    }, 1500);
  }

  function stopStream() {
    if (sessionRef.current) clearInterval(sessionRef.current);
    setSession(prev => prev ? { ...prev, active: false } : null);
  }

  return (
    <div style={{ padding: '24px 24px 60px', maxWidth: 1200, margin: '0 auto', position: 'relative', zIndex: 1 }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 10, color: 'rgba(232,240,232,0.3)', letterSpacing: '0.2em', marginBottom: 6 }}>ARC TERMINAL · CIRCLE NANOPAYMENTS</div>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: '#e8f0e8', letterSpacing: '-0.02em', marginBottom: 4 }}>Nanopayments</h1>
          <p style={{ fontSize: 13, color: 'rgba(232,240,232,0.4)' }}>
            Pay-per-use micro-transactions between agents and services — as low as $0.0001 USDC per call
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => setView('marketplace')} className={view === 'marketplace' ? 'btn btn-green' : 'btn btn-ghost'} style={{ fontSize: 11 }}>🛒 MARKETPLACE</button>
          <button onClick={() => setView('stream')} className={view === 'stream' ? 'btn btn-green' : 'btn btn-ghost'} style={{ fontSize: 11 }}>⚡ STREAM {session?.active && '●'}</button>
          <button onClick={() => setView('history')} className={view === 'history' ? 'btn btn-green' : 'btn btn-ghost'} style={{ fontSize: 11 }}>📜 HISTORY ({transactions.length})</button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
        {[
          { label: 'TOTAL CALLS', value: String(totalCalls), color: '#00aaff' },
          { label: 'TOTAL SPENT', value: `$${totalSpent.toFixed(4)} USDC`, color: '#00ff88' },
          { label: 'AVG PER CALL', value: totalCalls > 0 ? `$${(totalSpent / totalCalls).toFixed(4)}` : '$0.0000', color: '#ffaa00' },
          { label: 'SERVICES', value: String(services.length), color: '#aa55ff' },
        ].map(s => (
          <div key={s.label} className="panel" style={{ padding: 16 }}>
            <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 9, color: 'rgba(232,240,232,0.3)', letterSpacing: '0.15em', marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontFamily: 'Space Mono, monospace', fontWeight: 700, fontSize: 18, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* MARKETPLACE */}
      {view === 'marketplace' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          {services.map(service => (
            <div key={service.id} className="panel" style={{ overflow: 'hidden' }}>
              <div style={{ padding: '20px 20px 0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                  <span style={{ fontSize: 32 }}>{service.icon}</span>
                  <span className="badge" style={{ fontSize: 9, background: 'rgba(0,170,255,0.1)', color: CATEGORY_COLORS[service.category] || '#00aaff', border: `1px solid ${CATEGORY_COLORS[service.category] || '#00aaff'}40` }}>
                    {service.category}
                  </span>
                </div>
                <div style={{ fontFamily: 'Space Mono, monospace', fontWeight: 700, fontSize: 13, color: '#e8f0e8', marginBottom: 6 }}>{service.name}</div>
                <div style={{ fontSize: 12, color: 'rgba(232,240,232,0.4)', lineHeight: 1.5, marginBottom: 14 }}>{service.description}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
                  <div>
                    <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 9, color: 'rgba(232,240,232,0.3)', marginBottom: 2 }}>PRICE PER CALL</div>
                    <div style={{ fontFamily: 'Space Mono, monospace', fontWeight: 700, fontSize: 16, color: '#00ff88' }}>${service.pricePerCall} USDC</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 9, color: 'rgba(232,240,232,0.3)', marginBottom: 2 }}>TOTAL CALLS</div>
                    <div style={{ fontFamily: 'Space Mono, monospace', fontWeight: 700, fontSize: 16, color: '#00aaff' }}>{service.calls.toLocaleString()}</div>
                  </div>
                </div>
              </div>
              <div style={{ padding: '0 20px 20px', display: 'flex', gap: 8 }}>
                <button
                  onClick={() => singleCall(service)}
                  disabled={paying === service.id}
                  className="btn btn-green"
                  style={{ flex: 1, fontSize: 11 }}
                >
                  {paying === service.id ? <><span className="spinner" /> PAYING...</> : '⚡ CALL ONCE'}
                </button>
                <button
                  onClick={() => startStream(service)}
                  className="btn btn-blue"
                  style={{ flex: 1, fontSize: 11 }}
                >
                  ▶ STREAM
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* STREAM VIEW */}
      {view === 'stream' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20, alignItems: 'start' }}>
          <div className="panel" style={{ overflow: 'hidden' }}>
            <div className="panel-header">
              <div className="panel-title">
                {session?.active && <span className="live-dot" style={{ width: 6, height: 6 }} />}
                PAYMENT STREAM
              </div>
              {session?.active && (
                <button onClick={stopStream} className="btn btn-amber" style={{ fontSize: 11, padding: '6px 14px' }}>⏹ STOP STREAM</button>
              )}
            </div>

            {!session ? (
              <div style={{ padding: 48, textAlign: 'center' }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>⚡</div>
                <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 13, color: 'rgba(232,240,232,0.3)', marginBottom: 8 }}>No active stream</div>
                <button onClick={() => setView('marketplace')} className="btn btn-green" style={{ fontSize: 12 }}>BROWSE SERVICES</button>
              </div>
            ) : (
              <div style={{ padding: 24 }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24 }}>
                  {[
                    { label: 'SERVICE', value: session.serviceName },
                    { label: 'CALLS THIS SESSION', value: String(session.callsThisSession) },
                    { label: 'SPENT THIS SESSION', value: `$${session.totalSpent.toFixed(4)}` },
                  ].map(s => (
                    <div key={s.label} style={{ background: 'rgba(0,255,136,0.04)', border: '1px solid rgba(0,255,136,0.1)', borderRadius: 8, padding: 14 }}>
                      <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 9, color: 'rgba(232,240,232,0.3)', marginBottom: 6 }}>{s.label}</div>
                      <div style={{ fontFamily: 'Space Mono, monospace', fontWeight: 700, fontSize: 14, color: '#00ff88' }}>{s.value}</div>
                    </div>
                  ))}
                </div>

                {/* Live tx feed */}
                <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 10, color: 'rgba(232,240,232,0.3)', letterSpacing: '0.15em', marginBottom: 10 }}>LIVE TRANSACTION FEED</div>
                <div style={{ height: 300, overflowY: 'auto', background: 'rgba(0,0,0,0.3)', borderRadius: 8, padding: 12 }}>
                  {transactions.filter(t => t.service === session.serviceName).slice(0, 20).map(tx => (
                    <div key={tx.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.03)', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ color: '#00ff88', fontSize: 10 }}>✓</span>
                        <span style={{ color: 'rgba(232,240,232,0.4)', fontSize: 10 }}>{tx.timestamp}</span>
                        <a href={`https://testnet.arcscan.app/tx/${tx.txHash}`} target="_blank" rel="noopener noreferrer" style={{ color: '#00aaff', fontSize: 10, textDecoration: 'none' }}>
                          {tx.txHash.slice(0, 12)}... ↗
                        </a>
                      </div>
                      <span style={{ fontFamily: 'Space Mono, monospace', fontWeight: 700, fontSize: 11, color: '#00ff88' }}>
                        ${tx.amount.toFixed(4)} USDC
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Explainer */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="panel" style={{ padding: 20 }}>
              <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 10, color: '#00ff88', letterSpacing: '0.15em', marginBottom: 14 }}>⚡ WHAT IS NANOPAY?</div>
              <div style={{ fontSize: 13, color: 'rgba(232,240,232,0.5)', lineHeight: 1.7, marginBottom: 16 }}>
                Nanopayments let agents and services pay each other per API call — fractions of a cent at a time. No subscriptions. No invoices. Pay exactly for what you use.
              </div>
              {[
                { label: 'Min payment', value: '$0.0001 USDC' },
                { label: 'Settlement', value: '< 1 second' },
                { label: 'Gas fee', value: '~$0.01' },
                { label: 'Network', value: 'Arc Testnet' },
                { label: 'Circle tool', value: 'Nanopayments API' },
              ].map(i => (
                <div key={i.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <span style={{ fontFamily: 'Space Mono, monospace', fontSize: 10, color: 'rgba(232,240,232,0.3)' }}>{i.label}</span>
                  <span style={{ fontFamily: 'Space Mono, monospace', fontSize: 11, fontWeight: 700, color: '#e8f0e8' }}>{i.value}</span>
                </div>
              ))}
            </div>
            <div className="panel" style={{ padding: 20 }}>
              <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 10, color: '#00aaff', letterSpacing: '0.15em', marginBottom: 10 }}>USE CASES</div>
              {['AI agent pays per LLM token', 'Bot pays per price feed update', 'Agent pays per compute task', 'Service pays per data query', 'Agent-to-agent commerce'].map(u => (
                <div key={u} style={{ fontSize: 12, color: 'rgba(232,240,232,0.4)', padding: '5px 0', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                  → {u}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* HISTORY */}
      {view === 'history' && (
        <div className="panel">
          <div className="panel-header">
            <div className="panel-title">TRANSACTION HISTORY</div>
            <span style={{ fontFamily: 'Space Mono, monospace', fontSize: 10, color: 'rgba(232,240,232,0.3)' }}>{transactions.length} TXS</span>
          </div>
          {transactions.length === 0 ? (
            <div style={{ padding: 48, textAlign: 'center', fontFamily: 'Space Mono, monospace', fontSize: 12, color: 'rgba(232,240,232,0.25)' }}>
              No transactions yet — call a service to get started
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    {['TIME', 'SERVICE', 'AMOUNT', 'FROM', 'TX HASH', 'STATUS'].map(h => (
                      <th key={h} style={{ fontFamily: 'Space Mono, monospace', fontSize: 10, color: 'rgba(232,240,232,0.3)', letterSpacing: '0.15em', padding: '10px 16px', textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {transactions.map(tx => (
                    <tr key={tx.id}>
                      <td style={{ padding: '12px 16px', fontFamily: 'Space Mono, monospace', fontSize: 11, color: 'rgba(232,240,232,0.4)', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>{tx.timestamp}</td>
                      <td style={{ padding: '12px 16px', fontFamily: 'Space Mono, monospace', fontSize: 12, fontWeight: 700, color: '#e8f0e8', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>{tx.service}</td>
                      <td style={{ padding: '12px 16px', fontFamily: 'Space Mono, monospace', fontSize: 12, fontWeight: 700, color: '#00ff88', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>${tx.amount.toFixed(4)}</td>
                      <td style={{ padding: '12px 16px', fontFamily: 'Space Mono, monospace', fontSize: 11, color: 'rgba(232,240,232,0.4)', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>{tx.from}</td>
                      <td style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                        <a href={`https://testnet.arcscan.app/tx/${tx.txHash}`} target="_blank" rel="noopener noreferrer" style={{ fontFamily: 'Space Mono, monospace', fontSize: 11, color: '#00aaff', textDecoration: 'none' }}>
                          {tx.txHash.slice(0, 14)}... ↗
                        </a>
                      </td>
                      <td style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                        <span className="badge badge-green" style={{ fontSize: 9 }}>CONFIRMED</span>
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
  );
}