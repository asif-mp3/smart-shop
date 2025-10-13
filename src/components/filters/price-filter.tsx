"use client";

import { Label, Slider, Input } from "@/components/ui";

export interface PriceFilterProps {
  min: number;
  max: number;
  value: [number, number];
  onChange: (value: [number, number]) => void;
}

export function PriceFilter({ min, max, value, onChange }: PriceFilterProps) {
  const [minValue, maxValue] = value;

  return (
    <div className="space-y-3">
      <Label>Price Range</Label>
      <Slider
        min={Math.floor(min)}
        max={Math.ceil(max)}
        step={1}
        value={[Math.floor(minValue), Math.ceil(maxValue)]}
        onValueChange={(v) =>
          onChange([v[0] ?? min, v[1] ?? max] as [number, number])
        }
      />
      <div className="flex items-center gap-2">
        <Input
          type="number"
          value={Math.floor(minValue)}
          onChange={(e) => onChange([Number(e.target.value) || min, maxValue])}
          className="w-24"
        />
        <span className="text-muted-foreground">to</span>
        <Input
          type="number"
          value={Math.ceil(maxValue)}
          onChange={(e) => onChange([minValue, Number(e.target.value) || max])}
          className="w-24"
        />
      </div>
    </div>
  );
}
