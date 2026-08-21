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
  /** When true, paste of comma/newline/space-separated values adds multiple tags. */
  splitPaste?: boolean;
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
  splitPaste = false,
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

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    if (!splitPaste || disabled) {
      return;
    }
    const text = e.clipboardData.getData("text");
    if (!text || !/[\s,;]/.test(text)) {
      return;
    }
    e.preventDefault();
    const parts = text
      .split(/[\s,;]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (parts.length === 0) {
      return;
    }
    const next = [...value];
    for (const part of parts) {
      if (!next.includes(part)) {
        next.push(part);
      }
    }
    onChange(next);
    setInputValue("");
  };

  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <Label
          htmlFor={id}
          className="text-muted-foreground"
        >
          {label}
        </Label>
      )}
      <div
        className={cn(
          // Match Input background, border, and focus styles
          "flex min-h-9 w-full flex-wrap items-center gap-2 rounded-md border border-input px-3 py-1 text-base text-foreground shadow-xs transition-[color,box-shadow] outline-none md:text-sm",
          "bg-muted dark:bg-input/30",
          "focus-within:border-ring focus-within:ring-ring/50 focus-within:ring-[3px]",
          "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
          inputClassName
        )}
      >
        {value.map((tag, index) => (
          <Badge
            key={`${tag}-${index}`}
            variant="secondary"
            className={cn(
              "gap-1 pr-1 font-normal border border-border bg-muted text-foreground hover:bg-accent"
            )}
          >
            {tag}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-4 w-4 min-w-4 rounded-full p-0 text-muted-foreground hover:bg-accent hover:text-foreground"
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
          onPaste={handlePaste}
          placeholder={value.length === 0 ? placeholder : ""}
          disabled={disabled}
          className={cn(
            "min-w-[120px] flex-1 border-0 p-0 bg-transparent dark:bg-transparent text-foreground shadow-none placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0"
          )}
        />
      </div>
    </div>
  );
}
