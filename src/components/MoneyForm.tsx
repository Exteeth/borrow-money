"use client";

import { useState, type FormEvent } from "react";

export interface MoneyFormData {
  personName: string;
  amount: number;
  type: "borrow" | "lend";
  description: string;
}

interface MoneyFormProps {
  onSubmit: (data: MoneyFormData) => Promise<void>;
  initialData?: Partial<MoneyFormData>;
  isLoading?: boolean;
  submitLabel?: string;
}

export default function MoneyForm({
  onSubmit,
  initialData,
  isLoading = false,
  submitLabel = "Save",
}: MoneyFormProps) {
  const [personName, setPersonName] = useState(initialData?.personName ?? "");
  const [amount, setAmount] = useState(initialData?.amount?.toString() ?? "");
  const [type, setType] = useState<"borrow" | "lend">(initialData?.type ?? "borrow");
  const [description, setDescription] = useState(initialData?.description ?? "");
  const [error, setError] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    const parsedAmount = parseInt(amount, 10);
    if (!personName.trim()) {
      setError("Please enter a person's name");
      return;
    }
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError("Amount must be a positive whole number");
      return;
    }
    if (!Number.isInteger(parseFloat(amount)) || amount.includes(".")) {
      setError("Amount must be a whole number (no decimals)");
      return;
    }
    if (parsedAmount > 99_999_999) {
      setError("Amount cannot exceed ฿99,999,999");
      return;
    }
    if (description.length > 200) {
      setError("Description must be 200 characters or fewer");
      return;
    }

    await onSubmit({
      personName: personName.trim(),
      amount: parsedAmount,
      type,
      description: description.trim(),
    });
  };

  return (
    <form className="money-form" onSubmit={handleSubmit}>
      {/* Type Toggle */}
      <div className="form-type-toggle">
        <button
          type="button"
          className={`type-btn ${type === "borrow" ? "active borrow" : ""}`}
          onClick={() => setType("borrow")}
        >
          Borrowed
        </button>
        <button
          type="button"
          className={`type-btn ${type === "lend" ? "active lend" : ""}`}
          onClick={() => setType("lend")}
        >
          Lent
        </button>
      </div>

      {/* Person Name */}
      <div className="form-field">
        <label htmlFor="personName">Person</label>
        <input
          id="personName"
          type="text"
          value={personName}
          onChange={(e) => setPersonName(e.target.value)}
          placeholder="e.g. Num, Kaew, Bank..."
          disabled={isLoading}
          maxLength={50}
        />
      </div>

      {/* Amount */}
      <div className="form-field">
        <label htmlFor="amount">Amount (฿)</label>
        <input
          id="amount"
          type="number"
          inputMode="numeric"
          value={amount}
          onChange={(e) => {
            const val = e.target.value;
            // Strip leading zeros but allow single "0"
            if (val.startsWith("0") && val.length > 1) {
              e.target.value = val.replace(/^0+/, "");
            }
            setAmount(e.target.value);
          }}
          onKeyDown={(e) => {
            if (e.key === "." || e.key === "," || e.key === "-" || e.key === "e" || e.key === "E" || e.key === "+") {
              e.preventDefault();
            }
          }}
          placeholder="0"
          min="1"
          max="99999999"
          disabled={isLoading}
        />
      </div>

      {/* Description */}
      <div className="form-field">
        <label htmlFor="description">Note (optional)</label>
        <input
          id="description"
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What was it for?"
          disabled={isLoading}
          maxLength={200}
        />
      </div>

      {/* Error */}
      {error && <p className="form-error">{error}</p>}

      {/* Submit */}
      <button
        type="submit"
        className={`form-submit-btn ${isLoading ? "loading" : ""}`}
        disabled={isLoading}
      >
        {isLoading ? "Saving..." : submitLabel}
      </button>
    </form>
  );
}