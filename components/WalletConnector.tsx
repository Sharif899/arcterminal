"use client";
import React, { useState } from "react";
import { useWallet } from "@/context/WalletContext";

export default function WalletConnector() {
  const { address, connect, disconnect } = useWallet();
  const [connecting, setConnecting] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [copied, setCopied] = useState(false);

  function shortAddress(addr: string) {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  }

  async function connectWallet() {
    if (connecting) return;
    setConnecting(true);
    try {
      await connect();
    } catch (e: any) {
      console.error(e);
    }
    setConnecting(false);
  }

  async function disconnectWallet() {
    disconnect();
    setShowMenu(false);
    if (typeof window !== "undefined" && (window as any).ethereum) {
      try {
        await (window as any).ethereum.request({
          method: "wallet_revokePermissions",
          params: [{ eth_accounts: {} }],
        });
      } catch {}
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

        {showMenu && (
          <>
            <div onClick={() => setShowMenu(false)} style={{ position: "fixed", inset: 0, zIndex: 98 }} />
            <div style={{
              position: "absolute", top: "calc(100% + 8px)", right: 0,
              background: "#0a0f0c", border: "1px solid rgba(0,255,136,0.15)",
              borderRadius: 8, padding: 6, minWidth: 220, zIndex: 99,
              boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
            }}>
              <div style={{ padding: "8px 12px", borderBottom: "1px solid rgba(0,255,136,0.08)", marginBottom: 4 }}>
                <div style={{ fontSize: 9, color: "rgba(232,240,232,0.3)", letterSpacing: "0.1em", marginBottom: 4, fontFamily: "Space Mono, monospace" }}>CONNECTED</div>
                <div style={{ fontFamily: "Space Mono, monospace", fontSize: 10, color: "rgba(232,240,232,0.5)", wordBreak: "break-all" }}>{address}</div>
              </div>
              <button onClick={copyAddress} style={{ width: "100%", padding: "8px 12px", background: "none", border: "none", cursor: "pointer", textAlign: "left", fontSize: 12, color: copied ? "#00ff88" : "rgba(232,240,232,0.6)", borderRadius: 4, display: "flex", alignItems: "center", gap: 8, fontFamily: "Space Mono, monospace" }}>
                {copied ? "✓ COPIED!" : "📋 COPY ADDRESS"}
              </button>
              <a href={`https://testnet.arcscan.app/address/${address}`} target="_blank" rel="noopener noreferrer" onClick={() => setShowMenu(false)}
                style={{ width: "100%", padding: "8px 12px", display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "rgba(232,240,232,0.6)", borderRadius: 4, textDecoration: "none", fontFamily: "Space Mono, monospace" }}>
                ↗ VIEW ON ARCSCAN
              </a>
              <div style={{ height: 1, background: "rgba(0,255,136,0.08)", margin: "4px 0" }} />
              <button onClick={disconnectWallet} style={{ width: "100%", padding: "8px 12px", background: "none", border: "none", cursor: "pointer", textAlign: "left", fontSize: 12, color: "rgba(232,240,232,0.6)", borderRadius: 4, display: "flex", alignItems: "center", gap: 8, fontFamily: "Space Mono, monospace" }}>
                ✕ DISCONNECT
              </button>
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <button onClick={connectWallet} disabled={connecting}
      style={{ background: "rgba(0,255,136,0.12)", border: "1px solid rgba(0,255,136,0.3)", borderRadius: 6, padding: "6px 14px", cursor: connecting ? "not-allowed" : "pointer", fontFamily: "Space Mono, monospace", fontSize: 11, fontWeight: 700, color: "#00ff88", letterSpacing: "0.08em", display: "flex", alignItems: "center", gap: 6 }}>
      {connecting ? "CONNECTING..." : "CONNECT WALLET"}
    </button>
  );
}