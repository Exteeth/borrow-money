export interface Category {
  id: string;
  name: string;
  emoji: string;
  shortLabel: string;
}

export const CATEGORIES: Category[] = [
  { id: "food", emoji: "🍜", name: "อาหาร & เครื่องดื่ม", shortLabel: "อาหาร" },
  { id: "transport", emoji: "🚗", name: "เดินทาง & น้ำมัน", shortLabel: "เดินทาง" },
  { id: "shopping", emoji: "🛒", name: "ช้อปปิ้ง & ของใช้", shortLabel: "ช้อปปิ้ง" },
  { id: "bills", emoji: "🏠", name: "บิล & ค่าห้อง", shortLabel: "บิล/ห้อง" },
  { id: "trip", emoji: "✈️", name: "ทริปเที่ยว & พักผ่อน", shortLabel: "ทริปเที่ยว" },
  { id: "health", emoji: "💊", name: "สุขภาพ & ยา", shortLabel: "สุขภาพ" },
  { id: "cash", emoji: "💵", name: "เงินสด / หมุนเวียน", shortLabel: "เงินสด" },
  { id: "other", emoji: "📦", name: "อื่นๆ", shortLabel: "อื่นๆ" },
];

export const DEFAULT_CATEGORY_ID = "food";
export const DEFAULT_CATEGORY: Category = {
  id: "other",
  emoji: "📦",
  name: "อื่นๆ",
  shortLabel: "อื่นๆ",
};

export function getCategoryById(id: string): Category {
  const found = CATEGORIES.find((c) => c.id === id);
  return found ?? DEFAULT_CATEGORY;
}

/**
 * Formats note with category tag: e.g. "[🍜 อาหาร & เครื่องดื่ม] ข้าวเที่ยง"
 */
export function formatCategoryNote(categoryId: string, note?: string): string {
  const cat = getCategoryById(categoryId);
  const clean = (note || "").replace(/^\[.*?\]\s*/, "").trim();
  if (!clean) {
    return `[${cat.emoji} ${cat.name}]`;
  }
  return `[${cat.emoji} ${cat.name}] ${clean}`;
}

/**
 * Parses category and clean note from record description
 */
export function parseCategoryNote(description?: string): {
  category: Category;
  cleanNote: string;
} {
  const raw = (description || "").trim();
  if (!raw) {
    return { category: getCategoryById("other"), cleanNote: "" };
  }

  // Check if starts with [emoji name] or [id]
  const match = raw.match(/^\[([\s\S]*?)\]\s*([\s\S]*)$/);
  if (match && match[1] !== undefined) {
    const tagContent = match[1].trim();
    const cleanNote = (match[2] ?? "").trim();

    // Check if tagContent matches emoji or name or id
    const found = CATEGORIES.find(
      (c) =>
        tagContent.includes(c.emoji) ||
        tagContent.toLowerCase() === c.id.toLowerCase() ||
        tagContent.includes(c.name) ||
        tagContent.includes(c.shortLabel)
    );

    if (found) {
      return { category: found, cleanNote };
    }
  }

  // If no tag format found, return other and the full text as clean note
  return { category: getCategoryById("other"), cleanNote: raw };
}
