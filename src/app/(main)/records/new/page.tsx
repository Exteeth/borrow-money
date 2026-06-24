"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { collection, doc, setDoc } from "firebase/firestore";
import MoneyForm, { type MoneyFormData } from "@/components/MoneyForm";
import { useAuth } from "@/hooks/useAuth";

export default function NewRecordPage() {
  const router = useRouter();
  const { profile } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (data: MoneyFormData) => {
    if (!profile) return;
    setIsLoading(true);
    try {
      const txnId = doc(collection(db, "records")).id;

      await setDoc(doc(db, "records", txnId), {
        type: data.type,
        personName: data.personName,
        amount: data.amount,
        currentBalance: data.amount,
        description: data.description,
        createdBy: profile.id,
        createdAt: new Date(),
      });

      // Write audit transaction
      await setDoc(doc(db, "transactions", doc(collection(db, "transactions")).id), {
        recordId: txnId,
        action: "create",
        amount: data.amount,
        prevBalance: 0,
        newBalance: data.amount,
        editedBy: profile.id,
        editedByName: profile.name,
        note: data.description,
        createdAt: new Date(),
      });

      router.push("/");
    } catch (err) {
      console.error("Create error:", err);
      alert("Failed to create record");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="record-page">
      <h1 className="page-title">New Record</h1>
      <MoneyForm onSubmit={handleSubmit} isLoading={isLoading} submitLabel="Add Record" />
    </div>
  );
}