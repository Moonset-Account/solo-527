import { Download, RefreshCw, Clock, User } from 'lucide-react';
import { useState } from 'react';

interface TopBarProps {
  onExportPDF?: () => void;
  onRefresh?: () => void;
  title?: string;
}

export default function TopBar({ onExportPDF, onRefresh, title }: TopBarProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    onRefresh?.();
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  return (
    <header className="h-16 bg-slate-900/70 backdrop-blur-sm border-b border-slate-700/50 flex items-center justify-between px-6">
      <div className="flex items-center gap-4">
        <h2 className="text-xl font-semibold text-white">{title || '总览看板'}</h2>
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <Clock className="w-4 h-4" />
          <span>{new Date().toLocaleDateString('zh-CN', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            weekday: 'long'
          })}</span>
        </div>
      </div>
      
      <div className="flex items-center gap-3">
        <button
          onClick={handleRefresh}
          className="btn-secondary flex items-center gap-2 text-sm"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          刷新
        </button>
        <button
          onClick={onExportPDF}
          className="btn-primary flex items-center gap-2 text-sm"
        >
          <Download className="w-4 h-4" />
          导出PDF
        </button>
        <div className="w-px h-8 bg-slate-700 mx-2" />
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
            <User className="w-4 h-4 text-white" />
          </div>
          <span className="text-sm text-slate-300">管理员</span>
        </div>
      </div>
    </header>
  );
}
