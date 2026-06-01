'use client';
import { useState } from 'react';
import { useWallet } from '@/context/WalletContext';
import WalletConnector from '@/components/WalletConnector';
import { arcSend } from '@/lib/arc';

interface Employee {
  id: string;
  name: string;
  wallet: string;
  salary: number;
  payAmount: string;
  currency: string;
  status: 'pending' | 'paid' | 'failed';
  txHash?: string;
}

interface PayrollRun {
  id: string;
  date: string;
  employees: Employee[];
  totalUSDC: number;
  status: 'complete' | 'partial' | 'failed';
}

function shortId() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export default function PayrollPage() {
  const { address } = useWallet();

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [history, setHistory] = useState<PayrollRun[]>([]);
  const [paying, setPaying] = useState(false);
  const [payingId, setPayingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newEmployee, setNewEmployee] = useState({ name: '', wallet: '', salary: '', currency: 'USD' });
  const [addError, setAddError] = useState('');
  const [runComplete, setRunComplete] = useState(false);
  const [error, setError] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState<Employee | null>(null);
  const [confirmAll, setConfirmAll] = useState(false);

  const totalPayroll = employees.reduce((sum, e) => sum + e.salary, 0);
  const pendingEmployees = employees.filter(e => e.status === 'pending' || e.status === 'failed');

  function addEmployee() {
    setAddError('');
    if (!newEmployee.name) return setAddError('Name is required');
    if (!newEmployee.wallet || !/^0x[a-fA-F0-9]{40}$/.test(newEmployee.wallet)) return setAddError('Valid wallet address required (0x...)');
    if (!newEmployee.salary || parseFloat(newEmployee.salary) <= 0) return setAddError('Valid salary required');
    setEmployees(prev => [...prev, {
      id: shortId(),
      name: newEmployee.name,
      wallet: newEmployee.wallet,
      salary: parseFloat(newEmployee.salary),
      payAmount: parseFloat(newEmployee.salary).toFixed(2),
      currency: newEmployee.currency,
      status: 'pending',
    }]);
    setNewEmployee({ name: '', wallet: '', salary: '', currency: 'USD' });
    setShowAddForm(false);
  }

  function removeEmployee(id: string) {
    setEmployees(prev => prev.filter(e => e.id !== id));
  }

  function promptPayAll() {
    if (pendingEmployees.length === 0) return;
    setConfirmAll(true);
    setConfirmTarget(null);
    setShowConfirm(true);
  }

  function promptPaySingle(emp: Employee) {
    if (emp.status === 'paid') return;
    setConfirmAll(false);
    setConfirmTarget(emp);
    setShowConfirm(true);
  }

  function cancelConfirm() {
    setShowConfirm(false);
    setConfirmTarget(null);
    setConfirmAll(false);
  }

  async function executePayAll() {
    setShowConfirm(false);
    setPaying(true);
    setRunComplete(false);
    setError('');
    const updated = [...employees];

    for (const emp of pendingEmployees) {
      setPayingId(emp.id);
      try {
        const amount = parseFloat(emp.payAmount).toFixed(2);
        const result = await arcSend(emp.wallet, amount, 'USDC');
        const idx = updated.findIndex(e => e.id === emp.id);
        if (idx !== -1) {
          updated[idx] = { ...updated[idx], status: 'paid', txHash: result.txHash };
          setEmployees([...updated]);
        }
      } catch (e: unknown) {
        const idx = updated.findIndex(e => e.id === emp.id);
        if (idx !== -1) {
          updated[idx] = { ...updated[idx], status: 'failed' };
          setEmployees([...updated]);
        }
        const errMsg = e instanceof Error ? e.message : String(e);
        setError(`Payment failed for ${emp.name}: ${errMsg}`);
        if (errMsg.includes('rejected') || errMsg.includes('denied') || errMsg.includes('4001')) {
          break;
        }
      }
    }

    setPayingId(null);
    setPaying(false);
    setRunComplete(true);

    const run: PayrollRun = {
      id: shortId(),
      date: new Date().toLocaleString(),
      employees: [...updated],
      totalUSDC: updated.filter(e => e.status === 'paid').reduce((s, e) => s + parseFloat(e.payAmount), 0),
      status: updated.every(e => e.status === 'paid') ? 'complete' : updated.some(e => e.status === 'paid') ? 'partial' : 'failed',
    };
    setHistory(prev => [run, ...prev]);
  }

  async function executePaySingle(emp: Employee) {
    setShowConfirm(false);
    setPayingId(emp.id);
    setError('');
    try {
      const amount = parseFloat(emp.payAmount).toFixed(2);
      const result = await arcSend(emp.wallet, amount, 'USDC');
      setEmployees(prev => prev.map(e => e.id === emp.id ? { ...e, status: 'paid', txHash: result.txHash } : e));
    } catch (e: unknown) {
      const errMsg = e instanceof Error ? e.message : String(e);
      if (errMsg.includes('rejected') || errMsg.includes('denied') || errMsg.includes('4001')) {
        setError('Payment rejected in MetaMask.');
      } else {
        setError(`Payment failed: ${errMsg}`);
      }
      setEmployees(prev => prev.map(e => e.id === emp.id ? { ...e, status: 'failed' } : e));
    } finally {
      setPayingId(null);
    }
  }

  function resetAll() {
    setEmployees(prev => prev.map(e => ({ ...e, status: 'pending', txHash: undefined })));
    setRunComplete(false);
    setError('');
  }

  function retryFailed() {
    setEmployees(prev => prev.map(e => e.status === 'failed' ? { ...e, status: 'pending', txHash: undefined } : e));
    setError('');
  }

  if (!address) {
    return (
      <div style={{ minHeight: 'calc(100vh - 84px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
        <div className="panel" style={{ maxWidth: 420, width: '100%', padding: '48px 36px', textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 20 }}>🔒</div>
          <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 10, color: 'rgba(232,240,232,0.3)', letterSpacing: '0.2em', marginBottom: 10 }}>ARC TERMINAL · PAYROLL</div>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: '#e8f0e8', marginBottom: 12, letterSpacing: '-0.02em' }}>Wallet Required</h2>
          <p style={{ fontSize: 13, color: 'rgba(232,240,232,0.4)', lineHeight: 1.7, marginBottom: 32 }}>
            Connect your wallet to access Payroll.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <WalletConnector />
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <style>{`
        .payroll-grid { display: grid; grid-template-columns: 1fr 320px; gap: 20px; align-items: start; }
        .payroll-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 24px; }
        .add-form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px; }
        @media (max-width: 1024px) { .payroll-grid { grid-template-columns: 1fr; } }
        @media (max-width: 768px) { .payroll-stats { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 640px) {
          .payroll-page { padding: 16px 16px 60px !important; }
          .payroll-stats { grid-template-columns: repeat(2, 1fr); gap: 8px; }
          .add-form-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      {showConfirm && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)', padding: 24 }}>
          <div className="panel" style={{ maxWidth: 420, width: '100%', padding: 32 }}>
            <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 10, color: '#ffaa00', letterSpacing: '0.2em', marginBottom: 16 }}>⚠ PAYMENT CONFIRMATION</div>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: '#e8f0e8', marginBottom: 12 }}>
              {confirmAll ? `Pay ${pendingEmployees.length} Employees` : `Pay ${confirmTarget?.name}`}
            </h3>
            <div style={{ marginBottom: 20, padding: '14px 16px', borderRadius: 6, background: 'rgba(0,255,136,0.05)', border: '1px solid rgba(0,255,136,0.15)' }}>
              {confirmAll ? (
                <>
                  {pendingEmployees.map(emp => (
                    <div key={emp.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid rgba(255,255,255,0.05)', fontFamily: 'Space Mono, monospace', fontSize: 11 }}>
                      <span style={{ color: 'rgba(232,240,232,0.6)' }}>{emp.name}</span>
                      <span style={{ color: '#00ff88', fontWeight: 700 }}>${parseFloat(emp.payAmount).toFixed(2)} USDC</span>
                    </div>
                  ))}
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0 0', fontFamily: 'Space Mono, monospace', fontSize: 13, fontWeight: 700, marginTop: 4 }}>
                    <span style={{ color: '#e8f0e8' }}>TOTAL</span>
                    <span style={{ color: '#00ff88' }}>${pendingEmployees.reduce((s, e) => s + parseFloat(e.payAmount), 0).toFixed(2)} USDC</span>
                  </div>
                </>
              ) : (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'Space Mono, monospace', fontSize: 13 }}>
                  <span style={{ color: 'rgba(232,240,232,0.6)' }}>{confirmTarget?.name}</span>
                  <span style={{ color: '#00ff88', fontWeight: 700 }}>${parseFloat(confirmTarget?.payAmount || '0').toFixed(2)} USDC</span>
                </div>
              )}
            </div>
            <div style={{ padding: '10px 14px', borderRadius: 6, background: 'rgba(255,170,0,0.06)', border: '1px solid rgba(255,170,0,0.15)', fontFamily: 'Space Mono, monospace', fontSize: 11, color: 'rgba(232,240,232,0.5)', lineHeight: 1.6, marginBottom: 20 }}>
              🦊 MetaMask will ask you to approve {confirmAll ? 'each payment separately' : 'this payment'}.
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={cancelConfirm} className="btn btn-ghost" style={{ flex: 1, fontSize: 13 }}>CANCEL</button>
              <button onClick={() => confirmAll ? executePayAll() : confirmTarget && executePaySingle(confirmTarget)} className="btn btn-green" style={{ flex: 1, fontSize: 13 }}>
                APPROVE & PAY
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="payroll-page" style={{ padding: '24px 24px 60px', maxWidth: 1200, margin: '0 auto', position: 'relative', zIndex: 1 }}>
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 10, color: 'rgba(232,240,232,0.3)', letterSpacing: '0.2em', marginBottom: 6 }}>ARC TERMINAL · PAYROLL</div>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: '#e8f0e8', letterSpacing: '-0.02em', marginBottom: 4 }}>Payroll</h1>
          <p style={{ fontSize: 13, color: 'rgba(232,240,232,0.4)' }}>Add employees, set salaries, pay everyone in one click via Arc SDK</p>
          <div style={{ marginTop: 10, display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 6, background: 'rgba(0,255,136,0.06)', border: '1px solid rgba(0,255,136,0.15)' }}>
            <span className="live-dot" style={{ width: 5, height: 5 }} />
            <span style={{ fontFamily: 'Space Mono, monospace', fontSize: 10, color: '#00ff88' }}>{address.slice(0, 6)}…{address.slice(-4)}</span>
          </div>
        </div>

        {error && (
          <div style={{ marginBottom: 20, padding: '12px 16px', borderRadius: 6, background: 'rgba(255,51,85,0.08)', border: '1px solid rgba(255,51,85,0.2)', fontFamily: 'Space Mono, monospace', fontSize: 12, color: '#ff3355' }}>
            ✗ {error}
          </div>
        )}

        <div className="payroll-stats">
          {[
            { label: 'TOTAL EMPLOYEES', value: employees.length, color: '#00aaff' },
            { label: 'TOTAL PAYROLL', value: `$${totalPayroll.toLocaleString()}`, color: '#00ff88' },
            { label: 'PAID THIS RUN', value: employees.filter(e => e.status === 'paid').length, color: '#00ff88' },
            { label: 'NETWORK FEE', value: `~$${(employees.length * 0.01).toFixed(2)}`, color: '#ffaa00' },
          ].map(s => (
            <div key={s.label} className="panel" style={{ padding: 16 }}>
              <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 9, color: 'rgba(232,240,232,0.3)', letterSpacing: '0.15em', marginBottom: 6 }}>{s.label}</div>
              <div style={{ fontFamily: 'Space Mono, monospace', fontWeight: 700, fontSize: 20, color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>

        <div className="payroll-grid">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="panel">
              <div className="panel-header">
                <div className="panel-title">EMPLOYEES ({employees.length})</div>
                <button onClick={() => setShowAddForm(!showAddForm)} className="btn btn-green" style={{ fontSize: 11, padding: '6px 14px' }}>
                  {showAddForm ? '✕ CANCEL' : '+ ADD EMPLOYEE'}
                </button>
              </div>

              {showAddForm && (
                <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(0,255,136,0.02)' }}>
                  <div className="add-form-grid">
                    <div>
                      <label className="label">FULL NAME</label>
                      <input className="input" placeholder="Alice Johnson" value={newEmployee.name} onChange={e => setNewEmployee(p => ({ ...p, name: e.target.value }))} />
                    </div>
                    <div>
                      <label className="label">SALARY (USDC/month)</label>
                      <input className="input" type="number" placeholder="3000" value={newEmployee.salary} onChange={e => setNewEmployee(p => ({ ...p, salary: e.target.value }))} />
                    </div>
                  </div>
                  <div style={{ marginBottom: 12 }}>
                    <label className="label">WALLET ADDRESS (ARC TESTNET)</label>
                    <input className="input" placeholder="0x... (must be a real Arc Testnet address)" value={newEmployee.wallet} onChange={e => setNewEmployee(p => ({ ...p, wallet: e.target.value }))} />
                  </div>
                  {addError && <div style={{ color: '#ff3355', fontFamily: 'Space Mono, monospace', fontSize: 11, marginBottom: 10 }}>⚠ {addError}</div>}
                  <button onClick={addEmployee} className="btn btn-green" style={{ fontSize: 12 }}>ADD EMPLOYEE</button>
                </div>
              )}

              <div>
                {employees.length === 0 && (
                  <div style={{ padding: 32, textAlign: 'center', color: 'rgba(232,240,232,0.3)', fontFamily: 'Space Mono, monospace', fontSize: 12 }}>
                    No employees yet. Click &quot;+ ADD EMPLOYEE&quot; to get started.
                  </div>
                )}
                {employees.map(emp => (
                  <div key={emp.id} style={{ padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.04)', background: emp.status === 'paid' ? 'rgba(0,255,136,0.03)' : emp.status === 'failed' ? 'rgba(255,51,85,0.03)' : 'transparent', transition: 'all 0.3s' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                          <span style={{ fontFamily: 'Space Mono, monospace', fontWeight: 700, fontSize: 13, color: '#e8f0e8' }}>{emp.name}</span>
                          {emp.status === 'paid' && <span className="badge badge-green" style={{ fontSize: 9 }}>PAID</span>}
                          {emp.status === 'failed' && <span className="badge badge-red" style={{ fontSize: 9 }}>FAILED</span>}
                          {payingId === emp.id && <span className="spinner" />}
                        </div>
                        <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 10, color: 'rgba(232,240,232,0.3)', wordBreak: 'break-all' }}>
                          {emp.wallet.slice(0, 10)}...{emp.wallet.slice(-6)}
                        </div>
                        {emp.txHash && (
                          <a href={`https://testnet.arcscan.app/tx/${emp.txHash}`} target="_blank" rel="noopener noreferrer" style={{ fontFamily: 'Space Mono, monospace', fontSize: 10, color: '#00ff88', textDecoration: 'none' }}>
                            {emp.txHash.slice(0, 14)}... ↗
                          </a>
                        )}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                        {(emp.status === 'pending' || emp.status === 'failed') && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <span style={{ fontFamily: 'Space Mono, monospace', fontSize: 11, color: 'rgba(232,240,232,0.3)' }}>$</span>
                            <input
                              type="number"
                              value={emp.payAmount}
                              onChange={e => setEmployees(prev => prev.map(em => em.id === emp.id ? { ...em, payAmount: e.target.value } : em))}
                              style={{ width: 80, background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 4, padding: '4px 8px', color: '#00ff88', fontFamily: 'Space Mono, monospace', fontSize: 12, fontWeight: 700, outline: 'none' }}
                              min="0.01" step="0.01"
                            />
                          </div>
                        )}
                        {emp.status === 'paid' && (
                          <span style={{ fontFamily: 'Space Mono, monospace', fontWeight: 700, fontSize: 13, color: '#00ff88' }}>${parseFloat(emp.payAmount).toFixed(2)}</span>
                        )}
                        {(emp.status === 'pending' || emp.status === 'failed') && (
                          <button onClick={() => promptPaySingle(emp)} disabled={paying || payingId === emp.id} className={`btn ${emp.status === 'failed' ? 'btn-amber' : 'btn-blue'}`} style={{ fontSize: 10, padding: '5px 10px' }}>
                            {payingId === emp.id ? <span className="spinner" /> : emp.status === 'failed' ? 'RETRY' : 'PAY'}
                          </button>
                        )}
                        {emp.status !== 'paid' && (
                          <button onClick={() => removeEmployee(emp.id)} disabled={paying} style={{ background: 'none', border: 'none', color: 'rgba(232,240,232,0.3)', cursor: 'pointer', fontSize: 16, padding: '0 4px' }}>✕</button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button onClick={promptPayAll} disabled={paying || pendingEmployees.length === 0} className="btn btn-green" style={{ flex: 1, fontSize: 13, padding: '14px' }}>
                {paying
                  ? <><span className="spinner" /> PAYING {payingId ? employees.find(e => e.id === payingId)?.name : ''}...</>
                  : `⚡ PAY ALL ${pendingEmployees.length} · $${pendingEmployees.reduce((s, e) => s + parseFloat(e.payAmount || '0'), 0).toFixed(2)} USDC`
                }
              </button>
              {employees.some(e => e.status === 'failed') && (
                <button onClick={retryFailed} className="btn btn-amber" style={{ fontSize: 12, padding: '14px 16px' }}>↻ RETRY FAILED</button>
              )}
              {runComplete && (
                <button onClick={resetAll} className="btn btn-ghost" style={{ fontSize: 13, padding: '14px 20px' }}>RESET ALL</button>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="panel">
              <div className="panel-header">
                <div className="panel-title">PAYROLL HISTORY</div>
                <span style={{ fontFamily: 'Space Mono, monospace', fontSize: 10, color: 'rgba(232,240,232,0.3)' }}>{history.length} RUNS</span>
              </div>
              {history.length === 0 ? (
                <div style={{ padding: 24, textAlign: 'center', fontFamily: 'Space Mono, monospace', fontSize: 11, color: 'rgba(232,240,232,0.25)' }}>No runs yet</div>
              ) : (
                <div>
                  {history.map(run => (
                    <div key={run.id} style={{ padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                        <span style={{ fontFamily: 'Space Mono, monospace', fontSize: 11, fontWeight: 700, color: '#e8f0e8' }}>RUN #{run.id}</span>
                        <span className={`badge ${run.status === 'complete' ? 'badge-green' : run.status === 'partial' ? 'badge-amber' : 'badge-red'}`} style={{ fontSize: 9 }}>
                          {run.status.toUpperCase()}
                        </span>
                      </div>
                      <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 10, color: 'rgba(232,240,232,0.3)', marginBottom: 4 }}>{run.date}</div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontFamily: 'Space Mono, monospace', fontSize: 11, color: 'rgba(232,240,232,0.5)' }}>
                          {run.employees.filter(e => e.status === 'paid').length}/{run.employees.length} paid
                        </span>
                        <span style={{ fontFamily: 'Space Mono, monospace', fontSize: 12, fontWeight: 700, color: '#00ff88' }}>${run.totalUSDC.toFixed(2)} USDC</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="panel" style={{ padding: 16 }}>
              <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 10, color: '#00ff88', letterSpacing: '0.15em', marginBottom: 10 }}>⚡ HOW IT WORKS</div>
              {[
                { label: 'Per payment fee', value: '~$0.01' },
                { label: 'Settlement', value: '< 1 second' },
                { label: 'Token', value: 'USDC' },
                { label: 'Network', value: 'Arc Testnet' },
                { label: 'Method', value: 'kit.send()' },
                { label: 'Approval', value: 'MetaMask' },
              ].map(i => (
                <div key={i.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <span style={{ fontFamily: 'Space Mono, monospace', fontSize: 10, color: 'rgba(232,240,232,0.3)' }}>{i.label}</span>
                  <span style={{ fontFamily: 'Space Mono, monospace', fontSize: 11, fontWeight: 700, color: '#e8f0e8' }}>{i.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}