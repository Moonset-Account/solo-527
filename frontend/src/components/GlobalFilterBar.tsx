import { useEffect } from 'react';
import { useFilterStore } from '../stores/filterStore';
import { apiService } from '../services/api';
import { Filter, Calendar, Building2, Wrench, Clock } from 'lucide-react';

export default function GlobalFilterBar() {
  const {
    roomIds,
    timeWindow,
    weekType,
    includeMaintenance,
    filterOptions,
    setRoomIds,
    setTimeWindow,
    setWeekType,
    setIncludeMaintenance,
    setFilterOptions,
    resetFilters
  } = useFilterStore();

  useEffect(() => {
    apiService.getFilterOptions().then(setFilterOptions);
  }, [setFilterOptions]);

  const timeWindows = [
    { value: 'day', label: '今日' },
    { value: 'week', label: '本周' },
    { value: 'month', label: '本月' },
  ];

  const weekTypes = [
    { value: 'all', label: '全部' },
    { value: 'normal', label: '教学周' },
    { value: 'exam', label: '考试周' },
  ];

  const handleRoomChange = (roomId: string) => {
    if (roomIds.includes(roomId)) {
      setRoomIds(roomIds.filter(id => id !== roomId));
    } else {
      setRoomIds([...roomIds, roomId]);
    }
  };

  return (
    <div className="glass-card p-4 mb-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-blue-400" />
          <span className="text-sm font-medium text-slate-300">全局筛选</span>
        </div>

        <div className="flex items-center gap-6 flex-wrap">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-400" />
            <span className="text-sm text-slate-400">时间窗口:</span>
            <div className="flex bg-slate-700/50 rounded-lg p-1">
              {timeWindows.map((tw) => (
                <button
                  key={tw.value}
                  onClick={() => setTimeWindow(tw.value as 'day' | 'week' | 'month')}
                  className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                    timeWindow === tw.value
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {tw.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-400" />
            <span className="text-sm text-slate-400">周类型:</span>
            <div className="flex bg-slate-700/50 rounded-lg p-1">
              {weekTypes.map((wt) => (
                <button
                  key={wt.value}
                  onClick={() => setWeekType(wt.value as 'all' | 'exam' | 'normal')}
                  className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                    weekType === wt.value
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {wt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-slate-400" />
            <span className="text-sm text-slate-400">机房:</span>
            <select
              multiple
              value={roomIds}
              onChange={(e) => {
                const selected = Array.from(e.target.selectedOptions, option => option.value);
                setRoomIds(selected);
              }}
              className="bg-slate-700/50 border border-slate-600 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-blue-500 min-w-[150px] h-[34px]"
            >
              {filterOptions?.rooms.map((room) => (
                <option key={room.id} value={room.id}>
                  {room.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <Wrench className="w-4 h-4 text-slate-400" />
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={includeMaintenance}
                onChange={(e) => setIncludeMaintenance(e.target.checked)}
                className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-slate-300">包含维护窗口</span>
            </label>
          </div>

          <button
            onClick={resetFilters}
            className="text-sm text-slate-400 hover:text-white transition-colors"
          >
            重置筛选
          </button>
        </div>
      </div>
    </div>
  );
}
