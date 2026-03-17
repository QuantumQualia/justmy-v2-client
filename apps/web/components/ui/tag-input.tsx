"use client";

import * as React from "react";
import { X } from "lucide-react";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { cn } from "@workspace/ui/lib/utils";

export interface TagInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  id?: string;
  label?: string;
  className?: string;
  inputClassName?: string;
  disabled?: boolean;
}

/**
 * Tag input built with shadcn Badge + Input. Add tags by typing and pressing Enter or comma.
 * Remove tags by clicking the X on each Badge.
 */
export function TagInput({
  value,
  onChange,
  placeholder = "Add tag...",
  id,
  label,
  className,
  inputClassName,
  disabled,
}: TagInputProps) {
  const [inputValue, setInputValue] = React.useState("");

  const addTag = React.useCallback(
    (tag: string) => {
      const t = tag.trim();
      if (!t || value.includes(t)) return;
      onChange([...value, t]);
    },
    [value, onChange]
  );

  const removeTag = React.useCallback(
    (index: number) => {
      onChange(value.filter((_, i) => i !== index));
    },
    [value, onChange]
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      if (inputValue.trim()) {
        addTag(inputValue.trim());
        setInputValue("");
      }
    } else if (e.key === "Backspace" && !inputValue && value.length > 0) {
      removeTag(value.length - 1);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    if (v.endsWith(",")) {
      addTag(v.slice(0, -1));
      setInputValue("");
    } else {
      setInputValue(v);
    }
  };

  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <Label
          htmlFor={id}
          className="text-slate-300"
        >
          {label}
        </Label>
      )}
      <div
        className={cn(
          "flex min-h-9 w-full flex-wrap items-center gap-2 rounded-md border px-3 py-2 text-sm text-slate-100 shadow-xs transition-[color,box-shadow] outline-none focus-within:ring-[3px]",
          "border-slate-600 bg-black/40 focus-within:border-slate-500 focus-within:ring-slate-500/40",
          "dark:border-slate-600 dark:bg-black/40 dark:text-slate-100 dark:focus-within:border-slate-500 dark:focus-within:ring-slate-500/40",
          disabled && "pointer-events-none opacity-50",
          inputClassName
        )}
      >
        {value.map((tag, index) => (
          <Badge
            key={`${tag}-${index}`}
            variant="secondary"
            className={cn(
              "gap-1 pr-1 font-normal border border-slate-600 bg-slate-700 text-slate-200 hover:bg-slate-600"
            )}
          >
            {tag}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-4 w-4 min-w-4 rounded-full p-0 text-slate-300 hover:bg-slate-500/50 hover:text-slate-100"
              onClick={() => removeTag(index)}
              aria-label={`Remove ${tag}`}
            >
              <X className="h-3 w-3" />
            </Button>
          </Badge>
        ))}
        <Input
          id={id}
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={value.length === 0 ? placeholder : ""}
          disabled={disabled}
          className={cn(
            "min-w-[120px] flex-1 border-0 bg-transparent p-0 text-slate-100 shadow-none placeholder:text-slate-500 focus-visible:ring-0 focus-visible:ring-offset-0"
          )}
        />
      </div>
    </div>
  );
}
