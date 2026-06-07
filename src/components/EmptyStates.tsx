import { Database, BarChart3, Activity } from 'lucide-react';
import { motion } from 'framer-motion';

interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: 'database' | 'chart' | 'activity';
  action?: {
    label: string;
    onClick: () => void;
  };
}

const icons = {
  database: Database,
  chart: BarChart3,
  activity: Activity,
};

export function EmptyState({
  title = '暂无数据',
  description = '当前筛选条件下没有可用数据，请尝试调整筛选条件。',
  icon = 'database',
  action,
}: EmptyStateProps) {
  const Icon = icons[icon];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-16 px-4 text-center"
    >
      <div className="w-20 h-20 rounded-full bg-surface-lighter flex items-center justify-center mb-6">
        <Icon className="w-10 h-10 text-slate-500" strokeWidth={1.5} />
      </div>
      <h3 className="font-display text-xl font-semibold text-slate-200 mb-2">
        {title}
      </h3>
      <p className="text-slate-400 text-sm max-w-md mb-6">
        {description}
      </p>
      {action && (
        <button
          onClick={action.onClick}
          className="btn-primary"
        >
          {action.label}
        </button>
      )}
    </motion.div>
  );
}

export function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="relative w-16 h-16 mb-6">
        <div className="absolute inset-0 rounded-full border-4 border-surface-lighter"></div>
        <div className="absolute inset-0 rounded-full border-4 border-brand-400 border-t-transparent animate-spin"></div>
      </div>
      <p className="text-slate-400 text-sm">加载中...</p>
    </div>
  );
}

export function NoPermission() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center py-16 px-4 text-center"
    >
      <div className="w-20 h-20 rounded-full bg-danger/10 flex items-center justify-center mb-6">
        <svg className="w-10 h-10 text-danger" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
        </svg>
      </div>
      <h3 className="font-display text-xl font-semibold text-slate-200 mb-2">
        无访问权限
      </h3>
      <p className="text-slate-400 text-sm max-w-md">
        该模块仅对教练组成员开放。如需访问，请联系管理员。
      </p>
    </motion.div>
  );
}
