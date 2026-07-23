"use client";
import { useState } from "react";

export default function WalletConnector() {
  const [address, setAddress] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);

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
      // Always force popup — never silently reconnect
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
    if (typeof window !== "undefined" && (window as any).ethereum) {
      try {
        await (window as any).ethereum.request({
          method: "wallet_revokePermissions",
          params: [{ eth_accounts: {} }],
        });
      } catch {
        // Fail silently — not all wallets support this
      }
    }
  }

  if (address) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{
          display: "flex", alignItems: "center", gap: 6,
          background: "rgba(0,255,136,0.06)", border: "1px solid rgba(0,255,136,0.2)",
          borderRadius: 6, padding: "5px 10px",
        }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#00ff88" }} />
          <span style={{ fontFamily: "Space Mono, monospace", fontSize: 11, color: "#00ff88", fontWeight: 700 }}>
            {shortAddress(address)}
          </span>
        </div>
        <button
          onClick={disconnectWallet}
          title="Disconnect wallet"
          style={{
            background: "none", border: "none", cursor: "pointer",
            color: "rgba(232,240,232,0.3)", padding: "4px",
            transition: "color 0.15s",
          }}
          onMouseEnter={e => (e.currentTarget.style.color = "#ff3355")}
          onMouseLeave={e => (e.currentTarget.style.color = "rgba(232,240,232,0.3)")}
        >
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
        </button>
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