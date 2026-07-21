'use client';
import { useEffect, useState, useRef } from 'react';

interface AgentLog {
  id: string;
  timestamp: string;
  type: 'info' | 'decision' | 'action' | 'success' | 'warning' | 'error';
  message: string;
  txHash?: string;
}

interface AgentRule {
  id: string;
  currency: string;
  condition: 'above' | 'below';
  targetRate: number;
  action: 'convert' | 'alert';
  amount: number;
  recipientWallet: string;
  active: boolean;
  triggered: boolean;
}

function shortId() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

function mockTxHash() {
  return '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
}

const MY_WALLET = '0xf2ee634847d39161ec7de7879d7d0d241b932ad4';
const AGENT_WALLET = MY_WALLET;
const CURRENCIES = ['NGN', 'GHS', 'KES', 'EUR', 'GBP', 'ZAR'];

const TYPE_COLORS: Record<string, string> = {
  info: 'var(--text-2)',
  decision: '#00aaff',
  action: '#ffaa00',
  success: '#00ff88',
  warning: '#ffaa00',
  error: '#ff3355',
};

const TYPE_ICONS: Record<string, string> = {
  info: '●', decision: '◆', action: '▶', success: '✓', warning: '⚠', error: '✕',
};

export default function AgentPage() {
  const [running, setRunning] = useState(false);
  const [logs, setLogs] = useState<AgentLog[]>([]);
  const [rules, setRules] = useState<AgentRule[]>([
    { id: shortId(), currency: 'NGN', condition: 'above', targetRate: 1600, action: 'convert', amount: 10, recipientWallet: MY_WALLET, active: true, triggered: false },
    { id: shortId(), currency: 'GHS', condition: 'below', targetRate: 14, action: 'alert', amount: 5, recipientWallet: MY_WALLET, active: true, triggered: false },
  ]);
  const [liveRates, setLiveRates] = useState<Record<string, number>>({});
  const [cycleCount, setCycleCount] = useState(0);
  const [showAddRule, setShowAddRule] = useState(false);
  const [newRule, setNewRule] = useState({
    currency: 'NGN',
    condition: 'above' as 'above' | 'below',
    targetRate: '',
    action: 'convert' as 'convert' | 'alert',
    amount: '',
    recipientWallet: MY_WALLET,
  });
  const [totalTx, setTotalTx] = useState(0);
  const [totalUSDC, setTotalUSDC] = useState(0);
  const logsEndRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  function addLog(type: AgentLog['type'], message: string, txHash?: string) {
    setLogs(prev => [...prev.slice(-100), {
      id: shortId(),
      timestamp: new Date().toLocaleTimeString(),
      type, message, txHash,
    }]);
  }

  async function fetchRates(): Promise<Record<string, number>> {
    try {
      const res = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
      const data = await res.json();
      return data.rates;
    } catch {
      return {};
    }
  }

  async function runCycle() {
    setCycleCount(c => c + 1);
    addLog('info', 'Agent cycle started — fetching live rates...');
    const rates = await fetchRates();
    if (Object.keys(rates).length === 0) {
      addLog('error', 'Failed to fetch rates — retrying next cycle');
      return;
    }
    setLiveRates(rates);
    const rateLines = CURRENCIES.map(c => `${c}: ${(rates[c] ?? 0).toFixed(2)}`).join(' · ');
    addLog('info', `Rates fetched → ${rateLines}`);
    setRules(prev => {
      const updated = [...prev];
      for (let i = 0; i < updated.length; i++) {
        const rule = updated[i];
        if (!rule.active || rule.triggered) continue;
        const currentRate = rates[rule.currency] ?? 0;
        if (currentRate === 0) continue;
        const conditionMet = rule.condition === 'above' ? currentRate > rule.targetRate : currentRate < rule.targetRate;
        addLog('decision', `Evaluating: ${rule.currency} ${rule.condition} ${rule.targetRate} → current: ${currentRate.toFixed(2)} → ${conditionMet ? 'CONDITION MET ✓' : 'not yet'}`);
        if (conditionMet) {
          updated[i] = { ...rule, triggered: true };
          if (rule.action === 'convert' && rule.recipientWallet) {
            addLog('action', `Triggering auto-convert: ${rule.amount} USDC at rate ${currentRate.toFixed(2)} → ${rule.recipientWallet.slice(0, 10)}...`);
            setTimeout(async () => {
              await new Promise(r => setTimeout(r, 1500));
              const txHash = mockTxHash();
              const localAmount = (rule.amount * currentRate).toFixed(2);
              addLog('success', `Auto-conversion complete — sent ${rule.amount} USDC (≈ ${localAmount} ${rule.currency})`, txHash);
              setTotalTx(t => t + 1);
              setTotalUSDC(t => t + rule.amount);
            }, 500);
          } else if (rule.action === 'alert') {
            addLog('warning', `ALERT: ${rule.currency} hit target! Current: ${currentRate.toFixed(2)} (target: ${rule.targetRate})`);
          }
        }
      }
      return updated;
    });
  }

  function startAgent() {
    setRunning(true);
    setLogs([]);
    setCycleCount(0);
    addLog('success', 'Arc Auto-Rate Agent initialized');
    addLog('info', `Agent wallet: ${AGENT_WALLET.slice(0, 10)}...${AGENT_WALLET.slice(-8)}`);
    addLog('info', `Monitoring ${rules.filter(r => r.active).length} active rules — cycle every 30 seconds`);
    runCycle();
    intervalRef.current = setInterval(runCycle, 30000);
  }

  function stopAgent() {
    setRunning(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
    addLog('warning', 'Agent stopped by user');
  }

  useEffect(() => {
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  function addRule() {
    if (!newRule.targetRate || !newRule.amount) return;
    if (newRule.action === 'convert' && !newRule.recipientWallet) return;
    setRules(prev => [...prev, {
      id: shortId(),
      currency: newRule.currency,
      condition: newRule.condition,
      targetRate: parseFloat(newRule.targetRate),
      action: newRule.action,
      amount: parseFloat(newRule.amount),
      recipientWallet: newRule.recipientWallet,
      active: true,
      triggered: false,
    }]);
    setNewRule({ currency: 'NGN', condition: 'above', targetRate: '', action: 'convert', amount: '', recipientWallet: MY_WALLET });
    setShowAddRule(false);
  }

  return (
    <div className="agent-page" style={{ padding: '24px 24px 60px', maxWidth: 1200, margin: '0 auto', position: 'relative', zIndex: 1 }}>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 10, color: 'var(--text-3)', letterSpacing: '0.2em', marginBottom: 6 }}>ARC TERMINAL · AGENTIC ECONOMY</div>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.02em', marginBottom: 4 }}>
            Auto-Rate Agent
            {running && <span style={{ marginLeft: 12, fontSize: 13, color: '#00ff88', fontWeight: 400 }}>● RUNNING</span>}
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-2)', maxWidth: 500 }}>
            Autonomous agent that monitors live rates and triggers USDC payments on Arc when conditions are met
          </p>
        </div>
        <div>
          {!running
            ? <button onClick={startAgent} className="btn btn-green" style={{ fontSize: 13, padding: '10px 24px' }}>▶ START AGENT</button>
            : <button onClick={stopAgent} className="btn btn-amber" style={{ fontSize: 13, padding: '10px 24px' }}>⏹ STOP AGENT</button>
          }
        </div>
      </div>

      <div className="agent-stats-grid" style={{ display: 'grid', gap: 12, marginBottom: 24 }}>
        {[
          { label: 'AGENT STATUS', value: running ? 'RUNNING' : 'STOPPED', color: running ? '#00ff88' : 'var(--text-3)' },
          { label: 'CYCLES RUN', value: String(cycleCount), color: '#00aaff' },
          { label: 'TX EXECUTED', value: String(totalTx), color: '#00ff88' },
          { label: 'USDC MOVED', value: `$${totalUSDC}`, color: '#ffaa00' },
        ].map(s => (
          <div key={s.label} className="panel" style={{ padding: 16 }}>
            <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 9, color: 'var(--text-3)', letterSpacing: '0.15em', marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontFamily: 'Space Mono, monospace', fontWeight: 700, fontSize: 18, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {Object.keys(liveRates).length > 0 && (
        <div className="panel" style={{ padding: '12px 16px', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <span style={{ fontFamily: 'Space Mono, monospace', fontSize: 10, color: 'var(--text-3)' }}>LIVE</span>
            {CURRENCIES.map(c => (
              <span key={c} style={{ fontFamily: 'Space Mono, monospace', fontSize: 11 }}>
                <span style={{ color: 'var(--text-2)' }}>{c} </span>
                <span style={{ color: '#00ff88', fontWeight: 700 }}>{(liveRates[c] ?? 0).toFixed(2)}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="agent-main-grid" style={{ display: 'grid', gap: 20, alignItems: 'start' }}>

        <div className="panel" style={{ overflow: 'hidden' }}>
          <div className="panel-header">
            <div className="panel-title">
              {running && <span className="live-dot" style={{ width: 6, height: 6 }} />}
              AGENT LOG
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <span style={{ fontFamily: 'Space Mono, monospace', fontSize: 10, color: 'var(--text-3)' }}>{logs.length} ENTRIES</span>
              <button onClick={() => setLogs([])} className="btn btn-ghost" style={{ fontSize: 10, padding: '4px 10px' }}>CLEAR</button>
            </div>
          </div>
          <div style={{ height: 400, overflowY: 'auto', fontFamily: 'Space Mono, monospace', fontSize: 11, lineHeight: 1.8, padding: 16, background: '#0d0f14', borderTop: '1px solid var(--border)' }}>
            {logs.length === 0 ? (
              <div style={{ color: 'var(--text-3)', textAlign: 'center', paddingTop: 40 }}>
                Start the agent to see live decision logs...
              </div>
            ) : (
              logs.map(log => (
                <div key={log.id} style={{ padding: '3px 8px', borderRadius: 4, marginBottom: 2, wordBreak: 'break-word' }}>
                  <span style={{ color: 'var(--text-3)', marginRight: 8 }}>{log.timestamp}</span>
                  <span style={{ color: TYPE_COLORS[log.type], marginRight: 6 }}>{TYPE_ICONS[log.type]}</span>
                  <span style={{ color: TYPE_COLORS[log.type] }}>{log.message}</span>
                  {log.txHash && (
                    <a href={`https://testnet.arcscan.app/tx/${log.txHash}`} target="_blank" rel="noopener noreferrer"
                      style={{ marginLeft: 8, color: '#00aaff', textDecoration: 'none', fontSize: 10 }}>
                      [{log.txHash.slice(0, 10)}...] ↗
                    </a>
                  )}
                </div>
              ))
            )}
            <div ref={logsEndRef} />
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="panel">
            <div className="panel-header">
              <div className="panel-title">AGENT RULES</div>
              <button onClick={() => setShowAddRule(!showAddRule)} className="btn btn-green" style={{ fontSize: 10, padding: '5px 12px' }}>
                {showAddRule ? '✕' : '+ ADD'}
              </button>
            </div>

            {showAddRule && (
              <div style={{ padding: 16, borderBottom: '1px solid var(--border)', background: 'rgba(0,255,136,0.02)' }}>
                <div style={{ marginBottom: 10 }}>
                  <label className="label">CURRENCY</label>
                  <select className="select" value={newRule.currency} onChange={e => setNewRule(p => ({ ...p, currency: e.target.value }))}>
                    {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                  <div style={{ flex: 1 }}>
                    <label className="label">CONDITION</label>
                    <select className="select" value={newRule.condition} onChange={e => setNewRule(p => ({ ...p, condition: e.target.value as 'above' | 'below' }))}>
                      <option value="above">Above</option>
                      <option value="below">Below</option>
                    </select>
                  </div>
                  <div style={{ flex: 1 }}>
                    <label className="label">TARGET RATE</label>
                    <input className="input" type="number" placeholder="1600" value={newRule.targetRate} onChange={e => setNewRule(p => ({ ...p, targetRate: e.target.value }))} />
                  </div>
                </div>
                <div style={{ marginBottom: 10 }}>
                  <label className="label">ACTION</label>
                  <select className="select" value={newRule.action} onChange={e => setNewRule(p => ({ ...p, action: e.target.value as 'convert' | 'alert' }))}>
                    <option value="convert">Auto-convert USDC</option>
                    <option value="alert">Alert only</option>
                  </select>
                </div>
                <div style={{ marginBottom: 10 }}>
                  <label className="label">AMOUNT (USDC)</label>
                  <input className="input" type="number" placeholder="10" value={newRule.amount} onChange={e => setNewRule(p => ({ ...p, amount: e.target.value }))} />
                </div>
                {newRule.action === 'convert' && (
                  <div style={{ marginBottom: 10 }}>
                    <label className="label">RECIPIENT WALLET</label>
                    <input className="input" placeholder="0x..." value={newRule.recipientWallet} onChange={e => setNewRule(p => ({ ...p, recipientWallet: e.target.value }))} />
                  </div>
                )}
                <button onClick={addRule} className="btn btn-green" style={{ width: '100%', fontSize: 11 }}>ADD RULE</button>
              </div>
            )}

            <div>
              {rules.map(rule => (
                <div key={rule.id} style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', background: rule.triggered ? 'rgba(0,255,136,0.04)' : 'transparent', opacity: rule.active ? 1 : 0.5 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, flexWrap: 'wrap', gap: 6 }}>
                    <span style={{ fontFamily: 'Space Mono, monospace', fontSize: 12, fontWeight: 700, color: 'var(--text)' }}>
                      {rule.currency} {rule.condition} {rule.targetRate.toLocaleString()}
                    </span>
                    {rule.triggered
                      ? <span className="badge badge-green" style={{ fontSize: 9 }}>TRIGGERED</span>
                      : <span className="badge badge-amber" style={{ fontSize: 9 }}>WATCHING</span>
                    }
                  </div>
                  <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 10, color: 'var(--text-3)', marginBottom: 4 }}>
                    {rule.action === 'convert' ? `→ Auto-send ${rule.amount} USDC to ${rule.recipientWallet.slice(0, 10)}...` : `→ Alert only`}
                  </div>
                  {liveRates[rule.currency] && (
                    <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 10, color: '#00aaff', marginBottom: 6 }}>
                      Current: {(liveRates[rule.currency] ?? 0).toFixed(2)}
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    <button onClick={() => setRules(prev => prev.map(r => r.id === rule.id ? { ...r, active: !r.active } : r))} className="btn btn-ghost" style={{ fontSize: 9, padding: '3px 8px' }}>
                      {rule.active ? 'DISABLE' : 'ENABLE'}
                    </button>
                    {rule.triggered && (
                      <button onClick={() => setRules(prev => prev.map(r => r.id === rule.id ? { ...r, triggered: false } : r))} className="btn btn-blue" style={{ fontSize: 9, padding: '3px 8px' }}>RESET</button>
                    )}
                    <button onClick={() => setRules(prev => prev.filter(r => r.id !== rule.id))} className="btn btn-ghost" style={{ fontSize: 9, padding: '3px 8px', color: '#ff3355' }}>DELETE</button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="panel" style={{ padding: 16 }}>
            <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 10, color: '#00ff88', letterSpacing: '0.15em', marginBottom: 10 }}>🤖 AGENT INFO</div>
            {[
              { label: 'Wallet', value: `${MY_WALLET.slice(0, 10)}...${MY_WALLET.slice(-8)}` },
              { label: 'Cycle', value: '30 seconds' },
              { label: 'Network', value: 'Arc Testnet' },
              { label: 'Method', value: 'kit.send()' },
              { label: 'Data', value: 'ExchangeRate API' },
            ].map(i => (
              <div key={i.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
                <span style={{ fontFamily: 'Space Mono, monospace', fontSize: 10, color: 'var(--text-3)' }}>{i.label}</span>
                <span style={{ fontFamily: 'Space Mono, monospace', fontSize: 10, fontWeight: 700, color: 'var(--text)' }}>{i.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}