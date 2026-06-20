import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, ChevronRight, CheckCircle, AlertTriangle, ArrowUpCircle } from 'lucide-react';
import useAuthStore from '@/stores/auth';
import { getReminders, handleReminder } from '@/api/reminders';
import type { Reminder } from '@/types';

const priorityColor: Record<string, string> = {
  high: 'bg-red-500',
  medium: 'bg-amber-500',
  low: 'bg-emerald-500',
};

const statusConfig: Record<string, { bg: string; text: string; icon: typeof CheckCircle }> = {
  pending: { bg: 'bg-amber-100', text: 'text-amber-700', icon: AlertTriangle },
  handled: { bg: 'bg-emerald-100', text: 'text-emerald-700', icon: CheckCircle },
  escalated: { bg: 'bg-red-100', text: 'text-red-700', icon: ArrowUpCircle },
};

const statusLabel: Record<string, string> = {
  pending: '待处理',
  handled: '已处理',
  escalated: '已升级',
};

const priorityLabel: Record<string, string> = {
  high: '紧急',
  medium: '中等',
  low: '普通',
};

export default function ReminderList() {
  const user = useAuthStore((s) => s.user);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [handlingId, setHandlingId] = useState<number | null>(null);

  const fetchReminders = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, unknown> = {};
      if (filterStatus) params.status = filterStatus;
      if (filterPriority) params.priority = filterPriority;
      const res = await getReminders(params);
      setReminders(res.data.results);
      const groups: Record<string, boolean> = {};
      res.data.results.forEach((r) => {
        if (groups[r.assignee_name] === undefined) groups[r.assignee_name] = true;
      });
      setExpandedGroups((prev) => ({ ...groups, ...prev }));
    } finally {
      setLoading(false);
    }
  }, [filterStatus, filterPriority]);

  useEffect(() => {
    fetchReminders();
  }, [fetchReminders]);

  const toggleGroup = (name: string) => {
    setExpandedGroups((prev) => ({ ...prev, [name]: !prev[name] }));
  };

  const onHandle = async (id: number) => {
    setHandlingId(id);
    try {
      await handleReminder(id);
      await fetchReminders();
    } finally {
      setHandlingId(null);
    }
  };

  const grouped = reminders.reduce<Record<string, Reminder[]>>((acc, r) => {
    const key = r.assignee_name;
    if (!acc[key]) acc[key] = [];
    acc[key].push(r);
    return acc;
  }, {});

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">催收管理</h1>
        <div className="flex items-center gap-3">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-400"
          >
            <option value="">全部状态</option>
            <option value="pending">待处理</option>
            <option value="handled">已处理</option>
            <option value="escalated">已升级</option>
          </select>
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-400"
          >
            <option value="">全部优先级</option>
            <option value="high">紧急</option>
            <option value="medium">中等</option>
            <option value="low">普通</option>
          </select>
          {user?.role === 'admin' && (
            <Link
              to="/reminders/config"
              className="text-sm text-amber-600 hover:text-amber-700 font-medium underline underline-offset-2"
            >
              催收节奏配置
            </Link>
          )}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">加载中...</div>
      ) : Object.keys(grouped).length === 0 ? (
        <div className="text-center py-12 text-gray-400">暂无催收提醒</div>
      ) : (
        <div className="space-y-3">
          {Object.entries(grouped).map(([assignee, items]) => {
            const expanded = expandedGroups[assignee] !== false;
            return (
              <div key={assignee} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <button
                  onClick={() => toggleGroup(assignee)}
                  className="w-full flex items-center gap-3 px-5 py-4 hover:bg-gray-50 transition-colors"
                >
                  {expanded ? (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  )}
                  <span className="font-medium text-gray-900">{assignee}</span>
                  <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-800 text-amber-400">
                    {items.length}
                  </span>
                </button>
                {expanded && (
                  <div className="border-t border-gray-100">
                    {items.map((r) => {
                      const sc = statusConfig[r.status];
                      const StatusIcon = sc.icon;
                      return (
                        <div
                          key={r.id}
                          className="flex items-center gap-4 px-5 py-3 border-b border-gray-50 last:border-b-0 hover:bg-gray-50/50 transition-colors"
                        >
                          <div className={`w-2.5 h-2.5 rounded-full ${priorityColor[r.priority]}`} title={priorityLabel[r.priority]} />
                          <div className="flex-1 min-w-0 grid grid-cols-5 gap-4 items-center">
                            <span className="text-sm text-gray-900 truncate" title={`对账单 #${r.reconciliation}`}>
                              对账单 #{r.reconciliation}
                            </span>
                            <span className="text-sm text-gray-500">{priorityLabel[r.priority]}</span>
                            <span className="text-sm text-gray-500">{r.due_date}</span>
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${sc.bg} ${sc.text}`}>
                              <StatusIcon className="w-3.5 h-3.5" />
                              {statusLabel[r.status]}
                            </span>
                            <span className="text-sm text-gray-400">
                              {r.escalation_level > 0 && `升级 L${r.escalation_level}`}
                            </span>
                          </div>
                          {r.status === 'pending' && (
                            <button
                              onClick={() => onHandle(r.id)}
                              disabled={handlingId === r.id}
                              className="px-3 py-1.5 text-sm font-medium text-white rounded-lg transition-colors disabled:opacity-50"
                              style={{ backgroundColor: '#f59e0b' }}
                            >
                              {handlingId === r.id ? '处理中...' : '处理'}
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
