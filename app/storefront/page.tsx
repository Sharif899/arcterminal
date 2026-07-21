'use client';
import { useState } from 'react';
import { arcSend } from '@/lib/arc';
import { useWallet } from '@/context/WalletContext';
import { callContract, CONTRACTS, STOREFRONT_ABI } from '@/lib/contracts';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  image: string;
  category: string;
  stock: number;
  sold: number;
  walletAddress: string;
  createdAt: string;
}

interface Order {
  id: string;
  productId: string;
  productName: string;
  amount: number;
  buyerAddress: string;
  txHash: string;
  explorerUrl: string;
  date: string;
  status: 'confirmed';
}

function shortId() {
  return Math.random().toString(36).substring(2, 10).toUpperCase();
}

const CATEGORIES = ['Digital', 'Physical', 'Service', 'Art', 'Software', 'Consulting'];
const EMOJI_MAP: Record<string, string> = {
  Digital: '💾', Physical: '📦', Service: '🛠', Art: '🎨', Software: '⚙️', Consulting: '💼',
};

const MY_WALLET = '0xf2ee634847d39161ec7de7879d7d0d241b932ad4';

const DEMO_PRODUCTS: Product[] = [
  { id: shortId(), name: 'Arc Integration Guide', description: 'Complete developer guide for integrating Arc SDK into your dApp', price: 29, currency: 'USDC', image: '📘', category: 'Digital', stock: 999, sold: 14, walletAddress: MY_WALLET, createdAt: new Date().toLocaleDateString() },
  { id: shortId(), name: 'DeFi Dashboard Template', description: 'Bloomberg-style terminal UI kit for Web3 projects', price: 79, currency: 'USDC', image: '🖥', category: 'Software', stock: 999, sold: 7, walletAddress: MY_WALLET, createdAt: new Date().toLocaleDateString() },
];

// Darker, higher-contrast text colors for a WHITE page background.
const TEXT_DARK = '#0a0b0d';
const TEXT_MUTED = 'rgba(10,11,13,0.72)';
const TEXT_FAINT = 'rgba(10,11,13,0.58)';
const BORDER = 'rgba(10,11,13,0.12)';

export default function StorefrontPage() {
  const { address, connect } = useWallet();
  const [view, setView] = useState<'store' | 'manage'>('store');
  const [products, setProducts] = useState<Product[]>(DEMO_PRODUCTS);
  const [orders, setOrders] = useState<Order[]>([]);
  const [buying, setBuying] = useState<string | null>(null);
  const [checkoutProduct, setCheckoutProduct] = useState<Product | null>(null);
  const [txResult, setTxResult] = useState<{ hash: string; explorerUrl: string; product: string } | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newProduct, setNewProduct] = useState({ name: '', description: '', price: '', category: 'Digital', stock: '', walletAddress: MY_WALLET });
  const [addError, setAddError] = useState('');
  const [payError, setPayError] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  async function addProduct() {
    setAddError('');
    if (!newProduct.name) return setAddError('Product name required');
    if (!newProduct.price || parseFloat(newProduct.price) <= 0) return setAddError('Valid price required');
    if (!newProduct.walletAddress || !/^0x[a-fA-F0-9]{40}$/.test(newProduct.walletAddress)) return setAddError('Valid wallet address required');
    const product: Product = {
      id: shortId(), name: newProduct.name, description: newProduct.description,
      price: parseFloat(newProduct.price), currency: 'USDC',
      image: EMOJI_MAP[newProduct.category] || '📦', category: newProduct.category,
      stock: parseInt(newProduct.stock) || 999, sold: 0,
      walletAddress: newProduct.walletAddress, createdAt: new Date().toLocaleDateString(),
    };
    try {
      await callContract(CONTRACTS.ArcStorefrontFactory, STOREFRONT_ABI, 'createProduct', [product.name, product.description, BigInt(Math.floor(product.price * 100)), product.category, BigInt(product.stock)]);
    } catch (contractErr) { console.log('Contract:', contractErr); }
    setProducts(prev => [product, ...prev]);
    setNewProduct({ name: '', description: '', price: '', category: 'Digital', stock: '', walletAddress: MY_WALLET });
    setShowAddForm(false);
  }

  async function handleBuy(product: Product) {
    if (!address) { await connect(); return; }
    setBuying(product.id);
    setPayError('');
    try {
      const res = await arcSend(product.walletAddress, product.price.toFixed(2), 'USDC');
      try {
        await callContract(CONTRACTS.ArcStorefrontFactory, STOREFRONT_ABI, 'recordOrder', [BigInt(0), product.walletAddress as `0x${string}`, BigInt(Math.floor(product.price * 100))]);
      } catch (contractErr) { console.log('Contract:', contractErr); }
      setProducts(prev => prev.map(p => p.id === product.id ? { ...p, sold: p.sold + 1 } : p));
      setOrders(prev => [{ id: shortId(), productId: product.id, productName: product.name, amount: product.price, buyerAddress: address, txHash: res.txHash, explorerUrl: res.explorerUrl, date: new Date().toLocaleString(), status: 'confirmed' }, ...prev]);
      setTxResult({ hash: res.txHash, explorerUrl: res.explorerUrl, product: product.name });
      setCheckoutProduct(null);
    } catch (e: any) {
      setPayError(e?.message || 'Payment failed');
    }
    setBuying(null);
  }

  function copyLink(productId: string) {
    const link = `${window.location.origin}/storefront?product=${productId}`;
    navigator.clipboard.writeText(link);
    setCopiedId(productId);
    setTimeout(() => setCopiedId(null), 2000);
  }

  return (
    <div style={{ padding: '24px 16px 60px', maxWidth: 1200, margin: '0 auto', position: 'relative', zIndex: 1, background: '#fff' }}>
      <style>{`
        .sf-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 28px; flex-wrap: wrap; gap: 12px; }
        .sf-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 24px; }
        .sf-store-layout { display: grid; grid-template-columns: 1fr 300px; gap: 20px; align-items: start; }
        .sf-products-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
        .sf-form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px; }
        @media (max-width: 900px) {
          .sf-stats { grid-template-columns: repeat(2, 1fr); }
          .sf-store-layout { grid-template-columns: 1fr; }
          .sf-products-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 560px) {
          .sf-stats { grid-template-columns: repeat(2, 1fr); }
          .sf-products-grid { grid-template-columns: 1fr; }
          .sf-form-grid { grid-template-columns: 1fr; }
          .sf-header { flex-direction: column; align-items: stretch; }
          .sf-header h1 { font-size: 24px !important; }
          .sf-header > div:last-child { width: 100%; }
          .sf-header > div:last-child button, .sf-header > div:last-child div { flex: 1; text-align: center; }
        }
      `}</style>

      <div className="sf-header">
        <div>
          <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 10, color: TEXT_FAINT, letterSpacing: '0.2em', marginBottom: 6, fontWeight: 700 }}>ARC TERMINAL · STOREFRONT</div>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: TEXT_DARK, letterSpacing: '-0.02em', marginBottom: 4 }}>Storefront</h1>
          <p style={{ fontSize: 13, color: TEXT_MUTED }}>Create products, share links, accept USDC payments on Arc</p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          {!address
            ? <button onClick={connect} className="btn btn-green" style={{ fontSize: 11 }}>🦊 CONNECT WALLET</button>
            : <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 11, color: '#00aa5c', padding: '6px 12px', borderRadius: 6, background: 'rgba(0,170,92,0.08)', border: '1px solid rgba(0,170,92,0.25)', fontWeight: 700 }}>{address.slice(0, 6)}…{address.slice(-4)}</div>
          }
          <button onClick={() => setView('store')} className={view === 'store' ? 'btn btn-green' : 'btn btn-ghost'} style={{ fontSize: 11, color: view === 'store' ? undefined : TEXT_DARK }}>🛒 STORE</button>
          <button onClick={() => setView('manage')} className={view === 'manage' ? 'btn btn-green' : 'btn btn-ghost'} style={{ fontSize: 11, color: view === 'manage' ? undefined : TEXT_DARK }}>⚙ MANAGE</button>
        </div>
      </div>

      <div className="sf-stats">
        {[
          { label: 'PRODUCTS', value: products.length, color: '#0068b3' },
          { label: 'TOTAL SOLD', value: products.reduce((s, p) => s + p.sold, 0), color: '#00925a' },
          { label: 'REVENUE (USDC)', value: `$${orders.reduce((s, o) => s + o.amount, 0).toLocaleString()}`, color: '#00925a' },
          { label: 'ORDERS', value: orders.length, color: '#b37200' },
        ].map(s => (
          <div key={s.label} className="panel" style={{ padding: 16, border: `1px solid ${BORDER}`, borderRadius: 10, background: '#fff' }}>
            <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 9, color: TEXT_FAINT, letterSpacing: '0.15em', marginBottom: 6, fontWeight: 700 }}>{s.label}</div>
            <div style={{ fontFamily: 'Space Mono, monospace', fontWeight: 700, fontSize: 20, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {txResult && (
        <div style={{ background: 'rgba(0,170,92,0.08)', border: '1px solid rgba(0,170,92,0.3)', borderRadius: 8, padding: '14px 20px', marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
          <div>
            <div style={{ fontFamily: 'Space Mono, monospace', fontWeight: 700, fontSize: 13, color: '#00925a', marginBottom: 4 }}>✓ Payment confirmed — {txResult.product}</div>
            <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 10, color: TEXT_MUTED }}>{txResult.hash.slice(0, 20)}...</div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <a href={txResult.explorerUrl} target="_blank" rel="noopener noreferrer" className="btn btn-green" style={{ fontSize: 11 }}>ARCSCAN ↗</a>
            <button onClick={() => setTxResult(null)} className="btn btn-ghost" style={{ fontSize: 11, color: TEXT_DARK }}>DISMISS</button>
          </div>
        </div>
      )}

      {view === 'store' && (
        <div className="sf-store-layout">
          <div className="sf-products-grid">
            {products.map(product => (
              <div key={product.id} className="panel" style={{ overflow: 'hidden', border: `1px solid ${BORDER}`, borderRadius: 10, background: '#fff' }}>
                <div style={{ padding: '24px 20px 16px', textAlign: 'center', background: 'rgba(0,0,0,0.03)' }}>
                  <div style={{ fontSize: 48, marginBottom: 8 }}>{product.image}</div>
                  <span className="badge badge-blue" style={{ fontSize: 9, color: '#0068b3', fontWeight: 700 }}>{product.category}</span>
                </div>
                <div style={{ padding: '16px 20px' }}>
                  <div style={{ fontFamily: 'Space Mono, monospace', fontWeight: 700, fontSize: 13, color: TEXT_DARK, marginBottom: 6 }}>{product.name}</div>
                  <div style={{ fontSize: 12, color: TEXT_MUTED, lineHeight: 1.5, marginBottom: 14 }}>{product.description}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <span style={{ fontFamily: 'Space Mono, monospace', fontWeight: 700, fontSize: 18, color: '#00925a' }}>${product.price} USDC</span>
                    <span style={{ fontFamily: 'Space Mono, monospace', fontSize: 10, color: TEXT_FAINT, fontWeight: 700 }}>{product.sold} sold</span>
                  </div>
                  <button onClick={() => setCheckoutProduct(product)} disabled={buying === product.id} className="btn btn-green" style={{ width: '100%', fontSize: 12 }}>
                    {buying === product.id ? <><span className="spinner" /> PROCESSING...</> : 'BUY WITH USDC'}
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div className="panel" style={{ border: `1px solid ${BORDER}`, borderRadius: 10, background: '#fff' }}>
            <div className="panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderBottom: `1px solid ${BORDER}` }}>
              <div className="panel-title" style={{ color: TEXT_DARK, fontWeight: 700, fontSize: 12 }}>RECENT ORDERS</div>
              <span style={{ fontFamily: 'Space Mono, monospace', fontSize: 10, color: TEXT_FAINT, fontWeight: 700 }}>{orders.length}</span>
            </div>
            {orders.length === 0
              ? <div style={{ padding: 24, textAlign: 'center', fontFamily: 'Space Mono, monospace', fontSize: 11, color: TEXT_FAINT, fontWeight: 700 }}>No orders yet</div>
              : orders.map(order => (
                <div key={order.id} style={{ padding: '12px 16px', borderBottom: `1px solid ${BORDER}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontFamily: 'Space Mono, monospace', fontSize: 11, fontWeight: 700, color: TEXT_DARK }}>{order.productName}</span>
                    <span style={{ fontFamily: 'Space Mono, monospace', fontSize: 12, color: '#00925a', fontWeight: 700 }}>${order.amount}</span>
                  </div>
                  <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 10, color: TEXT_FAINT, marginBottom: 4 }}>{order.date}</div>
                  <a href={order.explorerUrl} target="_blank" rel="noopener noreferrer" style={{ fontFamily: 'Space Mono, monospace', fontSize: 10, color: '#0068b3', textDecoration: 'none', fontWeight: 700 }}>
                    {order.txHash.slice(0, 14)}... ↗
                  </a>
                </div>
              ))
            }
            <div style={{ padding: '12px 16px' }}>
              <a href={`https://testnet.arcscan.app/address/${CONTRACTS.ArcStorefrontFactory}`} target="_blank" rel="noopener noreferrer"
                style={{ fontFamily: 'Space Mono, monospace', fontSize: 10, color: '#0068b3', textDecoration: 'none', fontWeight: 700 }}>
                VIEW CONTRACT ↗
              </a>
            </div>
          </div>
        </div>
      )}

      {view === 'manage' && (
        <div className="panel" style={{ border: `1px solid ${BORDER}`, borderRadius: 10, background: '#fff' }}>
          <div className="panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 20px', borderBottom: `1px solid ${BORDER}`, flexWrap: 'wrap', gap: 10 }}>
            <div className="panel-title" style={{ color: TEXT_DARK, fontWeight: 700, fontSize: 13 }}>MY PRODUCTS</div>
            <button onClick={() => setShowAddForm(!showAddForm)} className="btn btn-green" style={{ fontSize: 11, padding: '6px 14px' }}>
              {showAddForm ? '✕ CANCEL' : '+ NEW PRODUCT'}
            </button>
          </div>
          {showAddForm && (
            <div style={{ padding: '20px', borderBottom: `1px solid ${BORDER}`, background: 'rgba(0,170,92,0.04)' }}>
              <div className="sf-form-grid">
                <div><label className="label" style={{ color: TEXT_DARK, fontWeight: 700 }}>PRODUCT NAME</label><input className="input" placeholder="My Product" value={newProduct.name} onChange={e => setNewProduct(p => ({ ...p, name: e.target.value }))} style={{ color: TEXT_DARK }} /></div>
                <div><label className="label" style={{ color: TEXT_DARK, fontWeight: 700 }}>PRICE (USDC)</label><input className="input" type="number" placeholder="29" value={newProduct.price} onChange={e => setNewProduct(p => ({ ...p, price: e.target.value }))} style={{ color: TEXT_DARK }} /></div>
              </div>
              <div style={{ marginBottom: 12 }}><label className="label" style={{ color: TEXT_DARK, fontWeight: 700 }}>DESCRIPTION</label><input className="input" placeholder="What are you selling?" value={newProduct.description} onChange={e => setNewProduct(p => ({ ...p, description: e.target.value }))} style={{ color: TEXT_DARK }} /></div>
              <div className="sf-form-grid">
                <div><label className="label" style={{ color: TEXT_DARK, fontWeight: 700 }}>CATEGORY</label><select className="select" value={newProduct.category} onChange={e => setNewProduct(p => ({ ...p, category: e.target.value }))} style={{ color: TEXT_DARK }}>{CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
                <div><label className="label" style={{ color: TEXT_DARK, fontWeight: 700 }}>STOCK</label><input className="input" type="number" placeholder="999" value={newProduct.stock} onChange={e => setNewProduct(p => ({ ...p, stock: e.target.value }))} style={{ color: TEXT_DARK }} /></div>
              </div>
              <div style={{ marginBottom: 12 }}><label className="label" style={{ color: TEXT_DARK, fontWeight: 700 }}>YOUR WALLET (receives USDC)</label><input className="input" placeholder="0x..." value={newProduct.walletAddress} onChange={e => setNewProduct(p => ({ ...p, walletAddress: e.target.value }))} style={{ color: TEXT_DARK }} /></div>
              {addError && <div style={{ color: '#c81e3a', fontFamily: 'Space Mono, monospace', fontSize: 11, marginBottom: 10, fontWeight: 700 }}>⚠ {addError}</div>}
              <button onClick={addProduct} className="btn btn-green" style={{ fontSize: 12 }}>CREATE PRODUCT</button>
            </div>
          )}
          <div>
            {products.map(product => (
              <div key={product.id} style={{ padding: '16px 20px', borderBottom: `1px solid ${BORDER}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}>
                  <span style={{ fontSize: 28 }}>{product.image}</span>
                  <div>
                    <div style={{ fontFamily: 'Space Mono, monospace', fontWeight: 700, fontSize: 13, color: TEXT_DARK, marginBottom: 2 }}>{product.name}</div>
                    <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 10, color: TEXT_FAINT, fontWeight: 700 }}>{product.category} · {product.sold} sold · Created {product.createdAt}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontFamily: 'Space Mono, monospace', fontWeight: 700, fontSize: 14, color: '#00925a' }}>${product.price} USDC</span>
                  <button onClick={() => copyLink(product.id)} className="btn btn-blue" style={{ fontSize: 10, padding: '5px 10px' }}>{copiedId === product.id ? '✓ COPIED' : '🔗 SHARE'}</button>
                  <button onClick={() => setProducts(prev => prev.filter(p => p.id !== product.id))} className="btn btn-ghost" style={{ fontSize: 10, padding: '5px 10px', color: '#c81e3a', fontWeight: 700 }}>DELETE</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {checkoutProduct && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => setCheckoutProduct(null)}>
          <div style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 12, padding: 28, width: '100%', maxWidth: 440, maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <div style={{ fontSize: 48, marginBottom: 8 }}>{checkoutProduct.image}</div>
              <div style={{ fontFamily: 'Space Mono, monospace', fontWeight: 700, fontSize: 16, color: TEXT_DARK, marginBottom: 4 }}>{checkoutProduct.name}</div>
              <div style={{ fontFamily: 'Space Mono, monospace', fontWeight: 700, fontSize: 24, color: '#00925a' }}>${checkoutProduct.price} USDC</div>
            </div>
            {[
              { label: 'SELLER', value: `${checkoutProduct.walletAddress.slice(0, 10)}...${checkoutProduct.walletAddress.slice(-8)}` },
              { label: 'NETWORK', value: 'Arc Testnet' },
              { label: 'GAS FEE', value: '~$0.01 USDC' },
              { label: 'FINALITY', value: '< 1 second' },
              { label: 'CONTRACT', value: 'ArcStorefrontFactory' },
            ].map(row => (
              <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: `1px solid ${BORDER}` }}>
                <span style={{ fontFamily: 'Space Mono, monospace', fontSize: 10, color: TEXT_MUTED, fontWeight: 700 }}>{row.label}</span>
                <span style={{ fontFamily: 'Space Mono, monospace', fontSize: 12, fontWeight: 700, color: TEXT_DARK }}>{row.value}</span>
              </div>
            ))}
            {payError && (
              <div style={{ marginTop: 14, padding: '10px 14px', background: 'rgba(200,30,58,0.08)', border: '1px solid rgba(200,30,58,0.25)', borderRadius: 6, fontFamily: 'Space Mono, monospace', fontSize: 12, color: '#c81e3a', fontWeight: 700 }}>⚠ {payError}</div>
            )}
            {!address && (
              <div style={{ marginTop: 14, padding: '10px 14px', background: 'rgba(179,114,0,0.08)', border: '1px solid rgba(179,114,0,0.25)', borderRadius: 6, fontFamily: 'Space Mono, monospace', fontSize: 12, color: '#b37200', fontWeight: 700 }}>Connect your wallet to pay</div>
            )}
            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button onClick={() => setCheckoutProduct(null)} className="btn btn-ghost" style={{ flex: 1, color: TEXT_DARK }}>CANCEL</button>
              <button onClick={() => handleBuy(checkoutProduct)} disabled={buying === checkoutProduct.id} className="btn btn-green" style={{ flex: 1 }}>
                {buying === checkoutProduct.id ? <><span className="spinner" /> PAYING...</> : address ? 'PAY NOW' : '🦊 CONNECT & PAY'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}