"use client";

import { useState, useMemo } from "react";
import { useTransactions } from "@/hooks/useTransactions";
import { formatRelativeTime, formatBaht } from "@/lib/utils";

const ACTION_LABELS: Record<string, string> = {
  create: "Created",
  edit: "Edited",
  decrease: "Paid back",
  delete: "Deleted",
};

export default function TransactionsPage() {
  const { transactions, isLoading, error } = useTransactions();
  const [filter, setFilter] = useState<string>("all");

  const filtered = useMemo(() => {
    if (filter === "all") return transactions;
    return transactions.filter((t) => t.action === filter);
  }, [transactions, filter]);

  return (
    <div className="page-container">
      <h1 className="page-title">Transaction History</h1>

      {/* Filters */}
      <div className="filter-row">
        {["all", "create", "decrease", "edit"].map((f) => (
          <button
            key={f}
            className={`filter-chip ${filter === f ? "active" : ""}`}
            onClick={() => setFilter(f)}
          >
            {f === "all" ? "All" : ACTION_LABELS[f] ?? f}
          </button>
        ))}
      </div>

      {isLoading && (
        <div className="activity-skeleton">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="skeleton-row glass" />
          ))}
        </div>
      )}

      {error && (
        <div className="glass error-state">
          <p>Could not load transactions</p>
          <button onClick={() => window.location.reload()}>Retry</button>
        </div>
      )}

      {!isLoading && !error && filtered.length === 0 && (
        <div className="glass empty-state">
          <p>No transactions yet. Activity will appear here.</p>
        </div>
      )}

      {!isLoading && !error && filtered.length > 0 && (
        <div className="txn-list">
          {filtered.map((txn) => (
            <div key={txn.id} className={`txn-card glass txn-${txn.action}`}>
              <div className="txn-left">
                <div className={`txn-dot txn-${txn.action}`} />
                <div className="txn-info">
                  <span className="txn-action">
                    {ACTION_LABELS[txn.action] ?? txn.action}
                  </span>
                  <span className="txn-editor">by {txn.editedByName}</span>
                </div>
              </div>
              <div className="txn-right">
                <span className="txn-amount">{formatBaht(txn.amount)}</span>
                <span className="txn-balance">
                  {txn.action === "decrease"
                    ? `${formatBaht(txn.prevBalance)} → ${formatBaht(txn.newBalance)}`
                    : formatRelativeTime(txn.createdAt)}
                </span>
              </div>
              {txn.note && <p className="txn-note">{txn.note}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}