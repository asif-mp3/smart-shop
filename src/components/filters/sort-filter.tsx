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

export type SortOption =
  | "relevance"
  | "price-asc"
  | "price-desc"
  | "rating-desc"
  | "name-asc"
  | "name-desc";

export interface SortFilterProps {
  value: SortOption;
  onChange: (value: SortOption) => void;
}

export function SortFilter({ value, onChange }: SortFilterProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor="sort">Sort By</Label>
      <Select value={value} onValueChange={(v) => onChange(v as SortOption)}>
        <SelectTrigger id="sort" className="w-full">
          <SelectValue placeholder="Relevance" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectItem value="relevance">Relevance</SelectItem>
            <SelectItem value="price-asc">Price: Low to High</SelectItem>
            <SelectItem value="price-desc">Price: High to Low</SelectItem>
            <SelectItem value="rating-desc">Rating: High to Low</SelectItem>
            <SelectItem value="name-asc">Name: A to Z</SelectItem>
            <SelectItem value="name-desc">Name: Z to A</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  );
}
