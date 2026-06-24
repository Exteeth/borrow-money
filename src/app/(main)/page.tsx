"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { doc, setDoc, updateDoc, deleteDoc, collection } from "firebase/firestore";
import { useRecords, type Record } from "@/hooks/useRecords";
import { useAuth } from "@/hooks/useAuth";
import { formatRelativeTime, formatBaht } from "@/lib/utils";
import BalanceCircle from "@/components/BalanceCircle";
import { useToast } from "@/context/ToastContext";

export default function DashboardPage() {
  const router = useRouter();
  const { profile } = useAuth();
  const profileId = profile?.id ?? "";
  const myName = profile?.name ?? "";
  const { records, totalOwed, isLoading, error } = useRecords(profileId);
  const { addToast } = useToast();

  // Quick Add state
  const [addAmount, setAddAmount] = useState("");
  const [addNote, setAddNote] = useState("");
  const [addSaving, setAddSaving] = useState(false);
  const [addError, setAddError] = useState("");

  // Inline Controls state
  const [expandedRecordId, setExpandedRecordId] = useState<string | null>(null);

  const otherName = useMemo(() => {
    if (myName === "Num") return "Kaew";
    if (myName === "Kaew") return "Num";
    return "them";
  }, [myName]);

  const handleAmountChange = (val: string) => {
    // Only allow whole numbers
    setAddAmount(val.replace(/[^0-9]/g, ""));
    setAddError("");
  };

  const handleQuickAdd = async () => {
    if (!profile) return;
    const parsed = parseInt(addAmount, 10);
    if (isNaN(parsed) || parsed <= 0) {
      setAddError("กรุณาระบุจำนวนเงินที่ถูกต้อง");
      return;
    }
    if (parsed > 99_999_999) {
      setAddError("จำนวนเงินมากเกินไป");
      return;
    }

    setAddSaving(true);
    setAddError("");

    const isKaew = myName === "Kaew";
    const recordType = isKaew ? "lend" : "borrow";
    const targetPerson = isKaew ? "Num" : "Kaew";

    try {
      const recordId = doc(collection(db, "records")).id;
      
      await setDoc(doc(db, "records", recordId), {
        type: recordType,
        personName: targetPerson,
        amount: parsed,
        currentBalance: parsed,
        description: addNote.trim(),
        createdBy: profile.id,
        createdAt: new Date(),
      });

      await setDoc(doc(db, "transactions", doc(collection(db, "transactions")).id), {
        recordId,
        action: "create",
        amount: parsed,
        prevBalance: 0,
        newBalance: parsed,
        editedBy: profile.id,
        editedByName: profile.name,
        note: addNote.trim() || (isKaew ? "ให้ Num ยืม" : "ยืมเงินจากแก้ว"),
        createdAt: new Date(),
      });

      setAddAmount("");
      setAddNote("");
      addToast("บันทึกข้อมูลการยืมสำเร็จ", "success");
    } catch {
      setAddError("ล้มเหลวในการบันทึกข้อมูล");
      addToast("ล้มเหลวในการบันทึกข้อมูล", "error");
    } finally {
      setAddSaving(false);
    }
  };

  const handlePayback = async (record: Record) => {
    if (!profile || record.currentBalance <= 0) return;
    try {
      const newBalance = 0;
      await updateDoc(doc(db, "records", record.id), { currentBalance: newBalance });
      await setDoc(doc(db, "transactions", doc(collection(db, "transactions")).id), {
        recordId: record.id,
        action: "decrease",
        amount: record.currentBalance,
        prevBalance: record.currentBalance,
        newBalance,
        editedBy: profile.id,
        editedByName: profile.name,
        note: "จ่ายคืนแล้ว (ทั้งหมด)",
        createdAt: new Date(),
      });
      addToast("บันทึกข้อมูลคืนเงินสำเร็จ", "success");
      setExpandedRecordId(null);
    } catch {
      addToast("ล้มเหลวในการบันทึกข้อมูลคืนเงิน", "error");
    }
  };

  const handleDelete = async (recordId: string) => {
    if (!profile) return;
    if (!window.confirm("ต้องการลบรายการนี้ใช่หรือไม่? (ข้อมูลนี้จะหายไปจากประวัติทันที)")) return;
    try {
      await deleteDoc(doc(db, "records", recordId));
      await setDoc(doc(db, "transactions", doc(collection(db, "transactions")).id), {
        recordId,
        action: "delete",
        amount: 0,
        prevBalance: 0,
        newBalance: 0,
        editedBy: profile.id,
        editedByName: profile.name,
        note: "ลบรายการธุรกรรม",
        createdAt: new Date(),
      });
      addToast("ลบรายการธุรกรรมสำเร็จ", "success");
      setExpandedRecordId(null);
    } catch {
      addToast("ล้มเหลวในการลบรายการธุรกรรม", "error");
    }
  };

  return (
    <div className="dashboard">
      {/* Balance Display */}
      <div className="dashboard-hero">
        <BalanceCircle totalOwed={totalOwed} otherPersonName={otherName} />
      </div>

      {/* Wisdom Quick Add Form (Always visible) */}
      <div className="wisdom-quick-add">
        <div className="wisdom-input-group">
          <span className="wisdom-currency-symbol">฿</span>
          <input
            className="wisdom-amount-input"
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            placeholder="0"
            value={addAmount}
            onChange={e => handleAmountChange(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") handleQuickAdd(); }}
            disabled={addSaving}
          />
        </div>
        
        <input
          className="wisdom-note-input"
          type="text"
          placeholder="โน้ตบันทึกสั้นๆ (เช่น ค่าหมูกระทะ, กาแฟ)..."
          value={addNote}
          onChange={e => setAddNote(e.target.value)}
          disabled={addSaving}
        />
        
        {addError && <p className="form-error">{addError}</p>}
        
        <button 
          className="wisdom-submit-btn" 
          onClick={handleQuickAdd} 
          disabled={addSaving || !addAmount}
        >
          {addSaving ? "กำลังบันทึก..." : myName === "Kaew" ? "ให้ Num ยืม" : "ยืมเงินจากแก้ว"}
        </button>
      </div>

      {/* Records List */}
      <div className="dashboard-section">
        <h2 className="section-heading">Recent Transactions</h2>
        {isLoading && <div className="skeleton-row glass" />}
        {error && <div className="glass error-state"><p>Could not load records</p></div>}
        {!isLoading && !error && records.length === 0 && (
          <div className="glass empty-state"><p>ยังไม่มีรายการค้างชำระ</p></div>
        )}
        {!isLoading && !error && records.length > 0 && (
          <div className="activity-list">
            {records.map(r => {
              const isBorrow = r.type === "borrow";
              const isPaidOff = r.currentBalance === 0;
              const isExpanded = expandedRecordId === r.id;
              
              return (
                <div 
                  key={r.id} 
                  className={`activity-card glass ${isPaidOff ? "paid-off" : ""}`}
                >
                  <div 
                    className="activity-card-main-row" 
                    onClick={() => setExpandedRecordId(isExpanded ? null : r.id)}
                  >
                    <div className="activity-left">
                      <div className={`activity-icon ${isBorrow ? "borrow" : "lend"}`}>
                        {isBorrow ? "↓" : "↑"}
                      </div>
                      <div className="activity-info">
                        <span className="activity-name">
                          {isBorrow ? `${r.personName} (ยืม)` : `${r.personName} (ให้ยืม)`}
                        </span>
                        <span className="activity-time">
                          {formatRelativeTime(r.createdAt)}
                          {r.description && ` • ${r.description}`}
                        </span>
                      </div>
                    </div>
                    <div className="activity-right">
                      <span className={`activity-amount ${isBorrow ? "borrow" : "lend"}`}>
                        {isBorrow ? "-" : "+"}{formatBaht(r.amount)}
                      </span>
                      {!isPaidOff && r.currentBalance !== r.amount && (
                        <span className="activity-balance">เหลือ: {formatBaht(r.currentBalance)}</span>
                      )}
                    </div>
                  </div>
                  
                  {isExpanded && (
                    <div className="activity-card-actions">
                      <button 
                        className="ac-btn edit" 
                        onClick={() => router.push(`/records/${r.id}/edit`)}
                      >
                        แก้ไข
                      </button>
                      {!isPaidOff && (
                        <button 
                          className="ac-btn pay" 
                          onClick={() => handlePayback(r)}
                        >
                          จ่ายแล้ว
                        </button>
                      )}
                      <button 
                        className="ac-btn delete" 
                        onClick={() => handleDelete(r.id)}
                      >
                        ลบ
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}