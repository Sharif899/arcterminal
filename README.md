# Arc Terminal — DeFi Trading Dashboard

A professional 6-page DeFi terminal for Arc Network. Send USDC, swap EURC, bridge across chains — all powered by the official Arc SDK.

**Stack:** Next.js 14 + Supabase + `@circle-fin/app-kit` + Vercel

---

## Pages

| Page | Route | Description |
|---|---|---|
| Landing | `/` | Live network stats, hero, feature overview |
| Terminal | `/terminal` | Send / Swap / Bridge with real Arc SDK calls |
| Portfolio | `/portfolio` | Wallet balances, allocation chart, recent txs |
| History | `/history` | Full tx log with filters, saved to Supabase |
| Markets | `/markets` | Live block data, chain comparison, token info |
| Docs | `/docs` | Copy-paste Arc SDK code examples |

---

## Arc SDK Methods Used

```typescript
import { AppKit } from "@circle-fin/app-kit";
import { createViemAdapterFromProvider } from "@circle-fin/adapter-viem-v2";

const kit = new AppKit();
const adapter = await createViemAdapterFromProvider({ provider: window.ethereum });

// Send USDC or EURC
await kit.send({ from: { adapter, chain: "Arc_Testnet" }, to, amount, token: "USDC" });

// Swap USDC ↔ EURC (requires kitKey from console.circle.com)
await kit.swap({ from: { adapter, chain: "Arc_Testnet" }, tokenIn: "USDC", tokenOut: "EURC", amountIn, config: { kitKey } });

// Bridge across chains via CCTP
await kit.bridge({ from: { adapter, chain: "Ethereum_Sepolia" }, to: { adapter, chain: "Arc_Testnet" }, amount });
```

---

## Step 1 — Supabase Setup

1. Go to **https://supabase.com** → New Project
2. Open **SQL Editor** and run:

```sql
create table transactions (
  id uuid default gen_random_uuid() primary key,
  wallet text not null,
  type text not null,
  token_in text not null,
  token_out text not null,
  amount text not null,
  from_chain text not null,
  to_chain text not null,
  to_address text not null,
  tx_hash text not null,
  explorer_url text not null,
  status text not null default 'success',
  created_at timestamptz default now()
);

alter table transactions enable row level security;
create policy "Public read" on transactions for select using (true);
create policy "Public insert" on transactions for insert with check (true);
create index on transactions (wallet);
create index on transactions (created_at desc);
```

3. Go to **Settings → API** → copy URL and anon key

---

## Step 2 — Environment Variables

Create `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

---

## Step 3 — Run Locally

```bash
npm install
npm run dev
```

Open **http://localhost:3000**

---

## Step 4 — MetaMask Setup

Add Arc Testnet to MetaMask (the app does this automatically when you connect):
- **RPC:** https://rpc.testnet.arc.network
- **Chain ID:** 1657
- **Currency:** USDC
- **Explorer:** https://testnet.arcscan.app

Get testnet USDC: **https://faucet.circle.com** → select Arc Testnet

---

## Step 5 — For Swap Feature

The swap feature (`kit.swap()`) requires a Circle Kit Key:
1. Go to **https://console.circle.com**
2. Create a project
3. Copy your API key
4. Enter it in the Swap tab of the terminal

---

## Step 6 — Deploy to Vercel

```bash
npm i -g vercel
vercel
```

Add env vars when prompted:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

---

## Arc Network

| | |
|---|---|
| Chain ID | 1657 |
| RPC | https://rpc.testnet.arc.network |
| Explorer | https://testnet.arcscan.app |
| USDC | 0x3600000000000000000000000000000000000000 |
| EURC | 0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a |
| Gas | ~$0.000006 in USDC |
| Finality | < 0.5 seconds |
