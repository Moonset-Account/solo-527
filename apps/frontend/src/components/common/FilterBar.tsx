import React, { useState } from 'react';
import api from '../../api';

interface FilterBarProps {
  module: string;
  filters: Record<string, any>;
  onFilterChange: (filters: Record<string, any>) => void;
  onSearch?: (keyword: string) => void;
  children: React.ReactNode;
}

interface SavedFilter {
  id: number;
  name: string;
  filters: Record<string, any>;
  isDefault: boolean;
}

export function FilterBar({ module, filters, onFilterChange, onSearch, children }: FilterBarProps) {
  const [searchKeyword, setSearchKeyword] = useState(filters.search || '');
  const [savedFilters, setSavedFilters] = useState<SavedFilter[]>([]);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [filterName, setFilterName] = useState('');

  const handleSearch = () => {
    onSearch?.(searchKeyword);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const loadSavedFilters = async () => {
    try {
      const res = await api.get('/filters', { params: { module } });
      setSavedFilters(res.data);
    } catch (e) {
      console.error('Load saved filters error:', e);
    }
  };

  const applyFilter = (filter: SavedFilter) => {
    onFilterChange({ ...filter.filters, search: filter.filters.search || '' });
    setSearchKeyword(filter.filters.search || '');
  };

  const saveFilter = async () => {
    if (!filterName.trim()) return;
    try {
      await api.post('/filters', {
        name: filterName,
        module,
        filters,
      });
      setFilterName('');
      setShowSaveDialog(false);
      loadSavedFilters();
    } catch (e) {
      console.error('Save filter error:', e);
    }
  };

  const deleteFilter = async (id: number) => {
    try {
      await api.delete(`/filters/${id}`);
      loadSavedFilters();
    } catch (e) {
      console.error('Delete filter error:', e);
    }
  };

  React.useEffect(() => {
    loadSavedFilters();
  }, [module]);

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
      <div className="flex items-center gap-4 mb-4">
        <div className="flex-1 flex items-center gap-2">
          <input
            type="text"
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="搜索关键词..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
          />
          <button
            onClick={handleSearch}
            className="px-4 py-2 bg-primary-500 text-white rounded-md hover:bg-primary-600"
          >
            搜索
          </button>
        </div>

        <div className="relative">
          <button
            onClick={() => setShowSaveDialog(!showSaveDialog)}
            className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 text-gray-700"
          >
            💾 保存过滤
          </button>

          {showSaveDialog && (
            <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded-md shadow-lg z-10">
              <div className="p-3 border-b border-gray-200">
                <input
                  type="text"
                  value={filterName}
                  onChange={(e) => setFilterName(e.target.value)}
                  placeholder="过滤条件名称"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                />
                <button
                  onClick={saveFilter}
                  className="w-full mt-2 px-3 py-2 bg-primary-500 text-white rounded-md text-sm hover:bg-primary-600"
                >
                  保存当前过滤
                </button>
              </div>
              {savedFilters.length > 0 && (
                <div className="max-h-64 overflow-y-auto">
                  {savedFilters.map((f) => (
                    <div
                      key={f.id}
                      className="flex items-center justify-between px-3 py-2 hover:bg-gray-50"
                    >
                      <button
                        onClick={() => applyFilter(f)}
                        className="flex-1 text-left text-sm text-gray-700"
                      >
                        {f.name}
                        {f.isDefault && <span className="ml-2 text-xs text-primary-500">默认</span>}
                      </button>
                      <button
                        onClick={() => deleteFilter(f.id)}
                        className="text-red-500 text-xs hover:text-red-700"
                      >
                        删除
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">{children}</div>
    </div>
  );
}
