'use client';

import { Bell, Settings, User, Calendar } from 'lucide-react';
import { useFilterStore } from '@/store/useFilterStore';

export default function Header() {
  const { dateRange } = useFilterStore();

  return (
    <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-6 sticky top-0 z-10">
      <div className="flex items-center gap-4">
        <h2 className="text-lg font-semibold text-gray-900">取药瓶颈分析</h2>
        <div className="flex items-center gap-2 text-sm text-gray-500 bg-gray-50 px-3 py-1.5 rounded-lg">
          <Calendar className="w-4 h-4" />
          <span>
            {dateRange.start} ~ {dateRange.end}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors relative">
          <Bell className="w-5 h-5 text-gray-600" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-danger-500 rounded-full"></span>
        </button>
        <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
          <Settings className="w-5 h-5 text-gray-600" />
        </button>
        <div className="w-px h-6 bg-gray-200 mx-2"></div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
            <User className="w-4 h-4 text-primary-600" />
          </div>
          <span className="text-sm font-medium text-gray-700">运营改善组</span>
        </div>
      </div>
    </header>
  );
}
