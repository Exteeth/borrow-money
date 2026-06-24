"use client";

import { useEffect, useState, useRef } from "react";

interface BalanceCircleProps {
  totalOwed: number; // positive = they owe you, negative = you owe
  otherPersonName?: string; // name of the other person (e.g. "Kaew" or "Num")
}

export default function BalanceCircle({ totalOwed, otherPersonName }: BalanceCircleProps) {
  const [displayAmount, setDisplayAmount] = useState(0);
  const animRef = useRef<number>(0);

  const isPositive = totalOwed >= 0;
  const person = otherPersonName || "they";
  const label = isPositive
    ? `${person} owes you`
    : `You owe ${person}`;

  // Animate the counter with slow elegant easing
  useEffect(() => {
    const target = totalOwed;
    let start: number | null = null;
    const duration = 1200;

    const animate = (timestamp: number) => {
      if (start === null) start = timestamp;
      const elapsed = timestamp - start;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayAmount(Math.round(eased * target));
      if (progress < 1) {
        animRef.current = requestAnimationFrame(animate);
      }
    };

    animRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animRef.current);
  }, [totalOwed]);

  return (
    <div className="wisdom-card-wrapper">
      <div className="wisdom-card">
        {/* Luxury Gold Reflection & Pattern */}
        <div className="wisdom-card-pattern" />
        <div className="wisdom-card-glow" />
        
        {/* Card Header */}
        <div className="wisdom-card-header">
          <div className="wisdom-card-brand-group">
            <span className="wisdom-card-brand">THE WISDOM</span>
            <span className="wisdom-card-type">PRIVATE DEBT</span>
          </div>
          <div className="wisdom-card-chip" />
        </div>

        {/* Card Balance */}
        <div className="wisdom-card-body">
          <span className="wisdom-card-label">CURRENT OUTSTANDING</span>
          <span className={`wisdom-card-amount ${isPositive ? "positive" : "negative"}`}>
            {displayAmount >= 0 ? "+" : ""}{displayAmount.toLocaleString("th-TH")} ฿
          </span>
        </div>

        {/* Card Footer */}
        <div className="wisdom-card-footer">
          <div className="wisdom-card-holder-group">
            <span className="wisdom-card-holder-label">CARDHOLDERS</span>
            <span className="wisdom-card-holder">NUM & KAEW</span>
          </div>
          <span className={`wisdom-card-status-badge ${isPositive ? "positive" : "negative"}`}>
            {label}
          </span>
        </div>
      </div>
    </div>
  );
}