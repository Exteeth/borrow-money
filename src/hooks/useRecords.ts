"use client";

import { useEffect, useState, useCallback } from "react";

export interface Record {
  id: string;
  type: "borrow" | "lend";
  personName: string;
  amount: number;
  currentBalance: number;
  description: string;
  billImageBase64?: string;
  createdBy: string;
  createdAt: Date;
}

export function useRecords(profileId: string, maxRecords = 20) {
  const [records, setRecords] = useState<Record[]>([]);
  const [totalOwed, setTotalOwed] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRecords = useCallback(async () => {
    if (!profileId) return;
    try {
      const res = await fetch("/api/records");
      if (!res.ok) {
        throw new Error("Failed to fetch records");
      }
      const { records: data } = await res.json() as { records: any[] };

      const allItems: Record[] = (data || []).map((item: any) => ({
        id: item.id,
        type: item.type as "borrow" | "lend",
        personName: item.person_name,
        amount: Number(item.amount),
        currentBalance: Number(item.current_balance),
        description: item.description ?? "",
        billImageBase64: item.bill_image_base64 ?? undefined,
        createdBy: item.created_by,
        createdAt: new Date(item.created_at),
      }));

      // Calculate net from the current user's perspective across ALL records
      let net = 0;
      allItems.forEach((record) => {
        const isMine = (record.createdBy || "").toLowerCase() === (profileId || "").toLowerCase();
        if (record.type === "lend") {
          // Someone lent money: if it was me, they owe me (+); if it was them, I owe (-)
          net += isMine ? record.currentBalance : -record.currentBalance;
        } else {
          // Someone borrowed money: if it was me, I owe (-); if it was them, they owe me (+)
          net += isMine ? -record.currentBalance : record.currentBalance;
        }
      });

      const displayRecords = allItems
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .slice(0, maxRecords);

      setRecords(displayRecords);
      setTotalOwed(net);
      setError(null);
    } catch (err: any) {
      console.error("Records fetch error:", err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [profileId, maxRecords]);

  // Expose refetch for callers to use after mutations
  const refetch = useCallback(() => {
    fetchRecords();
  }, [fetchRecords]);

  useEffect(() => {
    if (!profileId) return;
    fetchRecords();
  }, [profileId, fetchRecords]);

  return { records, totalOwed, isLoading, error, refetch };
}