"use client";

import { useState, useCallback } from "react";

interface PinKeypadProps {
  onSubmit: (pin: string) => void;
  error?: string;
  isLoading?: boolean;
  maxDigits?: number;
}

export default function PinKeypad({
  onSubmit,
  error,
  isLoading = false,
  maxDigits = 6,
}: PinKeypadProps) {
  const [pin, setPin] = useState("");
  const [shake, setShake] = useState(false);

  const handleDigit = useCallback(
    (digit: string) => {
      if (isLoading) return;
      if (pin.length >= maxDigits) return;
      const newPin = pin + digit;
      setPin(newPin);
      if (newPin.length === maxDigits) {
        onSubmit(newPin);
      }
    },
    [pin, maxDigits, isLoading, onSubmit]
  );

  const handleDelete = useCallback(() => {
    if (isLoading) return;
    setPin((prev) => prev.slice(0, -1));
  }, [isLoading]);

  const handleClear = useCallback(() => {
    if (isLoading) return;
    setPin("");
  }, [isLoading]);

  // Trigger shake when error changes
  if (error && !shake) {
    setShake(true);
    setTimeout(() => setShake(false), 500);
  }

  const digits = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "⌫"];

  return (
    <div className={`pin-keypad ${shake ? "shake" : ""}`}>
      {/* PIN dots */}
      <div className="pin-dots">
        {Array.from({ length: maxDigits }).map((_, i) => (
          <div
            key={i}
            className={`pin-dot ${i < pin.length ? "filled" : ""} ${isLoading ? "loading" : ""}`}
          />
        ))}
      </div>

      {/* Error message */}
      {error && <p className="pin-error">{error}</p>}

      {/* Digit grid */}
      <div className="pin-grid">
        {digits.map((digit, i) => {
          if (digit === "") {
            return <div key={`empty-${i}`} className="pin-key empty" />;
          }
          if (digit === "⌫") {
            return (
              <button
                key="delete"
                className="pin-key delete"
                onClick={handleDelete}
                onDoubleClick={handleClear}
                disabled={isLoading}
                type="button"
                aria-label="Delete"
              >
                ⌫
              </button>
            );
          }
          return (
            <button
              key={digit}
              className="pin-key digit"
              onClick={() => handleDigit(digit)}
              disabled={isLoading}
              type="button"
            >
              {digit}
            </button>
          );
        })}
      </div>

      <style jsx>{`
        .pin-keypad {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 24px;
        }
        .pin-dots {
          display: flex;
          gap: 14px;
        }
        .pin-dot {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          border: 2px solid var(--border-medium);
          background: transparent;
          transition: all 0.2s ease;
        }
        .pin-dot.filled {
          background: var(--accent-primary);
          border-color: var(--accent-primary);
          transform: scale(1.1);
        }
        .pin-dot.loading {
          animation: pinPulse 0.8s ease-in-out infinite;
        }
        @keyframes pinPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
        .pin-error {
          font-size: 13px;
          color: var(--accent-red);
          font-weight: 500;
          text-align: center;
        }
        .pin-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
          max-width: 280px;
          width: 100%;
        }
        .pin-key {
          width: 100%;
          aspect-ratio: 1;
          border-radius: var(--radius-sm);
          border: 1px solid var(--border-light);
          background: var(--glass-bg);
          backdrop-filter: blur(12px);
          font-size: 24px;
          font-weight: 700;
          color: var(--text-primary);
          cursor: pointer;
          transition: all 0.15s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          -webkit-tap-highlight-color: transparent;
          user-select: none;
        }
        .pin-key:active:not(:disabled) {
          transform: scale(0.92);
          background: var(--bg-card-hover);
        }
        .pin-key:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .pin-key.empty {
          border: none;
          background: transparent;
          pointer-events: none;
        }
        .pin-key.delete {
          font-size: 22px;
          color: var(--text-secondary);
          font-weight: 600;
        }
        .pin-keypad.shake {
          animation: shakeX 0.5s ease;
        }
        @keyframes shakeX {
          0%, 100% { transform: translateX(0); }
          10%, 50%, 90% { transform: translateX(-8px); }
          30%, 70% { transform: translateX(8px); }
        }
      `}</style>
    </div>
  );
}