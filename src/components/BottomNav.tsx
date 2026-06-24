"use client";

import { usePathname, useRouter } from "next/navigation";

interface NavItem {
  href: string;
  label: string;
  icon: "home" | "history" | "add" | "records" | "profile";
}

const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Home", icon: "home" },
  { href: "/transactions", label: "History", icon: "history" },
  { href: "/profile", label: "Profile", icon: "profile" },
];

function NavIcon({ icon, active }: { icon: string; active: boolean }) {
  const stroke = active ? "var(--accent-primary)" : "var(--text-muted)";
  const strokeW = 2;

  switch (icon) {
    case "home":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={strokeW}>
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      );
    case "history":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={strokeW}>
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
        </svg>
      );
    case "records":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={strokeW}>
          <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        </svg>
      );
    case "profile":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={strokeW}>
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      );
    case "add":
      // FAB — always uses special styling
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      );
    default:
      return null;
  }
}

export default function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <nav className="bottom-nav">
      {NAV_ITEMS.map((item) => {
        const isActive =
          item.href === "/"
            ? pathname === "/" || pathname === "/records/new"
            : pathname.startsWith(item.href);

        if (item.icon === "add") {
          return (
            <button
              key={item.href}
              className="bottom-nav-fab"
              onClick={() => router.push(item.href)}
              aria-label={item.label}
            >
              <NavIcon icon={item.icon} active={false} />
            </button>
          );
        }

        return (
          <button
            key={item.href}
            className={`bottom-nav-item ${isActive ? "active" : ""}`}
            onClick={() => router.push(item.href)}
          >
            <NavIcon icon={item.icon} active={isActive} />
            <span>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}