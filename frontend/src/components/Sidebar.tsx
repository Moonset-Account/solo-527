import { NavLink } from 'react-router-dom';
import { Activity, BarChart3, AlertTriangle, FileText, Zap } from 'lucide-react';

const navItems = [
  { path: '/', label: '总览看板', icon: Activity },
  { path: '/energy', label: '能耗分析', icon: BarChart3 },
  { path: '/faults', label: '故障监控', icon: AlertTriangle },
  { path: '/reports', label: '报表中心', icon: FileText },
];

export default function Sidebar() {
  return (
    <aside className="w-64 min-h-screen bg-slate-900/90 border-r border-slate-700/50 flex flex-col">
      <div className="p-5 border-b border-slate-700/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">能耗看板</h1>
            <p className="text-xs text-slate-400">高校机房监控平台</p>
          </div>
        </div>
      </div>
      
      <nav className="flex-1 p-4">
        <ul className="space-y-1">
          {navItems.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                end={item.path === '/'}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                    isActive
                      ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                  }`
                }
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
      
      <div className="p-4 border-t border-slate-700/50">
        <div className="glass-card p-3">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-xs text-slate-400">系统运行中</span>
          </div>
          <p className="text-xs text-slate-500">最后更新: {new Date().toLocaleTimeString()}</p>
        </div>
      </div>
    </aside>
  );
}
