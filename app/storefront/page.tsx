'use client';
import { useState } from 'react';
import { arcSend } from '@/lib/arc';
import { useWallet } from '@/context/WalletContext';

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

const DEMO_PRODUCTS: Product[] = [
  { id: shortId(), name: 'Arc Integration Guide', description: 'Complete developer guide for integrating Arc SDK into your dApp', price: 29, currency: 'USDC', image: '📘', category: 'Digital', stock: 999, sold: 14, walletAddress: '0x1234567890abcdef1234567890abcdef12345678', createdAt: new Date().toLocaleDateString() },
  { id: shortId(), name: 'DeFi Dashboard Template', description: 'Bloomberg-style terminal UI kit for Web3 projects', price: 79, currency: 'USDC', image: '🖥', category: 'Software', stock: 999, sold: 7, walletAddress: '0x1234567890abcdef1234567890abcdef12345678', createdAt: new Date().toLocaleDateString() },
];

export default function StorefrontPage() {
  const { address, connect } = useWallet();
  const [view, setView] = useState<'store' | 'manage'>('store');
  const [products, setProducts] = useState<Product[]>(DEMO_PRODUCTS);
  const [orders, setOrders] = useState<Order[]>([]);
  const [buying, setBuying] = useState<string | null>(null);
  const [checkoutProduct, setCheckoutProduct] = useState<Product | null>(null);
  const [txResult, setTxResult] = useState<{ hash: string; explorerUrl: string; product: string } | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newProduct, setNewProduct] = useState({ name: '', description: '', price: '', category: 'Digital', stock: '', walletAddress: '' });
  const [addError, setAddError] = useState('');
  const [payError, setPayError] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  function addProduct() {
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
    setProducts(prev => [product, ...prev]);
    setNewProduct({ name: '', description: '', price: '', category: 'Digital', stock: '', walletAddress: '' });
    setShowAddForm(false);
  }

  async function handleBuy(product: Product) {
    if (!address) { await connect(); return; }
    setBuying(product.id);
    setPayError('');
    try {
      const res = await arcSend(product.walletAddress, product.price.toFixed(2), 'USDC');
      setProducts(prev => prev.map(p => p.id === product.id ? { ...p, sold: p.sold + 1 } : p));
      setOrders(prev => [{
        id: shortId(), productId: product.id, productName: product.name,
        amount: product.price, buyerAddress: address,
        txHash: res.txHash, explorerUrl: res.explorerUrl,
        date: new Date().toLocaleString(), status: 'confirmed',
      }, ...prev]);
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
    <>
      <style>{`
        .products-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 24px; }
        .store-grid { display: grid; grid-template-columns: 1fr 300px; gap: 20px; align-items: start; }
        .store-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 24px; }
        .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.7); backdrop-filter: blur(4px); z-index: 200; display: flex; align-items: center; justify-content: center; padding: 20px; }
        .modal { background: #080c10; border: 1px solid rgba(0,255,136,0.2); border-radius: 12px; padding: 28px; width: 100%; max-width: 440px; animation: fadeUp 0.2s ease; max-height: 90vh; overflow-y: auto; }
        @media (max-width: 1024px) { .store-grid { grid-template-columns: 1fr; } }
        @media (max-width: 768px) { .products-grid { grid-template-columns: repeat(2, 1fr); } .store-stats { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 480px) { .products-grid { grid-template-columns: 1fr; } .storefront-page { padding: 16px 16px 60px !important; } }
      `}</style>

      <div className="storefront-page" style={{ padding: '24px 24px 60px', maxWidth: 1200, margin: '0 auto', position: 'relative', zIndex: 1 }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 10, color: 'rgba(232,240,232,0.3)', letterSpacing: '0.2em', marginBottom: 6 }}>ARC TERMINAL · STOREFRONT</div>
            <h1 style={{ fontSize: 28, fontWeight: 700, color: '#e8f0e8', letterSpacing: '-0.02em', marginBottom: 4 }}>Storefront</h1>
            <p style={{ fontSize: 13, color: 'rgba(232,240,232,0.4)' }}>Create products, share links, accept USDC payments on Arc</p>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            {!address
              ? <button onClick={connect} className="btn btn-green" style={{ fontSize: 11 }}>🦊 CONNECT WALLET</button>
              : <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 11, color: '#00ff88', padding: '6px 12px', borderRadius: 6, background: 'rgba(0,255,136,0.06)', border: '1px solid rgba(0,255,136,0.2)' }}>{address.slice(0, 6)}…{address.slice(-4)}</div>
            }
            <button onClick={() => setView('store')} className={view === 'store' ? 'btn btn-green' : 'btn btn-ghost'} style={{ fontSize: 11 }}>🛒 STORE</button>
            <button onClick={() => setView('manage')} className={view === 'manage' ? 'btn btn-green' : 'btn btn-ghost'} style={{ fontSize: 11 }}>⚙ MANAGE</button>
          </div>
        </div>

        {/* Stats */}
        <div className="store-stats">
          {[
            { label: 'PRODUCTS', value: products.length, color: '#00aaff' },
            { label: 'TOTAL SOLD', value: products.reduce((s, p) => s + p.sold, 0), color: '#00ff88' },
            { label: 'REVENUE (USDC)', value: `$${orders.reduce((s, o) => s + o.amount, 0).toLocaleString()}`, color: '#00ff88' },
            { label: 'ORDERS', value: orders.length, color: '#ffaa00' },
          ].map(s => (
            <div key={s.label} className="panel" style={{ padding: 16 }}>
              <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 9, color: 'rgba(232,240,232,0.3)', letterSpacing: '0.15em', marginBottom: 6 }}>{s.label}</div>
              <div style={{ fontFamily: 'Space Mono, monospace', fontWeight: 700, fontSize: 20, color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Success banner */}
        {txResult && (
          <div style={{ background: 'rgba(0,255,136,0.08)', border: '1px solid rgba(0,255,136,0.25)', borderRadius: 8, padding: '14px 20px', marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
            <div>
              <div style={{ fontFamily: 'Space Mono, monospace', fontWeight: 700, fontSize: 13, color: '#00ff88', marginBottom: 4 }}>✓ Payment confirmed — {txResult.product}</div>
              <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 10, color: 'rgba(232,240,232,0.4)' }}>{txResult.hash.slice(0, 20)}...</div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <a href={txResult.explorerUrl} target="_blank" rel="noopener noreferrer" className="btn btn-green" style={{ fontSize: 11 }}>ARCSCAN ↗</a>
              <button onClick={() => setTxResult(null)} className="btn btn-ghost" style={{ fontSize: 11 }}>DISMISS</button>
            </div>
          </div>
        )}

        {/* STORE VIEW */}
        {view === 'store' && (
          <div className="store-grid">
            <div>
              <div className="products-grid">
                {products.map(product => (
                  <div key={product.id} className="panel" style={{ overflow: 'hidden' }}>
                    <div style={{ padding: '24px 20px 16px', textAlign: 'center', background: 'rgba(255,255,255,0.02)' }}>
                      <div style={{ fontSize: 48, marginBottom: 8 }}>{product.image}</div>
                      <span className="badge badge-blue" style={{ fontSize: 9 }}>{product.category}</span>
                    </div>
                    <div style={{ padding: '16px 20px' }}>
                      <div style={{ fontFamily: 'Space Mono, monospace', fontWeight: 700, fontSize: 13, color: '#e8f0e8', marginBottom: 6 }}>{product.name}</div>
                      <div style={{ fontSize: 12, color: 'rgba(232,240,232,0.4)', lineHeight: 1.5, marginBottom: 14 }}>{product.description}</div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                        <span style={{ fontFamily: 'Space Mono, monospace', fontWeight: 700, fontSize: 18, color: '#00ff88' }}>${product.price} USDC</span>
                        <span style={{ fontFamily: 'Space Mono, monospace', fontSize: 10, color: 'rgba(232,240,232,0.3)' }}>{product.sold} sold</span>
                      </div>
                      <button onClick={() => setCheckoutProduct(product)} disabled={buying === product.id} className="btn btn-green" style={{ width: '100%', fontSize: 12 }}>
                        {buying === product.id ? <><span className="spinner" /> PROCESSING...</> : 'BUY WITH USDC'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Orders */}
            <div className="panel">
              <div className="panel-header">
                <div className="panel-title">RECENT ORDERS</div>
                <span style={{ fontFamily: 'Space Mono, monospace', fontSize: 10, color: 'rgba(232,240,232,0.3)' }}>{orders.length}</span>
              </div>
              {orders.length === 0
                ? <div style={{ padding: 24, textAlign: 'center', fontFamily: 'Space Mono, monospace', fontSize: 11, color: 'rgba(232,240,232,0.25)' }}>No orders yet</div>
                : orders.map(order => (
                  <div key={order.id} style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontFamily: 'Space Mono, monospace', fontSize: 11, fontWeight: 700, color: '#e8f0e8' }}>{order.productName}</span>
                      <span style={{ fontFamily: 'Space Mono, monospace', fontSize: 12, color: '#00ff88', fontWeight: 700 }}>${order.amount}</span>
                    </div>
                    <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 10, color: 'rgba(232,240,232,0.3)', marginBottom: 4 }}>{order.date}</div>
                    <a href={order.explorerUrl} target="_blank" rel="noopener noreferrer" style={{ fontFamily: 'Space Mono, monospace', fontSize: 10, color: '#00aaff', textDecoration: 'none' }}>
                      {order.txHash.slice(0, 14)}... ↗
                    </a>
                  </div>
                ))
              }
            </div>
          </div>
        )}

        {/* MANAGE VIEW */}
        {view === 'manage' && (
          <div className="panel">
            <div className="panel-header">
              <div className="panel-title">MY PRODUCTS</div>
              <button onClick={() => setShowAddForm(!showAddForm)} className="btn btn-green" style={{ fontSize: 11, padding: '6px 14px' }}>
                {showAddForm ? '✕ CANCEL' : '+ NEW PRODUCT'}
              </button>
            </div>
            {showAddForm && (
              <div style={{ padding: '20px', borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(0,255,136,0.02)' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                  <div><label className="label">PRODUCT NAME</label><input className="input" placeholder="My Product" value={newProduct.name} onChange={e => setNewProduct(p => ({ ...p, name: e.target.value }))} /></div>
                  <div><label className="label">PRICE (USDC)</label><input className="input" type="number" placeholder="29" value={newProduct.price} onChange={e => setNewProduct(p => ({ ...p, price: e.target.value }))} /></div>
                </div>
                <div style={{ marginBottom: 12 }}><label className="label">DESCRIPTION</label><input className="input" placeholder="What are you selling?" value={newProduct.description} onChange={e => setNewProduct(p => ({ ...p, description: e.target.value }))} /></div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                  <div><label className="label">CATEGORY</label><select className="select" value={newProduct.category} onChange={e => setNewProduct(p => ({ ...p, category: e.target.value }))}>{CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
                  <div><label className="label">STOCK</label><input className="input" type="number" placeholder="999" value={newProduct.stock} onChange={e => setNewProduct(p => ({ ...p, stock: e.target.value }))} /></div>
                </div>
                <div style={{ marginBottom: 12 }}><label className="label">YOUR WALLET (receives USDC)</label><input className="input" placeholder="0x..." value={newProduct.walletAddress} onChange={e => setNewProduct(p => ({ ...p, walletAddress: e.target.value }))} /></div>
                {addError && <div style={{ color: '#ff3355', fontFamily: 'Space Mono, monospace', fontSize: 11, marginBottom: 10 }}>⚠ {addError}</div>}
                <button onClick={addProduct} className="btn btn-green" style={{ fontSize: 12 }}>CREATE PRODUCT</button>
              </div>
            )}
            <div>
              {products.map(product => (
                <div key={product.id} style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.04)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}>
                    <span style={{ fontSize: 28 }}>{product.image}</span>
                    <div>
                      <div style={{ fontFamily: 'Space Mono, monospace', fontWeight: 700, fontSize: 13, color: '#e8f0e8', marginBottom: 2 }}>{product.name}</div>
                      <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 10, color: 'rgba(232,240,232,0.3)' }}>{product.category} · {product.sold} sold · Created {product.createdAt}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontFamily: 'Space Mono, monospace', fontWeight: 700, fontSize: 14, color: '#00ff88' }}>${product.price} USDC</span>
                    <button onClick={() => copyLink(product.id)} className="btn btn-blue" style={{ fontSize: 10, padding: '5px 10px' }}>{copiedId === product.id ? '✓ COPIED' : '🔗 SHARE'}</button>
                    <button onClick={() => setProducts(prev => prev.filter(p => p.id !== product.id))} className="btn btn-ghost" style={{ fontSize: 10, padding: '5px 10px', color: '#ff3355' }}>DELETE</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Checkout Modal */}
        {checkoutProduct && (
          <div className="modal-overlay" onClick={() => setCheckoutProduct(null)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <div style={{ textAlign: 'center', marginBottom: 20 }}>
                <div style={{ fontSize: 48, marginBottom: 8 }}>{checkoutProduct.image}</div>
                <div style={{ fontFamily: 'Space Mono, monospace', fontWeight: 700, fontSize: 16, color: '#e8f0e8', marginBottom: 4 }}>{checkoutProduct.name}</div>
                <div style={{ fontFamily: 'Space Mono, monospace', fontWeight: 700, fontSize: 24, color: '#00ff88' }}>${checkoutProduct.price} USDC</div>
              </div>
              {[
                { label: 'SELLER', value: `${checkoutProduct.walletAddress.slice(0, 10)}...${checkoutProduct.walletAddress.slice(-8)}` },
                { label: 'NETWORK', value: 'Arc Testnet' },
                { label: 'GAS FEE', value: '~$0.01 USDC' },
                { label: 'FINALITY', value: '< 1 second' },
              ].map(row => (
                <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <span style={{ fontFamily: 'Space Mono, monospace', fontSize: 10, color: 'rgba(232,240,232,0.35)' }}>{row.label}</span>
                  <span style={{ fontFamily: 'Space Mono, monospace', fontSize: 12, fontWeight: 700, color: '#e8f0e8' }}>{row.value}</span>
                </div>
              ))}
              {payError && (
                <div style={{ marginTop: 14, padding: '10px 14px', background: 'rgba(255,51,85,0.08)', border: '1px solid rgba(255,51,85,0.2)', borderRadius: 6, fontFamily: 'Space Mono, monospace', fontSize: 12, color: '#ff3355' }}>⚠ {payError}</div>
              )}
              {!address && (
                <div style={{ marginTop: 14, padding: '10px 14px', background: 'rgba(255,170,0,0.08)', border: '1px solid rgba(255,170,0,0.2)', borderRadius: 6, fontFamily: 'Space Mono, monospace', fontSize: 12, color: '#ffaa00' }}>
                  Connect your wallet to pay
                </div>
              )}
              <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                <button onClick={() => setCheckoutProduct(null)} className="btn btn-ghost" style={{ flex: 1 }}>CANCEL</button>
                <button onClick={() => handleBuy(checkoutProduct)} disabled={buying === checkoutProduct.id} className="btn btn-green" style={{ flex: 1 }}>
                  {buying === checkoutProduct.id ? <><span className="spinner" /> PAYING...</> : address ? 'PAY NOW' : '🦊 CONNECT & PAY'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}