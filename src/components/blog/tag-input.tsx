"use client";
import { X } from "lucide-react";
import { useState, KeyboardEvent } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type TagInputProps = {
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  className?: string;
};

export default function TagInput({
  value = [],
  onChange,
  placeholder = "Add tags...",
  className,
}: TagInputProps) {
  const [inputValue, setInputValue] = useState("");

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag();
    } else if (e.key === "Backspace" && !inputValue && value.length > 0) {
      removeTag(value.length - 1);
    }
  };

  const addTag = () => {
    const newTag = inputValue.trim();
    if (newTag && !value.includes(newTag)) {
      onChange([...value, newTag]);
      setInputValue("");
    }
  };

  const removeTag = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  const handleBlur = () => {
    if (inputValue.trim()) {
      addTag();
    }
  };

  return (
    <div
      className={cn(
        "flex flex-wrap gap-2 p-2 border rounded-md bg-background min-h-[42px]",
        className
      )}
    >
      {value.map((tag, index) => (
        <Badge
          key={index}
          variant="secondary"
          className="gap-1 pr-1 py-1 text-sm"
        >
          {tag}
          <button
            type="button"
            onClick={() => removeTag(index)}
            className="ml-1 hover:bg-muted rounded-sm p-0.5"
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      ))}
      <Input
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        placeholder={value.length === 0 ? placeholder : ""}
        className="flex-1 border-0 shadow-none focus-visible:ring-0 min-w-[120px] h-auto p-0"
      />
    </div>
  );
}
