import { useEffect, useState } from 'react';
import { Search, X, Save } from 'lucide-react';
import { api } from '@/services/api';
import { useFilterStore, useMetaStore } from '@/store';
import type { SavedFilter } from '@shared/types';

export default function FilterBar() {
  const { 
    selectedVehicleId, selectedRouteId, selectedBatchId, selectedCustomerId,
    setSelectedVehicleId, setSelectedRouteId, setSelectedBatchId, setSelectedCustomerId,
    clearFilters
  } = useFilterStore();
  
  const { vehicles, routes, customers } = useMetaStore();
  
  const [savedFilters, setSavedFilters] = useState<SavedFilter[]>([]);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [filterName, setFilterName] = useState('');

  useEffect(() => {
    loadMeta();
    loadSavedFilters();
  }, []);

  const loadMeta = async () => {
    try {
      const [v, r, c] = await Promise.all([
        api.getVehicles(),
        api.getRoutes(),
        api.getCustomers(),
      ]);
      useMetaStore.getState().setVehicles(v);
      useMetaStore.getState().setRoutes(r);
      useMetaStore.getState().setCustomers(c);
    } catch (error) {
      console.error('Failed to load meta data:', error);
    }
  };

  const loadSavedFilters = async () => {
    try {
      const filters = await api.getSavedFilters();
      setSavedFilters(filters);
    } catch (error) {
      console.error('Failed to load saved filters:', error);
    }
  };

  const handleSaveFilter = async () => {
    if (!filterName.trim()) return;
    
    const filters = {
      selectedVehicleId,
      selectedRouteId,
      selectedBatchId,
      selectedCustomerId,
    };
    
    try {
      await api.saveFilter(filterName, filters);
      setFilterName('');
      setShowSaveDialog(false);
      loadSavedFilters();
    } catch (error) {
      console.error('Failed to save filter:', error);
    }
  };

  const applySavedFilter = (filter: SavedFilter) => {
    setSelectedVehicleId(filter.filters.selectedVehicleId);
    setSelectedRouteId(filter.filters.selectedRouteId);
    setSelectedBatchId(filter.filters.selectedBatchId);
    setSelectedCustomerId(filter.filters.selectedCustomerId);
  };

  const hasActiveFilters = selectedVehicleId || selectedRouteId || selectedBatchId || selectedCustomerId;

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 mb-6">
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <Search className="w-4 h-4 text-gray-400" />
          <span className="text-sm font-medium text-gray-700">筛选条件</span>
        </div>

        <select
          value={selectedVehicleId || ''}
          onChange={(e) => setSelectedVehicleId(e.target.value || null)}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">全部车辆</option>
          {vehicles.map((v) => (
            <option key={v.id} value={v.id}>{v.plateNumber} - {v.driverName}</option>
          ))}
        </select>

        <select
          value={selectedRouteId || ''}
          onChange={(e) => setSelectedRouteId(e.target.value || null)}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">全部路线</option>
          {routes.map((r) => (
            <option key={r.id} value={r.id}>{r.name}</option>
          ))}
        </select>

        <select
          value={selectedCustomerId || ''}
          onChange={(e) => setSelectedCustomerId(e.target.value || null)}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">全部客户</option>
          {customers.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>

        {savedFilters.length > 0 && (
          <select
            onChange={(e) => {
              const filter = savedFilters.find(f => f.id === e.target.value);
              if (filter) applySavedFilter(filter);
            }}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-blue-50"
          >
            <option value="">已保存筛选</option>
            {savedFilters.map((f) => (
              <option key={f.id} value={f.id}>{f.name}</option>
            ))}
          </select>
        )}

        <div className="flex-1" />

        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-1 px-3 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
            清除筛选
          </button>
        )}

        <button
          onClick={() => setShowSaveDialog(true)}
          className="flex items-center gap-1 px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
        >
          <Save className="w-4 h-4" />
          保存筛选
        </button>
      </div>

      {showSaveDialog && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg flex items-center gap-3">
          <input
            type="text"
            value={filterName}
            onChange={(e) => setFilterName(e.target.value)}
            placeholder="输入筛选组合名称..."
            className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleSaveFilter}
            className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
          >
            保存
          </button>
          <button
            onClick={() => setShowSaveDialog(false)}
            className="px-4 py-2 text-gray-600 text-sm hover:bg-gray-200 rounded-lg transition-colors"
          >
            取消
          </button>
        </div>
      )}
    </div>
  );
}
