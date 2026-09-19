"use client";

import { CATEGORIES } from "@/lib/categories";

interface CategoryChipsProps {
  selectedCategoryId: string;
  onSelectCategory: (categoryId: string) => void;
  disabled?: boolean;
}

export default function CategoryChips({
  selectedCategoryId,
  onSelectCategory,
  disabled = false,
}: CategoryChipsProps) {
  return (
    <div className="category-chips-container" role="radiogroup" aria-label="หมวดหมู่ค่าใช้จ่าย">
      <div className="category-chips-scroll">
        {CATEGORIES.map((cat) => {
          const isSelected = cat.id === selectedCategoryId;
          return (
            <button
              key={cat.id}
              type="button"
              role="radio"
              aria-checked={isSelected}
              className={`category-chip ${isSelected ? "active" : ""}`}
              onClick={() => onSelectCategory(cat.id)}
              disabled={disabled}
            >
              <span className="category-chip-emoji">{cat.emoji}</span>
              <span className="category-chip-label">{cat.shortLabel}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
