import * as React from 'react';
import { ChevronDown, X } from 'lucide-react';
import { cn } from '@/utils';

interface SelectOption {
  value: string | number;
  label: string;
  disabled?: boolean;
}

interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'value' | 'onChange'> {
  options: SelectOption[];
  placeholder?: string;
  value?: string | number | (string | number)[];
  multiple?: boolean;
  onChange?: (value: string | number | (string | number)[]) => void;
}

export default function Select({
  className,
  options,
  placeholder = '请选择',
  value,
  multiple = false,
  disabled,
  onChange,
  ...props
}: SelectProps) {
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (!onChange) return;
    if (multiple) {
      const values = Array.from(e.target.selectedOptions).map((opt) => opt.value);
      onChange(values);
    } else {
      onChange(e.target.value);
    }
  };

  const selectedValues = Array.isArray(value) ? value : value ? [value] : [];
  const selectedLabels = options
    .filter((opt) => selectedValues.includes(opt.value))
    .map((opt) => opt.label);

  return (
    <div className="relative w-full">
      <select
        className={cn(
          'w-full h-10 px-3 pr-8 rounded-lg border border-neutral-200 bg-white text-neutral-900',
          'outline-none transition-colors appearance-none cursor-pointer',
          'focus:ring-2 focus:ring-primary-400 focus:ring-offset-2 focus:border-primary-400',
          'disabled:bg-neutral-50 disabled:cursor-not-allowed disabled:text-neutral-500',
          className
        )}
        value={Array.isArray(value) ? value.map(String) : value != null ? String(value) : ''}
        multiple={multiple}
        disabled={disabled}
        onChange={handleChange}
        {...props}
      >
        {!multiple && <option value="" disabled>{placeholder}</option>}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} disabled={opt.disabled}>
            {opt.label}
          </option>
        ))}
      </select>
      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
      {multiple && selectedLabels.length > 0 && (
        <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-1 pointer-events-none">
          {selectedLabels.slice(0, 2).map((label, idx) => (
            <span key={idx} className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary-100 text-primary-700 text-xs rounded">
              {label}
              <X className="w-3 h-3" />
            </span>
          ))}
          {selectedLabels.length > 2 && (
            <span className="text-xs text-neutral-500">+{selectedLabels.length - 2}</span>
          )}
        </div>
      )}
    </div>
  );
}
