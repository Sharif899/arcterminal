'use client';
import { useState } from 'react';
import { arcSend } from '@/lib/arc';
import { useWallet } from '@/context/WalletContext';
import { callContract, CONTRACTS, PAYROLL_ABI } from '@/lib/contracts';

interface Employee {
  id: string;
  name: string;
  wallet: string;
  salary: number;
  currency: string;
  status: 'pending' | 'paid' | 'failed';
  txHash?: string;
  explorerUrl?: string;
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

const MY_WALLET = '0xf2ee634847d39161ec7de7879d7d0d241b932ad4';

// Core text tones tuned for a WHITE page background
const TEXT = {
  faint:  'rgba(15,26,20,0.45)',
  muted:  'rgba(15,26,20,0.62)',
  strong: '#0d1f16',
};
const GREEN = '#059669';
const GREEN_BG = 'rgba(5,150,105,0.08)';
const GREEN_BORDER = 'rgba(5,150,105,0.28)';
const BLUE = '#0284c7';
const AMBER = '#b45f06';
const RED = '#dc2626';

export default function PayrollPage() {
  const { address, connect } = useWallet();
  const [employees, setEmployees] = useState<Employee[]>([
    { id: shortId(), name: 'Alice Johnson', wallet: MY_WALLET, salary: 3000, currency: 'USD', status: 'pending' },
    { id: shortId(), name: 'Bob Smith', wallet: MY_WALLET, salary: 2500, currency: 'USD', status: 'pending' },
  ]);
  const [history, setHistory] = useState<PayrollRun[]>([]);
  const [paying, setPaying] = useState(false);
  const [payingId, setPayingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newEmployee, setNewEmployee] = useState({ name: '', wallet: '', salary: '', currency: 'USD' });
  const [addError, setAddError] = useState('');
  const [runComplete, setRunComplete] = useState(false);
  const [error, setError] = useState('');

  const totalPayroll = employees.reduce((sum, e) => sum + e.salary, 0);
  const pendingEmployees = employees.filter(e => e.status === 'pending');

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
      currency: newEmployee.currency,
      status: 'pending',
    }]);
    setNewEmployee({ name: '', wallet: '', salary: '', currency: 'USD' });
    setShowAddForm(false);
  }

  function removeEmployee(id: string) {
    setEmployees(prev => prev.filter(e => e.id !== id));
  }

  async function paySingle(id: string) {
    if (!address) { await connect(); return; }
    const emp = employees.find(e => e.id === id);
    if (!emp || emp.status === 'paid') return;
    setPayingId(id);
    setError('');
    try {
      const res = await arcSend(emp.wallet, emp.salary.toFixed(2), 'USDC');
      try {
        await callContract(CONTRACTS.ArcPayrollRegistry, PAYROLL_ABI, 'addEmployee', [emp.wallet as `0x${string}`, emp.name, BigInt(Math.floor(emp.salary * 100))]);
        await callContract(CONTRACTS.ArcPayrollRegistry, PAYROLL_ABI, 'recordPayrollRun', [BigInt(Math.floor(emp.salary * 100)), BigInt(1), 'complete']);
      } catch (contractErr) { console.log('Contract:', contractErr); }
      setEmployees(prev => prev.map(e => e.id === id ? { ...e, status: 'paid', txHash: res.txHash, explorerUrl: res.explorerUrl } : e));
    } catch (e: any) {
      setError(e?.message || 'Payment failed');
      setEmployees(prev => prev.map(e => e.id === id ? { ...e, status: 'failed' } : e));
    }
    setPayingId(null);
  }

  async function payAll() {
    if (!address) { await connect(); return; }
    if (pendingEmployees.length === 0) return;
    setPaying(true);
    setRunComplete(false);
    setError('');
    const updated = [...employees];
    for (const emp of pendingEmployees) {
      setPayingId(emp.id);
      try {
        const res = await arcSend(emp.wallet, emp.salary.toFixed(2), 'USDC');
        const idx = updated.findIndex(e => e.id === emp.id);
        if (idx !== -1) { updated[idx] = { ...updated[idx], status: 'paid', txHash: res.txHash, explorerUrl: res.explorerUrl }; setEmployees([...updated]); }
        try { await callContract(CONTRACTS.ArcPayrollRegistry, PAYROLL_ABI, 'recordPayrollRun', [BigInt(Math.floor(emp.salary * 100)), BigInt(1), 'complete']); } catch (contractErr) { console.log('Contract:', contractErr); }
      } catch (e: any) {
        const idx = updated.findIndex(e => e.id === emp.id);
        if (idx !== -1) { updated[idx] = { ...updated[idx], status: 'failed' }; setEmployees([...updated]); }
        setError(e?.message || 'One or more payments failed');
      }
    }
    try {
      const totalPaid = updated.filter(e => e.status === 'paid').reduce((s, e) => s + e.salary, 0);
      const paidCount = updated.filter(e => e.status === 'paid').length;
      const runStatus = updated.every(e => e.status === 'paid') ? 'complete' : updated.some(e => e.status === 'paid') ? 'partial' : 'failed';
      await callContract(CONTRACTS.ArcPayrollRegistry, PAYROLL_ABI, 'recordPayrollRun', [BigInt(Math.floor(totalPaid * 100)), BigInt(paidCount), runStatus]);
    } catch (contractErr) { console.log('Contract:', contractErr); }
    setPayingId(null);
    setPaying(false);
    setRunComplete(true);
    const run: PayrollRun = {
      id: shortId(), date: new Date().toLocaleString(), employees: [...updated],
      totalUSDC: updated.filter(e => e.status === 'paid').reduce((s, e) => s + e.salary, 0),
      status: updated.every(e => e.status === 'paid') ? 'complete' : updated.some(e => e.status === 'paid') ? 'partial' : 'failed',
    };
    setHistory(prev => [run, ...prev]);
  }

  function resetAll() {
    setEmployees(prev => prev.map(e => ({ ...e, status: 'pending', txHash: undefined, explorerUrl: undefined })));
    setRunComplete(false);
    setError('');
  }

  return (
    <>
      <style>{`
        .payroll-page { padding: 24px 24px 60px; max-width: 1200px; margin: 0 auto; position: relative; z-index: 1; }
        .payroll-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 28px; flex-wrap: wrap; gap: 12px; }
        .payroll-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 24px; }
        .payroll-main { display: grid; grid-template-columns: 1fr 320px; gap: 20px; align-items: start; }
        .add-emp-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px; }
        .emp-row { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; }
        .emp-actions { display: flex; align-items: center; gap: 10px; flex-shrink: 0; }
        .pay-actions-row { display: flex; gap: 10px; }
        @media (max-width: 900px) {
          .payroll-main { grid-template-columns: 1fr; }
        }
        @media (max-width: 640px) {
          .payroll-stats { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 480px) {
          .payroll-page { padding: 16px 16px 60px !important; }
          .payroll-page h1 { font-size: 22px !important; }
          .payroll-header { flex-direction: column; align-items: stretch; }
          .payroll-header .btn, .payroll-header > div:last-child { width: 100%; text-align: center; }
          .add-emp-grid { grid-template-columns: 1fr; }
          .emp-row { flex-direction: column; }
          .emp-actions { width: 100%; justify-content: space-between; }
          .pay-actions-row { flex-direction: column; }
        }
      `}</style>

      <div className="payroll-page">
        <div className="payroll-header">
          <div>
            <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 10, color: TEXT.faint, letterSpacing: '0.2em', marginBottom: 6 }}>ARC TERMINAL · PAYROLL</div>
            <h1 style={{ fontSize: 28, fontWeight: 700, color: TEXT.strong, letterSpacing: '-0.02em', marginBottom: 4 }}>Payroll</h1>
            <p style={{ fontSize: 13, color: TEXT.muted }}>Add employees, set salaries, pay everyone in one click via Arc SDK</p>
          </div>
          {!address
            ? <button onClick={connect} className="btn btn-green" style={{ fontSize: 12 }}>🦊 CONNECT WALLET</button>
            : <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 11, color: GREEN, padding: '8px 14px', borderRadius: 6, background: GREEN_BG, border: `1px solid ${GREEN_BORDER}` }}>{address.slice(0, 6)}…{address.slice(-4)}</div>
          }
        </div>

        <div className="payroll-stats">
          {[
            { label: 'TOTAL EMPLOYEES', value: employees.length, color: BLUE },
            { label: 'TOTAL PAYROLL', value: `$${totalPayroll.toLocaleString()} USDC`, color: GREEN },
            { label: 'PAID THIS RUN', value: employees.filter(e => e.status === 'paid').length, color: GREEN },
            { label: 'NETWORK FEE', value: `~$${(employees.length * 0.01).toFixed(2)}`, color: AMBER },
          ].map(s => (
            <div key={s.label} className="panel" style={{ padding: 16 }}>
              <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 9, color: TEXT.faint, letterSpacing: '0.15em', marginBottom: 6 }}>{s.label}</div>
              <div style={{ fontFamily: 'Space Mono, monospace', fontWeight: 700, fontSize: 18, color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>

        {error && (
          <div style={{ background: 'rgba(220,38,38,0.06)', border: `1px solid rgba(220,38,38,0.25)`, borderRadius: 8, padding: '12px 16px', marginBottom: 16, fontFamily: 'Space Mono, monospace', fontSize: 12, color: RED }}>
            ⚠ {error}
          </div>
        )}

        <div className="payroll-main">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="panel">
              <div className="panel-header">
                <div className="panel-title">EMPLOYEES ({employees.length})</div>
                <button onClick={() => setShowAddForm(!showAddForm)} className="btn btn-green" style={{ fontSize: 11, padding: '6px 14px' }}>
                  {showAddForm ? '✕ CANCEL' : '+ ADD EMPLOYEE'}
                </button>
              </div>
              {showAddForm && (
                <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(15,26,20,0.08)', background: GREEN_BG }}>
                  <div className="add-emp-grid">
                    <div><label className="label">FULL NAME</label><input className="input" placeholder="Alice Johnson" value={newEmployee.name} onChange={e => setNewEmployee(p => ({ ...p, name: e.target.value }))} /></div>
                    <div><label className="label">SALARY (USDC/month)</label><input className="input" type="number" placeholder="3000" value={newEmployee.salary} onChange={e => setNewEmployee(p => ({ ...p, salary: e.target.value }))} /></div>
                  </div>
                  <div style={{ marginBottom: 12 }}><label className="label">WALLET ADDRESS (ARC)</label><input className="input" placeholder="0x..." value={newEmployee.wallet} onChange={e => setNewEmployee(p => ({ ...p, wallet: e.target.value }))} /></div>
                  {addError && <div style={{ color: RED, fontFamily: 'Space Mono, monospace', fontSize: 11, marginBottom: 10 }}>⚠ {addError}</div>}
                  <button onClick={addEmployee} className="btn btn-green" style={{ fontSize: 12 }}>ADD EMPLOYEE</button>
                </div>
              )}
              <div>
                {employees.length === 0 && (
                  <div style={{ padding: 32, textAlign: 'center', color: TEXT.faint, fontFamily: 'Space Mono, monospace', fontSize: 12 }}>No employees yet. Add one above.</div>
                )}
                {employees.map(emp => (
                  <div key={emp.id} style={{ padding: '14px 20px', borderBottom: '1px solid rgba(15,26,20,0.06)', background: emp.status === 'paid' ? 'rgba(5,150,105,0.05)' : emp.status === 'failed' ? 'rgba(220,38,38,0.05)' : 'transparent', transition: 'all 0.3s' }}>
                    <div className="emp-row">
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                          <span style={{ fontFamily: 'Space Mono, monospace', fontWeight: 700, fontSize: 13, color: TEXT.strong }}>{emp.name}</span>
                          {emp.status === 'paid' && <span className="badge badge-green" style={{ fontSize: 9 }}>PAID</span>}
                          {emp.status === 'failed' && <span className="badge badge-red" style={{ fontSize: 9 }}>FAILED</span>}
                          {payingId === emp.id && <span className="spinner" />}
                        </div>
                        <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 10, color: TEXT.faint, marginBottom: emp.txHash ? 4 : 0 }}>{emp.wallet.slice(0, 12)}...{emp.wallet.slice(-8)}</div>
                        {emp.txHash && emp.explorerUrl && (
                          <a href={emp.explorerUrl} target="_blank" rel="noopener noreferrer" style={{ fontFamily: 'Space Mono, monospace', fontSize: 10, color: GREEN, textDecoration: 'none' }}>{emp.txHash.slice(0, 16)}... ↗</a>
                        )}
                      </div>
                      <div className="emp-actions">
                        <span style={{ fontFamily: 'Space Mono, monospace', fontWeight: 700, fontSize: 14, color: GREEN }}>${emp.salary.toLocaleString()} USDC</span>
                        {emp.status === 'pending' && (
                          <button onClick={() => paySingle(emp.id)} disabled={paying || payingId === emp.id} className="btn btn-blue" style={{ fontSize: 10, padding: '5px 10px' }}>
                            {payingId === emp.id ? <span className="spinner" /> : 'PAY'}
                          </button>
                        )}
                        {emp.status !== 'paid' && (
                          <button onClick={() => removeEmployee(emp.id)} disabled={paying} style={{ background: 'none', border: 'none', color: TEXT.faint, cursor: 'pointer', fontSize: 16, padding: '0 4px' }}>✕</button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="pay-actions-row">
              <button onClick={payAll} disabled={paying || pendingEmployees.length === 0} className="btn btn-green" style={{ flex: 1, fontSize: 13, padding: '14px' }}>
                {paying ? <><span className="spinner" /> PAYING {employees.find(e => e.id === payingId)?.name || ''}...</> : `PAY ALL ${pendingEmployees.length} EMPLOYEES · $${pendingEmployees.reduce((s, e) => s + e.salary, 0).toLocaleString()} USDC`}
              </button>
              {runComplete && <button onClick={resetAll} className="btn btn-ghost" style={{ fontSize: 13, padding: '14px 20px' }}>RESET</button>}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="panel">
              <div className="panel-header">
                <div className="panel-title">PAYROLL HISTORY</div>
                <span style={{ fontFamily: 'Space Mono, monospace', fontSize: 10, color: TEXT.faint }}>{history.length} RUNS</span>
              </div>
              {history.length === 0
                ? <div style={{ padding: 24, textAlign: 'center', fontFamily: 'Space Mono, monospace', fontSize: 11, color: TEXT.faint }}>No runs yet</div>
                : history.map(run => (
                  <div key={run.id} style={{ padding: '14px 16px', borderBottom: '1px solid rgba(15,26,20,0.06)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ fontFamily: 'Space Mono, monospace', fontSize: 11, fontWeight: 700, color: TEXT.strong }}>RUN #{run.id}</span>
                      <span className={`badge ${run.status === 'complete' ? 'badge-green' : run.status === 'partial' ? 'badge-amber' : 'badge-red'}`} style={{ fontSize: 9 }}>{run.status.toUpperCase()}</span>
                    </div>
                    <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 10, color: TEXT.faint, marginBottom: 4 }}>{run.date}</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontFamily: 'Space Mono, monospace', fontSize: 11, color: TEXT.muted }}>{run.employees.filter(e => e.status === 'paid').length}/{run.employees.length} paid</span>
                      <span style={{ fontFamily: 'Space Mono, monospace', fontSize: 12, fontWeight: 700, color: GREEN }}>${run.totalUSDC.toLocaleString()} USDC</span>
                    </div>
                  </div>
                ))
              }
            </div>
            <div className="panel" style={{ padding: 16 }}>
              <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 10, color: GREEN, letterSpacing: '0.15em', marginBottom: 10 }}>⚡ HOW IT WORKS</div>
              {[
                { label: 'Per payment fee', value: '~$0.01' },
                { label: 'Settlement', value: '< 1 second' },
                { label: 'Token', value: 'USDC' },
                { label: 'Network', value: 'Arc Testnet' },
                { label: 'Contract', value: 'ArcPayrollRegistry' },
              ].map(i => (
                <div key={i.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid rgba(15,26,20,0.06)' }}>
                  <span style={{ fontFamily: 'Space Mono, monospace', fontSize: 10, color: TEXT.faint }}>{i.label}</span>
                  <span style={{ fontFamily: 'Space Mono, monospace', fontSize: 11, fontWeight: 700, color: TEXT.strong }}>{i.value}</span>
                </div>
              ))}
              <a href={`https://testnet.arcscan.app/address/${CONTRACTS.ArcPayrollRegistry}`} target="_blank" rel="noopener noreferrer"
                style={{ display: 'block', marginTop: 12, fontFamily: 'Space Mono, monospace', fontSize: 10, color: BLUE, textDecoration: 'none' }}>
                VIEW CONTRACT ON ARCSCAN ↗
              </a>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}