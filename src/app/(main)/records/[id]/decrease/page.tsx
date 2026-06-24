"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { db } from "@/lib/firebase";
import { doc, setDoc, updateDoc, collection } from "firebase/firestore";
import { formatBaht } from "@/lib/utils";
import { useRecords } from "@/hooks/useRecords";
import { useAuth } from "@/hooks/useAuth";

export default function DecreaseRecordPage() {
  const router = useRouter();
  const params = useParams();
  const recordId = params.id as string;
  const { profile } = useAuth();
  const { records } = useRecords(profile?.id ?? "", 50);
  const record = records.find((r) => r.id === recordId);

  const [amount, setAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const currentBalance = record?.currentBalance ?? 0;

  const parsedInput = parseFloat(amount);
  const isValidAmount = !isNaN(parsedInput) && Number.isInteger(parsedInput) && parsedInput > 0;
  const exceedsBalance = isValidAmount && parsedInput > currentBalance;
  const previewBalance = isValidAmount && !exceedsBalance
    ? currentBalance - parsedInput
    : null;

  const handleAmountChange = (value: string) => {
    const cleaned = value.replace(/[^0-9]/g, "").replace(/^0+/, "");
    setAmount(cleaned);
    setError("");
  };

  const handleSubmit = async () => {
    if (!profile || !record) return;
    const parsedAmount = parseInt(amount, 10);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError("Amount must be a positive whole number");
      return;
    }
    if (parsedAmount > currentBalance) {
      setError(`Can't pay more than remaining balance (${formatBaht(currentBalance)})`);
      return;
    }
    if (currentBalance === 0) {
      setError("This record is already fully paid");
      return;
    }

    setIsLoading(true);
    try {
      const newBalance = currentBalance - parsedAmount;

      await updateDoc(doc(db, "records", recordId), {
        currentBalance: newBalance,
      });

      // Write audit transaction
      await setDoc(doc(db, "transactions", doc(collection(db, "transactions")).id), {
        recordId,
        action: "decrease",
        amount: parsedAmount,
        prevBalance: currentBalance,
        newBalance,
        editedBy: profile.id,
        editedByName: profile.name,
        note: `Paid back ฿${parsedAmount.toLocaleString("th-TH")}`,
        createdAt: new Date(),
      });

      router.push("/");
    } catch {
      setError("Network error. Please try again.");
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

  return (
    <div className="record-page">
      <h1 className="page-title">Paid Back</h1>
      {record && (
        <p className="page-subtitle">
          {record.personName} • Remaining: {formatBaht(currentBalance)}
        </p>
      )}

      <div className="glass decrease-card">
        <div className="form-field">
          <label htmlFor="decreaseAmount">Amount paid back (฿)</label>
          <input
            id="decreaseAmount"
            type="number"
            inputMode="numeric"
            value={amount}
            onChange={(e) => handleAmountChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "." || e.key === "," || e.key === "-" || e.key === "e" || e.key === "E" || e.key === "+") {
                e.preventDefault();
              }
            }}
            placeholder="0"
            min="1"
            max={currentBalance || 1}
            disabled={isLoading || currentBalance === 0}
          />
        </div>

        {previewBalance !== null && (
          <div className="balance-preview">
            <span className="preview-label">Remaining after payment</span>
            <span className="preview-amount">{formatBaht(previewBalance)}</span>
          </div>
        )}

        {exceedsBalance && (
          <p className="form-error">Cannot exceed remaining balance ({formatBaht(currentBalance)})</p>
        )}

        {error && <p className="form-error">{error}</p>}

        <button
          className={`form-submit-btn ${isLoading ? "loading" : ""}`}
          onClick={handleSubmit}
          disabled={isLoading || !amount || exceedsBalance || currentBalance === 0}
        >
          {isLoading ? "Recording..." : currentBalance === 0 ? "Fully Paid" : "Confirm Payment"}
        </button>
      </div>
    </div>
  );
}