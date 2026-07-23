"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import WalletConnector from "./WalletConnector";
import NetworkTicker from "./NetworkTicker";

const links = [
  { href: "/", label: "HOME" },
  { href: "/terminal", label: "AGENT" },
  { href: "/portfolio", label: "WALLET" },
  { href: "/history", label: "AGENT LOG" },
  { href: "/markets", label: "SIGNALS" },
  { href: "/payroll", label: "PAYROLL" },
  { href: "/storefront", label: "STOREFRONT" },
  { href: "/tickets", label: "TICKETS" },
  { href: "/agent", label: "RULES" },
  { href: "/nanopay", label: "NANOPAY" },
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
          background: #2563eb;
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
          background: #ffffff;
          border-top: 1px solid #e2e6ed;
          padding: 12px 0 20px;
        }
        .mobile-menu.open {
          display: flex;
        }
        .mobile-menu a {
          padding: 12px 24px;
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 0.08em;
          text-decoration: none;
          color: #5a6478;
          border-left: 3px solid transparent;
          transition: all 0.15s;
        }
        .mobile-menu a.active {
          color: #2563eb;
          border-left-color: #2563eb;
          background: #eff4ff;
        }
        .mobile-wallet {
          padding: 12px 24px 0;
          border-top: 1px solid #e2e6ed;
          margin-top: 8px;
        }
        @media (max-width: 768px) {
          .nav-links-desktop { display: none; }
          .nav-wallet-desktop { display: none; }
          .hamburger { display: flex; }
        }
        @media (max-width: 480px) {
          .nav-logo-subtitle { display: none; }
        }
      `}</style>

      <div style={{
        position: "sticky", top: 0, zIndex: 100,
        background: "rgba(255,255,255,0.95)",
        borderBottom: "1px solid #e2e6ed",
        backdropFilter: "blur(20px)",
      }}>
        <NetworkTicker />

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 24px", height: 56 }}>

          {/* Logo */}
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none", flexShrink: 0 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 8, flexShrink: 0,
              background: "#2563eb",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <span style={{ color: "white", fontWeight: 800, fontSize: 18, letterSpacing: "-0.02em" }}>F</span>
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 15, letterSpacing: "-0.01em", color: "#0f1117" }}>Fluxa</div>
              <div className="nav-logo-subtitle" style={{ fontSize: 9, color: "#9199aa", letterSpacing: "0.12em", textTransform: "uppercase" }}>Autonomous Agent · Built on Arc</div>
            </div>
          </Link>

          {/* Desktop nav links */}
          <div className="nav-links-desktop">
            {links.map(({ href, label }) => {
              const active = href === "/" ? path === "/" : path.startsWith(href);
              return (
                <Link key={href} href={href} style={{
                  padding: "6px 10px",
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: "0.08em",
                  color: active ? "#2563eb" : "#5a6478",
                  textDecoration: "none",
                  transition: "all 0.15s",
                  borderBottom: active ? "2px solid #2563eb" : "2px solid transparent",
                  background: active ? "#eff4ff" : "transparent",
                  borderRadius: "4px 4px 0 0",
                  whiteSpace: "nowrap",
                }}>{label}</Link>
              );
            })}
          </div>

          {/* Desktop wallet — untouched */}
          <div className="nav-wallet-desktop">
            <WalletConnector />
          </div>

          {/* Hamburger */}
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

        {/* Mobile menu */}
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