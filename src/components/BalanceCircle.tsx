"use client";

import { useEffect, useState, useRef } from "react";
import { formatBahtCompact } from "@/lib/utils";

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

  // Animate the counter
  useEffect(() => {
    const target = totalOwed;
    let start: number | null = null;
    const duration = 800;

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
    <div className="balance-circle-wrapper">
      <div className="balance-circle">
        <div className="balance-inner">
          <span className={`balance-amount ${isPositive ? "positive" : "negative"}`}>
            {formatBahtCompact(displayAmount)}
          </span>
          <span className="balance-label">{label}</span>
        </div>
      </div>
    </div>
  );
}