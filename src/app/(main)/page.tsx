"use client";

import { useMemo, useState } from "react";
import { db } from "@/lib/firebase";
import { doc, setDoc, updateDoc, collection } from "firebase/firestore";
import { useRecords, type Record } from "@/hooks/useRecords";
import { useAuth } from "@/hooks/useAuth";
import { formatRelativeTime, formatBaht, formatBahtCompact } from "@/lib/utils";

export default function DashboardPage() {
  const { profile } = useAuth();
  const profileId = profile?.id ?? "";
  const myName = profile?.name ?? "";
  const { records, totalOwed, isLoading, error } = useRecords(profileId);

  // Quick Add state
  const [showAdd, setShowAdd] = useState(false);
  const [addName, setAddName] = useState(myName === "Num" ? "Kaew" : myName === "Kaew" ? "Num" : "");
  const [addAmount, setAddAmount] = useState("");
  const [addType, setAddType] = useState<"borrow" | "lend">("borrow");
  const [addSaving, setAddSaving] = useState(false);
  const [addError, setAddError] = useState("");

  const otherName = useMemo(() => {
    if (myName === "Num") return "Kaew";
    if (myName === "Kaew") return "Num";
    return "them";
  }, [myName]);

  const handleAdd = async () => {
    if (!profile) return;
    const parsed = parseInt(addAmount, 10);
    if (!addName.trim()) { setAddError("Enter a name"); return; }
    if (isNaN(parsed) || parsed <= 0) { setAddError("Enter a valid amount"); return; }
    if (parsed > 99_999_999) { setAddError("Amount too large"); return; }

    setAddSaving(true);
    setAddError("");
    try {
      const id = doc(collection(db, "records")).id;
      await setDoc(doc(db, "records", id), {
        type: addType,
        personName: addName.trim(),
        amount: parsed,
        currentBalance: parsed,
        description: "",
        createdBy: profile.id,
        createdAt: new Date(),
      });
      await setDoc(doc(db, "transactions", doc(collection(db, "transactions")).id), {
        recordId: id, action: "create", amount: parsed,
        prevBalance: 0, newBalance: parsed,
        editedBy: profile.id, editedByName: profile.name,
        note: "", createdAt: new Date(),
      });
      setShowAdd(false);
      setAddAmount("");
      setAddError("");
    } catch {
      setAddError("Failed to save");
    } finally {
      setAddSaving(false);
    }
  };

  const handlePayback = async (record: Record) => {
    if (!profile || record.currentBalance <= 0) return;
    const newBalance = 0;
    try {
      await updateDoc(doc(db, "records", record.id), { currentBalance: newBalance });
      await setDoc(doc(db, "transactions", doc(collection(db, "transactions")).id), {
        recordId: record.id, action: "decrease",
        amount: record.currentBalance, prevBalance: record.currentBalance,
        newBalance, editedBy: profile.id, editedByName: profile.name,
        note: "Paid in full", createdAt: new Date(),
      });
    } catch {
      alert("Failed to mark as paid");
    }
  };

  return (
    <div className="dashboard">
      {/* Balance Circle */}
      <div className="dashboard-hero">
        <div className="balance-circle-wrapper">
          <div className="balance-circle">
            <div className="balance-inner">
              <span className={`balance-amount ${totalOwed >= 0 ? "positive" : "negative"}`}>
                {formatBahtCompact(totalOwed)}
              </span>
              <span className="balance-label">
                {totalOwed >= 0 ? `${otherName} owes you` : `You owe ${otherName}`}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Huge Add Button */}
      {!showAdd && (
        <button className="big-add-btn" onClick={() => setShowAdd(true)}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Add Record
        </button>
      )}

      {/* Quick Add Form */}
      {showAdd && (
        <div className="glass quick-add-card">
          <div className="quick-add-toggle">
            <button className={`qt-btn ${addType === "borrow" ? "active borrow" : ""}`} onClick={() => setAddType("borrow")}>I Borrowed</button>
            <button className={`qt-btn ${addType === "lend" ? "active lend" : ""}`} onClick={() => setAddType("lend")}>I Lent</button>
          </div>
          <input className="qt-input" placeholder="Name" value={addName} onChange={e => setAddName(e.target.value)} maxLength={50} />
          <input className="qt-input" type="number" inputMode="numeric" placeholder="Amount (฿)" value={addAmount}
            onChange={e => setAddAmount(e.target.value.replace(/[^0-9]/g, ""))}
            onKeyDown={e => { if (e.key === "Enter") handleAdd(); }} />
          {addError && <p className="form-error">{addError}</p>}
          <div className="quick-add-actions">
            <button className="qt-cancel" onClick={() => { setShowAdd(false); setAddError(""); }}>Cancel</button>
            <button className="qt-save" onClick={handleAdd} disabled={addSaving}>{addSaving ? "Saving..." : "Save"}</button>
          </div>
        </div>
      )}

      {/* Records List */}
      <div className="dashboard-section">
        <h2 className="section-heading">Recent</h2>
        {isLoading && <div className="skeleton-row glass" />}
        {error && <div className="glass error-state"><p>Could not load</p></div>}
        {!isLoading && !error && records.length === 0 && (
          <div className="glass empty-state"><p>No records yet</p></div>
        )}
        {!isLoading && !error && records.length > 0 && (
          <div className="activity-list">
            {records.map(r => (
              <div key={r.id} className={`activity-card glass ${r.currentBalance === 0 ? "paid-off" : ""}`}>
                <div className="activity-left">
                  <div className={`activity-icon ${r.type === "borrow" ? "borrow" : "lend"}`}>
                    {r.type === "borrow" ? "↓" : "↑"}
                  </div>
                  <div className="activity-info">
                    <span className="activity-name">{r.personName}</span>
                    <span className="activity-time">{formatRelativeTime(r.createdAt)}</span>
                  </div>
                </div>
                <div className="activity-right">
                  <span className={`activity-amount ${r.type === "borrow" ? "borrow" : "lend"}`}>
                    {r.type === "borrow" ? "-" : "+"}{formatBaht(r.amount)}
                  </span>
                </div>
                {r.currentBalance > 0 && (
                  <button className="pay-btn" onClick={() => handlePayback(r)} title="Mark as paid">✓</button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}