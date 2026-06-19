import * as React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { cn } from '@/utils';

interface PaginationProps {
  current: number;
  pageSize: number;
  total: number;
  onChange: (page: number, pageSize: number) => void;
  showSizeChanger?: boolean;
  pageSizeOptions?: number[];
  className?: string;
}

export default function Pagination({
  current,
  pageSize,
  total,
  onChange,
  showSizeChanger = false,
  pageSizeOptions = [10, 20, 50, 100],
  className,
}: PaginationProps) {
  const totalPages = Math.ceil(total / pageSize) || 1;

  const getPageNumbers = () => {
    const pages: (number | '...')[] = [];
    const range = 2;
    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= current - range && i <= current + range)) {
        pages.push(i);
      } else if (pages[pages.length - 1] !== '...') {
        pages.push('...');
      }
    }
    return pages;
  };

  const handlePageSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange(1, Number(e.target.value));
  };

  return (
    <div className={cn('flex items-center justify-between gap-4', className)}>
      <span className="text-sm text-neutral-500">共 {total} 条</span>
      <div className="flex items-center gap-1">
        <button
          className="p-1.5 rounded-lg border border-neutral-200 text-neutral-600 hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          disabled={current <= 1}
          onClick={() => onChange(1, pageSize)}
        >
          <ChevronsLeft className="w-4 h-4" />
        </button>
        <button
          className="p-1.5 rounded-lg border border-neutral-200 text-neutral-600 hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          disabled={current <= 1}
          onClick={() => onChange(current - 1, pageSize)}
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        {getPageNumbers().map((page, idx) => (
          <button
            key={idx}
            className={cn(
              'min-w-8 h-8 px-2 rounded-lg text-sm font-medium transition-colors',
              page === '...'
                ? 'cursor-default text-neutral-400'
                : page === current
                ? 'bg-primary-500 text-white'
                : 'border border-neutral-200 text-neutral-700 hover:bg-neutral-50'
            )}
            disabled={page === '...'}
            onClick={() => page !== '...' && onChange(page, pageSize)}
          >
            {page}
          </button>
        ))}
        <button
          className="p-1.5 rounded-lg border border-neutral-200 text-neutral-600 hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          disabled={current >= totalPages}
          onClick={() => onChange(current + 1, pageSize)}
        >
          <ChevronRight className="w-4 h-4" />
        </button>
        <button
          className="p-1.5 rounded-lg border border-neutral-200 text-neutral-600 hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          disabled={current >= totalPages}
          onClick={() => onChange(totalPages, pageSize)}
        >
          <ChevronsRight className="w-4 h-4" />
        </button>
        {showSizeChanger && (
          <select
            className="ml-2 h-8 px-2 rounded-lg border border-neutral-200 text-sm text-neutral-700 bg-white outline-none focus:ring-2 focus:ring-primary-400"
            value={pageSize}
            onChange={handlePageSizeChange}
          >
            {pageSizeOptions.map((size) => (
              <option key={size} value={size}>
                {size} 条/页
              </option>
            ))}
          </select>
        )}
      </div>
    </div>
  );
}
