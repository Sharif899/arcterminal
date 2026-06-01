// Arc SDK wrapper — all blockchain interactions
// Uses @circle-fin/app-kit v1.4.1

import { AppKit } from "@circle-fin/app-kit";
import type { EIP1193Provider } from "viem";

export const ARC_RPC = "https://rpc.testnet.arc.network";
export const EXPLORER = "https://testnet.arcscan.app";
export const CHAIN_ID = 5042002;
export const USDC_ADDRESS = "0x3600000000000000000000000000000000000000";
export const EURC_ADDRESS = "0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a";

export const ARC_NETWORK_PARAMS = {
  chainId: "0x4CEF52",
  chainName: "Arc Testnet",
  nativeCurrency: { name: "USDC", symbol: "USDC", decimals: 18 },
  rpcUrls: [ARC_RPC],
  blockExplorerUrls: [EXPLORER],
};

export const BRIDGE_CHAINS = [
  { id: "Arc_Testnet", label: "Arc Testnet", icon: "🔵" },
  { id: "Ethereum_Sepolia", label: "Ethereum Sepolia", icon: "⚪" },
  { id: "Base_Sepolia", label: "Base Sepolia", icon: "🔷" },
  { id: "Arbitrum_Sepolia", label: "Arbitrum Sepolia", icon: "🔶" },
];

// Detect MetaMask mobile in-app browser
function isMobileMetaMask(): boolean {
  if (typeof window === "undefined") return false;
  const ua = navigator.userAgent || "";
  return /MetaMaskMobile/i.test(ua) || (/Mobile/i.test(ua) && Boolean((window as any).ethereum?.isMetaMask));
}

let _kit: AppKit | null = null;
export function getKit(): AppKit {
  if (!_kit) _kit = new AppKit();
  return _kit;
}

export async function connectWallet(): Promise<string> {
  if (typeof window === "undefined") throw new Error("Browser only");
  const eth = getEthereum();
  if (!eth) throw new Error("MetaMask not installed — please install MetaMask");

  const accounts = (await eth.request({ method: "eth_requestAccounts" })) as string[];
  if (!accounts.length) throw new Error("No accounts found");

  // Check if already on Arc Testnet
  const currentChainId = (await eth.request({ method: "eth_chainId" })) as string;
  if (currentChainId.toLowerCase() === "0x4cef52") {
    return accounts[0];
  }

  // Mobile MetaMask — auto chain switching is unreliable, guide user manually
  if (isMobileMetaMask()) {
    throw new Error(
      "MOBILE_CHAIN_SWITCH: Please switch to Arc Testnet manually in MetaMask:\n" +
      "Settings → Networks → Add Network:\n" +
      "• Name: Arc Testnet\n" +
      "• RPC: https://rpc.testnet.arc.network\n" +
      "• Chain ID: 5042002\n" +
      "• Symbol: USDC\n" +
      "• Explorer: https://testnet.arcscan.app"
    );
  }

  // Desktop — try add then switch
  try {
    await eth.request({ method: "wallet_addEthereumChain", params: [ARC_NETWORK_PARAMS] });
  } catch (e: unknown) {
    const err = e as Record<string, unknown>;
    if (err.code === 4001) throw new Error("Request rejected — please approve in MetaMask");
    try {
      await eth.request({ method: "wallet_switchEthereumChain", params: [{ chainId: "0x4CEF52" }] });
    } catch (switchErr: unknown) {
      const se = switchErr as Record<string, unknown>;
      if (se.code === 4001) throw new Error("Request rejected — please approve in MetaMask");
      throw new Error(String(se.message || "Failed to add Arc Testnet to MetaMask"));
    }
  }

  return accounts[0];
}

export async function getConnectedAddress(): Promise<string | null> {
  if (typeof window === "undefined") return null;
  if (sessionStorage.getItem('disconnected') === 'true') return null;
  const eth = getEthereum();
  if (!eth) return null;
  try {
    const accounts = (await eth.request({ method: "eth_accounts" })) as string[];
    return accounts[0] || null;
  } catch { return null; }
}

function getEthereum(): EIP1193Provider | null {
  if (typeof window === "undefined") return null;
  return (window as unknown as { ethereum?: EIP1193Provider }).ethereum || null;
}

async function readContract(contract: string, data: string): Promise<string> {
  const res = await fetch(ARC_RPC, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "eth_call", params: [{ to: contract, data }, "latest"] }),
  });
  const json = await res.json();
  return json.result || "0x0";
}

export async function getUsdcBalance(address: string): Promise<string> {
  const data = "0x70a08231" + address.slice(2).padStart(64, "0");
  const result = await readContract(USDC_ADDRESS, data);
  if (!result || result === "0x") return "0.00";
  return (Number(BigInt(result)) / 1e6).toFixed(2);
}

export async function getEurcBalance(address: string): Promise<string> {
  const data = "0x70a08231" + address.slice(2).padStart(64, "0");
  const result = await readContract(EURC_ADDRESS, data);
  if (!result || result === "0x") return "0.00";
  return (Number(BigInt(result)) / 1e6).toFixed(2);
}

export async function getAllBalances(address: string) {
  const [usdc, eurc] = await Promise.all([getUsdcBalance(address), getEurcBalance(address)]);
  return { usdc, eurc };
}

async function rpcCall(method: string, params: unknown[] = []): Promise<unknown> {
  const res = await fetch(ARC_RPC, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
  });
  const json = await res.json();
  return json.result;
}

export async function getNetworkStats() {
  const [blockHex, gasPriceHex] = await Promise.all([
    rpcCall("eth_blockNumber") as Promise<string>,
    rpcCall("eth_gasPrice") as Promise<string>,
  ]);
  const blockNumber = parseInt(blockHex, 16);
  const block = await rpcCall("eth_getBlockByNumber", ["0x" + blockNumber.toString(16), false]) as { timestamp: string; transactions: string[] };
  return {
    blockNumber,
    gasPrice: (parseInt(gasPriceHex, 16) / 1e18).toFixed(8),
    txCount: block?.transactions?.length || 0,
    timestamp: parseInt(block?.timestamp || "0", 16),
  };
}

export interface TxResult {
  txHash: string;
  explorerUrl: string;
  amount: string;
  from: string;
  to: string;
  type: "send" | "swap" | "bridge";
  tokenIn?: string;
  tokenOut?: string;
  fromChain?: string;
  toChain?: string;
}

function formatAmount(amount: string): string {
  const num = parseFloat(amount);
  if (isNaN(num)) throw new Error("Invalid amount");
  return num.toFixed(2);
}

export async function arcSend(
  to: string,
  amount: string,
  token: "USDC" | "EURC" = "USDC"
): Promise<TxResult> {
  const eth = getEthereum();
  if (!eth) throw new Error("MetaMask not found");
  const formattedAmount = formatAmount(amount);
  const { createViemAdapterFromProvider } = await import("@circle-fin/adapter-viem-v2");
  const adapter = await createViemAdapterFromProvider({ provider: eth });
  const kit = getKit();
  const result = await kit.send({
    from: { adapter, chain: "Arc_Testnet" },
    to,
    amount: formattedAmount,
    token,
  });
  if (result.state !== "success") throw new Error(`Send failed: ${result.state}`);
  const address = await getConnectedAddress();
  return {
    txHash: result.txHash || "",
    explorerUrl: result.explorerUrl || `${EXPLORER}/tx/${result.txHash}`,
    amount: formattedAmount,
    from: address || "",
    to,
    type: "send",
    tokenIn: token,
    tokenOut: token,
  };
}

export async function arcSwap(
  tokenIn: "USDC" | "EURC",
  tokenOut: "EURC" | "USDC",
  amountIn: string,
  kitKey: string
): Promise<TxResult> {
  const eth = getEthereum();
  if (!eth) throw new Error("MetaMask not found");
  if (!kitKey) throw new Error("Circle Kit Key required for swap — get it from console.circle.com");
  const formattedAmount = formatAmount(amountIn);

  const result = await fetch('/api/swap', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tokenIn, tokenOut, amountIn: formattedAmount }),
  }).then(r => r.json());

  if (result.state && result.state !== "success") {
    throw new Error(`Swap failed: ${result.state}`);
  }
  if (result.error) {
    throw new Error(result.error);
  }

  const txHash: string = result.txHash || result.executedTransactions?.[0]?.txHash || "";
  const address = await getConnectedAddress();
  return {
    txHash,
    explorerUrl: result.explorerUrl || `${EXPLORER}/tx/${txHash}`,
    amount: formattedAmount,
    from: address || "",
    to: address || "",
    type: "swap",
    tokenIn,
    tokenOut,
    fromChain: "Arc_Testnet",
    toChain: "Arc_Testnet",
  };
}

export async function arcBridge(
  fromChain: string,
  toChain: string,
  amount: string,
  recipientAddress: string
): Promise<TxResult> {
  const eth = getEthereum();
  if (!eth) throw new Error("MetaMask not found");
  const formattedAmount = formatAmount(amount);
  const { createViemAdapterFromProvider } = await import("@circle-fin/adapter-viem-v2");
  const adapter = await createViemAdapterFromProvider({ provider: eth });
  const kit = getKit();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result: any = await kit.bridge({
    from: { adapter, chain: fromChain as any },
    to: { adapter, chain: toChain as any },
    amount: formattedAmount,
  });
  if (result.state && result.state !== "success") {
    throw new Error(`Bridge failed: ${result.state}`);
  }
  const burnStep = result.steps?.find((s: { name: string; txHash?: string }) => s.name === "burn" || s.name === "Burn");
  const txHash: string = burnStep?.txHash || result.steps?.[0]?.txHash || "";
  const explorerUrl = burnStep?.explorerUrl || result.steps?.[0]?.explorerUrl || `${EXPLORER}/tx/${txHash}`;
  const address = await getConnectedAddress();
  return {
    txHash,
    explorerUrl,
    amount: formattedAmount,
    from: address || "",
    to: recipientAddress,
    type: "bridge",
    tokenIn: "USDC",
    tokenOut: "USDC",
    fromChain,
    toChain,
  };
}