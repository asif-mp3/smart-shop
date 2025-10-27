"use client";

import {
  Label,
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui";

export interface RatingFilterProps {
  value: number;
  onChange: (value: number) => void;
}

const ratingOptions = [0, 3, 3.5, 4, 4.5];

export function RatingFilter({ value, onChange }: RatingFilterProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor="rating">Minimum Rating</Label>
      <Select value={String(value)} onValueChange={(v) => onChange(Number(v))}>
        <SelectTrigger id="rating" className="w-full">
          <SelectValue placeholder="Any rating" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {ratingOptions.map((r) => (
              <SelectItem key={r} value={String(r)}>
                {r === 0 ? "Any" : `${r}+`}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  );
}
