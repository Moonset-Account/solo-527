import { useState } from 'react';
import { useLocation, Link } from '@remix-run/react';
import {
  LayoutDashboard,
  Download,
  Settings,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { cn } from '../lib/utils';

const navItems = [
  { label: '仪表盘', icon: LayoutDashboard, path: '/' },
  { label: '导出中心', icon: Download, path: '/exports' },
];

export default function Sidebar() {
  const [expanded, setExpanded] = useState(false);
  const location = useLocation();

  return (
    <aside
      className={cn(
        'flex h-screen flex-col bg-[#0F172A] border-r border-slate-800 transition-all duration-300',
        expanded ? 'w-56' : 'w-16'
      )}
    >
      <div
        className={cn(
          'flex items-center h-14 border-b border-slate-800 px-4',
          expanded ? 'justify-between' : 'justify-center'
        )}
      >
        {expanded && (
          <span className="text-emerald font-semibold text-sm tracking-wide whitespace-nowrap">
            医美数据中心
          </span>
        )}
        <button
          onClick={() => setExpanded((prev) => !prev)}
          className="p-1 rounded hover:bg-slate-800/50 text-slate-400 hover:text-slate-200 transition-colors"
        >
          {expanded ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
        </button>
      </div>

      <nav className="flex-1 py-3 flex flex-col gap-1 px-2">
        {navItems.map(({ label, icon: Icon, path }) => {
          const isActive = location.pathname === path;
          return (
            <Link
              key={path}
              to={path}
              className={cn(
                'flex items-center gap-3 rounded-md transition-colors relative group',
                expanded ? 'px-3 py-2.5' : 'justify-center py-2.5',
                isActive
                  ? 'text-emerald bg-slate-800/60'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              )}
            >
              {isActive && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r bg-emerald" />
              )}
              <Icon size={20} strokeWidth={isActive ? 2 : 1.5} />
              {expanded && (
                <span className={cn('text-sm whitespace-nowrap', isActive && 'font-medium')}>
                  {label}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-slate-800 py-3 px-2">
        <Link
          to="/settings"
          className={cn(
            'flex items-center gap-3 rounded-md text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 transition-colors',
            expanded ? 'px-3 py-2.5' : 'justify-center py-2.5'
          )}
        >
          <Settings size={20} strokeWidth={1.5} />
          {expanded && <span className="text-sm whitespace-nowrap">设置</span>}
        </Link>
      </div>
    </aside>
  );
}
