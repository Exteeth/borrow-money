"use client";

import { useRouter } from "next/navigation";
import { useRecords } from "@/hooks/useRecords";
import { useAuth } from "@/hooks/useAuth";
import { formatRelativeTime, formatBaht } from "@/lib/utils";
import { parseCategoryNote } from "@/lib/categories";

export default function RecordsListPage() {
  const router = useRouter();
  const { profile } = useAuth();
  const { records, isLoading, error } = useRecords(profile?.id ?? "", 50);

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
            const isBorrow = record.type === "borrow";
            const isPaidOff = record.currentBalance === 0;
            const { category, cleanNote } = parseCategoryNote(record.description);

            return (
              <div
                key={record.id}
                className={`activity-card glass ${isPaidOff ? "paid-off" : ""}`}
                onClick={() => router.push(`/records/${record.id}/edit`)}
                style={{ cursor: "pointer" }}
              >
                <div className="activity-left">
                  <div className={`activity-icon ${isBorrow ? "borrow" : "lend"}`}>
                    {category.id !== "other" ? category.emoji : (isBorrow ? "↓" : "↑")}
                  </div>
                  <div className="activity-info">
                    <div className="activity-title-row">
                      <span className="activity-name">{record.personName}</span>
                      <span className="activity-category-badge">
                        {category.emoji} {category.shortLabel}
                      </span>
                    </div>
                    <span className="activity-time">
                      {formatRelativeTime(record.createdAt)}
                      {cleanNote && ` • ${cleanNote}`}
                    </span>
                  </div>
                </div>
                <div className="activity-right">
                  <span className={`activity-amount ${isBorrow ? "borrow" : "lend"}`}>
                    {isBorrow ? "-" : "+"}{formatBaht(record.amount)}
                  </span>
                  {!isPaidOff && record.currentBalance !== record.amount && (
                    <span className="activity-balance">Remaining: {formatBaht(record.currentBalance)}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}