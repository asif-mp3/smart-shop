"use client";

import { Label, Switch } from "@/components/ui";

export interface StockFilterProps {
  value: boolean;
  onChange: (value: boolean) => void;
}

export function StockFilter({ value, onChange }: StockFilterProps) {
  return (
    <div className="flex items-center justify-between">
      <Label htmlFor="in-stock">In Stock Only</Label>
      <Switch id="in-stock" checked={value} onCheckedChange={onChange} />
    </div>
  );
}
