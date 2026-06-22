"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
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
    setIsLoading(true);
    try {
      const res = await fetch(`/api/records/${recordId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const err = (await res.json()) as { error: string };
        alert(err.error ?? "Failed to update record");
        return;
      }

      router.push("/");
      router.refresh();
    } catch {
      alert("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Record not found (but we have data loaded)
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

  // Still loading
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