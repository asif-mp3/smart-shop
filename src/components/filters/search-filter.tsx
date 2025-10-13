"use client";

import { Input, Label } from "@/components/ui";
import { ChangeEvent } from "react";

export interface SearchFilterProps {
  value: string;
  onChange: (value: string) => void;
}

export function SearchFilter({ value, onChange }: SearchFilterProps) {
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="search">Search</Label>
      <Input
        id="search"
        placeholder="Search products..."
        value={value}
        onChange={handleChange}
      />
    </div>
  );
}
