"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useRecords } from "@/hooks/useRecords";
import { useAuth } from "@/hooks/useAuth";
import { formatRelativeTime, formatBaht } from "@/lib/utils";
import BalanceCircle from "@/components/BalanceCircle";
import { useToast } from "@/context/ToastContext";
import CategoryChips from "@/components/CategoryChips";
import { formatCategoryNote, parseCategoryNote, DEFAULT_CATEGORY_ID, isPaybackRecord } from "@/lib/categories";

export default function DashboardPage() {
  const router = useRouter();
  const { profile } = useAuth();
  const profileId = profile?.id ?? "";
  const myName = profile?.name ?? "";
  const { records, totalOwed, isLoading, error, refetch } = useRecords(profileId);
  const { addToast } = useToast();

  // Quick Add state
  const [addAmount, setAddAmount] = useState("");
  const [addNote, setAddNote] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>(DEFAULT_CATEGORY_ID);
  const [addSaving, setAddSaving] = useState(false);
  const [addError, setAddError] = useState("");

  // Inline Controls state
  const [expandedRecordId, setExpandedRecordId] = useState<string | null>(null);

  const otherName = useMemo(() => {
    const idLower = profileId.toLowerCase();
    if (idLower === "num") return "Kaew";
    if (idLower === "kaew") return "Num";
    return "Other";
  }, [profileId]);

  const handleAmountChange = (val: string) => {
    // Only allow whole numbers
    const clean = val.replace(/[^0-9]/g, "");
    setAddAmount(clean);
    if (addError) setAddError("");
  };

  const handleQuickAdd = async (actionType: "debt" | "payback") => {
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

    const isKaew = profileId.toLowerCase() === "kaew";
    let recordType: "borrow" | "lend";
    let targetPerson: string;
    let defaultNote: string;

    if (actionType === "debt") {
      recordType = isKaew ? "lend" : "borrow";
      targetPerson = isKaew ? "Num" : "Kaew";
      defaultNote = isKaew ? "จ่ายให้ Num" : "ยืมเงินจากแก้ว";
    } else {
      recordType = isKaew ? "borrow" : "lend";
      targetPerson = isKaew ? "Num" : "Kaew";
      defaultNote = isKaew ? "ได้รับเงินคืนจาก Num" : "คืนเงินให้แก้ว";
    }

    const effectiveCategory = actionType === "payback" && selectedCategory === DEFAULT_CATEGORY_ID
      ? "payback"
      : selectedCategory;

    const finalDescription = formatCategoryNote(effectiveCategory, addNote.trim() || defaultNote);

    try {
      const res = await fetch("/api/records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: recordType,
          personName: targetPerson,
          amount: parsed,
          description: finalDescription,
          createdBy: profile.id,
          createdByName: profile.name,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Insert failed");
      }

      // Refresh records to update balance
      refetch();

      setAddAmount("");
      setAddNote("");
      setSelectedCategory(DEFAULT_CATEGORY_ID);
      addToast(actionType === "debt" ? "บันทึกข้อมูลสำเร็จ" : "บันทึกการคืนเงินสำเร็จ", "success");
    } catch (err: any) {
      console.error(err);
      setAddError("ล้มเหลวในการบันทึกข้อมูล");
      addToast("ล้มเหลวในการบันทึกข้อมูล", "error");
    } finally {
      setAddSaving(false);
    }
  };

  const handleDelete = async (recordId: string) => {
    if (!profile) return;
    if (!window.confirm("ต้องการลบรายการนี้ใช่หรือไม่? (ข้อมูลนี้จะหายไปจากประวัติทันที)")) return;
    try {
      const res = await fetch(`/api/records/${recordId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Delete failed");
      }

      // Refresh records to update balance
      refetch();

      addToast("ลบรายการธุรกรรมสำเร็จ", "success");
      setExpandedRecordId(null);
    } catch (err: any) {
      console.error(err);
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
            onKeyDown={e => { if (e.key === "Enter") handleQuickAdd("debt"); }}
            disabled={addSaving}
          />
        </div>
        
        {/* Category Chips Selector */}
        <CategoryChips
          selectedCategoryId={selectedCategory}
          onSelectCategory={setSelectedCategory}
          disabled={addSaving}
        />

        <input
          className="wisdom-note-input"
          type="text"
          placeholder="โน้ตบันทึกสั้นๆ (เช่น ค่าหมูกระทะ, กาแฟ)..."
          value={addNote}
          onChange={e => setAddNote(e.target.value)}
          disabled={addSaving}
        />
        
        {addError && <p className="form-error">{addError}</p>}
        
        <div className="wisdom-actions-row">
          <button 
            className="wisdom-submit-btn" 
            onClick={() => handleQuickAdd("debt")} 
            disabled={addSaving || !addAmount}
          >
            {addSaving ? "กำลังบันทึก..." : myName === "Kaew" ? "จ่ายให้ Num / ให้ยืม" : "ยืมเงิน / แฟนจ่ายให้"}
          </button>
          <button 
            className="wisdom-submit-btn secondary" 
            onClick={() => handleQuickAdd("payback")} 
            disabled={addSaving || !addAmount}
          >
            {addSaving ? "กำลังบันทึก..." : myName === "Kaew" ? "💸 ได้รับเงินคืน" : "💸 คืนเงินแฟน"}
          </button>
        </div>
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
              const isPayback = isPaybackRecord(r.description, r.type, r.createdBy);
              const isBorrow = r.type === "borrow";
              const isExpanded = expandedRecordId === r.id;
              const { category, cleanNote } = parseCategoryNote(r.description);
              
              let displayName = "";
              if (isPayback) {
                if (profileId.toLowerCase() === "num") {
                  displayName = r.createdBy?.toLowerCase() === "num" ? "💸 โอนคืนแก้วแล้ว" : "💸 แก้วบันทึกได้รับเงินคืน";
                } else {
                  displayName = r.createdBy?.toLowerCase() === "kaew" ? "💸 ได้รับเงินคืนจาก Num" : "💸 Num โอนคืนแล้ว";
                }
              } else {
                if (profileId.toLowerCase() === "num") {
                  displayName = r.createdBy?.toLowerCase() === "num" ? "ยืมเงินจากแก้ว" : "แก้วจ่ายให้";
                } else {
                  displayName = r.createdBy?.toLowerCase() === "kaew" ? "จ่ายให้ Num" : "Num ยืมเงิน";
                }
              }
              
              return (
                <div 
                  key={r.id} 
                  className={`activity-card glass ${isPayback ? "payback-card" : ""}`}
                >
                  <div 
                    className="activity-card-main-row" 
                    onClick={() => setExpandedRecordId(isExpanded ? null : r.id)}
                  >
                    <div className="activity-left">
                      <div className={`activity-icon ${isPayback ? "payback" : (isBorrow ? "borrow" : "lend")}`}>
                        {isPayback ? "💸" : (category.id !== "other" ? category.emoji : (isBorrow ? "↓" : "↑"))}
                      </div>
                      <div className="activity-info">
                        <div className="activity-title-row">
                          <span className="activity-name">{displayName}</span>
                          <span className={`activity-category-badge ${isPayback ? "payback" : ""}`}>
                            {isPayback ? "💸 คืนเงิน" : `${category.emoji} ${category.shortLabel}`}
                          </span>
                        </div>
                        <span className="activity-time">
                          {formatRelativeTime(r.createdAt)}
                          {cleanNote && ` • ${cleanNote}`}
                        </span>
                      </div>
                    </div>
                    <div className="activity-right">
                      <span className={`activity-amount ${isPayback ? "payback" : (isBorrow ? "borrow" : "lend")}`}>
                        {isPayback ? `+${formatBaht(r.amount)}` : (isBorrow ? `-${formatBaht(r.amount)}` : `+${formatBaht(r.amount)}`)}
                      </span>
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