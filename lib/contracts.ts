// lib/contracts.ts
// All deployed Arc Terminal contracts on Arc Testnet

export const CONTRACTS = {
  ArcTerminalRegistry: '0x87B1135d439c9C8174a812B0a2d0b7dc958B754D',
  ArcPayrollRegistry: '0xEd70270aDF0723A8a3916a23f05cf36604FFe41F',
  ArcStorefrontFactory: '0x8e87Db8c4aF2eBFaB05F3e946388e8677e98F627',
  ArcTicketRegistry: '0x13125Bd7883cC91ea99B0fae79570BB2117dB9a5',
  ArcInvoiceRegistry: '0xb3575B78FB13Cb4E726F42c6d166f39C47Ee0E0A',
  ArcAgentRegistry: '0xe18d51c6a1bf2952096c993e49bE71848fA621b0',
  ArcNanopayRegistry: '0x75780D0d15cADdcc72eb7f47d6736C6d311295Ab',
  ArcRatesRegistry: '0xA11f9b5C71565df6C9a583A39f7b7CD40723d146',
};

export const ARC_RPC = 'https://rpc.testnet.arc.network';
export const EXPLORER = 'https://testnet.arcscan.app';

// ABIs — only the functions we call from the frontend
export const REGISTRY_ABI = [
  {
    name: 'recordPayment',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'recipient', type: 'address' },
      { name: 'amount', type: 'uint256' },
      { name: 'token', type: 'string' },
      { name: 'memo', type: 'string' },
      { name: 'paymentType', type: 'string' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'getTotalPayments',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
] as const;

export const PAYROLL_ABI = [
  {
    name: 'recordPayrollRun',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'totalAmount', type: 'uint256' },
      { name: 'employeeCount', type: 'uint256' },
      { name: 'status', type: 'string' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'addEmployee',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'wallet', type: 'address' },
      { name: 'name', type: 'string' },
      { name: 'salary', type: 'uint256' },
    ],
    outputs: [],
  },
] as const;

export const STOREFRONT_ABI = [
  {
    name: 'createProduct',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'name', type: 'string' },
      { name: 'description', type: 'string' },
      { name: 'price', type: 'uint256' },
      { name: 'category', type: 'string' },
      { name: 'stock', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'recordOrder',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'productId', type: 'uint256' },
      { name: 'seller', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
  },
] as const;

export const TICKET_ABI = [
  {
    name: 'createEvent',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'name', type: 'string' },
      { name: 'location', type: 'string' },
      { name: 'date', type: 'uint256' },
      { name: 'ticketPrice', type: 'uint256' },
      { name: 'totalTicketsAvailable', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'mintTicket',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'eventId', type: 'uint256' },
      { name: 'holderName', type: 'string' },
      { name: 'pricePaid', type: 'uint256' },
      { name: 'tokenId', type: 'string' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
  },
] as const;

export const INVOICE_ABI = [
  {
    name: 'createInvoice',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'amount', type: 'uint256' },
      { name: 'token', type: 'string' },
      { name: 'memo', type: 'string' },
      { name: 'currency', type: 'string' },
      { name: 'exchangeRate', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'payInvoice',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'invoiceId', type: 'uint256' },
      { name: 'txHash', type: 'string' },
    ],
    outputs: [],
  },
] as const;

export const AGENT_ABI = [
  {
    name: 'registerAgent',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'wallet', type: 'address' },
      { name: 'name', type: 'string' },
      { name: 'agentType', type: 'string' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'recordAction',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'agentId', type: 'uint256' },
      { name: 'actionType', type: 'string' },
      { name: 'amount', type: 'uint256' },
      { name: 'recipient', type: 'address' },
      { name: 'txHash', type: 'string' },
      { name: 'result', type: 'string' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
  },
] as const;

export const NANOPAY_ABI = [
  {
    name: 'recordNanoPayment',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'serviceId', type: 'uint256' },
      { name: 'provider', type: 'address' },
      { name: 'amount', type: 'uint256' },
      { name: 'txHash', type: 'string' },
      { name: 'sessionType', type: 'string' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'startStream',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'serviceId', type: 'uint256' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'endStream',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'sessionId', type: 'uint256' },
      { name: 'totalCalls', type: 'uint256' },
      { name: 'totalSpent', type: 'uint256' },
    ],
    outputs: [],
  },
] as const;

export const RATES_ABI = [
  {
    name: 'recordConversion',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'fromCurrency', type: 'string' },
      { name: 'toCurrency', type: 'string' },
      { name: 'fromAmount', type: 'uint256' },
      { name: 'toAmount', type: 'uint256' },
      { name: 'exchangeRate', type: 'uint256' },
      { name: 'recipient', type: 'address' },
      { name: 'txHash', type: 'string' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'recordRate',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'currency', type: 'string' },
      { name: 'rate', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
  },
] as const;

// Helper function to call a contract write function
export async function callContract(
  contractAddress: string,
  abi: readonly any[],
  functionName: string,
  args: any[]
): Promise<string> {
  const { createPublicClient, createWalletClient, custom, http, encodeFunctionData } = await import('viem');
  const { defineChain } = await import('viem');

  const arcTestnet = defineChain({
    id: 5042002,
    name: 'Arc Testnet',
    nativeCurrency: { name: 'USDC', symbol: 'USDC', decimals: 18 },
    rpcUrls: { default: { http: [ARC_RPC] } },
  });

  const ethereum = (window as any).ethereum;
  if (!ethereum) throw new Error('No wallet found');

  const walletClient = createWalletClient({
    chain: arcTestnet,
    transport: custom(ethereum),
  });

  const [account] = await walletClient.getAddresses();

  const fnAbi = abi.find((f: any) => f.name === functionName);
  if (!fnAbi) throw new Error(`Function ${functionName} not found in ABI`);

  const data = encodeFunctionData({
    abi: abi as any,
    functionName,
    args,
  });

  const txHash = await walletClient.sendTransaction({
    account,
    to: contractAddress as `0x${string}`,
    data,
  });

  return txHash;
}