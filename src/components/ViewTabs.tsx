import React from 'react';
import { TrendingDown, Users, BarChart2, GitBranch, PieChart } from 'lucide-react';
import { ViewType } from '../types';
import { useAnalyticsStore } from '../store/useAnalyticsStore';
import clsx from 'clsx';

interface ViewTabsProps {
  showChurn?: boolean;
  onShowChurn?: () => void;
}

const ViewTabs: React.FC<ViewTabsProps> = ({ showChurn, onShowChurn }) => {
  const { activeView, setActiveView } = useAnalyticsStore();

  const views: { id: ViewType; label: string; icon: React.ReactNode }[] = [
    { id: 'funnel', label: '转化漏斗', icon: <TrendingDown className="w-4 h-4" /> },
    { id: 'cohort', label: 'Cohort 留存', icon: <Users className="w-4 h-4" /> },
    { id: 'features', label: '功能热度', icon: <BarChart2 className="w-4 h-4" /> },
    { id: 'paths', label: '路径分析', icon: <GitBranch className="w-4 h-4" /> },
  ];

  return (
    <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg">
      {views.map((view) => (
        <button
          key={view.id}
          onClick={() => setActiveView(view.id)}
          className={clsx(
            'flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-all',
            activeView === view.id
              ? 'bg-white text-primary-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
          )}
        >
          {view.icon}
          {view.label}
        </button>
      ))}
      <div className="w-px h-6 bg-gray-300 mx-1" />
      <button
        onClick={onShowChurn}
        className={clsx(
          'flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-all',
          showChurn
            ? 'bg-white text-red-600 shadow-sm'
            : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
        )}
      >
        <PieChart className="w-4 h-4" />
        流失原因
      </button>
    </div>
  );
};

export default ViewTabs;
