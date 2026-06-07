import { useAppStore } from '@/store/appStore';
import { Filter, AlertTriangle, EyeOff } from 'lucide-react';

export default function StatusBar() {
  const {
    filterState,
    filteredRecords,
    selectedDistrict,
    setFilterState
  } = useAppStore();

  const anomalyCount = filteredRecords.filter(r => r.isAnomaly).length;

  const activeFilters = [
    filterState.months.length > 0 && `月份: ${filterState.months.length}个`,
    filterState.districts.length > 0 && `区域: ${filterState.districts.length}个`,
    filterState.communities.length > 0 && `小区: ${filterState.communities.length}个`,
    filterState.layouts.length > 0 && `户型: ${filterState.layouts.length}个`,
    filterState.sources.length > 0 && `来源: ${filterState.sources.length}个`,
    filterState.excludeAnomaly && '已排除异常'
  ].filter(Boolean);

  return (
    <footer className="h-9 bg-workbench-surface border-t border-workbench-border flex items-center justify-between px-4 flex-shrink-0">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5 text-xs text-workbench-text-muted">
          <Filter className="w-3.5 h-3.5" />
          <span>筛选条件:</span>
          {activeFilters.length > 0 ? (
            <div className="flex items-center gap-2">
              {activeFilters.map((f, i) => (
                <span key={i} className="bg-workbench-bg text-workbench-text px-1.5 py-0.5 rounded text-[10px]">
                  {f}
                </span>
              ))}
            </div>
          ) : (
            <span className="text-workbench-text-muted">无</span>
          )}
          {selectedDistrict && (
            <span className="bg-cyan-600/20 text-cyan-400 px-1.5 py-0.5 rounded text-[10px]">
              查看: {selectedDistrict}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4">
        {anomalyCount > 0 && (
          <button
            onClick={() => setFilterState({ excludeAnomaly: !filterState.excludeAnomaly })}
            className="flex items-center gap-1.5 text-xs transition-colors"
          >
            {filterState.excludeAnomaly ? (
              <>
                <EyeOff className="w-3.5 h-3.5 text-workbench-text-muted" />
                <span className="text-workbench-text-muted">已隐藏 {anomalyCount} 个异常值</span>
              </>
            ) : (
              <>
                <AlertTriangle className="w-3.5 h-3.5 text-orange-400" />
                <span className="text-orange-400">{anomalyCount} 个异常值</span>
              </>
            )}
          </button>
        )}

        <div className="text-xs text-workbench-text-muted">
          显示 <span className="text-cyan-400 font-medium">{filteredRecords.length}</span> 条记录
        </div>

        <div className="text-[10px] text-workbench-text-muted/60">
          © 租赁市场分析工作台
        </div>
      </div>
    </footer>
  );
}
