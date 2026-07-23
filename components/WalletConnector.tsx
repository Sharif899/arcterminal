"use client";
import { useState } from "react";

export default function WalletConnector() {
  const [address, setAddress] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [copied, setCopied] = useState(false);

  function shortAddress(addr: string) {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  }

  async function connectWallet() {
    if (connecting) return;
    if (typeof window === "undefined" || !(window as any).ethereum) {
      alert("No wallet found. Please install MetaMask or Rabby.");
      return;
    }
    setConnecting(true);
    try {
      await (window as any).ethereum.request({
        method: "wallet_requestPermissions",
        params: [{ eth_accounts: {} }],
      });
      const accounts = await (window as any).ethereum.request({
        method: "eth_accounts",
      });
      if (accounts.length > 0) setAddress(accounts[0]);
    } catch (e: any) {
      if (e.code === 4001) {
        console.log("User rejected connection");
      } else {
        console.error(e);
      }
    }
    setConnecting(false);
  }

  async function disconnectWallet() {
    setAddress(null);
    setShowMenu(false);
    if (typeof window !== "undefined" && (window as any).ethereum) {
      try {
        await (window as any).ethereum.request({
          method: "wallet_revokePermissions",
          params: [{ eth_accounts: {} }],
        });
      } catch {
        // Fail silently
      }
    }
  }

  function copyAddress() {
    if (!address) return;
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (address) {
    return (
      <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
        {/* Address button */}
        <button
          onClick={() => setShowMenu(!showMenu)}
          style={{
            display: "flex", alignItems: "center", gap: 6,
            background: "rgba(0,255,136,0.06)", border: "1px solid rgba(0,255,136,0.2)",
            borderRadius: 6, padding: "5px 10px", cursor: "pointer",
            fontFamily: "Space Mono, monospace", fontSize: 11, color: "#00ff88", fontWeight: 700,
          }}
        >
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#00ff88" }} />
          {shortAddress(address)}
          <span style={{ fontSize: 9, opacity: 0.5 }}>▾</span>
        </button>

        {/* Dropdown menu */}
        {showMenu && (
          <>
            {/* Backdrop */}
            <div
              onClick={() => setShowMenu(false)}
              style={{ position: "fixed", inset: 0, zIndex: 98 }}
            />
            <div style={{
              position: "absolute", top: "calc(100% + 8px)", right: 0,
              background: "#0a0f0c", border: "1px solid rgba(0,255,136,0.15)",
              borderRadius: 8, padding: 6, minWidth: 220, zIndex: 99,
              boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
            }}>
              {/* Full address */}
              <div style={{
                padding: "8px 12px", borderBottom: "1px solid rgba(0,255,136,0.08)",
                marginBottom: 4,
              }}>
                <div style={{ fontSize: 9, color: "rgba(232,240,232,0.3)", letterSpacing: "0.1em", marginBottom: 4, fontFamily: "Space Mono, monospace" }}>CONNECTED</div>
                <div style={{ fontFamily: "Space Mono, monospace", fontSize: 10, color: "rgba(232,240,232,0.5)", wordBreak: "break-all" }}>{address}</div>
              </div>

              {/* Copy address */}
              <button
                onClick={copyAddress}
                style={{
                  width: "100%", padding: "8px 12px", background: "none", border: "none",
                  cursor: "pointer", textAlign: "left", fontSize: 12,
                  color: copied ? "#00ff88" : "rgba(232,240,232,0.6)",
                  borderRadius: 4, display: "flex", alignItems: "center", gap: 8,
                  fontFamily: "Space Mono, monospace", transition: "all 0.15s",
                }}
                onMouseEnter={e => (e.currentTarget.style.background = "rgba(0,255,136,0.06)")}
                onMouseLeave={e => (e.currentTarget.style.background = "none")}
              >
                {copied ? "✓ COPIED!" : "📋 COPY ADDRESS"}
              </button>

              {/* View on Arcscan */}
              
                href={`https://testnet.arcscan.app/address/${address}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setShowMenu(false)}
                style={{
                  width: "100%", padding: "8px 12px", display: "flex", alignItems: "center",
                  gap: 8, fontSize: 12, color: "rgba(232,240,232,0.6)", borderRadius: 4,
                  textDecoration: "none", fontFamily: "Space Mono, monospace", transition: "all 0.15s",
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.background = "rgba(0,255,136,0.06)"; (e.currentTarget as HTMLAnchorElement).style.color = "#00ff88"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.background = "none"; (e.currentTarget as HTMLAnchorElement).style.color = "rgba(232,240,232,0.6)"; }}
              >
                ↗ VIEW ON ARCSCAN
              </a>

              {/* Divider */}
              <div style={{ height: 1, background: "rgba(0,255,136,0.08)", margin: "4px 0" }} />

              {/* Disconnect */}
              <button
                onClick={disconnectWallet}
                style={{
                  width: "100%", padding: "8px 12px", background: "none", border: "none",
                  cursor: "pointer", textAlign: "left", fontSize: 12,
                  color: "rgba(232,240,232,0.6)", borderRadius: 4,
                  display: "flex", alignItems: "center", gap: 8,
                  fontFamily: "Space Mono, monospace", transition: "all 0.15s",
                }}
                onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,51,85,0.08)"; e.currentTarget.style.color = "#ff3355"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "none"; e.currentTarget.style.color = "rgba(232,240,232,0.6)"; }}
              >
                ✕ DISCONNECT
              </button>
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <button
      onClick={connectWallet}
      disabled={connecting}
      style={{
        background: connecting ? "rgba(0,255,136,0.1)" : "rgba(0,255,136,0.12)",
        border: "1px solid rgba(0,255,136,0.3)",
        borderRadius: 6, padding: "6px 14px", cursor: connecting ? "not-allowed" : "pointer",
        fontFamily: "Space Mono, monospace", fontSize: 11, fontWeight: 700,
        color: "#00ff88", letterSpacing: "0.08em", transition: "all 0.15s",
        display: "flex", alignItems: "center", gap: 6,
      }}
      onMouseEnter={e => { if (!connecting) e.currentTarget.style.background = "rgba(0,255,136,0.2)"; }}
      onMouseLeave={e => { e.currentTarget.style.background = "rgba(0,255,136,0.12)"; }}
    >
      {connecting ? (
        <>
          <span className="spinner" style={{ width: 10, height: 10, borderColor: "rgba(0,255,136,0.3)", borderTopColor: "#00ff88" }} />
          CONNECTING...
        </>
      ) : (
        <>
          <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          CONNECT WALLET
        </>
      )}
    </button>
  );
}