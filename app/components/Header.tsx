import { Download, BarChart3, Settings, User } from 'lucide-react';
import { useFilters } from '~/contexts/FilterContext';
import { useState } from 'react';

export default function Header({ onExport }: { onExport: () => void }) {
  const { filters } = useFilters();
  const [saving, setSaving] = useState(false);

  const handleSaveView = () => {
    setSaving(true);
    setTimeout(() => setSaving(false), 1500);
  };

  return (
    <header className="glass-effect border-b border-slate-700/50 sticky top-0 z-50">
      <div className="max-w-[1600px] mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-fresh-green to-emerald-600 flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-display text-xl font-semibold text-white">生鲜损耗分析</h1>
              <p className="text-xs text-slate-400">
                {filters.startDate} ~ {filters.endDate}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleSaveView}
              className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-lg transition-all flex items-center gap-2"
            >
              <Settings className={`w-4 h-4 ${saving ? 'animate-spin' : ''}`} />
              {saving ? '保存中...' : '保存视角'}
            </button>
            
            <button
              onClick={onExport}
              className="px-4 py-2 text-sm font-medium text-white bg-fresh-green/90 hover:bg-fresh-green rounded-lg transition-all flex items-center gap-2 shadow-lg shadow-fresh-green/20"
            >
              <Download className="w-4 h-4" />
              导出报告
            </button>

            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center ml-2">
              <User className="w-5 h-5 text-white" />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
