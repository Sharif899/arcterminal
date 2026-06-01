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

  function short(addr: string) { return addr.slice(0, 6) + '…' + addr.slice(-4); }

  if (address && balances) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0, position: 'relative' }}>
        <div style={{ display: 'flex', gap: 12, fontFamily: 'Space Mono, monospace', fontSize: 11 }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ color: 'rgba(232,240,232,0.3)', fontSize: 9, letterSpacing: '0.1em' }}>USDC</div>
            <div style={{ color: '#00ff88', fontWeight: 700 }}>${balances.usdc}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ color: 'rgba(232,240,232,0.3)', fontSize: 9, letterSpacing: '0.1em' }}>EURC</div>
            <div style={{ color: '#00aaff', fontWeight: 700 }}>${balances.eurc}</div>
          </div>
        </div>
        <button onClick={() => setShowMenu(!showMenu)} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '5px 12px', borderRadius: 6, cursor: 'pointer', background: 'rgba(0,255,136,0.06)', border: '1px solid rgba(0,255,136,0.18)', fontFamily: 'Space Mono, monospace', fontSize: 11, color: '#00ff88' }}>
          <span className="live-dot" style={{ width: 5, height: 5 }} />
          {short(address)}
          <span style={{ fontSize: 9, opacity: 0.5 }}>▾</span>
        </button>
        {showMenu && (
          <>
            <div onClick={() => setShowMenu(false)} style={{ position: 'fixed', inset: 0, zIndex: 98 }} />
            <div style={{ position: 'absolute', top: 'calc(100% + 8px)', right: 0, background: '#080c10', border: '1px solid rgba(0,255,136,0.2)', borderRadius: 8, padding: 8, minWidth: 200, zIndex: 99, boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}>
              <div style={{ padding: '8px 12px', borderBottom: '1px solid rgba(255,255,255,0.07)', marginBottom: 4 }}>
                <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 9, color: 'rgba(232,240,232,0.3)', letterSpacing: '0.1em', marginBottom: 4 }}>CONNECTED</div>
                <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 10, color: 'rgba(232,240,232,0.6)', wordBreak: 'break-all' }}>{address}</div>
              </div>
              <button onClick={() => { navigator.clipboard.writeText(address); setShowMenu(false); }} style={{ width: '100%', padding: '8px 12px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', fontFamily: 'Space Mono, monospace', fontSize: 11, color: 'rgba(232,240,232,0.5)', borderRadius: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
                📋 Copy Address
              </button>
              <a href={`https://testnet.arcscan.app/address/${address}`} target="_blank" rel="noopener noreferrer" onClick={() => setShowMenu(false)} style={{ width: '100%', padding: '8px 12px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', fontFamily: 'Space Mono, monospace', fontSize: 11, color: 'rgba(232,240,232,0.5)', borderRadius: 6, display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
                ↗ View on Arcscan
              </a>
              <div style={{ height: 1, background: 'rgba(255,255,255,0.07)', margin: '4px 0' }} />
              <button onClick={handleDisconnect} style={{ width: '100%', padding: '8px 12px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', fontFamily: 'Space Mono, monospace', fontSize: 11, color: '#ff3355', borderRadius: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
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
      <button className="btn btn-green" onClick={handleConnect} disabled={connecting} style={{ fontSize: 11, padding: '7px 16px' }}>
        {connecting ? <><span className="spinner" style={{ borderTopColor: '#00ff88' }} /> CONNECTING…</> : '🦊 CONNECT'}
      </button>

      {/* Mobile manual network guide */}
      {showMobileGuide && (
        <div style={{ marginTop: 8, fontFamily: 'Space Mono, monospace', fontSize: 10, color: '#e8f0e8', background: 'rgba(0,255,136,0.06)', border: '1px solid rgba(0,255,136,0.2)', borderRadius: 8, padding: '10px 12px', maxWidth: 280, lineHeight: 1.7, textAlign: 'left' }}>
          <div style={{ color: '#00ff88', fontWeight: 700, marginBottom: 6 }}>📱 Add Arc Testnet Manually</div>
          <div style={{ color: 'rgba(232,240,232,0.5)', marginBottom: 4 }}>In MetaMask → Settings → Networks → Add Network:</div>
          <div><span style={{ color: 'rgba(232,240,232,0.4)' }}>Name:</span> <span style={{ color: '#00ff88' }}>Arc Testnet</span></div>
          <div><span style={{ color: 'rgba(232,240,232,0.4)' }}>RPC:</span> <span style={{ color: '#00ff88' }}>rpc.testnet.arc.network</span></div>
          <div><span style={{ color: 'rgba(232,240,232,0.4)' }}>Chain ID:</span> <span style={{ color: '#00ff88' }}>5042002</span></div>
          <div><span style={{ color: 'rgba(232,240,232,0.4)' }}>Symbol:</span> <span style={{ color: '#00ff88' }}>USDC</span></div>
          <div><span style={{ color: 'rgba(232,240,232,0.4)' }}>Explorer:</span> <span style={{ color: '#00ff88' }}>testnet.arcscan.app</span></div>
          <button onClick={handleConnect} style={{ marginTop: 10, width: '100%', padding: '6px 0', background: 'rgba(0,255,136,0.1)', border: '1px solid rgba(0,255,136,0.3)', borderRadius: 6, color: '#00ff88', fontFamily: 'Space Mono, monospace', fontSize: 10, cursor: 'pointer' }}>
            ↺ Try Again After Adding
          </button>
        </div>
      )}

      {error && <div style={{ marginTop: 6, fontFamily: 'Space Mono, monospace', fontSize: 10, color: '#ff3355', maxWidth: 260, lineHeight: 1.4 }}>✗ {error}</div>}
    </div>
  );
}