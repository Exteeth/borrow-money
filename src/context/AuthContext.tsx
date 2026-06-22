"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";

export interface AuthProfile {
  id: string;
  name: string;
  avatarType: "male" | "female";
  color: string;
}

interface AuthState {
  profile: AuthProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (profileId: string, pin: string) => Promise<{ success: boolean; error?: string; lockout?: boolean }>;
  logout: () => Promise<void>;
  checkSession: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<AuthProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const login = useCallback(
    async (profileId: string, pin: string) => {
      try {
        const res = await fetch("/api/auth", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ profileId, pin }),
        });
        const data = await res.json() as { success?: boolean; error?: string; lockout?: boolean; profile?: AuthProfile };

        if (res.ok && data.success && data.profile) {
          setProfile(data.profile);
          return { success: true };
        }
        return {
          success: false,
          error: data.error ?? "Login failed",
          lockout: data.lockout,
        };
      } catch {
        return { success: false, error: "Network error" };
      }
    },
    []
  );

  const logout = useCallback(async () => {
    try {
      await fetch("/api/auth", { method: "DELETE" });
    } finally {
      setProfile(null);
    }
  }, []);

  const checkSession = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/check");
      if (res.ok) {
        const data = await res.json() as { profile: AuthProfile | null };
        if (data.profile) {
          setProfile(data.profile);
        }
      }
    } catch {
      // Not authenticated — stay on login page
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  return (
    <AuthContext.Provider
      value={{
        profile,
        isAuthenticated: !!profile,
        isLoading,
        login,
        logout,
        checkSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuthContext must be used within AuthProvider");
  }
  return ctx;
}