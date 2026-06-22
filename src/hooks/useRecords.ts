"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import {
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
  type QueryDocumentSnapshot,
} from "firebase/firestore";

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

  useEffect(() => {
    setIsLoading(true);

    const q = query(
      collection(db, "records"),
      orderBy("createdAt", "desc"),
      limit(maxRecords)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const items: Record[] = [];
        let net = 0;

        snapshot.forEach((doc: QueryDocumentSnapshot) => {
          const data = doc.data();
          const record: Record = {
            id: doc.id,
            type: data.type as "borrow" | "lend",
            personName: data.personName as string,
            amount: data.amount as number,
            currentBalance: data.currentBalance as number,
            description: (data.description as string) ?? "",
            billImageBase64: data.billImageBase64 as string | undefined,
            createdBy: data.createdBy as string,
            createdAt: data.createdAt?.toDate() ?? new Date(),
          };

          items.push(record);

          // Calculate net from the current user's perspective
          const isMine = record.createdBy === profileId;
          if (record.type === "lend") {
            // Someone lent money: if it was me, they owe me (+); if it was them, I owe (-)
            net += isMine ? record.currentBalance : -record.currentBalance;
          } else {
            // Someone borrowed money: if it was me, I owe (-); if it was them, they owe me (+)
            net += isMine ? -record.currentBalance : record.currentBalance;
          }
        });

        setRecords(items);
        setTotalOwed(net);
        setIsLoading(false);
      },
      (err: Error) => {
        console.error("Firestore listener error:", err);
        setError(err.message);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [profileId, maxRecords]);

  return { records, totalOwed, isLoading, error };
}