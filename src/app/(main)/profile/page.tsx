"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useRecords } from "@/hooks/useRecords";
import { formatBaht } from "@/lib/utils";

export default function ProfilePage() {
  const router = useRouter();
  const { profile, logout } = useAuth();
  const { records } = useRecords(profile?.id ?? "", 200);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Calculate personal stats
  const myRecords = records.filter((r) => r.createdBy === profile?.id);
  const totalLent = myRecords
    .filter((r) => r.type === "lend")
    .reduce((sum, r) => sum + r.currentBalance, 0);
  const totalBorrowed = myRecords
    .filter((r) => r.type === "borrow")
    .reduce((sum, r) => sum + r.currentBalance, 0);
  const netBalance = totalLent - totalBorrowed;

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await logout();
    router.push("/login");
    router.refresh();
  };

  if (!profile) return null;

  return (
    <div className="page-container">
      {/* Avatar Card */}
      <div className="glass profile-card">
        <div className="profile-avatar-lg" style={{ borderColor: profile.color }}>
          {profile.avatarType === "male" ? (
            <svg viewBox="0 0 24 24" fill="none" stroke={profile.color} strokeWidth="1.5">
              <circle cx="12" cy="8" r="4" />
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke={profile.color} strokeWidth="1.5">
              <circle cx="12" cy="8" r="4" />
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <path d="M12 12v5M9 14h6" />
            </svg>
          )}
        </div>
        <h2 className="profile-name-lg">{profile.name}</h2>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <div className="glass stat-card">
          <span className="stat-label">Total Lent</span>
          <span className="stat-value positive">{formatBaht(totalLent)}</span>
        </div>
        <div className="glass stat-card">
          <span className="stat-label">Total Borrowed</span>
          <span className="stat-value negative">{formatBaht(totalBorrowed)}</span>
        </div>
        <div className="glass stat-card">
          <span className="stat-label">Net Balance</span>
          <span className={`stat-value ${netBalance >= 0 ? "positive" : "negative"}`}>
            {formatBaht(netBalance)}
          </span>
        </div>
        <div className="glass stat-card">
          <span className="stat-label">Records</span>
          <span className="stat-value">{myRecords.length}</span>
        </div>
      </div>

      {/* Switch User */}
      <div className="profile-actions">
        <button
          className="action-btn secondary"
          disabled={isLoggingOut}
        >
          Switch Profile (coming soon)
        </button>
        <button
          className="action-btn danger"
          onClick={handleLogout}
          disabled={isLoggingOut}
        >
          {isLoggingOut ? "Logging out..." : "Log Out"}
        </button>
      </div>
    </div>
  );
}