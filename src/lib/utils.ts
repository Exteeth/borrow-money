/**
 * Format a number as Thai Baht currency string.
 * e.g. 12500 -> "฿12,500"
 */
export function formatBaht(amount: number): string {
  return new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format a number as compact Thai Baht (thousands with K/M suffix).
 * e.g. 12500 -> "฿12.5K", 1500000 -> "฿1.5M"
 */
export function formatBahtCompact(amount: number): string {
  if (Math.abs(amount) >= 1_000_000) {
    return `฿${(amount / 1_000_000).toFixed(1)}M`;
  }
  if (Math.abs(amount) >= 1_000) {
    return `฿${(amount / 1_000).toFixed(1)}K`;
  }
  return `฿${amount.toLocaleString("th-TH")}`;
}

/**
 * Format a Firestore Timestamp or Date to a readable Thai locale string.
 */
export function formatDate(date: Date | null | undefined): string {
  if (!date) return "-";
  return new Intl.DateTimeFormat("th-TH", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

/**
 * Format date as relative time (e.g. "2 ชั่วโมงที่แล้ว", "3 วันที่แล้ว").
 */
export function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  const diffHr = Math.floor(diffMs / 3_600_000);
  const diffDay = Math.floor(diffMs / 86_400_000);

  if (diffMin < 1) return "เมื่อสักครู่";
  if (diffMin < 60) return `${diffMin} นาทีที่แล้ว`;
  if (diffHr < 24) return `${diffHr} ชั่วโมงที่แล้ว`;
  if (diffDay < 7) return `${diffDay} วันที่แล้ว`;
  return formatDate(date);
}

/**
 * Generate a unique device ID (simple UUID v4 substitute).
 */
export function generateDeviceId(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}