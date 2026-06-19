"use client";

import { cn } from "@/lib/utils";

export interface SelectEnumProps {
  value?: string | null;
  onChange?: (value: string | null) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  className?: string;
  nullable?: boolean;
}

export function SelectEnum({
  value,
  onChange,
  options,
  placeholder = "请选择",
  className,
  nullable = false,
}: SelectEnumProps) {
  return (
    <select
      className={cn("h-9", className)}
      value={value ?? ""}
      onChange={(e) => {
        const v = e.target.value;
        onChange?.(nullable && v === "" ? null : v);
      }}
    >
      {nullable && <option value="">{placeholder}</option>}
      {!nullable && <option value="">{placeholder}</option>}
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}
