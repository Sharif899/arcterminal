'use client';
import { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { useWallet } from '@/context/WalletContext';
import WalletConnector from '@/components/WalletConnector';
import { arcSend } from '@/lib/arc';

interface Event {
  id: string;
  name: string;
  description: string;
  date: string;
  time: string;
  location: string;
  category: string;
  price: number;
  totalTickets: number;
  sold: number;
  walletAddress: string;
  createdAt: string;
  image: string;
}

interface Ticket {
  id: string;
  eventId: string;
  eventName: string;
  eventDate: string;
  eventTime: string;
  eventLocation: string;
  amount: number;
  buyerAddress: string;
  txHash: string;
  purchasedAt: string;
  status: 'confirmed';
  qrData: string;
}

function shortId() {
  return Math.random().toString(36).substring(2, 10).toUpperCase();
}

const CATEGORIES = ['Conference', 'Concert', 'Hackathon', 'Workshop', 'Meetup', 'NFT Drop', 'Webinar', 'Sports'];
const EMOJI_MAP: Record<string, string> = {
  Conference: '🎤', Concert: '🎵', Hackathon: '💻', Workshop: '🛠',
  Meetup: '🤝', 'NFT Drop': '🎨', Webinar: '📡', Sports: '🏆',
};

const DEMO_EVENTS: Event[] = [
  {
    id: shortId(), name: 'Arc Developer Summit 2025', description: 'The biggest Web3 developer conference on Arc Network. Talks, workshops, and networking.',
    date: '2025-09-15', time: '09:00', location: 'Lagos, Nigeria', category: 'Conference',
    price: 49, totalTickets: 500, sold: 187,
    walletAddress: '0x1234567890abcdef1234567890abcdef12345678',
    createdAt: new Date().toLocaleDateString(), image: '🎤',
  },
  {
    id: shortId(), name: 'USDC Hackathon — Build on Arc', description: '48-hour hackathon. $50,000 USDC prize pool. Build the future of DeFi on Arc.',
    date: '2025-08-02', time: '08:00', location: 'Nairobi, Kenya', category: 'Hackathon',
    price: 0, totalTickets: 200, sold: 143,
    walletAddress: '0x1234567890abcdef1234567890abcdef12345678',
    createdAt: new Date().toLocaleDateString(), image: '💻',
  },
  {
    id: shortId(), name: 'DeFi & Stablecoins Meetup', description: 'Monthly community meetup for DeFi builders, investors, and enthusiasts.',
    date: '2025-07-20', time: '18:00', location: 'Accra, Ghana', category: 'Meetup',
    price: 5, totalTickets: 100, sold: 61,
    walletAddress: '0x1234567890abcdef1234567890abcdef12345678',
    createdAt: new Date().toLocaleDateString(), image: '🤝',
  },
];

export default function TicketsPage() {
  const { address } = useWallet();

  const [view, setView] = useState<'events' | 'mytickets' | 'manage'>('events');
  const [events, setEvents] = useState<Event[]>(DEMO_EVENTS);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [buying, setBuying] = useState<string | null>(null);
  const [checkoutEvent, setCheckoutEvent] = useState<Event | null>(null);
  const [txResult, setTxResult] = useState<{ hash: string; event: string; ticketId: string } | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [filterCategory, setFilterCategory] = useState('ALL');
  const [addError, setAddError] = useState('');
  const [buyError, setBuyError] = useState('');
  const [newEvent, setNewEvent] = useState({
    name: '', description: '', date: '', time: '', location: '',
    category: 'Conference', price: '', totalTickets: '', walletAddress: '',
  });

  async function generateQR(data: string): Promise<string> {
    try {
      return await QRCode.toDataURL(data, {
        width: 200, margin: 2,
        color: { dark: '#00ff88', light: '#040608' },
      });
    } catch { return ''; }
  }

  useEffect(() => {
    if (selectedTicket) {
      generateQR(selectedTicket.qrData).then(setQrDataUrl);
    }
  }, [selectedTicket]);

  function addEvent() {
    setAddError('');
    if (!newEvent.name) return setAddError('Event name required');
    if (!newEvent.date) return setAddError('Event date required');
    if (!newEvent.location) return setAddError('Location required');
    if (!newEvent.totalTickets || parseInt(newEvent.totalTickets) <= 0) return setAddError('Valid ticket count required');
    if (parseFloat(newEvent.price || '0') < 0) return setAddError('Price cannot be negative');
    if (!newEvent.walletAddress || !/^0x[a-fA-F0-9]{40}$/.test(newEvent.walletAddress)) return setAddError('Valid wallet address required');
    const event: Event = {
      id: shortId(), name: newEvent.name, description: newEvent.description,
      date: newEvent.date, time: newEvent.time || '00:00', location: newEvent.location,
      category: newEvent.category, price: parseFloat(newEvent.price || '0'),
      totalTickets: parseInt(newEvent.totalTickets), sold: 0,
      walletAddress: newEvent.walletAddress, createdAt: new Date().toLocaleDateString(),
      image: EMOJI_MAP[newEvent.category] || '🎤',
    };
    setEvents(prev => [event, ...prev]);
    setNewEvent({ name: '', description: '', date: '', time: '', location: '', category: 'Conference', price: '', totalTickets: '', walletAddress: '' });
    setShowAddForm(false);
  }

  function removeEvent(id: string) {
    setEvents(prev => prev.filter(e => e.id !== id));
  }

  async function handleBuy(event: Event) {
    if (!address) return;
    setBuying(event.id);
    setBuyError('');
    try {
      let txHash = '';
      if (event.price > 0) {
        const res = await arcSend(event.walletAddress, event.price.toString(), 'USDC');
        txHash = res.txHash;
      } else {
        txHash = '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
      }
      const ticketId = shortId();
      const qrData = JSON.stringify({ ticketId, event: event.name, buyer: address, tx: txHash, date: event.date });
      setEvents(prev => prev.map(e => e.id === event.id ? { ...e, sold: e.sold + 1 } : e));
      setTickets(prev => [{
        id: ticketId, eventId: event.id, eventName: event.name,
        eventDate: event.date, eventTime: event.time, eventLocation: event.location,
        amount: event.price, buyerAddress: address, txHash,
        purchasedAt: new Date().toLocaleString(), status: 'confirmed', qrData,
      }, ...prev]);
      setTxResult({ hash: txHash, event: event.name, ticketId });
      setCheckoutEvent(null);
    } catch (e: unknown) {
      setBuyError(e instanceof Error ? e.message : 'Payment failed');
    } finally {
      setBuying(null);
    }
  }

  const filteredEvents = filterCategory === 'ALL' ? events : events.filter(e => e.category === filterCategory);
  const allCategories = ['ALL', ...Array.from(new Set(events.map(e => e.category)))];

  function formatDate(d: string) {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  }

  const totalRevenue = tickets.reduce((s, t) => s + t.amount, 0);
  const availableEvents = events.filter(e => e.sold < e.totalTickets).length;

  if (!address) {
    return (
      <div style={{ minHeight: 'calc(100vh - 84px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
        <div className="panel" style={{ maxWidth: 420, width: '100%', padding: '48px 36px', textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 20 }}>🎟</div>
          <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 10, color: 'rgba(232,240,232,0.3)', letterSpacing: '0.2em', marginBottom: 10 }}>ARC TERMINAL · TICKETS</div>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: '#e8f0e8', marginBottom: 12, letterSpacing: '-0.02em' }}>Wallet Required</h2>
          <p style={{ fontSize: 13, color: 'rgba(232,240,232,0.4)', lineHeight: 1.7, marginBottom: 32 }}>
            Connect your wallet to browse events, buy tickets, and manage your own events.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <WalletConnector />
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <style>{`
        .events-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 24px; }
        .event-card { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.07); border-radius: 8px; overflow: hidden; transition: all 0.2s; cursor: pointer; }
        .event-card:hover { border-color: rgba(0,255,136,0.2); transform: translateY(-2px); box-shadow: 0 8px 32px rgba(0,0,0,0.4); }
        .tickets-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; }
        .ticket-card { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.07); border-radius: 8px; overflow: hidden; cursor: pointer; transition: all 0.2s; }
        .ticket-card:hover { border-color: rgba(0,255,136,0.2); transform: translateY(-2px); }
        .ticket-stub { border-top: 1px dashed rgba(255,255,255,0.1); margin: 0 16px; }
        .events-layout { display: grid; grid-template-columns: 1fr 300px; gap: 20px; align-items: start; }
        .progress-bar-bg { height: 4px; background: rgba(255,255,255,0.06); border-radius: 2px; overflow: hidden; margin-top: 8px; }
        .progress-bar-fill { height: 100%; border-radius: 2px; background: linear-gradient(90deg, #00ff88, #00aaff); transition: width 0.5s ease; }
        .filter-tabs { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 20px; }
        .filter-tab { padding: 5px 12px; border-radius: 4px; font-family: 'Space Mono', monospace; font-size: 10px; font-weight: 700; letter-spacing: 0.08em; cursor: pointer; border: 1px solid rgba(255,255,255,0.07); background: rgba(255,255,255,0.03); color: rgba(232,240,232,0.4); transition: all 0.15s; }
        .filter-tab:hover { color: rgba(232,240,232,0.7); border-color: rgba(255,255,255,0.12); }
        .filter-tab.active { background: rgba(0,255,136,0.1); color: #00ff88; border-color: rgba(0,255,136,0.25); }
        .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.75); backdrop-filter: blur(4px); z-index: 200; display: flex; align-items: center; justify-content: center; padding: 20px; }
        .modal { background: #080c10; border: 1px solid rgba(0,255,136,0.2); border-radius: 12px; padding: 28px; width: 100%; max-width: 460px; max-height: 90vh; overflow-y: auto; }
        .qr-modal { max-width: 360px; text-align: center; }
        .sold-out-overlay { position: absolute; inset: 0; background: rgba(4,6,8,0.7); display: flex; align-items: center; justify-content: center; font-family: 'Space Mono', monospace; font-size: 13px; font-weight: 700; color: #ff3355; letter-spacing: 0.1em; }
        @media (max-width: 1024px) { .events-layout { grid-template-columns: 1fr; } }
        @media (max-width: 768px) { .events-grid { grid-template-columns: repeat(2, 1fr); } .tickets-grid { grid-template-columns: 1fr; } }
        @media (max-width: 480px) { .events-grid { grid-template-columns: 1fr; } .tickets-page { padding: 16px 16px 60px !important; } .stats-row { grid-template-columns: repeat(2, 1fr) !important; } .form-row-2 { grid-template-columns: 1fr !important; } }
      `}</style>

      <div className="tickets-page" style={{ padding: '24px 24px 60px', maxWidth: 1200, margin: '0 auto', position: 'relative', zIndex: 1 }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 10, color: 'rgba(232,240,232,0.3)', letterSpacing: '0.2em', marginBottom: 6 }}>ARC TERMINAL · TICKETS</div>
            <h1 style={{ fontSize: 28, fontWeight: 700, color: '#e8f0e8', letterSpacing: '-0.02em', marginBottom: 4 }}>Tickets</h1>
            <p style={{ fontSize: 13, color: 'rgba(232,240,232,0.4)' }}>Create events, sell tickets, collect USDC payments on Arc</p>
            <div style={{ marginTop: 10, display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 6, background: 'rgba(0,255,136,0.06)', border: '1px solid rgba(0,255,136,0.15)' }}>
              <span className="live-dot" style={{ width: 5, height: 5 }} />
              <span style={{ fontFamily: 'Space Mono, monospace', fontSize: 10, color: '#00ff88' }}>{address.slice(0, 6)}…{address.slice(-4)}</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button onClick={() => setView('events')} className={view === 'events' ? 'btn btn-green' : 'btn btn-ghost'} style={{ fontSize: 11 }}>🎟 EVENTS</button>
            <button onClick={() => setView('mytickets')} className={view === 'mytickets' ? 'btn btn-green' : 'btn btn-ghost'} style={{ fontSize: 11 }}>
              🎫 MY TICKETS {tickets.length > 0 && <span style={{ background: 'rgba(0,255,136,0.2)', borderRadius: 4, padding: '1px 6px', fontSize: 10 }}>{tickets.length}</span>}
            </button>
            <button onClick={() => setView('manage')} className={view === 'manage' ? 'btn btn-green' : 'btn btn-ghost'} style={{ fontSize: 11 }}>⚙ MANAGE</button>
          </div>
        </div>

        {/* Stats */}
        <div className="stats-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
          {[
            { label: 'TOTAL EVENTS', value: events.length, color: '#00aaff' },
            { label: 'AVAILABLE', value: availableEvents, color: '#00ff88' },
            { label: 'REVENUE (USDC)', value: `$${totalRevenue.toLocaleString()}`, color: '#00ff88' },
            { label: 'MY TICKETS', value: tickets.length, color: '#ffaa00' },
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
              <div style={{ fontFamily: 'Space Mono, monospace', fontWeight: 700, fontSize: 13, color: '#00ff88', marginBottom: 4 }}>✓ Ticket confirmed — {txResult.event}</div>
              <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 10, color: 'rgba(232,240,232,0.4)' }}>Ticket ID: {txResult.ticketId} · {txResult.hash.slice(0, 20)}...</div>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button onClick={() => { setView('mytickets'); setTxResult(null); }} className="btn btn-green" style={{ fontSize: 11 }}>VIEW TICKET 🎫</button>
              <a href={`https://testnet.arcscan.app/tx/${txResult.hash}`} target="_blank" rel="noopener noreferrer" className="btn btn-blue" style={{ fontSize: 11 }}>ARCSCAN ↗</a>
              <button onClick={() => setTxResult(null)} className="btn btn-ghost" style={{ fontSize: 11 }}>DISMISS</button>
            </div>
          </div>
        )}

        {/* EVENTS VIEW */}
        {view === 'events' && (
          <div className="events-layout">
            <div>
              <div className="filter-tabs">
                {allCategories.map(cat => (
                  <button key={cat} className={`filter-tab ${filterCategory === cat ? 'active' : ''}`} onClick={() => setFilterCategory(cat)}>
                    {cat !== 'ALL' && EMOJI_MAP[cat] ? `${EMOJI_MAP[cat]} ` : ''}{cat}
                  </button>
                ))}
              </div>
              {filteredEvents.length === 0 ? (
                <div style={{ padding: '48px 24px', textAlign: 'center', fontFamily: 'Space Mono, monospace', fontSize: 12, color: 'rgba(232,240,232,0.25)' }}>No events in this category</div>
              ) : (
                <div className="events-grid">
                  {filteredEvents.map(event => {
                    const soldOut = event.sold >= event.totalTickets;
                    const pct = Math.round((event.sold / event.totalTickets) * 100);
                    return (
                      <div key={event.id} className="event-card" style={{ position: 'relative' }} onClick={() => !soldOut && setCheckoutEvent(event)}>
                        {soldOut && <div className="sold-out-overlay">SOLD OUT</div>}
                        <div style={{ padding: '28px 20px 20px', textAlign: 'center', background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                          <div style={{ fontSize: 44, marginBottom: 10 }}>{event.image}</div>
                          <span className="badge badge-blue" style={{ fontSize: 9 }}>{event.category}</span>
                        </div>
                        <div style={{ padding: '16px 18px 20px' }}>
                          <div style={{ fontFamily: 'Space Mono, monospace', fontWeight: 700, fontSize: 13, color: '#e8f0e8', marginBottom: 8, lineHeight: 1.4 }}>{event.name}</div>
                          <div style={{ fontSize: 12, color: 'rgba(232,240,232,0.4)', lineHeight: 1.5, marginBottom: 14 }}>{event.description}</div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 14 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <span style={{ fontSize: 11 }}>📅</span>
                              <span style={{ fontFamily: 'Space Mono, monospace', fontSize: 10, color: 'rgba(232,240,232,0.5)' }}>{formatDate(event.date)} · {event.time}</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <span style={{ fontSize: 11 }}>📍</span>
                              <span style={{ fontFamily: 'Space Mono, monospace', fontSize: 10, color: 'rgba(232,240,232,0.5)' }}>{event.location}</span>
                            </div>
                          </div>
                          <div style={{ marginBottom: 14 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span style={{ fontFamily: 'Space Mono, monospace', fontSize: 9, color: 'rgba(232,240,232,0.3)', letterSpacing: '0.1em' }}>CAPACITY</span>
                              <span style={{ fontFamily: 'Space Mono, monospace', fontSize: 9, color: pct > 80 ? '#ffaa00' : 'rgba(232,240,232,0.3)' }}>{event.sold}/{event.totalTickets} · {pct}%</span>
                            </div>
                            <div className="progress-bar-bg">
                              <div className="progress-bar-fill" style={{ width: `${pct}%`, background: pct > 80 ? 'linear-gradient(90deg, #ffaa00, #ff3355)' : undefined }} />
                            </div>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                            <span style={{ fontFamily: 'Space Mono, monospace', fontWeight: 700, fontSize: 18, color: '#00ff88' }}>{event.price === 0 ? 'FREE' : `$${event.price} USDC`}</span>
                            <span style={{ fontFamily: 'Space Mono, monospace', fontSize: 10, color: 'rgba(232,240,232,0.3)' }}>{event.totalTickets - event.sold} left</span>
                          </div>
                          <button disabled={soldOut} className={soldOut ? 'btn btn-ghost' : 'btn btn-green'} style={{ width: '100%', fontSize: 12 }}
                            onClick={e => { e.stopPropagation(); if (!soldOut) { setCheckoutEvent(event); setBuyError(''); } }}>
                            {soldOut ? 'SOLD OUT' : event.price === 0 ? 'REGISTER FREE' : 'BUY TICKET'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Recent tickets sidebar */}
            <div className="panel">
              <div className="panel-header">
                <div className="panel-title">RECENT SALES</div>
                <span style={{ fontFamily: 'Space Mono, monospace', fontSize: 10, color: 'rgba(232,240,232,0.3)' }}>{tickets.length}</span>
              </div>
              {tickets.length === 0 ? (
                <div style={{ padding: 24, textAlign: 'center', fontFamily: 'Space Mono, monospace', fontSize: 11, color: 'rgba(232,240,232,0.25)' }}>No ticket sales yet</div>
              ) : tickets.map(ticket => (
                <div key={ticket.id} style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.04)', cursor: 'pointer' }} onClick={() => setSelectedTicket(ticket)}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                    <span style={{ fontFamily: 'Space Mono, monospace', fontSize: 11, fontWeight: 700, color: '#e8f0e8' }}>{ticket.eventName.length > 18 ? ticket.eventName.slice(0, 18) + '…' : ticket.eventName}</span>
                    <span style={{ fontFamily: 'Space Mono, monospace', fontSize: 12, color: '#00ff88', fontWeight: 700 }}>{ticket.amount === 0 ? 'FREE' : `$${ticket.amount}`}</span>
                  </div>
                  <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 10, color: 'rgba(232,240,232,0.3)', marginBottom: 3 }}>#{ticket.id} · {ticket.purchasedAt.slice(0, 10)}</div>
                  <a href={`https://testnet.arcscan.app/tx/${ticket.txHash}`} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
                    style={{ fontFamily: 'Space Mono, monospace', fontSize: 10, color: '#00aaff', textDecoration: 'none' }}>
                    {ticket.txHash.slice(0, 14)}... ↗
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* MY TICKETS VIEW */}
        {view === 'mytickets' && (
          <div>
            {tickets.length === 0 ? (
              <div style={{ padding: '64px 24px', textAlign: 'center' }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>🎫</div>
                <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 13, color: 'rgba(232,240,232,0.35)', marginBottom: 20 }}>No tickets yet. Buy your first ticket above.</div>
                <button onClick={() => setView('events')} className="btn btn-green" style={{ fontSize: 12 }}>BROWSE EVENTS</button>
              </div>
            ) : (
              <div className="tickets-grid">
                {tickets.map(ticket => (
                  <div key={ticket.id} className="ticket-card" onClick={() => setSelectedTicket(ticket)}>
                    <div style={{ padding: '16px 18px 12px', background: 'rgba(0,255,136,0.04)', borderBottom: '1px solid rgba(0,255,136,0.08)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                        <span className="badge badge-green" style={{ fontSize: 9 }}>✓ CONFIRMED</span>
                        <span style={{ fontFamily: 'Space Mono, monospace', fontSize: 10, color: 'rgba(232,240,232,0.3)' }}>#{ticket.id}</span>
                      </div>
                      <div style={{ fontFamily: 'Space Mono, monospace', fontWeight: 700, fontSize: 14, color: '#e8f0e8', lineHeight: 1.3 }}>{ticket.eventName}</div>
                    </div>
                    <div style={{ padding: '14px 18px' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
                        {[
                          { label: 'DATE', value: formatDate(ticket.eventDate) },
                          { label: 'TIME', value: ticket.eventTime },
                          { label: 'LOCATION', value: ticket.eventLocation },
                          { label: 'PAID', value: ticket.amount === 0 ? 'FREE' : `$${ticket.amount} USDC` },
                        ].map(row => (
                          <div key={row.label}>
                            <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 9, color: 'rgba(232,240,232,0.3)', letterSpacing: '0.1em', marginBottom: 3 }}>{row.label}</div>
                            <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 11, color: row.label === 'PAID' ? '#00ff88' : '#e8f0e8', fontWeight: row.label === 'PAID' ? 700 : 400 }}>{row.value}</div>
                          </div>
                        ))}
                      </div>
                      <div className="ticket-stub" style={{ padding: '10px 0 0' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <a href={`https://testnet.arcscan.app/tx/${ticket.txHash}`} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
                            style={{ fontFamily: 'Space Mono, monospace', fontSize: 10, color: '#00aaff', textDecoration: 'none' }}>
                            {ticket.txHash.slice(0, 16)}... ↗
                          </a>
                          <span style={{ fontFamily: 'Space Mono, monospace', fontSize: 10, color: 'rgba(232,240,232,0.3)' }}>TAP FOR QR 📲</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* MANAGE VIEW */}
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
                <div className="form-row-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                  <div><label className="label">EVENT NAME</label><input className="input" placeholder="My Awesome Event" value={newEvent.name} onChange={e => setNewEvent(p => ({ ...p, name: e.target.value }))} /></div>
                  <div><label className="label">CATEGORY</label>
                    <select className="select" value={newEvent.category} onChange={e => setNewEvent(p => ({ ...p, category: e.target.value }))}>
                      {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>
                <div style={{ marginBottom: 12 }}><label className="label">DESCRIPTION</label><input className="input" placeholder="Tell people about your event..." value={newEvent.description} onChange={e => setNewEvent(p => ({ ...p, description: e.target.value }))} /></div>
                <div className="form-row-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                  <div><label className="label">DATE</label><input className="input" type="date" value={newEvent.date} onChange={e => setNewEvent(p => ({ ...p, date: e.target.value }))} /></div>
                  <div><label className="label">TIME</label><input className="input" type="time" value={newEvent.time} onChange={e => setNewEvent(p => ({ ...p, time: e.target.value }))} /></div>
                </div>
                <div style={{ marginBottom: 12 }}><label className="label">LOCATION</label><input className="input" placeholder="Lagos, Nigeria" value={newEvent.location} onChange={e => setNewEvent(p => ({ ...p, location: e.target.value }))} /></div>
                <div className="form-row-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                  <div><label className="label">TICKET PRICE (USDC · 0 = FREE)</label><input className="input" type="number" placeholder="0" value={newEvent.price} onChange={e => setNewEvent(p => ({ ...p, price: e.target.value }))} /></div>
                  <div><label className="label">TOTAL TICKETS</label><input className="input" type="number" placeholder="100" value={newEvent.totalTickets} onChange={e => setNewEvent(p => ({ ...p, totalTickets: e.target.value }))} /></div>
                </div>
                <div style={{ marginBottom: 12 }}><label className="label">YOUR WALLET ADDRESS (receives USDC)</label><input className="input" placeholder="0x..." value={newEvent.walletAddress} onChange={e => setNewEvent(p => ({ ...p, walletAddress: e.target.value }))} /></div>
                {addError && <div style={{ color: '#ff3355', fontFamily: 'Space Mono, monospace', fontSize: 11, marginBottom: 10 }}>⚠ {addError}</div>}
                <button onClick={addEvent} className="btn btn-green" style={{ fontSize: 12 }}>CREATE EVENT</button>
              </div>
            )}
            <div>
              {events.length === 0 && <div style={{ padding: 32, textAlign: 'center', fontFamily: 'Space Mono, monospace', fontSize: 11, color: 'rgba(232,240,232,0.25)' }}>No events yet.</div>}
              {events.map(event => {
                const pct = Math.round((event.sold / event.totalTickets) * 100);
                return (
                  <div key={event.id} style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.04)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14, flex: 1, minWidth: 0 }}>
                      <span style={{ fontSize: 28 }}>{event.image}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontFamily: 'Space Mono, monospace', fontWeight: 700, fontSize: 13, color: '#e8f0e8', marginBottom: 2 }}>{event.name}</div>
                        <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 10, color: 'rgba(232,240,232,0.3)', marginBottom: 6 }}>{event.category} · {formatDate(event.date)} · {event.location}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ flex: 1, maxWidth: 120 }}><div className="progress-bar-bg" style={{ marginTop: 0 }}><div className="progress-bar-fill" style={{ width: `${pct}%` }} /></div></div>
                          <span style={{ fontFamily: 'Space Mono, monospace', fontSize: 9, color: 'rgba(232,240,232,0.3)' }}>{event.sold}/{event.totalTickets} sold</span>
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontFamily: 'Space Mono, monospace', fontWeight: 700, fontSize: 14, color: '#00ff88' }}>{event.price === 0 ? 'FREE' : `$${event.price} USDC`}</span>
                      <button onClick={() => removeEvent(event.id)} className="btn btn-ghost" style={{ fontSize: 10, padding: '5px 10px', color: '#ff3355' }}>DELETE</button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* CHECKOUT MODAL */}
        {checkoutEvent && (
          <div className="modal-overlay" onClick={() => setCheckoutEvent(null)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <div style={{ textAlign: 'center', marginBottom: 20 }}>
                <div style={{ fontSize: 44, marginBottom: 8 }}>{checkoutEvent.image}</div>
                <div style={{ fontFamily: 'Space Mono, monospace', fontWeight: 700, fontSize: 15, color: '#e8f0e8', marginBottom: 6, lineHeight: 1.3 }}>{checkoutEvent.name}</div>
                <div style={{ fontFamily: 'Space Mono, monospace', fontWeight: 700, fontSize: 26, color: '#00ff88' }}>{checkoutEvent.price === 0 ? 'FREE' : `$${checkoutEvent.price} USDC`}</div>
              </div>
              {[
                { label: 'DATE', value: `${formatDate(checkoutEvent.date)} · ${checkoutEvent.time}` },
                { label: 'LOCATION', value: checkoutEvent.location },
                { label: 'ORGANIZER', value: `${checkoutEvent.walletAddress.slice(0, 10)}...${checkoutEvent.walletAddress.slice(-8)}` },
                { label: 'BUYER', value: `${address.slice(0, 10)}...${address.slice(-8)}` },
                { label: 'NETWORK', value: 'Arc Testnet' },
                { label: 'GAS FEE', value: '~$0.01 USDC' },
                { label: 'FINALITY', value: '< 1 second' },
                { label: 'AVAILABILITY', value: `${checkoutEvent.totalTickets - checkoutEvent.sold} tickets left` },
              ].map(row => (
                <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <span style={{ fontFamily: 'Space Mono, monospace', fontSize: 10, color: 'rgba(232,240,232,0.35)' }}>{row.label}</span>
                  <span style={{ fontFamily: 'Space Mono, monospace', fontSize: 11, fontWeight: 700, color: '#e8f0e8', textAlign: 'right', maxWidth: 220, wordBreak: 'break-all' }}>{row.value}</span>
                </div>
              ))}
              {buyError && (
                <div style={{ marginTop: 12, padding: '10px 14px', borderRadius: 6, background: 'rgba(255,51,85,0.08)', border: '1px solid rgba(255,51,85,0.2)', fontFamily: 'Space Mono, monospace', fontSize: 11, color: '#ff3355' }}>
                  ✗ {buyError}
                </div>
              )}
              <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                <button onClick={() => setCheckoutEvent(null)} className="btn btn-ghost" style={{ flex: 1 }}>CANCEL</button>
                <button onClick={() => handleBuy(checkoutEvent)} disabled={buying === checkoutEvent.id} className="btn btn-green" style={{ flex: 1 }}>
                  {buying === checkoutEvent.id ? <><span className="spinner" /> PROCESSING...</> : checkoutEvent.price === 0 ? 'REGISTER NOW' : 'PAY & GET TICKET'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* QR TICKET MODAL */}
        {selectedTicket && (
          <div className="modal-overlay" onClick={() => { setSelectedTicket(null); setQrDataUrl(''); }}>
            <div className="modal qr-modal" onClick={e => e.stopPropagation()}>
              <div style={{ marginBottom: 16 }}><span className="badge badge-green" style={{ fontSize: 9 }}>✓ VALID TICKET</span></div>
              <div style={{ fontFamily: 'Space Mono, monospace', fontWeight: 700, fontSize: 15, color: '#e8f0e8', marginBottom: 4, lineHeight: 1.3 }}>{selectedTicket.eventName}</div>
              <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 10, color: 'rgba(232,240,232,0.4)', marginBottom: 20 }}>
                {formatDate(selectedTicket.eventDate)} · {selectedTicket.eventTime} · {selectedTicket.eventLocation}
              </div>
              <div style={{ background: '#040608', border: '1px solid rgba(0,255,136,0.15)', borderRadius: 10, padding: 20, marginBottom: 20, display: 'inline-block' }}>
                {qrDataUrl ? (
                  <img src={qrDataUrl} alt="QR Code" style={{ width: 180, height: 180, display: 'block' }} />
                ) : (
                  <div style={{ width: 180, height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span className="spinner" style={{ width: 24, height: 24 }} />
                  </div>
                )}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 20, textAlign: 'left' }}>
                {[
                  { label: 'TICKET ID', value: `#${selectedTicket.id}` },
                  { label: 'PAID', value: selectedTicket.amount === 0 ? 'FREE' : `$${selectedTicket.amount} USDC` },
                  { label: 'BUYER', value: `${selectedTicket.buyerAddress.slice(0, 8)}...` },
                  { label: 'PURCHASED', value: selectedTicket.purchasedAt.slice(0, 10) },
                ].map(row => (
                  <div key={row.label} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 6, padding: '8px 10px' }}>
                    <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 9, color: 'rgba(232,240,232,0.3)', letterSpacing: '0.1em', marginBottom: 3 }}>{row.label}</div>
                    <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 11, fontWeight: 700, color: '#e8f0e8' }}>{row.value}</div>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <a href={`https://testnet.arcscan.app/tx/${selectedTicket.txHash}`} target="_blank" rel="noopener noreferrer" className="btn btn-blue" style={{ flex: 1, fontSize: 11 }}>ARCSCAN ↗</a>
                <button onClick={() => { setSelectedTicket(null); setQrDataUrl(''); }} className="btn btn-ghost" style={{ flex: 1, fontSize: 11 }}>CLOSE</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}