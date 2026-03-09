"use client";

import * as React from "react";
import { X, Sparkles, Check } from "lucide-react";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import { Card, CardContent, CardFooter } from "@workspace/ui/components/card";
import { Label } from "@workspace/ui/components/label";
import { useSearchStore, type BusinessCategory } from "@/lib/store";
import { cn } from "@workspace/ui/lib/utils";

export interface CategoryConfig {
  id: BusinessCategory;
  label: string;
  icon: string;
  hasFoundingPartner?: boolean;
}

export const CATEGORY_CONFIGS: CategoryConfig[] = [
  {
    id: "eats-drinks",
    label: "Eats & Drinks",
    icon: "🍔",
    hasFoundingPartner: false, // TODO: Connect to actual founder data
  },
  {
    id: "home-services",
    label: "Home Services",
    icon: "🛠️",
    hasFoundingPartner: false,
  },
  {
    id: "health-wellness",
    label: "Health & Wellness",
    icon: "🩺",
    hasFoundingPartner: false,
  },
  {
    id: "shopping-retail",
    label: "Shopping & Retail",
    icon: "🛍️",
    hasFoundingPartner: false,
  },
  {
    id: "professional",
    label: "Professional",
    icon: "⚖️",
    hasFoundingPartner: false,
  },
  {
    id: "auto-travel",
    label: "Auto & Travel",
    icon: "🚗",
    hasFoundingPartner: false,
  },
  {
    id: "things-to-do",
    label: "Things to Do",
    icon: "🎭",
    hasFoundingPartner: false,
  },
  {
    id: "community",
    label: "Community",
    icon: "❤️",
    hasFoundingPartner: false,
  },
];

interface CategoryBentoProps {
  onApply?: () => void;
  className?: string;
}

/**
 * Category Bento Grid
 * 
 * Glassmorphism grid of category tiles that users can select (max 3).
 * Categories with Founding Partners get a subtle neon green glow.
 */
export function CategoryBento({ onApply, className }: CategoryBentoProps) {
  const selectedCategories = useSearchStore((state) => state.selectedCategories);
  const toggleCategory = useSearchStore((state) => state.toggleCategory);

  const handleCategoryClick = (category: BusinessCategory) => {
    toggleCategory(category);
  };

  const isSelected = (categoryId: BusinessCategory) =>
    selectedCategories.includes(categoryId);

  const isMaxSelected = selectedCategories.length >= 3;

  return (
    <Card
      className={cn(
        "border-slate-800/50 bg-slate-900 backdrop-blur-xl",
        "shadow-[0_8px_32px_rgba(0,0,0,0.4)] rounded-2xl",
        className
      )}
    >
      <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {CATEGORY_CONFIGS.map((category) => {
          const selected = isSelected(category.id);
          const disabled = !selected && isMaxSelected;

          return (
            <Button
              key={category.id}
              type="button"
              variant="outline"
              onClick={() => handleCategoryClick(category.id)}
              disabled={disabled}
              className={cn(
                "relative h-auto flex flex-col items-center justify-center gap-2",
                "p-4 rounded-xl transition-all duration-300",
                "hover:scale-105 active:scale-95",
                selected
                  ? "border-emerald-500/60 bg-emerald-500/10 shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:bg-emerald-500/15"
                  : "border-slate-700/50 bg-slate-800/40 hover:border-slate-600 hover:bg-slate-800/60",
                disabled && "opacity-40 cursor-not-allowed hover:scale-100",
                category.hasFoundingPartner &&
                  !selected &&
                  "ring-1 ring-emerald-400/30 shadow-[0_0_15px_rgba(16,185,129,0.15)]"
              )}
              aria-label={`Select ${category.label} category`}
            >
              {/* Founder badge */}
              {category.hasFoundingPartner && (
                <Badge
                  variant="outline"
                  className="absolute -top-1.5 -right-1.5 h-5 w-5 p-0 flex items-center justify-center border-emerald-400/50 bg-emerald-500/20"
                >
                  <Sparkles className="h-3 w-3 text-emerald-400 animate-pulse" />
                </Badge>
              )}

              {/* Category icon */}
              <span className="text-3xl md:text-4xl">{category.icon}</span>

              {/* Category label */}
              <Label className="text-xs md:text-sm font-medium text-slate-200 text-center cursor-pointer">
                {category.label}
              </Label>

              {/* Selection indicator */}
              {selected && (
                <div className="absolute inset-0 rounded-xl border-2 border-emerald-400/80 pointer-events-none" />
              )}
            </Button>
          );
        })}

        {/* Max selection hint */}
        {isMaxSelected && (
          <Label className="col-span-full text-center text-xs text-slate-400 mt-2">
            Maximum 3 categories selected. Remove one to add another.
          </Label>
        )}
      </CardContent>

      {/* Apply button footer */}
      <CardFooter className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800/50">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onApply}
          disabled={selectedCategories.length === 0}
          className={cn(
            "rounded-full px-4 py-2 transition-colors",
            selectedCategories.length > 0
              ? "border-emerald-500/60 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/25 hover:border-emerald-400/90 hover:text-emerald-200"
              : "border-slate-700/50 text-slate-500 cursor-not-allowed"
          )}
        >
          <Check className="h-4 w-4 mr-2" />
          Apply {selectedCategories.length > 0 && `(${selectedCategories.length})`}
        </Button>
      </CardFooter>
    </Card>
  );
}

/**
 * Category Chips
 * 
 * Display selected categories as removable chips inside the search bar.
 */
export function CategoryChips() {
  const selectedCategories = useSearchStore((state) => state.selectedCategories);
  const removeCategory = useSearchStore((state) => state.removeCategory);

  if (selectedCategories.length === 0) {
    return null;
  }

  const getCategoryLabel = (id: BusinessCategory) => {
    const config = CATEGORY_CONFIGS.find((c) => c.id === id);
    return config?.label || id;
  };

  const getCategoryIcon = (id: BusinessCategory) => {
    const config = CATEGORY_CONFIGS.find((c) => c.id === id);
    return config?.icon || "•";
  };

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {selectedCategories.map((categoryId) => (
        <Badge
          key={categoryId}
          variant="outline"
          className={cn(
            "inline-flex items-center gap-1.5 px-2 py-1",
            "bg-emerald-500/20 border-emerald-500/40 text-emerald-300",
            "hover:bg-emerald-500/30"
          )}
        >
          <span>{getCategoryIcon(categoryId)}</span>
          <span>{getCategoryLabel(categoryId)}</span>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => removeCategory(categoryId)}
            className="h-4 w-4 p-0 ml-0.5 -mr-1 hover:bg-emerald-500/30 rounded-full text-emerald-300"
            aria-label={`Remove ${getCategoryLabel(categoryId)} category`}
          >
            <X className="h-3 w-3" />
          </Button>
        </Badge>
      ))}
    </div>
  );
}
