import { useState, useEffect } from 'react';
import { Filter, X, ChevronDown } from 'lucide-react';
import { useFilters } from '~/contexts/FilterContext';
import { api } from '~/utils/api';
import type { FilterOption } from '@shared/types';

export default function FilterBar() {
  const { filters, updateFilters, resetFilters } = useFilters();
  const [options, setOptions] = useState<{
    stores: FilterOption[];
    categories: FilterOption[];
    suppliers: FilterOption[];
  }>({ stores: [], categories: [], suppliers: [] });
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  useEffect(() => {
    api.getFilterOptions().then(setOptions);
  }, []);

  const activeFilterCount = 
    (filters.storeIds?.length || 0) +
    (filters.categoryIds?.length || 0) +
    (filters.supplierIds?.length || 0);

  const toggleDropdown = (name: string) => {
    setOpenDropdown(openDropdown === name ? null : name);
  };

  const toggleOption = (field: 'storeIds' | 'categoryIds' | 'supplierIds', id: string) => {
    const current = filters[field] || [];
    const updated = current.includes(id)
      ? current.filter((i) => i !== id)
      : [...current, id];
    updateFilters({ [field]: updated.length > 0 ? updated : undefined });
  };

  const renderDropdown = (
    name: string,
    field: 'storeIds' | 'categoryIds' | 'supplierIds',
    items: FilterOption[]
  ) => (
    <div className="relative">
      <button
        onClick={() => toggleDropdown(name)}
        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800/50 border border-slate-700 hover:border-slate-600 text-sm transition-all"
      >
        <span className="text-slate-400">{name}</span>
        {(filters[field]?.length || 0) > 0 && (
          <span className="px-1.5 py-0.5 text-xs bg-fresh-green/20 text-fresh-green rounded-full">
            {filters[field]!.length}
          </span>
        )}
        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${openDropdown === name ? 'rotate-180' : ''}`} />
      </button>
      
      {openDropdown === name && (
        <div className="absolute top-full left-0 mt-2 w-56 max-h-64 overflow-y-auto bg-slate-800 border border-slate-700 rounded-xl shadow-2xl z-50 animate-fade-in">
          {items.map((item) => (
            <label
              key={item.id}
              className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-700/50 cursor-pointer text-sm"
            >
              <input
                type="checkbox"
                checked={(filters[field] || []).includes(item.id)}
                onChange={() => toggleOption(field, item.id)}
                className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-fresh-green focus:ring-fresh-green"
              />
              <span className="text-slate-200">{item.name}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="border-b border-slate-700/50 bg-slate-900/30">
      <div className="max-w-[1600px] mx-auto px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-slate-400">
              <Filter className="w-4 h-4" />
              <span className="text-sm font-medium">筛选：</span>
            </div>
            
            {renderDropdown('门店', 'storeIds', options.stores)}
            {renderDropdown('品类', 'categoryIds', options.categories)}
            {renderDropdown('供应商', 'supplierIds', options.suppliers)}

            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800/50 border border-slate-700">
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => updateFilters({ startDate: e.target.value })}
                className="bg-transparent text-sm text-slate-300 outline-none"
              />
              <span className="text-slate-500">至</span>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => updateFilters({ endDate: e.target.value })}
                className="bg-transparent text-sm text-slate-300 outline-none"
              />
            </div>
          </div>

          {activeFilterCount > 0 && (
            <button
              onClick={resetFilters}
              className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
              清除筛选 ({activeFilterCount})
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
