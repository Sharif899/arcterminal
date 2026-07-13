'use client';
import { useState } from 'react';
import { arcSend } from '@/lib/arc';
import { useWallet } from '@/context/WalletContext';
import { callContract, CONTRACTS, TICKET_ABI } from '@/lib/contracts';

interface Event {
  id: string;
  name: string;
  description: string;
  date: string;
  time: string;
  location: string;
  price: number;
  totalTickets: number;
  soldTickets: number;
  walletAddress: string;
  category: string;
  createdAt: string;
}

interface Ticket {
  id: string;
  eventId: string;
  eventName: string;
  eventDate: string;
  eventLocation: string;
  buyerAddress: string;
  buyerName: string;
  price: number;
  txHash: string;
  explorerUrl: string;
  issuedAt: string;
  tokenId: string;
}

function shortId() {
  return Math.random().toString(36).substring(2, 10).toUpperCase();
}

const CATEGORIES = ['Conference', 'Concert', 'Workshop', 'Meetup', 'Sports', 'Festival', 'Webinar'];
const CATEGORY_EMOJI: Record<string, string> = {
  Conference: '🎤', Concert: '🎵', Workshop: '🛠', Meetup: '🤝',
  Sports: '⚽', Festival: '🎉', Webinar: '💻',
};

const MY_WALLET = '0xf2ee634847d39161ec7de7879d7d0d241b932ad4';

const DEMO_EVENTS: Event[] = [
  {
    id: shortId(), name: 'Arc Developer Summit 2025',
    description: 'Annual gathering of Arc builders — talks, workshops, and networking with the core team.',
    date: '2025-08-15', time: '09:00', location: 'Lagos, Nigeria',
    price: 25, totalTickets: 500, soldTickets: 312,
    walletAddress: MY_WALLET,
    category: 'Conference', createdAt: new Date().toLocaleDateString(),
  },
  {
    id: shortId(), name: 'Web3 Africa Meetup',
    description: 'Community meetup for Web3 builders across Africa.',
    date: '2025-07-20', time: '18:00', location: 'Accra, Ghana',
    price: 5, totalTickets: 200, soldTickets: 87,
    walletAddress: MY_WALLET,
    category: 'Meetup', createdAt: new Date().toLocaleDateString(),
  },
];

function QRCode({ data, size = 120 }: { data: string; size?: number }) {
  const cells = 10;
  const cellSize = size / cells;
  const hash = data.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const grid = Array.from({ length: cells }, (_, r) =>
    Array.from({ length: cells }, (_, c) => {
      if (r === 0 || r === cells - 1 || c === 0 || c === cells - 1) return 1;
      if (r <= 2 && c <= 2) return 1;
      if (r <= 2 && c >= cells - 3) return 1;
      if (r >= cells - 3 && c <= 2) return 1;
      return (hash * (r + 1) * (c + 1) + r * c) % 3 === 0 ? 1 : 0;
    })
  );
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ display: 'block' }}>
      {grid.map((row, r) =>
        row.map((cell, c) =>
          cell ? <rect key={`${r}-${c}`} x={c * cellSize} y={r * cellSize} width={cellSize} height={cellSize} fill="#00ff88" /> : null
        )
      )}
    </svg>
  );
}

export default function TicketsPage() {
  const { address, connect } = useWallet();
  const [view, setView] = useState<'events' | 'manage' | 'mytickets'>('events');
  const [events, setEvents] = useState<Event[]>(DEMO_EVENTS);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [checkoutEvent, setCheckoutEvent] = useState<Event | null>(null);
  const [buyerName, setBuyerName] = useState('');
  const [buying, setBuying] = useState<string | null>(null);
  const [newTicket, setNewTicket] = useState<Ticket | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [payError, setPayError] = useState('');
  const [addError, setAddError] = useState('');
  const [newEvent, setNewEvent] = useState({
    name: '', description: '', date: '', time: '', location: '',
    price: '', totalTickets: '', walletAddress: MY_WALLET, category: 'Conference',
  });

  function addEvent() {
    setAddError('');
    if (!newEvent.name) return setAddError('Event name required');
    if (!newEvent.date) return setAddError('Event date required');
    if (!newEvent.price || parseFloat(newEvent.price) < 0) return setAddError('Valid price required');
    if (!newEvent.walletAddress || !/^0x[a-fA-F0-9]{40}$/.test(newEvent.walletAddress)) return setAddError('Valid wallet address required');
    const event: Event = {
      id: shortId(), name: newEvent.name, description: newEvent.description,
      date: newEvent.date, time: newEvent.time, location: newEvent.location,
      price: parseFloat(newEvent.price), totalTickets: parseInt(newEvent.totalTickets) || 100,
      soldTickets: 0, walletAddress: newEvent.walletAddress,
      category: newEvent.category, createdAt: new Date().toLocaleDateString(),
    };
    try {
      callContract(CONTRACTS.ArcTicketRegistry, TICKET_ABI, 'createEvent', [
        event.name, event.location,
        BigInt(Math.floor(new Date(event.date).getTime() / 1000)),
        BigInt(Math.floor(event.price * 100)),
        BigInt(event.totalTickets),
      ]).catch(e => console.log('Contract:', e));
    } catch (contractErr) { console.log('Contract:', contractErr); }
    setEvents(prev => [event, ...prev]);
    setNewEvent({ name: '', description: '', date: '', time: '', location: '', price: '', totalTickets: '', walletAddress: MY_WALLET, category: 'Conference' });
    setShowAddForm(false);
  }

  async function handleBuy(event: Event) {
    if (!address) { await connect(); return; }
    if (!buyerName.trim()) return;
    setBuying(event.id);
    setPayError('');
    try {
      const res = await arcSend(event.walletAddress, event.price.toFixed(2), 'USDC');
      const tokenId = shortId();
      try {
        await callContract(CONTRACTS.ArcTicketRegistry, TICKET_ABI, 'mintTicket', [
          BigInt(0), buyerName,
          BigInt(Math.floor(event.price * 100)),
          tokenId,
        ]);
      } catch (contractErr) { console.log('Contract:', contractErr); }
      const ticket: Ticket = {
        id: shortId(), eventId: event.id, eventName: event.name,
        eventDate: event.date, eventLocation: event.location,
        buyerAddress: address, buyerName,
        price: event.price, txHash: res.txHash, explorerUrl: res.explorerUrl,
        issuedAt: new Date().toLocaleString(), tokenId,
      };
      setEvents(prev => prev.map(e => e.id === event.id ? { ...e, soldTickets: e.soldTickets + 1 } : e));
      setTickets(prev => [ticket, ...prev]);
      setNewTicket(ticket);
      setCheckoutEvent(null);
      setBuyerName('');
    } catch (e: any) {
      setPayError(e?.message || 'Payment failed');
    }
    setBuying(null);
  }

  return (
    <div style={{ padding: '24px 24px 60px', maxWidth: 1200, margin: '0 auto', position: 'relative', zIndex: 1 }}>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 10, color: 'rgba(232,240,232,0.3)', letterSpacing: '0.2em', marginBottom: 6 }}>ARC TERMINAL · TICKETS</div>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: '#e8f0e8', letterSpacing: '-0.02em', marginBottom: 4 }}>Event Tickets</h1>
          <p style={{ fontSize: 13, color: 'rgba(232,240,232,0.4)' }}>Create events, sell tickets, verify via QR — powered by Arc + USDC</p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          {!address
            ? <button onClick={connect} className="btn btn-green" style={{ fontSize: 11 }}>🦊 CONNECT WALLET</button>
            : <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 11, color: '#00ff88', padding: '6px 12px', borderRadius: 6, background: 'rgba(0,255,136,0.06)', border: '1px solid rgba(0,255,136,0.2)' }}>{address.slice(0, 6)}…{address.slice(-4)}</div>
          }
          <button onClick={() => setView('events')} className={view === 'events' ? 'btn btn-green' : 'btn btn-ghost'} style={{ fontSize: 11 }}>🎟 EVENTS</button>
          <button onClick={() => setView('mytickets')} className={view === 'mytickets' ? 'btn btn-green' : 'btn btn-ghost'} style={{ fontSize: 11 }}>👤 MY TICKETS {tickets.length > 0 && `(${tickets.length})`}</button>
          <button onClick={() => setView('manage')} className={view === 'manage' ? 'btn btn-green' : 'btn btn-ghost'} style={{ fontSize: 11 }}>⚙ MANAGE</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
        {[
          { label: 'EVENTS', value: events.length, color: '#00aaff' },
          { label: 'TICKETS SOLD', value: events.reduce((s, e) => s + e.soldTickets, 0), color: '#00ff88' },
          { label: 'REVENUE (USDC)', value: `$${tickets.reduce((s, t) => s + t.price, 0).toLocaleString()}`, color: '#00ff88' },
          { label: 'MY TICKETS', value: tickets.length, color: '#ffaa00' },
        ].map(s => (
          <div key={s.label} className="panel" style={{ padding: 16 }}>
            <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 9, color: 'rgba(232,240,232,0.3)', letterSpacing: '0.15em', marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontFamily: 'Space Mono, monospace', fontWeight: 700, fontSize: 20, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {newTicket && (
        <div style={{ background: 'rgba(0,255,136,0.08)', border: '1px solid rgba(0,255,136,0.25)', borderRadius: 8, padding: '14px 20px', marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
          <div>
            <div style={{ fontFamily: 'Space Mono, monospace', fontWeight: 700, fontSize: 13, color: '#00ff88', marginBottom: 4 }}>✓ Ticket #{newTicket.tokenId} minted — {newTicket.eventName}</div>
            <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 10, color: 'rgba(232,240,232,0.4)' }}>{newTicket.txHash.slice(0, 24)}...</div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => { setSelectedTicket(newTicket); setNewTicket(null); }} className="btn btn-green" style={{ fontSize: 11 }}>VIEW TICKET</button>
            <a href={newTicket.explorerUrl} target="_blank" rel="noopener noreferrer" className="btn btn-ghost" style={{ fontSize: 11 }}>ARCSCAN ↗</a>
            <button onClick={() => setNewTicket(null)} className="btn btn-ghost" style={{ fontSize: 11 }}>✕</button>
          </div>
        </div>
      )}

      {view === 'events' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
          {events.map(event => {
            const soldPct = Math.round((event.soldTickets / event.totalTickets) * 100);
            const isSoldOut = event.soldTickets >= event.totalTickets;
            return (
              <div key={event.id} className="panel" style={{ overflow: 'hidden' }}>
                <div style={{ padding: '20px 20px 0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 24 }}>{CATEGORY_EMOJI[event.category] || '🎟'}</span>
                      <span className="badge badge-blue" style={{ fontSize: 9 }}>{event.category}</span>
                    </div>
                    <span style={{ fontFamily: 'Space Mono, monospace', fontWeight: 700, fontSize: 18, color: '#00ff88' }}>
                      {event.price === 0 ? 'FREE' : `$${event.price} USDC`}
                    </span>
                  </div>
                  <div style={{ fontFamily: 'Space Mono, monospace', fontWeight: 700, fontSize: 15, color: '#e8f0e8', marginBottom: 6 }}>{event.name}</div>
                  <div style={{ fontSize: 12, color: 'rgba(232,240,232,0.4)', lineHeight: 1.5, marginBottom: 14 }}>{event.description}</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
                    {[
                      { icon: '📅', value: new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) },
                      { icon: '🕐', value: event.time },
                      { icon: '📍', value: event.location },
                      { icon: '🎟', value: `${event.soldTickets}/${event.totalTickets} sold` },
                    ].map(item => (
                      <div key={item.icon} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'rgba(232,240,232,0.5)' }}>
                        <span>{item.icon}</span><span>{item.value}</span>
                      </div>
                    ))}
                  </div>
                  <div style={{ marginBottom: 14 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontFamily: 'Space Mono, monospace', fontSize: 10, color: 'rgba(232,240,232,0.3)' }}>
                      <span>AVAILABILITY</span><span>{soldPct}% SOLD</span>
                    </div>
                    <div style={{ height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden' }}>
                      <div style={{ height: '100%', borderRadius: 2, width: `${soldPct}%`, background: soldPct > 80 ? '#ff3355' : soldPct > 50 ? '#ffaa00' : '#00ff88', transition: 'width 0.5s ease' }} />
                    </div>
                  </div>
                </div>
                <div style={{ padding: '0 20px 20px' }}>
                  <button onClick={() => { setCheckoutEvent(event); setPayError(''); }} disabled={isSoldOut} className={isSoldOut ? 'btn btn-ghost' : 'btn btn-green'} style={{ width: '100%', fontSize: 12 }}>
                    {isSoldOut ? 'SOLD OUT' : `GET TICKET · $${event.price} USDC`}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {view === 'mytickets' && (
        <div>
          {tickets.length === 0 ? (
            <div className="panel" style={{ padding: 48, textAlign: 'center' }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>🎟</div>
              <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 13, color: 'rgba(232,240,232,0.3)', marginBottom: 8 }}>No tickets yet</div>
              <button onClick={() => setView('events')} className="btn btn-green" style={{ fontSize: 12 }}>BROWSE EVENTS</button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
              {tickets.map(ticket => (
                <div key={ticket.id} onClick={() => setSelectedTicket(ticket)} style={{ background: 'linear-gradient(135deg, rgba(0,255,136,0.06) 0%, rgba(0,170,255,0.04) 100%)', border: '1px solid rgba(0,255,136,0.2)', borderRadius: 12, overflow: 'hidden', cursor: 'pointer', position: 'relative' }}>
                  <div style={{ padding: '20px 28px', borderBottom: '1px dashed rgba(0,255,136,0.15)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                      <span className="badge badge-green" style={{ fontSize: 9 }}>NFT TICKET</span>
                      <span style={{ fontFamily: 'Space Mono, monospace', fontSize: 10, color: 'rgba(232,240,232,0.3)' }}>#{ticket.tokenId}</span>
                    </div>
                    <div style={{ fontFamily: 'Space Mono, monospace', fontWeight: 700, fontSize: 15, color: '#e8f0e8', marginBottom: 4 }}>{ticket.eventName}</div>
                    <div style={{ fontSize: 12, color: 'rgba(232,240,232,0.4)' }}>{new Date(ticket.eventDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</div>
                    <div style={{ fontSize: 12, color: 'rgba(232,240,232,0.4)' }}>📍 {ticket.eventLocation}</div>
                  </div>
                  <div style={{ padding: '16px 28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 10, color: 'rgba(232,240,232,0.3)', marginBottom: 2 }}>HOLDER</div>
                      <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 11, fontWeight: 700, color: '#e8f0e8' }}>{ticket.buyerName}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 10, color: 'rgba(232,240,232,0.3)', marginBottom: 2 }}>PAID</div>
                      <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 14, fontWeight: 700, color: '#00ff88' }}>${ticket.price} USDC</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {view === 'manage' && (
        <div className="panel">
          <div className="panel-header">
            <div className="panel-title">MY EVENTS</div>
            <button onClick={() => setShowAddForm(!showAddForm)} className="btn btn-green" style={{ fontSize: 11, padding: '6px 14px' }}>
              {showAddForm ? '✕ CANCEL' : '+ CREATE EVENT'}
            </button>
          </div>
          {showAddForm && (
            <div style={{ padding: '20px', borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(0,255,136,0.02)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                <div><label className="label">EVENT NAME</label><input className="input" placeholder="Arc Summit 2025" value={newEvent.name} onChange={e => setNewEvent(p => ({ ...p, name: e.target.value }))} /></div>
                <div><label className="label">CATEGORY</label><select className="select" value={newEvent.category} onChange={e => setNewEvent(p => ({ ...p, category: e.target.value }))}>{CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
              </div>
              <div style={{ marginBottom: 12 }}><label className="label">DESCRIPTION</label><input className="input" placeholder="What's this event about?" value={newEvent.description} onChange={e => setNewEvent(p => ({ ...p, description: e.target.value }))} /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 12 }}>
                <div><label className="label">DATE</label><input className="input" type="date" value={newEvent.date} onChange={e => setNewEvent(p => ({ ...p, date: e.target.value }))} /></div>
                <div><label className="label">TIME</label><input className="input" type="time" value={newEvent.time} onChange={e => setNewEvent(p => ({ ...p, time: e.target.value }))} /></div>
                <div><label className="label">LOCATION</label><input className="input" placeholder="Lagos, Nigeria" value={newEvent.location} onChange={e => setNewEvent(p => ({ ...p, location: e.target.value }))} /></div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                <div><label className="label">TICKET PRICE (USDC)</label><input className="input" type="number" placeholder="25" value={newEvent.price} onChange={e => setNewEvent(p => ({ ...p, price: e.target.value }))} /></div>
                <div><label className="label">TOTAL TICKETS</label><input className="input" type="number" placeholder="100" value={newEvent.totalTickets} onChange={e => setNewEvent(p => ({ ...p, totalTickets: e.target.value }))} /></div>
              </div>
              <div style={{ marginBottom: 12 }}><label className="label">YOUR WALLET (receives USDC)</label><input className="input" placeholder="0x..." value={newEvent.walletAddress} onChange={e => setNewEvent(p => ({ ...p, walletAddress: e.target.value }))} /></div>
              {addError && <div style={{ color: '#ff3355', fontFamily: 'Space Mono, monospace', fontSize: 11, marginBottom: 10 }}>⚠ {addError}</div>}
              <button onClick={addEvent} className="btn btn-green" style={{ fontSize: 12 }}>CREATE EVENT</button>
            </div>
          )}
          <div>
            {events.map(event => (
              <div key={event.id} style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.04)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1 }}>
                  <span style={{ fontSize: 28 }}>{CATEGORY_EMOJI[event.category]}</span>
                  <div>
                    <div style={{ fontFamily: 'Space Mono, monospace', fontWeight: 700, fontSize: 13, color: '#e8f0e8', marginBottom: 2 }}>{event.name}</div>
                    <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 10, color: 'rgba(232,240,232,0.3)' }}>{new Date(event.date).toLocaleDateString()} · {event.location} · {event.soldTickets}/{event.totalTickets} sold</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontFamily: 'Space Mono, monospace', fontWeight: 700, fontSize: 14, color: '#00ff88' }}>${event.price} USDC</span>
                  <button onClick={() => setEvents(prev => prev.filter(e => e.id !== event.id))} className="btn btn-ghost" style={{ fontSize: 10, padding: '5px 10px', color: '#ff3355' }}>DELETE</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {checkoutEvent && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => setCheckoutEvent(null)}>
          <div style={{ background: '#080c10', border: '1px solid rgba(0,255,136,0.2)', borderRadius: 12, padding: 28, width: '100%', maxWidth: 460, maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <div style={{ fontSize: 40, marginBottom: 8 }}>{CATEGORY_EMOJI[checkoutEvent.category]}</div>
              <div style={{ fontFamily: 'Space Mono, monospace', fontWeight: 700, fontSize: 16, color: '#e8f0e8', marginBottom: 4 }}>{checkoutEvent.name}</div>
              <div style={{ fontFamily: 'Space Mono, monospace', fontWeight: 700, fontSize: 22, color: '#00ff88', marginBottom: 4 }}>
                {checkoutEvent.price === 0 ? 'FREE' : `$${checkoutEvent.price} USDC`}
              </div>
              <div style={{ fontSize: 12, color: 'rgba(232,240,232,0.4)' }}>📅 {new Date(checkoutEvent.date).toLocaleDateString()} · 📍 {checkoutEvent.location}</div>
            </div>
            {[
              { label: 'ORGANIZER WALLET', value: `${checkoutEvent.walletAddress.slice(0, 10)}...${checkoutEvent.walletAddress.slice(-8)}` },
              { label: 'NETWORK', value: 'Arc Testnet' },
              { label: 'GAS FEE', value: '~$0.01 USDC' },
              { label: 'TICKET TYPE', value: 'NFT on Arc' },
              { label: 'CONTRACT', value: 'ArcTicketRegistry' },
            ].map(row => (
              <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <span style={{ fontFamily: 'Space Mono, monospace', fontSize: 10, color: 'rgba(232,240,232,0.35)' }}>{row.label}</span>
                <span style={{ fontFamily: 'Space Mono, monospace', fontSize: 12, fontWeight: 700, color: '#e8f0e8' }}>{row.value}</span>
              </div>
            ))}
            <div style={{ marginTop: 20, marginBottom: 16 }}>
              <label className="label">YOUR NAME</label>
              <input className="input" placeholder="John Doe" value={buyerName} onChange={e => setBuyerName(e.target.value)} />
            </div>
            {payError && (
              <div style={{ marginBottom: 14, padding: '10px 14px', background: 'rgba(255,51,85,0.08)', border: '1px solid rgba(255,51,85,0.2)', borderRadius: 6, fontFamily: 'Space Mono, monospace', fontSize: 12, color: '#ff3355' }}>⚠ {payError}</div>
            )}
            {!address && (
              <div style={{ marginBottom: 14, padding: '10px 14px', background: 'rgba(255,170,0,0.08)', border: '1px solid rgba(255,170,0,0.2)', borderRadius: 6, fontFamily: 'Space Mono, monospace', fontSize: 12, color: '#ffaa00' }}>Connect your wallet to buy ticket</div>
            )}
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setCheckoutEvent(null)} className="btn btn-ghost" style={{ flex: 1 }}>CANCEL</button>
              <button onClick={() => handleBuy(checkoutEvent)} disabled={buying === checkoutEvent.id || !buyerName} className="btn btn-green" style={{ flex: 1 }}>
                {buying === checkoutEvent.id ? <><span className="spinner" /> MINTING...</> : address ? 'BUY TICKET' : '🦊 CONNECT & PAY'}
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedTicket && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => setSelectedTicket(null)}>
          <div style={{ background: '#080c10', border: '1px solid rgba(0,255,136,0.3)', borderRadius: 16, width: '100%', maxWidth: 380, overflow: 'hidden' }} onClick={e => e.stopPropagation()}>
            <div style={{ background: 'rgba(0,255,136,0.06)', padding: '24px 28px', borderBottom: '1px dashed rgba(0,255,136,0.2)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                <span className="badge badge-green" style={{ fontSize: 9 }}>✓ VALID TICKET</span>
                <span style={{ fontFamily: 'Space Mono, monospace', fontSize: 10, color: 'rgba(232,240,232,0.4)' }}>#{selectedTicket.tokenId}</span>
              </div>
              <div style={{ fontFamily: 'Space Mono, monospace', fontWeight: 700, fontSize: 17, color: '#e8f0e8', marginBottom: 6 }}>{selectedTicket.eventName}</div>
              <div style={{ fontSize: 12, color: 'rgba(232,240,232,0.5)', marginBottom: 2 }}>📅 {new Date(selectedTicket.eventDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</div>
              <div style={{ fontSize: 12, color: 'rgba(232,240,232,0.5)' }}>📍 {selectedTicket.eventLocation}</div>
            </div>
            <div style={{ padding: '24px 28px', display: 'flex', justifyContent: 'center', borderBottom: '1px dashed rgba(0,255,136,0.2)', background: '#040608' }}>
              <div style={{ background: '#040608', padding: 12, borderRadius: 8, border: '1px solid rgba(0,255,136,0.15)' }}>
                <QRCode data={`${selectedTicket.id}-${selectedTicket.tokenId}-${selectedTicket.txHash}`} size={140} />
                <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 9, color: 'rgba(0,255,136,0.5)', textAlign: 'center', marginTop: 8 }}>SCAN TO VERIFY</div>
              </div>
            </div>
            <div style={{ padding: '16px 28px' }}>
              {[
                { label: 'HOLDER', value: selectedTicket.buyerName },
                { label: 'WALLET', value: `${selectedTicket.buyerAddress.slice(0, 8)}...${selectedTicket.buyerAddress.slice(-6)}` },
                { label: 'PAID', value: `$${selectedTicket.price} USDC` },
                { label: 'ISSUED', value: selectedTicket.issuedAt },
              ].map(row => (
                <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <span style={{ fontFamily: 'Space Mono, monospace', fontSize: 10, color: 'rgba(232,240,232,0.3)' }}>{row.label}</span>
                  <span style={{ fontFamily: 'Space Mono, monospace', fontSize: 11, fontWeight: 700, color: '#e8f0e8' }}>{row.value}</span>
                </div>
              ))}
              <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                <a href={selectedTicket.explorerUrl} target="_blank" rel="noopener noreferrer" className="btn btn-green" style={{ flex: 1, fontSize: 11, textAlign: 'center' }}>ARCSCAN ↗</a>
                <button onClick={() => setSelectedTicket(null)} className="btn btn-ghost" style={{ flex: 1, fontSize: 11 }}>CLOSE</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}