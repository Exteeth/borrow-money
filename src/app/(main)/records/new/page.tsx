"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import MoneyForm, { type MoneyFormData } from "@/components/MoneyForm";

export default function NewRecordPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (data: MoneyFormData) => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const err = await res.json() as { error: string };
        alert(err.error ?? "Failed to create record");
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

  return (
    <div className="record-page">
      <h1 className="page-title">New Record</h1>
      <MoneyForm onSubmit={handleSubmit} isLoading={isLoading} submitLabel="Add Record" />
    </div>
  );
}