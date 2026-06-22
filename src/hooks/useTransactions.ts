"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  type QueryDocumentSnapshot,
} from "firebase/firestore";

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

  useEffect(() => {
    setIsLoading(true);

    let q = query(
      collection(db, "transactions"),
      orderBy("createdAt", "desc")
    );

    if (recordId) {
      // Filter client-side since Firestore doesn't support compound queries easily
      // In production, add a composite index on [recordId, createdAt]
    }

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const items: Transaction[] = [];

        snapshot.forEach((doc: QueryDocumentSnapshot) => {
          const data = doc.data();

          // Client-side filter if recordId is specified
          if (recordId && data.recordId !== recordId) return;

          items.push({
            id: doc.id,
            recordId: data.recordId as string,
            action: data.action as Transaction["action"],
            amount: data.amount as number,
            prevBalance: data.prevBalance as number,
            newBalance: data.newBalance as number,
            editedBy: data.editedBy as string,
            editedByName: data.editedByName as string,
            note: (data.note as string) ?? "",
            createdAt: data.createdAt?.toDate() ?? new Date(),
          });
        });

        setTransactions(items);
        setIsLoading(false);
      },
      (err: Error) => {
        setError(err.message);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [recordId]);

  return { transactions, isLoading, error };
}