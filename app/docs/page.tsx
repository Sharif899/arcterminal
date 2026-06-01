'use client';
import { useState } from 'react';

function Code({ code, lang = 'typescript' }: { code: string; lang?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div style={{ position: 'relative', marginBottom: 24 }}>
      <div style={{ background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(0,255,136,0.1)', borderRadius: 8, overflow: 'hidden' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(0,255,136,0.03)' }}>
          <span style={{ fontFamily: 'Space Mono, monospace', fontSize: 10, color: 'rgba(232,240,232,0.25)', letterSpacing: '0.1em' }}>{lang}</span>
          <button onClick={() => { navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Space Mono, monospace', fontSize: 10, color: copied ? '#00ff88' : 'rgba(232,240,232,0.3)', transition: 'color 0.2s' }}>
            {copied ? '✓ COPIED' : 'COPY'}
          </button>
        </div>
        <pre style={{ padding: '20px', overflowX: 'auto', margin: 0 }}>
          <code style={{ fontFamily: 'Space Mono, monospace', fontSize: 12, color: '#e8f0e8', lineHeight: 1.8 }}>
            {code}
          </code>
        </pre>
      </div>
    </div>
  );
}

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} style={{ marginBottom: 56, scrollMarginTop: 100 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, paddingBottom: 14, borderBottom: '1px solid rgba(0,255,136,0.1)' }}>
        <div style={{ width: 3, height: 18, background: '#00ff88', boxShadow: '0 0 8px #00ff88' }} />
        <h2 style={{ fontFamily: 'Space Mono, monospace', fontSize: 14, fontWeight: 700, color: '#00ff88', letterSpacing: '0.1em' }}>{title}</h2>
      </div>
      {children}
    </section>
  );
}

export default function DocsPage() {
  const sections = [
    { id: 'install', label: 'INSTALL' },
    { id: 'connect', label: 'CONNECT' },
    { id: 'send', label: 'SEND' },
    { id: 'swap', label: 'SWAP' },
    { id: 'bridge', label: 'BRIDGE' },
    { id: 'balance', label: 'BALANCES' },
    { id: 'network', label: 'NETWORK' },
    { id: 'contracts', label: 'CONTRACTS' },
  ];

  return (
    <div className="wrap" style={{ padding: '32px 24px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: 40, alignItems: 'start' }}>

        {/* Sidebar */}
        <div style={{ position: 'sticky', top: 100 }}>
          <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 9, color: 'rgba(232,240,232,0.25)', letterSpacing: '0.2em', marginBottom: 14 }}>ON THIS PAGE</div>
          <nav style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {sections.map(s => (
              <a key={s.id} href={`#${s.id}`} style={{ fontFamily: 'Space Mono, monospace', fontSize: 11, color: 'rgba(232,240,232,0.4)', textDecoration: 'none', padding: '6px 12px', borderRadius: 4, transition: 'all 0.15s', letterSpacing: '0.08em' }}
                onMouseEnter={e => { (e.target as HTMLAnchorElement).style.color = '#00ff88'; (e.target as HTMLAnchorElement).style.background = 'rgba(0,255,136,0.06)'; }}
                onMouseLeave={e => { (e.target as HTMLAnchorElement).style.color = 'rgba(232,240,232,0.4)'; (e.target as HTMLAnchorElement).style.background = 'none'; }}>
                {s.label}
              </a>
            ))}
          </nav>

          <div className="panel" style={{ marginTop: 28, padding: 16 }}>
            <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 9, color: 'rgba(232,240,232,0.25)', letterSpacing: '0.12em', marginBottom: 12 }}>QUICK LINKS</div>
            {[
              { label: 'Arc Docs', url: 'https://docs.arc.network' },
              { label: 'Arcscan', url: 'https://testnet.arcscan.app' },
              { label: 'Testnet Faucet', url: 'https://faucet.circle.com' },
              { label: 'Circle Console', url: 'https://console.circle.com' },
            ].map(l => (
              <a key={l.label} href={l.url} target="_blank" rel="noopener noreferrer"
                style={{ display: 'block', fontFamily: 'Space Mono, monospace', fontSize: 10, color: '#00aaff', textDecoration: 'none', padding: '5px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                ↗ {l.label}
              </a>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="animate-fade-up">
          <div style={{ marginBottom: 40 }}>
            <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 9, color: '#00ff88', letterSpacing: '0.2em', marginBottom: 12 }}>ARC SDK REFERENCE</div>
            <h1 style={{ fontSize: 36, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 14, color: '#e8f0e8' }}>
              Build with Arc SDK
            </h1>
            <p style={{ fontSize: 15, color: 'rgba(232,240,232,0.45)', lineHeight: 1.7 }}>
              The official Arc SDK packages — <code style={{ fontFamily: 'Space Mono, monospace', color: '#00ff88', fontSize: 13 }}>@circle-fin/app-kit</code> and <code style={{ fontFamily: 'Space Mono, monospace', color: '#00aaff', fontSize: 13 }}>@circle-fin/adapter-viem-v2</code> — let you send, swap, and bridge USDC on Arc Network in minutes.
            </p>
          </div>

          <Section id="install" title="INSTALL">
            <Code lang="bash" code={`npm install @circle-fin/app-kit @circle-fin/adapter-viem-v2 viem`} />
            <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 11, color: 'rgba(232,240,232,0.35)', lineHeight: 1.7 }}>
              Both packages are required. <code style={{ color: '#00ff88' }}>app-kit</code> provides the AppKit class with send/swap/bridge methods. <code style={{ color: '#00aaff' }}>adapter-viem-v2</code> creates a wallet adapter from any EIP-1193 provider (MetaMask, WalletConnect, etc).
            </div>
          </Section>

          <Section id="connect" title="CONNECT METAMASK">
            <Code code={`import { AppKit } from "@circle-fin/app-kit";
import { createViemAdapterFromProvider } from "@circle-fin/adapter-viem-v2";

// Add Arc Testnet to MetaMask
await window.ethereum.request({
  method: "wallet_addEthereumChain",
  params: [{
    chainId: "0x671",              // 1657
    chainName: "Arc Testnet",
    nativeCurrency: { name: "USDC", symbol: "USDC", decimals: 18 },
    rpcUrls: ["https://rpc.testnet.arc.network"],
    blockExplorerUrls: ["https://testnet.arcscan.app"],
  }],
});

// Create wallet adapter
const adapter = await createViemAdapterFromProvider({
  provider: window.ethereum,
});

// Init AppKit
const kit = new AppKit();`} />
          </Section>

          <Section id="send" title="SEND USDC / EURC">
            <p style={{ fontSize: 13, color: 'rgba(232,240,232,0.45)', marginBottom: 16, lineHeight: 1.6 }}>
              Transfer USDC or EURC to any wallet on Arc. Settles in under 1 second.
            </p>
            <Code code={`const result = await kit.send({
  from: { adapter, chain: "Arc_Testnet" },
  to: "0xRECIPIENT_ADDRESS",
  amount: "10.00",          // 10 USDC
  token: "USDC",            // or "EURC"
});

if (result.state === "success") {
  console.log("TX Hash:", result.txHash);
  console.log("Explorer:", result.explorerUrl);
  // Settlement confirmed in < 1 second ⚡
}`} />
          </Section>

          <Section id="swap" title="SWAP USDC ↔ EURC">
            <p style={{ fontSize: 13, color: 'rgba(232,240,232,0.45)', marginBottom: 16, lineHeight: 1.6 }}>
              Exchange USDC for EURC (or vice versa) on Arc. Requires a <code style={{ fontFamily: 'Space Mono, monospace', color: '#00aaff', fontSize: 12 }}>kitKey</code> from <a href="https://console.circle.com" target="_blank" rel="noopener noreferrer" style={{ color: '#00aaff' }}>console.circle.com</a>.
            </p>
            <Code code={`const result = await kit.swap({
  from: { adapter, chain: "Arc_Testnet" },
  tokenIn: "USDC",
  tokenOut: "EURC",
  amountIn: "100.00",        // 100 USDC
  config: {
    kitKey: "YOUR_CIRCLE_KIT_KEY",  // from console.circle.com
  },
});

if (result.state === "success") {
  console.log("Swapped! TX:", result.txHash);
}`} />
          </Section>

          <Section id="bridge" title="BRIDGE ACROSS CHAINS">
            <p style={{ fontSize: 13, color: 'rgba(232,240,232,0.45)', marginBottom: 16, lineHeight: 1.6 }}>
              Move USDC between Arc and other EVM chains via Circle CCTP. Native USDC — no wrapped tokens.
            </p>
            <Code code={`// Bridge USDC from Ethereum Sepolia → Arc Testnet
const result = await kit.bridge({
  from: { adapter, chain: "Ethereum_Sepolia" },
  to: { adapter, chain: "Arc_Testnet" },
  amount: "50.00",
});

// Bridge USDC from Arc → Base Sepolia
const result2 = await kit.bridge({
  from: { adapter, chain: "Arc_Testnet" },
  to: { adapter, chain: "Base_Sepolia" },
  amount: "25.00",
});

// Supported chains:
// "Arc_Testnet" | "Ethereum_Sepolia"
// "Base_Sepolia" | "Arbitrum_Sepolia"`} />
          </Section>

          <Section id="balance" title="READ USDC BALANCE">
            <Code code={`import { createPublicClient, http, formatUnits } from "viem";

const arcTestnet = {
  id: 1657,
  name: "Arc Testnet",
  nativeCurrency: { name: "USDC", symbol: "USDC", decimals: 18 },
  rpcUrls: { default: { http: ["https://rpc.testnet.arc.network"] } },
} as const;

const client = createPublicClient({
  chain: arcTestnet,
  transport: http(),
});

const USDC = "0x3600000000000000000000000000000000000000";

const balance = await client.readContract({
  address: USDC,
  abi: [{ name: "balanceOf", type: "function", stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ type: "uint256" }]
  }],
  functionName: "balanceOf",
  args: ["0xYOUR_ADDRESS"],
});

console.log(\`\${formatUnits(balance, 6)} USDC\`);`} />
          </Section>

          <Section id="network" title="NETWORK CONFIGURATION">
            <Code code={`// Arc Testnet chain config for viem / wagmi
export const arcTestnet = {
  id: 1657,
  name: "Arc Testnet",
  nativeCurrency: { name: "USDC", symbol: "USDC", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://rpc.testnet.arc.network"] },
  },
  blockExplorers: {
    default: { name: "Arcscan", url: "https://testnet.arcscan.app" },
  },
} as const;

// Hardhat config
module.exports = {
  networks: {
    arcTestnet: {
      url: "https://rpc.testnet.arc.network",
      chainId: 1657,
      accounts: [process.env.PRIVATE_KEY],
    },
  },
};`} />
          </Section>

          <Section id="contracts" title="CONTRACT ADDRESSES">
            <div className="panel" style={{ padding: 0, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                    {['CONTRACT', 'ADDRESS', 'STANDARD'].map(h => (
                      <th key={h} style={{ padding: '12px 18px', textAlign: 'left', fontFamily: 'Space Mono, monospace', fontSize: 9, color: 'rgba(232,240,232,0.25)', letterSpacing: '0.12em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    { name: 'USDC (gas token)', addr: '0x3600000000000000000000000000000000000000', std: 'ERC-20', color: '#00ff88' },
                    { name: 'EURC', addr: '0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a', std: 'ERC-20', color: '#00aaff' },
                    { name: 'Identity Registry', addr: '0x8004A818BFB912233c491871b3d84c89A494BD9e', std: 'ERC-8004', color: '#aa55ff' },
                    { name: 'Reputation Registry', addr: '0x8004B663056A597Dffe9eCcC1965A193B7388713', std: 'ERC-8004', color: '#aa55ff' },
                    { name: 'AgenticCommerce', addr: '0x0747EEf0706327138c69792bF28Cd525089e4583', std: 'ERC-8183', color: '#ffaa00' },
                  ].map(c => (
                    <tr key={c.name} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                      onMouseEnter={e => { (e.currentTarget as HTMLTableRowElement).style.background = 'rgba(255,255,255,0.02)'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLTableRowElement).style.background = 'transparent'; }}>
                      <td style={{ padding: '12px 18px', fontFamily: 'Space Mono, monospace', fontSize: 12, fontWeight: 600, color: c.color }}>{c.name}</td>
                      <td style={{ padding: '12px 18px', fontFamily: 'Space Mono, monospace', fontSize: 11, color: 'rgba(232,240,232,0.5)', wordBreak: 'break-all' }}>{c.addr}</td>
                      <td style={{ padding: '12px 18px' }}>
                        <span className="badge" style={{ background: `${c.color}12`, color: c.color, border: `1px solid ${c.color}25` }}>{c.std}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>
        </div>
      </div>
    </div>
  );
}
