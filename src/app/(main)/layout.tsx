"use client";

import { AuthProvider } from "@/context/AuthContext";
import { ToastProvider } from "@/context/ToastContext";
import BottomNav from "@/components/BottomNav";
import type { ReactNode } from "react";

export default function MainLayout({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <ToastProvider>
        <div className="main-layout">
          <main className="main-content">{children}</main>
          <BottomNav />
        </div>
      </ToastProvider>
    </AuthProvider>
  );
}
