"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import PinKeypad from "@/components/PinKeypad";

// Placeholder profiles until Firestore is connected
const DEFAULT_PROFILES = [
  { id: "num", name: "Num", avatarType: "male" as const, color: "#6c5ce7" },
  { id: "kaew", name: "Kaew", avatarType: "female" as const, color: "#e84393" },
];

export default function LoginPage() {
  const router = useRouter();
  const [selectedProfile, setSelectedProfile] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);



  const profile = DEFAULT_PROFILES.find((p) => p.id === selectedProfile);

  const handlePinSubmit = async (pin: string) => {
    if (!selectedProfile) return;
    setIsLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profileId: selectedProfile, pin }),
      });

      const data = await res.json() as {
        success?: boolean;
        error?: string;
        lockout?: boolean;
      };

      if (res.ok && data.success) {
        router.push("/");
        router.refresh();
      } else {
        setError(data.error ?? "Login failed");
        if (data.lockout) {
          setIsLoading(false);
          return;
        }
      }
    } catch {
      setError("Network error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card glass">
        {/* Header */}
        <div className="login-header">
          <h1 className="login-title">Money Borrow</h1>
          <p className="login-subtitle">
            {selectedProfile && profile
              ? `Enter PIN for ${profile.name}`
              : "Who are you?"}
          </p>
        </div>

        {/* Profile Selection (when none selected) */}
        {!selectedProfile && (
          <div className="profile-grid">
            {DEFAULT_PROFILES.map((prof) => (
              <button
                key={prof.id}
                className="profile-card"
                onClick={() => setSelectedProfile(prof.id)}
                type="button"
              >
                <div className="profile-avatar" style={{ "--profile-color": prof.color, borderColor: "rgba(197, 160, 89, 0.35)" } as any}>
                  {prof.avatarType === "male" ? (
                    <svg viewBox="0 0 24 24" fill="none" stroke="url(#loginAvatarGold)" strokeWidth="1.5">
                      <defs>
                        <linearGradient id="loginAvatarGold" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#f5e6c4" />
                          <stop offset="50%" stopColor="#c5a059" />
                          <stop offset="100%" stopColor="#9a7a35" />
                        </linearGradient>
                      </defs>
                      <circle cx="12" cy="8" r="4" />
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    </svg>
                  ) : (
                    /* Female avatar SVG */
                    <svg viewBox="0 0 24 24" fill="none" stroke="url(#loginAvatarGold)" strokeWidth="1.5">
                      <defs>
                        <linearGradient id="loginAvatarGold" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#f5e6c4" />
                          <stop offset="50%" stopColor="#c5a059" />
                          <stop offset="100%" stopColor="#9a7a35" />
                        </linearGradient>
                      </defs>
                      <circle cx="12" cy="8" r="4" />
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <path d="M12 12v5M9 14h6" />
                    </svg>
                  )}
                </div>
                <span className="profile-name">{prof.name}</span>
              </button>
            ))}
          </div>
        )}

        {/* PIN Keypad (when profile selected) */}
        {selectedProfile && (
          <>
            <PinKeypad
              onSubmit={handlePinSubmit}
              error={error}
              isLoading={isLoading}
            />

            {/* Back button */}
            <button
              className="back-button"
              onClick={() => {
                setSelectedProfile(null);
                setError("");
              }}
              disabled={isLoading}
              type="button"
            >
              ← Back to profiles
            </button>
          </>
        )}
      </div>

      <style jsx>{`
        .login-container {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          background: var(--bg-primary);
          position: relative;
          overflow: hidden;
        }

        /* Soft background shapes */
        .login-container::before {
          content: '';
          position: absolute;
          width: 400px;
          height: 400px;
          border-radius: 50%;
          background: rgba(108, 92, 231, 0.08);
          top: -5%;
          left: -10%;
          filter: blur(100px);
          animation: float 25s ease-in-out infinite;
        }
        .login-container::after {
          content: '';
          position: absolute;
          width: 350px;
          height: 350px;
          border-radius: 50%;
          background: rgba(232, 67, 147, 0.06);
          bottom: -5%;
          right: -10%;
          filter: blur(90px);
          animation: float 20s ease-in-out infinite reverse;
        }
        @keyframes float {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(20px, -15px) scale(1.03); }
          66% { transform: translate(-10px, 10px) scale(0.97); }
        }

        .login-card {
          padding: 48px 36px 36px;
          max-width: 380px;
          width: 100%;
          text-align: center;
          position: relative;
          z-index: 1;
        }

        .login-header {
          margin-bottom: 32px;
        }

        .login-title {
          font-size: 28px;
          font-weight: 800;
          color: var(--text-primary);
          margin-bottom: 6px;
          letter-spacing: -0.5px;
        }

        .login-subtitle {
          font-size: 15px;
          color: var(--text-secondary);
          font-weight: 500;
        }

        .profile-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }

        .profile-card {
          padding: 24px 16px;
          border-radius: var(--radius);
          border: 2px solid var(--border-light);
          background: var(--glass-bg);
          backdrop-filter: blur(12px);
          cursor: pointer;
          transition: all 0.25s ease;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
        }

        .profile-card:hover {
          border-color: var(--accent-primary);
          transform: translateY(-3px);
          box-shadow: var(--shadow-md);
        }

        .profile-card:active {
          transform: scale(0.97);
        }

        .profile-avatar {
          width: 76px;
          height: 76px;
          border-radius: 50%;
          border: 2px solid rgba(197, 160, 89, 0.35);
          display: flex;
          align-items: center;
          justify-content: center;
          background: radial-gradient(circle at top left, rgba(29, 30, 34, 0.95), rgba(11, 12, 14, 0.98));
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.55), 0 0 0 3px rgba(0, 0, 0, 0.4), inset 0 0 10px rgba(255, 255, 255, 0.05);
          position: relative;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .profile-avatar::after {
          content: '';
          position: absolute;
          inset: -5px;
          border-radius: 50%;
          border: 1px solid var(--profile-color);
          opacity: 0.35;
          filter: drop-shadow(0 0 6px var(--profile-color));
          pointer-events: none;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .profile-card:hover .profile-avatar {
          transform: scale(1.05);
          border-color: rgba(197, 160, 89, 0.65);
          box-shadow: 0 12px 28px rgba(0, 0, 0, 0.65), 0 0 0 4px rgba(0, 0, 0, 0.35), inset 0 0 15px rgba(255, 255, 255, 0.08);
        }

        .profile-card:hover .profile-avatar::after {
          opacity: 0.75;
          inset: -7px;
          filter: drop-shadow(0 0 10px var(--profile-color));
        }

        .profile-avatar svg {
          width: 40px;
          height: 40px;
          filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.4));
        }

        .profile-name {
          font-size: 16px;
          font-weight: 700;
          color: var(--text-primary);
        }

        .back-button {
          margin-top: 24px;
          padding: 10px 20px;
          border: none;
          background: transparent;
          color: var(--text-secondary);
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: color 0.2s ease;
          border-radius: var(--radius-sm);
        }

        .back-button:hover {
          color: var(--text-primary);
        }

        .back-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
}