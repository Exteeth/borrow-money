"use client";

import { useRouter } from "next/navigation";

export default function QuickActions() {
  const router = useRouter();

  return (
    <div className="quick-actions">
      <button
        className="quick-action-btn add"
        onClick={() => router.push("/records/new")}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M12 5v14M5 12h14" />
        </svg>
        <span>Add</span>
      </button>
      <button
        className="quick-action-btn payback"
        onClick={() => router.push("/records/new?action=decrease")}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M20 12H4M12 4l-8 8 8 8" />
        </svg>
        <span>Paid Back</span>
      </button>
    </div>
  );
}