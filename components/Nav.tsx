"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import WalletConnector from "./WalletConnector";
import NetworkTicker from "./NetworkTicker";

const links = [
  { href: "/", label: "HOME" },
  { href: "/terminal", label: "TERMINAL" },
  { href: "/portfolio", label: "PORTFOLIO" },
  { href: "/history", label: "HISTORY" },
  { href: "/markets", label: "MARKETS" },
  { href: "/rates", label: "RATES" },
  { href: "/convert", label: "CONVERT" },
  { href: "/fees", label: "FEES" },
  { href: "/payroll", label: "PAYROLL" },
  { href: "/storefront", label: "STOREFRONT" },
  { href: "/tickets", label: "TICKETS" },
{ href: "/agent", label: "AGENT" },
];

export default function Nav() {
  const path = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <style>{`
        .nav-links-desktop {
          display: flex;
          gap: 2px;
          flex-wrap: wrap;
        }
        .nav-wallet-desktop {
          display: flex;
        }
        .hamburger {
          display: none;
          flex-direction: column;
          gap: 5px;
          cursor: pointer;
          padding: 8px;
          background: none;
          border: none;
          z-index: 110;
        }
        .hamburger span {
          display: block;
          width: 22px;
          height: 2px;
          background: #00ff88;
          border-radius: 2px;
          transition: all 0.25s;
        }
        .hamburger.open span:nth-child(1) {
          transform: translateY(7px) rotate(45deg);
        }
        .hamburger.open span:nth-child(2) {
          opacity: 0;
        }
        .hamburger.open span:nth-child(3) {
          transform: translateY(-7px) rotate(-45deg);
        }
        .mobile-menu {
          display: none;
          flex-direction: column;
          background: rgba(4,6,8,0.99);
          border-top: 1px solid rgba(0,255,136,0.12);
          padding: 12px 0 20px;
        }
        .mobile-menu.open {
          display: flex;
        }
        .mobile-menu a {
          padding: 12px 24px;
          font-family: Space Mono, monospace;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-decoration: none;
          color: rgba(232,240,232,0.5);
          border-left: 3px solid transparent;
          transition: all 0.15s;
        }
        .mobile-menu a.active {
          color: #00ff88;
          border-left-color: #00ff88;
          background: rgba(0,255,136,0.05);
        }
        .mobile-wallet {
          padding: 12px 24px 0;
          border-top: 1px solid rgba(0,255,136,0.08);
          margin-top: 8px;
        }

        @media (max-width: 768px) {
          .nav-links-desktop {
            display: none;
          }
          .nav-wallet-desktop {
            display: none;
          }
          .hamburger {
            display: flex;
          }
        }

        @media (max-width: 480px) {
          .nav-logo-subtitle {
            display: none;
          }
        }
      `}</style>

      <div style={{ position: "sticky", top: 0, zIndex: 100, background: "rgba(4,6,8,0.97)", borderBottom: "1px solid rgba(0,255,136,0.12)", backdropFilter: "blur(20px)" }}>
        <NetworkTicker />

        {/* Main nav bar */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 24px", height: 56 }}>

          {/* Logo */}
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none", flexShrink: 0 }}>
            <div style={{ width: 36, height: 36, borderRadius: 8, overflow: "hidden", flexShrink: 0, border: "1px solid rgba(0,255,136,0.2)" }}>
              <img src="/arc_logo.jpeg" alt="Arc" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
            </div>
            <div>
              <div style={{ fontFamily: "Space Mono, monospace", fontWeight: 700, fontSize: 13, letterSpacing: "0.08em", color: "#00ff88" }}>ARC TERMINAL</div>
              <div className="nav-logo-subtitle" style={{ fontFamily: "Space Mono, monospace", fontSize: 9, color: "rgba(232,240,232,0.28)", letterSpacing: "0.15em" }}>DEFI TRADING DASHBOARD</div>
            </div>
          </Link>

          {/* Desktop nav links */}
          <div className="nav-links-desktop">
            {links.map(({ href, label }) => {
              const active = href === "/" ? path === "/" : path.startsWith(href);
              return (
                <Link key={href} href={href} style={{
                  padding: "6px 10px", fontSize: 10, fontFamily: "Space Mono, monospace",
                  fontWeight: 700, letterSpacing: "0.08em",
                  color: active ? "#00ff88" : "rgba(232,240,232,0.4)",
                  textDecoration: "none", transition: "all 0.15s",
                  borderBottom: active ? "2px solid #00ff88" : "2px solid transparent",
                  background: active ? "rgba(0,255,136,0.05)" : "transparent",
                  whiteSpace: "nowrap",
                }}>{label}</Link>
              );
            })}
          </div>

          {/* Desktop wallet */}
          <div className="nav-wallet-desktop">
            <WalletConnector />
          </div>

          {/* Hamburger (mobile only) */}
          <button
            className={`hamburger${menuOpen ? ' open' : ''}`}
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            <span />
            <span />
            <span />
          </button>
        </div>

        {/* Mobile dropdown menu */}
        <div className={`mobile-menu${menuOpen ? ' open' : ''}`}>
          {links.map(({ href, label }) => {
            const active = href === "/" ? path === "/" : path.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={active ? 'active' : ''}
                onClick={() => setMenuOpen(false)}
              >
                {label}
              </Link>
            );
          })}
          <div className="mobile-wallet">
            <WalletConnector />
          </div>
        </div>
      </div>
    </>
  );
}