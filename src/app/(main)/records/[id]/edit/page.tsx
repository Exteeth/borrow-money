"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { db } from "@/lib/firebase";
import { doc, setDoc, updateDoc, collection } from "firebase/firestore";
import MoneyForm, { type MoneyFormData } from "@/components/MoneyForm";
import { useRecords } from "@/hooks/useRecords";
import { useAuth } from "@/hooks/useAuth";

export default function EditRecordPage() {
  const router = useRouter();
  const params = useParams();
  const recordId = params.id as string;
  const { profile } = useAuth();
  const { records } = useRecords(profile?.id ?? "", 50);
  const record = records.find((r) => r.id === recordId);
  const [isLoading, setIsLoading] = useState(false);

  const initialData: Partial<MoneyFormData> | undefined = record
    ? {
        personName: record.personName,
        amount: record.amount,
        type: record.type,
        description: record.description,
      }
    : undefined;

  const handleSubmit = async (data: MoneyFormData) => {
    if (!profile || !record) return;
    setIsLoading(true);
    try {
      const oldBalance = record.currentBalance;
      const diff = data.amount - record.amount;
      const newBalance = Math.max(0, oldBalance + diff);

      await updateDoc(doc(db, "records", recordId), {
        amount: data.amount,
        currentBalance: newBalance,
        description: data.description,
      });

      // Write audit transaction
      await setDoc(doc(db, "transactions", doc(collection(db, "transactions")).id), {
        recordId,
        action: "edit",
        amount: data.amount,
        prevBalance: oldBalance,
        newBalance,
        editedBy: profile.id,
        editedByName: profile.name,
        note: data.description,
        createdAt: new Date(),
      });

      router.push("/");
    } catch (err) {
      alert("Failed to update record");
    } finally {
      setIsLoading(false);
    }
  };

  if (!record && records.length > 0) {
    return (
      <div className="record-page">
        <div className="glass error-state">
          <p>Record not found</p>
          <button onClick={() => router.push("/")}>Back to Dashboard</button>
        </div>
      </div>
    );
  }

  if (!initialData) {
    return (
      <div className="record-page">
        <div className="glass" style={{ padding: 24, textAlign: "center" }}>
          <p>Loading record...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="record-page">
      <h1 className="page-title">Edit Record</h1>
      <MoneyForm
        onSubmit={handleSubmit}
        initialData={initialData}
        isLoading={isLoading}
        submitLabel="Update Record"
      />
    </div>
  );
}