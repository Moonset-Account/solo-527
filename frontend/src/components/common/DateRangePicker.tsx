import { useState } from 'react';
import { Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DateRangePickerProps {
  value?: [string, string];
  onChange?: (value: [string, string]) => void;
  placeholder?: string;
  className?: string;
}

const presetRanges = [
  { label: '今天', getValue: () => [new Date().toISOString().split('T')[0], new Date().toISOString().split('T')[0]] as [string, string] },
  { label: '最近7天', getValue: () => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 7);
    return [start.toISOString().split('T')[0], end.toISOString().split('T')[0]] as [string, string];
  }},
  { label: '最近30天', getValue: () => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 30);
    return [start.toISOString().split('T')[0], end.toISOString().split('T')[0]] as [string, string];
  }},
  { label: '本月', getValue: () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return [start.toISOString().split('T')[0], end.toISOString().split('T')[0]] as [string, string];
  }},
];

export function DateRangePicker({ value, onChange, placeholder = '选择日期范围', className }: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [startDate, setStartDate] = useState(value?.[0] || '');
  const [endDate, setEndDate] = useState(value?.[1] || '');

  const handleApply = () => {
    if (startDate && endDate) {
      onChange?.([startDate, endDate]);
      setIsOpen(false);
    }
  };

  const handleReset = () => {
    setStartDate('');
    setEndDate('');
    onChange?.(['', '']);
    setIsOpen(false);
  };

  const handlePresetClick = (getValue: () => [string, string]) => {
    const [start, end] = getValue();
    setStartDate(start);
    setEndDate(end);
    onChange?.([start, end]);
    setIsOpen(false);
  };

  const displayText = startDate && endDate ? `${startDate} ~ ${endDate}` : placeholder;

  return (
    <div className={cn('relative', className)}>
      <button
        type="button"
        className={cn(
          'input flex items-center justify-between text-left',
          !startDate && !endDate && 'text-zinc-400'
        )}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          {displayText}
        </span>
      </button>

      {isOpen && (
        <div className="absolute z-20 top-full left-0 mt-2 bg-white border border-zinc-200 rounded-lg shadow-lg p-4 min-w-[320px]">
          <div className="mb-4">
            <p className="text-sm font-medium text-zinc-700 mb-2">快捷选择</p>
            <div className="flex flex-wrap gap-2">
              {presetRanges.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  className="px-3 py-1 text-sm border border-zinc-300 rounded-md hover:bg-zinc-50 transition-colors"
                  onClick={() => handlePresetClick(preset.getValue)}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">开始日期</label>
              <input
                type="date"
                className="input"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">结束日期</label>
              <input
                type="date"
                className="input"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-zinc-200">
            <button
              type="button"
              className="btn btn-secondary h-8 px-3"
              onClick={handleReset}
            >
              重置
            </button>
            <button
              type="button"
              className="btn btn-primary h-8 px-3"
              onClick={handleApply}
              disabled={!startDate || !endDate}
            >
              确定
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
