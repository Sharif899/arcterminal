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
    { icon: '⚡', label: 'SEND', desc: 'Transfer USDC or EURC to any wallet on Arc in under 1 second', color: '#00ff88', href: '/terminal?tab=send' },
    { icon: '🔄', label: 'SWAP', desc: 'Exchange USDC↔EURC on-chain using Arc SDK kit.swap()', color: '#00aaff', href: '/terminal?tab=swap' },
    { icon: '🌉', label: 'BRIDGE', desc: 'Move USDC across Ethereum, Base, Arbitrum and Arc via CCTP', color: '#ffaa00', href: '/terminal?tab=bridge' },
    { icon: '📊', label: 'PORTFOLIO', desc: 'Track all your balances, P&L and allocation in real time', color: '#aa55ff', href: '/portfolio' },
    { icon: '📜', label: 'HISTORY', desc: 'Full transaction log saved to Supabase, filterable by type', color: '#00ddff', href: '/history' },
    { icon: '📈', label: 'MARKETS', desc: 'Live Arc Network metrics — blocks, gas, volume, activity', color: '#ff3355', href: '/markets' },
    { icon: '💱', label: 'RATES', desc: 'Live USDC rates for NGN, GHS, KES, EUR, GBP updated every minute', color: '#00ff88', href: '/rates' },
    { icon: '🔁', label: 'CONVERT', desc: 'Enter amount in any currency, get exact USDC equivalent and send', color: '#00aaff', href: '/convert' },
    { icon: '⚖️', label: 'FEE COMPARE', desc: 'Arc vs Western Union vs PayPal vs SWIFT — live fee comparison', color: '#ffaa00', href: '/fees' },
    { icon: '💼', label: 'PAYROLL', desc: 'Add employees, set salaries, pay all wallets in one click via Arc', color: '#aa55ff', href: '/payroll' },
    { icon: '🛒', label: 'STOREFRONT', desc: 'Create products, share link, accept USDC payments on Arc', color: '#00ddff', href: '/storefront' },
    { icon: '🎟️', label: 'TICKETS', desc: 'Create events, sell tickets as NFTs, verify via QR on Arc', color: '#ff3355', href: '/tickets' },
  ];

  return (
    <>
      <style>{`
        .hero-grid {
          display: grid;
          grid-template-columns: 1fr 420px;
          gap: 48px;
          align-items: center;
        }
        .hero-title {
          font-size: 72px;
          font-weight: 700;
          letter-spacing: -0.04em;
          line-height: 1.0;
          margin-bottom: 24px;
          color: #e8f0e8;
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

        @media (max-width: 1024px) {
          .hero-grid { grid-template-columns: 1fr; gap: 32px; }
          .hero-title { font-size: 52px; }
          .features-grid { grid-template-columns: repeat(3, 1fr); }
          .stats-panel-wrapper { max-width: 520px; margin: 0 auto; width: 100%; }
        }

        @media (max-width: 640px) {
          .hero-grid { grid-template-columns: 1fr; gap: 28px; }
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

      <div style={{ minHeight: 'calc(100vh - 84px)', display: 'flex', flexDirection: 'column' }}>

        <section className="hero-section" style={{ flex: 1, display: 'flex', alignItems: 'center', padding: '60px 24px 40px', position: 'relative', zIndex: 1 }}>
          <div style={{ maxWidth: 1400, margin: '0 auto', width: '100%' }}>
            <div className="hero-grid">

              <div className="animate-fade-up">
                <h1 className="hero-title">
                  Arc<br />
                  <span style={{ color: '#00ff88', textShadow: '0 0 40px rgba(0,255,136,0.3)' }}>DeFi Terminal</span><br />
                </h1>

                <p style={{ fontSize: 17, color: 'rgba(232,240,232,0.5)', lineHeight: 1.7, maxWidth: 520, marginBottom: 36 }}>
                  Send USDC. Swap EURC. Bridge across chains — all in one place.
                </p>

                <div className="hero-buttons">
                  <Link href="/terminal" className="btn btn-green" style={{ fontSize: 13, padding: '12px 28px' }}>
                    OPEN TERMINAL →
                  </Link>
                  <Link href="/portfolio" className="btn btn-ghost" style={{ fontSize: 13, padding: '12px 28px' }}>
                    VIEW PORTFOLIO
                  </Link>
                </div>
              </div>

              <div className="animate-fade-up delay-2 stats-panel-wrapper">
                <div className="panel glow-green" style={{ overflow: 'hidden' }}>
                  <div className="panel-header">
                    <div className="panel-title">NETWORK · LIVE</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'Space Mono, monospace', fontSize: 10, color: 'rgba(232,240,232,0.3)' }}>
                      <span className="live-dot" style={{ width: 5, height: 5 }} />
                      ARC TESTNET
                    </div>
                  </div>

                  <div style={{ padding: '20px' }}>
                    {[
                      { label: 'BLOCK HEIGHT', value: stats ? `#${stats.blockNumber.toLocaleString()}` : '—', color: '#00ff88', flash: blockFlash },
                      { label: 'GAS PRICE (USDC)', value: stats ? `$${stats.gasPrice}` : '—', color: '#00aaff', flash: false },
                      { label: 'FINALITY', value: '< 0.5 seconds', color: '#00ff88', flash: false },
                      { label: 'CONSENSUS', value: 'Malachite BFT', color: '#aa55ff', flash: false },
                      { label: 'CHAIN ID', value: '5042002', color: '#ffaa00', flash: false },
                      { label: 'GAS TOKEN', value: 'USDC', color: '#00ff88', flash: false },
                      { label: 'EVM', value: 'Compatible', color: '#00ddff', flash: false },
                      { label: 'USDC CONTRACT', value: '0x3600…0000', color: '#00ff88', flash: false },
                    ].map((item) => (
                      <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.04)', alignItems: 'center' }}>
                        <span style={{ fontFamily: 'Space Mono, monospace', fontSize: 10, color: 'rgba(232,240,232,0.3)', letterSpacing: '0.1em' }}>{item.label}</span>
                        <span style={{ fontFamily: 'Space Mono, monospace', fontSize: 12, fontWeight: 700, color: item.color, transition: 'all 0.3s', textShadow: item.flash ? `0 0 12px ${item.color}` : 'none' }}>
                          {item.value}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="panel-footer-btns" style={{ padding: '14px 20px', borderTop: '1px solid rgba(0,255,136,0.08)', display: 'flex', gap: 8 }}>
                    <Link href="/terminal" className="btn btn-green" style={{ flex: 1, fontSize: 11, padding: '9px', textAlign: 'center' }}>OPEN TERMINAL</Link>
                    <Link href="/markets" className="btn btn-ghost" style={{ flex: 1, fontSize: 11, padding: '9px', textAlign: 'center' }}>VIEW MARKETS</Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="features-section" style={{ padding: '40px 24px 60px', position: 'relative', zIndex: 1 }}>
          <div style={{ maxWidth: 1400, margin: '0 auto' }}>
            <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 10, color: 'rgba(232,240,232,0.25)', letterSpacing: '0.2em', marginBottom: 20, textAlign: 'center' }}>
              ── CAPABILITIES ──
            </div>
            <div className="features-grid">
              {features.map((f, i) => (
                <Link key={f.label} href={f.href} style={{ textDecoration: 'none' }} className={`panel animate-fade-up delay-${Math.min(i + 1, 6)}`}>
                  <div style={{ padding: 20 }}>
                    <div style={{ fontSize: 24, marginBottom: 10 }}>{f.icon}</div>
                    <div style={{ fontFamily: 'Space Mono, monospace', fontWeight: 700, fontSize: 11, color: f.color, letterSpacing: '0.1em', marginBottom: 8 }}>{f.label}</div>
                    <div style={{ fontSize: 12, color: 'rgba(232,240,232,0.4)', lineHeight: 1.5 }}>{f.desc}</div>
                    <div style={{ marginTop: 14, height: 2, borderRadius: 1, background: f.color, opacity: 0.3 }} />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </div>
    </>
  );
}