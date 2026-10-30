"use client";

import { useRouter } from "next/navigation";
import { useRecords } from "@/hooks/useRecords";
import { useAuth } from "@/hooks/useAuth";
import { formatRelativeTime, formatBaht } from "@/lib/utils";
import { parseCategoryNote, isPaybackRecord } from "@/lib/categories";

export default function RecordsListPage() {
  const router = useRouter();
  const { profile } = useAuth();
  const profileId = profile?.id ?? "";
  const { records, isLoading, error } = useRecords(profileId, 50);

  return (
    <div className="page-container">
      <h1 className="page-title">All Records</h1>

      {isLoading && (
        <div className="activity-skeleton">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="skeleton-row glass" />
          ))}
        </div>
      )}

      {error && (
        <div className="glass error-state">
          <p>Could not load records</p>
          <button onClick={() => window.location.reload()}>Retry</button>
        </div>
      )}

      {!isLoading && !error && records.length === 0 && (
        <div className="glass empty-state">
          <p>No records yet. Tap + to add one.</p>
        </div>
      )}

      {!isLoading && !error && records.length > 0 && (
        <div className="activity-list">
          {records.map((record) => {
            const isPayback = isPaybackRecord(record.description, record.type, record.createdBy);
            const isBorrow = record.type === "borrow";
            const { category, cleanNote } = parseCategoryNote(record.description);

            let displayName = "";
            if (isPayback) {
              if (profileId.toLowerCase() === "num") {
                displayName = record.createdBy?.toLowerCase() === "num" ? "💸 โอนคืนแก้วแล้ว" : "💸 แก้วบันทึกได้รับเงินคืน";
              } else {
                displayName = record.createdBy?.toLowerCase() === "kaew" ? "💸 ได้รับเงินคืนจาก Num" : "💸 Num โอนคืนแล้ว";
              }
            } else {
              if (profileId.toLowerCase() === "num") {
                displayName = record.createdBy?.toLowerCase() === "num" ? "ยืมเงินจากแก้ว" : "แก้วจ่ายให้";
              } else {
                displayName = record.createdBy?.toLowerCase() === "kaew" ? "จ่ายให้ Num" : "Num ยืมเงิน";
              }
            }

            return (
              <div
                key={record.id}
                className={`activity-card glass ${isPayback ? "payback-card" : ""}`}
                onClick={() => router.push(`/records/${record.id}/edit`)}
                style={{ cursor: "pointer" }}
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
                      {formatRelativeTime(record.createdAt)}
                      {cleanNote && ` • ${cleanNote}`}
                    </span>
                  </div>
                </div>
                <div className="activity-right">
                  <span className={`activity-amount ${isPayback ? "payback" : (isBorrow ? "borrow" : "lend")}`}>
                    {isPayback ? `+${formatBaht(record.amount)}` : (isBorrow ? `-${formatBaht(record.amount)}` : `+${formatBaht(record.amount)}`)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}