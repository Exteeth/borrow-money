"use client";

import { useEffect, useState, useCallback } from "react";

export interface Transaction {
  id: string;
  recordId: string;
  action: "create" | "edit" | "decrease" | "delete";
  amount: number;
  prevBalance: number;
  newBalance: number;
  editedBy: string;
  editedByName: string;
  note: string;
  createdAt: Date;
}

export function useTransactions(recordId?: string) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTransactions = useCallback(async () => {
    try {
      const url = recordId
        ? `/api/transactions?recordId=${encodeURIComponent(recordId)}`
        : "/api/transactions";
      
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error("Failed to fetch transactions");
      }

      const { transactions: data } = await res.json() as { transactions: any[] };

      const items: Transaction[] = (data || []).map((item: any) => ({
        id: item.id,
        recordId: item.record_id,
        action: item.action as Transaction["action"],
        amount: Number(item.amount),
        prevBalance: Number(item.prev_balance),
        newBalance: Number(item.new_balance),
        editedBy: item.edited_by,
        editedByName: item.edited_by_name,
        note: item.note ?? "",
        createdAt: new Date(item.created_at),
      }));

      setTransactions(items);
      setError(null);
    } catch (err: any) {
      console.error("Transactions fetch error:", err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [recordId]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  return { transactions, isLoading, error };
}