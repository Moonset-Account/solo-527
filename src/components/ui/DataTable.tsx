'use client';

import { useState } from 'react';
import { Search, Filter, X, ChevronDown } from 'lucide-react';
import { Button } from './Button';
import { Input } from './Input';
import { cn } from '@/utils';

interface FilterOption {
  label: string;
  value: string;
}

interface FilterConfig {
  key: string;
  label: string;
  type: 'select' | 'date' | 'text';
  options?: FilterOption[];
}

interface DataTableFilterProps {
  filters: FilterConfig[];
  onFilterChange: (filters: Record<string, string>) => void;
  onSearch: (query: string) => void;
  searchPlaceholder?: string;
  className?: string;
}

export function DataTableFilter({
  filters,
  onFilterChange,
  onSearch,
  searchPlaceholder = '搜索...',
  className,
}: DataTableFilterProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>({});
  const [showFilters, setShowFilters] = useState(false);

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    onSearch(value);
  };

  const handleFilterChange = (key: string, value: string) => {
    const newFilters = { ...activeFilters };
    if (value) {
      newFilters[key] = value;
    } else {
      delete newFilters[key];
    }
    setActiveFilters(newFilters);
    onFilterChange(newFilters);
  };

  const clearFilters = () => {
    setActiveFilters({});
    setSearchQuery('');
    onFilterChange({});
    onSearch('');
  };

  const activeFilterCount = Object.keys(activeFilters).length;

  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            type="text"
            placeholder={searchPlaceholder}
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-10"
          />
          {searchQuery && (
            <button
              onClick={() => handleSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2"
            >
              <X className="w-4 h-4 text-slate-400 hover:text-slate-600" />
            </button>
          )}
        </div>

        <Button
          variant="outline"
          onClick={() => setShowFilters(!showFilters)}
          className="relative"
        >
          <Filter className="w-4 h-4 mr-2" />
          筛选
          {activeFilterCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary-600 text-white text-xs rounded-full flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </Button>

        {activeFilterCount > 0 && (
          <Button variant="ghost" onClick={clearFilters}>
            <X className="w-4 h-4 mr-2" />
            清除筛选
          </Button>
        )}
      </div>

      {showFilters && (
        <div className="bg-slate-50 p-4 rounded-lg animate-fade-in-up">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {filters.map((filter) => (
              <div key={filter.key}>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  {filter.label}
                </label>
                {filter.type === 'select' && (
                  <select
                    value={activeFilters[filter.key] || ''}
                    onChange={(e) => handleFilterChange(filter.key, e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">全部</option>
                    {filter.options?.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                )}
                {filter.type === 'text' && (
                  <Input
                    type="text"
                    value={activeFilters[filter.key] || ''}
                    onChange={(e) => handleFilterChange(filter.key, e.target.value)}
                    placeholder={`输入${filter.label}`}
                  />
                )}
                {filter.type === 'date' && (
                  <Input
                    type="date"
                    value={activeFilters[filter.key] || ''}
                    onChange={(e) => handleFilterChange(filter.key, e.target.value)}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {activeFilterCount > 0 && (
        <div className="flex flex-wrap gap-2">
          {Object.entries(activeFilters).map(([key, value]) => {
            const filterConfig = filters.find((f) => f.key === key);
            const optionLabel = filterConfig?.options?.find((o) => o.value === value)?.label;
            return (
              <span
                key={key}
                className="inline-flex items-center gap-1 px-3 py-1 bg-primary-100 text-primary-700 text-sm rounded-full"
              >
                {filterConfig?.label}: {optionLabel || value}
                <button
                  onClick={() => handleFilterChange(key, '')}
                  className="ml-1 hover:bg-primary-200 rounded-full p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export function Pagination({
  currentPage,
  totalPages,
  totalItems,
  onPageChange,
  className,
}: PaginationProps) {
  const startItem = (currentPage - 1) * 10 + 1;
  const endItem = Math.min(currentPage * 10, totalItems);

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);

    if (end - start < maxVisible - 1) {
      start = Math.max(1, end - maxVisible + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  };

  return (
    <div
      className={cn(
        'flex items-center justify-between px-4 py-3 bg-white border-t border-slate-200',
        className
      )}
    >
      <div className="text-sm text-slate-500">
        显示 <span className="font-medium">{startItem}</span> -{' '}
        <span className="font-medium">{endItem}</span> 条，共{' '}
        <span className="font-medium">{totalItems}</span> 条
      </div>
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          上一页
        </Button>
        {getPageNumbers().map((page) => (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={cn(
              'w-9 h-9 rounded text-sm font-medium transition-colors',
              currentPage === page
                ? 'bg-primary-600 text-white'
                : 'hover:bg-slate-100 text-slate-700'
            )}
          >
            {page}
          </button>
        ))}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          下一页
        </Button>
      </div>
    </div>
  );
}
