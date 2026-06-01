import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(url, key);

export interface TxRecord {
  id: string;
  wallet: string;
  type: "send" | "swap" | "bridge";
  token_in: string;
  token_out: string;
  amount: string;
  from_chain: string;
  to_chain: string;
  to_address: string;
  tx_hash: string;
  explorer_url: string;
  status: "success" | "failed" | "pending";
  created_at: string;
}

export async function saveTx(tx: Omit<TxRecord, "id" | "created_at">) {
  const { data, error } = await supabase.from("transactions").insert(tx).select().single();
  if (error) console.error("Failed to save tx:", error);
  return data as TxRecord | null;
}

export async function getTxHistory(wallet: string, limit = 50) {
  const { data, error } = await supabase
    .from("transactions")
    .select("*")
    .eq("wallet", wallet.toLowerCase())
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data as TxRecord[];
}

export async function getAllTxStats() {
  const { data, error } = await supabase
    .from("transactions")
    .select("type, amount, token_in, status")
    .eq("status", "success");
  if (error) throw error;
  return data as Pick<TxRecord, "type" | "amount" | "token_in" | "status">[];
}
