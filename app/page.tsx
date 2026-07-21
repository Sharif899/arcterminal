'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getNetworkStats } from '@/lib/arc';

export default function HomePage() {
  const [stats, setStats] = useState<{ blockNumber: number; gasPrice: string; txCount: number } | null>(null);
  const [blockFlash, setBlockFlash] = useState(false);

  useEffect(() => {
    const load = async () => {
      const s = await getNetworkStats().catch(() => null);
      if (s) {
        setBlockFlash(true);
        setStats(s);
        setTimeout(() => setBlockFlash(false), 400);
      }
    };
    load();
    const t = setInterval(load, 8000);
    return () => clearInterval(t);
  }, []);

  const features = [
    { icon: '⚡', label: 'SEND', desc: 'Agent sends USDC or EURC to any wallet on Arc in under 1 second', color: '#2563eb', href: '/terminal?tab=send' },
    { icon: '🔄', label: 'SWAP', desc: 'Agent swaps USDC↔EURC on-chain using Arc SDK kit.swap()', color: '#7c3aed', href: '/terminal?tab=swap' },
    { icon: '🌉', label: 'BRIDGE', desc: 'Agent bridges USDC across Ethereum, Base, Arbitrum and Arc via CCTP', color: '#0891b2', href: '/terminal?tab=bridge' },
    { icon: '📊', label: 'PORTFOLIO', desc: 'Track agent wallet balances, P&L and allocation in real time', color: '#059669', href: '/portfolio' },
    { icon: '📜', label: 'AGENT LOG', desc: 'Full log of every autonomous action — what fired, why, and what happened', color: '#d97706', href: '/history' },
    { icon: '📈', label: 'SIGNALS', desc: 'Live Arc Network metrics the agent watches — blocks, gas, rates, activity', color: '#dc2626', href: '/markets' },
    { icon: '💱', label: 'RATES', desc: 'Live USDC rates for NGN, GHS, KES, EUR, GBP updated every minute', color: '#2563eb', href: '/rates' },
    { icon: '🔁', label: 'CONVERT', desc: 'Enter amount in any currency, get exact USDC equivalent and send via agent', color: '#7c3aed', href: '/convert' },
    { icon: '⚖️', label: 'FEE COMPARE', desc: 'Fluxa on Arc vs Western Union vs PayPal vs SWIFT — live fee comparison', color: '#0891b2', href: '/fees' },
    { icon: '💼', label: 'PAYROLL', desc: 'Add employees, set salaries, agent pays all wallets in one autonomous run', color: '#059669', href: '/payroll' },
    { icon: '🛒', label: 'STOREFRONT', desc: 'Create products, share link, accept USDC payments — agent settles instantly', color: '#d97706', href: '/storefront' },
    { icon: '🎟️', label: 'TICKETS', desc: 'Create events, sell tickets as NFTs, verify via QR on Arc', color: '#dc2626', href: '/tickets' },
  ];

  return (
    <>
      <style>{`
        body { background: #ffffff !important; color: #0f1117 !important; }

        .hero-grid {
          display: grid;
          grid-template-columns: 1fr 420px;
          gap: 48px;
          align-items: center;
        }
        .hero-title {
          font-size: 72px;
          font-weight: 800;
          letter-spacing: -0.04em;
          line-height: 1.0;
          margin-bottom: 24px;
          color: #0f1117;
        }
        .features-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
        }
        .hero-buttons {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }
        .stats-panel-wrapper { display: block; }
        .feature-card {
          background: #ffffff;
          border: 1px solid #e2e6ed;
          border-radius: 12px;
          text-decoration: none;
          transition: box-shadow 0.15s, border-color 0.15s, transform 0.15s;
        }
        .feature-card:hover {
          box-shadow: 0 4px 16px rgba(37,99,235,0.10);
          border-color: #bfdbfe;
          transform: translateY(-2px);
        }
        .btn-primary {
          display: inline-block;
          padding: 13px 28px;
          background: #2563eb;
          color: white;
          font-weight: 700;
          font-size: 13px;
          border-radius: 8px;
          text-decoration: none;
          letter-spacing: 0.03em;
          transition: background 0.15s;
        }
        .btn-primary:hover { background: #1d4ed8; }
        .btn-outline {
          display: inline-block;
          padding: 13px 28px;
          background: transparent;
          color: #5a6478;
          font-weight: 600;
          font-size: 13px;
          border-radius: 8px;
          border: 1px solid #e2e6ed;
          text-decoration: none;
          transition: border-color 0.15s, color 0.15s;
        }
        .btn-outline:hover { border-color: #2563eb; color: #2563eb; }
        .stats-card {
          background: #ffffff;
          border: 1px solid #e2e6ed;
          border-radius: 14px;
          box-shadow: 0 2px 12px rgba(15,17,23,0.06);
          overflow: hidden;
        }

        @media (max-width: 1024px) {
          .hero-grid { grid-template-columns: 1fr; gap: 32px; }
          .hero-title { font-size: 52px; }
          .features-grid { grid-template-columns: repeat(3, 1fr); }
          .stats-panel-wrapper { max-width: 520px; margin: 0 auto; width: 100%; }
        }
        @media (max-width: 640px) {
          .hero-title { font-size: 36px; letter-spacing: -0.02em; margin-bottom: 16px; }
          .hero-section { padding: 32px 16px 24px !important; }
          .features-section { padding: 24px 16px 40px !important; }
          .features-grid { grid-template-columns: repeat(2, 1fr); gap: 10px; }
          .hero-buttons a { flex: 1; text-align: center; min-width: 140px; }
          .stats-panel-wrapper { width: 100%; }
          .panel-footer-btns { flex-direction: column !important; }
        }
        @media (max-width: 380px) {
          .hero-title { font-size: 30px; }
          .features-grid { grid-template-columns: 1fr 1fr; }
        }
      `}</style>

      <div style={{ minHeight: 'calc(100vh - 84px)', display: 'flex', flexDirection: 'column', background: '#ffffff' }}>

        {/* Hero */}
        <section className="hero-section" style={{ flex: 1, display: 'flex', alignItems: 'center', padding: '60px 24px 40px' }}>
          <div style={{ maxWidth: 1400, margin: '0 auto', width: '100%' }}>
            <div className="hero-grid">

              <div>
                {/* Track badge */}
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: 7,
                  background: '#eff4ff', border: '1px solid #bfdbfe',
                  borderRadius: 100, padding: '5px 14px', marginBottom: 28,
                  fontSize: 12, fontWeight: 600, color: '#2563eb',
                }}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#2563eb', display: 'inline-block' }} />
                  Agentic Economy Track · Built on Arc Network
                </div>

                <h1 className="hero-title">
                  Fluxa<br />
                  <span style={{ color: '#2563eb' }}>Autonomous</span><br />
                  <span style={{ color: '#2563eb' }}>Agent</span>
                </h1>

                <p style={{ fontSize: 17, color: '#5a6478', lineHeight: 1.7, maxWidth: 520, marginBottom: 36 }}>
                  An AI agent that holds Arc wallets, reads market signals, and autonomously sends, swaps, and bridges USDC — no manual clicks required.
                </p>

                <div className="hero-buttons">
                  <Link href="/terminal" className="btn-primary">
                    LAUNCH AGENT →
                  </Link>
                  <Link href="/portfolio" className="btn-outline">
                    VIEW WALLET
                  </Link>
                </div>
              </div>

              {/* Stats panel */}
              <div className="stats-panel-wrapper">
                <div className="stats-card">
                  <div style={{
                    padding: '14px 20px',
                    borderBottom: '1px solid #e2e6ed',
                    background: '#f8f9fb',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  }}>
                    <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', color: '#5a6478' }}>
                      NETWORK · LIVE
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10, color: '#16a34a', fontWeight: 600 }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#16a34a', display: 'inline-block' }} />
                      ARC TESTNET
                    </span>
                  </div>

                  <div style={{ padding: '16px 20px' }}>
                    {[
                      { label: 'BLOCK HEIGHT', value: stats ? `#${stats.blockNumber.toLocaleString()}` : '—', flash: blockFlash },
                      { label: 'GAS PRICE (USDC)', value: stats ? `$${stats.gasPrice}` : '—', flash: false },
                      { label: 'FINALITY', value: '< 0.5 seconds', flash: false },
                      { label: 'CONSENSUS', value: 'Malachite BFT', flash: false },
                      { label: 'CHAIN ID', value: '5042002', flash: false },
                      { label: 'GAS TOKEN', value: 'USDC', flash: false },
                      { label: 'EVM', value: 'Compatible', flash: false },
                      { label: 'USDC CONTRACT', value: '0x3600…0000', flash: false },
                    ].map((item) => (
                      <div key={item.label} style={{
                        display: 'flex', justifyContent: 'space-between',
                        padding: '9px 0', borderBottom: '1px solid #f1f3f7', alignItems: 'center',
                      }}>
                        <span style={{ fontSize: 11, color: '#9199aa', letterSpacing: '0.08em', fontWeight: 500 }}>
                          {item.label}
                        </span>
                        <span style={{
                          fontSize: 12, fontWeight: 700,
                          color: item.flash ? '#2563eb' : '#0f1117',
                          transition: 'color 0.3s',
                        }}>
                          {item.value}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="panel-footer-btns" style={{
                    padding: '14px 20px', borderTop: '1px solid #e2e6ed',
                    display: 'flex', gap: 8, background: '#f8f9fb',
                  }}>
                    <Link href="/terminal" className="btn-primary" style={{ flex: 1, fontSize: 11, padding: '9px', textAlign: 'center' }}>
                      LAUNCH AGENT
                    </Link>
                    <Link href="/markets" className="btn-outline" style={{ flex: 1, fontSize: 11, padding: '9px', textAlign: 'center' }}>
                      VIEW SIGNALS
                    </Link>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* Features */}
        <section className="features-section" style={{ padding: '40px 24px 60px', background: '#f8f9fb', borderTop: '1px solid #e2e6ed' }}>
          <div style={{ maxWidth: 1400, margin: '0 auto' }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#9199aa', letterSpacing: '0.2em', marginBottom: 20, textAlign: 'center' }}>
              ── AGENT CAPABILITIES ──
            </div>
            <div className="features-grid">
              {features.map((f) => (
                <Link key={f.label} href={f.href} className="feature-card">
                  <div style={{ padding: 20 }}>
                    <div style={{ fontSize: 24, marginBottom: 10 }}>{f.icon}</div>
                    <div style={{ fontWeight: 700, fontSize: 11, color: f.color, letterSpacing: '0.08em', marginBottom: 8 }}>
                      {f.label}
                    </div>
                    <div style={{ fontSize: 12, color: '#5a6478', lineHeight: 1.55 }}>{f.desc}</div>
                    <div style={{ marginTop: 14, height: 2, borderRadius: 1, background: f.color, opacity: 0.2 }} />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer style={{ borderTop: '1px solid #e2e6ed', padding: '24px', textAlign: 'center', fontSize: 12, color: '#9199aa' }}>
          Fluxa — Autonomous Stablecoin Agent · Built on Arc Network · Powered by USDC, CCTP & Arc App Kit
        </footer>

      </div>
    </>
  );
}