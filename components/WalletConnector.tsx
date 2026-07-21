'use client';
import { useState } from 'react';
import { useWallet } from '@/context/WalletContext';

export default function WalletConnector() {
  const { address, balances, connecting, connect, disconnect } = useWallet();
  const [showMenu, setShowMenu] = useState(false);
  const [error, setError] = useState('');
  const [showMobileGuide, setShowMobileGuide] = useState(false);

  async function handleConnect() {
    setError('');
    setShowMobileGuide(false);
    try {
      await connect();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg.startsWith('MOBILE_CHAIN_SWITCH:')) {
        setShowMobileGuide(true);
      } else {
        setError(msg);
      }
    }
  }

  function handleDisconnect() {
    disconnect();
    setShowMenu(false);
  }

  function short(addr: string) { return addr.slice(0, 6) + '\u2026' + addr.slice(-4); }

  if (address && balances) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0, position: 'relative' }}>
        <div style={{ display: 'flex', gap: 12, fontFamily: 'Space Mono, monospace', fontSize: 11 }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ color: '#9199aa', fontSize: 9, letterSpacing: '0.1em' }}>USDC</div>
            <div style={{ color: '#16a34a', fontWeight: 700 }}>${balances.usdc}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ color: '#9199aa', fontSize: 9, letterSpacing: '0.1em' }}>EURC</div>
            <div style={{ color: '#2563eb', fontWeight: 700 }}>${balances.eurc}</div>
          </div>
        </div>
        <button
          onClick={() => setShowMenu(!showMenu)}
          style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '6px 12px', borderRadius: 8, cursor: 'pointer', background: '#f0fdf4', border: '1px solid #bbf7d0', fontFamily: 'Space Mono, monospace', fontSize: 11, color: '#16a34a' }}
        >
          <span className="live-dot" style={{ width: 5, height: 5 }} />
          {short(address)}
          <span style={{ fontSize: 9, opacity: 0.5 }}>▾</span>
        </button>
        {showMenu && (
          <>
            <div onClick={() => setShowMenu(false)} style={{ position: 'fixed', inset: 0, zIndex: 98 }} />
            <div style={{ position: 'absolute', top: 'calc(100% + 8px)', right: 0, background: '#ffffff', border: '1px solid #e2e6ed', borderRadius: 10, padding: 8, minWidth: 220, zIndex: 99, boxShadow: '0 8px 32px rgba(15,17,23,0.12)' }}>
              <div style={{ padding: '8px 12px', borderBottom: '1px solid #f1f3f7', marginBottom: 4 }}>
                <div style={{ fontSize: 9, color: '#9199aa', letterSpacing: '0.1em', marginBottom: 4, fontWeight: 600 }}>CONNECTED</div>
                <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 10, color: '#5a6478', wordBreak: 'break-all' }}>{address}</div>
              </div>
              <button onClick={() => { navigator.clipboard.writeText(address); setShowMenu(false); }} style={{ width: '100%', padding: '8px 12px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', fontSize: 12, color: '#5a6478', borderRadius: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
                📋 Copy Address
              </button>
              <a href={`https://testnet.arcscan.app/address/${address}`} target="_blank" rel="noopener noreferrer" onClick={() => setShowMenu(false)} style={{ width: '100%', padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#5a6478', borderRadius: 6, textDecoration: 'none' }}>
                ↗ View on Arcscan
              </a>
              <div style={{ height: 1, background: '#f1f3f7', margin: '4px 0' }} />
              <button onClick={handleDisconnect} style={{ width: '100%', padding: '8px 12px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', fontSize: 12, color: '#dc2626', borderRadius: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
                ✕ Disconnect
              </button>
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div style={{ flexShrink: 0, textAlign: 'right' }}>
      <button className="btn btn-primary" onClick={handleConnect} disabled={connecting} style={{ fontSize: 11, padding: '7px 16px' }}>
        {connecting ? <><span className="spinner" /> CONNECTING…</> : '🦊 CONNECT'}
      </button>
      {showMobileGuide && (
        <div style={{ marginTop: 8, fontSize: 10, color: '#0f1117', background: '#eff4ff', border: '1px solid #bfdbfe', borderRadius: 8, padding: '10px 12px', maxWidth: 280, lineHeight: 1.7, textAlign: 'left', fontFamily: 'Space Mono, monospace' }}>
          <div style={{ color: '#2563eb', fontWeight: 700, marginBottom: 6 }}>📱 Add Arc Testnet Manually</div>
          <div style={{ color: '#5a6478', marginBottom: 4 }}>In MetaMask → Settings → Networks → Add Network:</div>
          <div><span style={{ color: '#9199aa' }}>Name:</span> <span style={{ color: '#2563eb' }}>Arc Testnet</span></div>
          <div><span style={{ color: '#9199aa' }}>RPC:</span> <span style={{ color: '#2563eb' }}>rpc.testnet.arc.network</span></div>
          <div><span style={{ color: '#9199aa' }}>Chain ID:</span> <span style={{ color: '#2563eb' }}>5042002</span></div>
          <div><span style={{ color: '#9199aa' }}>Symbol:</span> <span style={{ color: '#2563eb' }}>USDC</span></div>
          <div><span style={{ color: '#9199aa' }}>Explorer:</span> <span style={{ color: '#2563eb' }}>testnet.arcscan.app</span></div>
          <button onClick={handleConnect} style={{ marginTop: 10, width: '100%', padding: '6px 0', background: '#eff4ff', border: '1px solid #bfdbfe', borderRadius: 6, color: '#2563eb', fontFamily: 'Space Mono, monospace', fontSize: 10, cursor: 'pointer' }}>
            ↺ Try Again After Adding
          </button>
        </div>
      )}
      {error && (
        <div style={{ marginTop: 6, fontFamily: 'Space Mono, monospace', fontSize: 10, color: '#dc2626', maxWidth: 260, lineHeight: 1.4 }}>
          ✗ {error}
        </div>
      )}
    </div>
  );
}
