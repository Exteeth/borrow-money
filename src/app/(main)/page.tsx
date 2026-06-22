"use client";

import { useMemo } from "react";
import BalanceCircle from "@/components/BalanceCircle";
import QuickActions from "@/components/QuickActions";
import { useRecords, type Record } from "@/hooks/useRecords";
import { useAuth } from "@/hooks/useAuth";
import { formatRelativeTime, formatBaht } from "@/lib/utils";

export default function DashboardPage() {
  const { profile } = useAuth();
  const profileId = profile?.id ?? "";
  const myName = profile?.name ?? "";
  const { records, totalOwed, isLoading, error } = useRecords(profileId);

  // Figure out the other person's name
  const otherName = useMemo(() => {
    if (!myName) return "them";
    if (myName === "Num") return "Kaew";
    if (myName === "Kaew") return "Num";
    // Check records for the most common other name
    const nameCount = new Map<string, number>();
    for (const r of records) {
      if (r.personName !== myName) {
        nameCount.set(r.personName, (nameCount.get(r.personName) ?? 0) + 1);
      }
    }
    let top = "";
    let topCount = 0;
    for (const [name, count] of nameCount) {
      if (count > topCount) { top = name; topCount = count; }
    }
    return top || "them";
  }, [myName, records]);

  return (
    <div className="dashboard">
      {/* Balance Circle */}
      <div className="dashboard-hero">
        <BalanceCircle totalOwed={totalOwed} otherPersonName={otherName} />
      </div>

      {/* Quick Actions */}
      <QuickActions />

      {/* Recent Activity */}
      <div className="dashboard-section">
        <h2 className="section-heading">Recent Activity</h2>
        
        {isLoading && (
          <div className="activity-skeleton">
            {[1, 2, 3].map((i) => (
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
            <p>No records yet. Tap Add to start tracking money.</p>
          </div>
        )}

        {!isLoading && !error && records.length > 0 && (
          <div className="activity-list">
            {records.slice(0, 5).map((record) => (
              <ActivityCard key={record.id} record={record} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ActivityCard({ record }: { record: Record }) {
  const isBorrow = record.type === "borrow";
  const isPaidOff = record.currentBalance === 0;

  return (
    <div className={`activity-card glass ${isPaidOff ? "paid-off" : ""}`}>
      <div className="activity-left">
        <div className={`activity-icon ${isBorrow ? "borrow" : "lend"}`}>
          {isBorrow ? (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
          )}
        </div>
        <div className="activity-info">
          <span className="activity-name">{record.personName}</span>
          <span className="activity-time">{formatRelativeTime(record.createdAt)}</span>
        </div>
      </div>
      <div className="activity-right">
        <span className={`activity-amount ${isBorrow ? "borrow" : "lend"}`}>
          {isBorrow ? "-" : "+"}{formatBaht(record.amount)}
        </span>
        {!isPaidOff && record.currentBalance !== record.amount && (
          <span className="activity-balance">
            Remaining: {formatBaht(record.currentBalance)}
          </span>
        )}
      </div>
    </div>
  );
}