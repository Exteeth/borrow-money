"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import MoneyForm, { type MoneyFormData } from "@/components/MoneyForm";
import { useAuth } from "@/hooks/useAuth";
import { sendDiscordNotification } from "@/lib/discord";

export default function NewRecordPage() {
  const router = useRouter();
  const { profile } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (data: MoneyFormData) => {
    if (!profile) return;
    setIsLoading(true);
    try {
      const res = await fetch("/api/records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: data.type,
          personName: data.personName,
          amount: data.amount,
          description: data.description,
          createdBy: profile.id,
          createdByName: profile.name,
        }),
      });

      if (!res.ok) {
        const resData = await res.json();
        throw new Error(resData.error || "Insert failed");
      }

      // Trigger Discord Webhook Notification
      sendDiscordNotification(profile.id, data.type, data.amount, data.description).catch(() => {});

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