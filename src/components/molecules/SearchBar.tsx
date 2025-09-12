"use client";
import { Input } from "@/components/atoms/Input";
import { useState } from "react";
import { Button } from "@/components/atoms/Button";

interface Props {
  placeholder?: string;
  onSearch?: (value: string) => void;
}

export function SearchBar({ placeholder = "Search for anything", onSearch }: Props) {
  const [value, setValue] = useState("");
  return (
    <form
      onSubmit={(e) => { e.preventDefault(); onSearch?.(value); }}
      className="flex items-center gap-2 bg-white border border-gray-300 rounded-full pl-4 pr-2 h-10 w-[300px] focus-within:border-purple-600 transition-colors"
    >
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        className="flex-1 border-none focus:ring-0 focus:outline-none h-9 px-0"
      />
      <Button type="submit" variant="pill" size="sm" className="!h-7 px-3 text-xs">Go</Button>
    </form>
  );
}

export default SearchBar;

