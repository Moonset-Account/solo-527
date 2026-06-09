import { Link } from 'react-router-dom';
import {
  CalendarCheck2,
  AlertTriangle,
  ShieldAlert,
  CheckCircle2,
  ChevronRight,
  Clock,
  ArrowUpRight,
  TrendingUp,
} from 'lucide-react';
import ConfidenceBadge from '@/components/ConfidenceBadge';
import { mockMeetings, mockActionItems } from '@/lib/mockData';
import { cn } from '@/lib/utils';

const statCards = [
  {
    label: '会议总数',
    value: 128,
    delta: '+12 本周',
    deltaUp: true,
    icon: CalendarCheck2,
    gradient: 'from-blue-500 via-primary-500 to-primary-700',
    bgLight: 'bg-primary-50',
    textLight: 'text-primary-700',
  },
  {
    label: '待确认行动项',
    value: 17,
    delta: '+3 今日',
    deltaUp: true,
    icon: Clock,
    gradient: 'from-amber-400 via-accent-500 to-orange-600',
    bgLight: 'bg-accent-50',
    textLight: 'text-accent-700',
  },
  {
    label: '低置信度数',
    value: 6,
    delta: '需人工复核',
    deltaUp: false,
    icon: ShieldAlert,
    gradient: 'from-rose-400 via-red-500 to-rose-600',
    bgLight: 'bg-rose-50',
    textLight: 'text-rose-700',
  },
  {
    label: '本月完成率',
    value: '87.3%',
    delta: '+5.2% 环比',
    deltaUp: true,
    icon: CheckCircle2,
    gradient: 'from-emerald-400 via-teal-500 to-emerald-600',
    bgLight: 'bg-emerald-50',
    textLight: 'text-emerald-700',
  },
];

export default function Dashboard() {
  const pendingItems = mockActionItems.filter(
    (a) => a.status === 'pending' || a.status === 'in_progress' || a.lowConfidenceFields.length > 0
  ).slice(0, 6);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">工作台</h1>
          <p className="text-sm text-slate-500 mt-1">
            {new Date().toLocaleDateString('zh-CN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} · 欢迎回来
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/meetings"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:border-slate-300 shadow-sm transition-all"
          >
            <CalendarCheck2 className="h-4 w-4" />
            查看全部会议
          </Link>
          <Link
            to="/workbench"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-primary-600 to-primary-700 text-white text-sm font-medium hover:from-primary-700 hover:to-primary-800 shadow-lg shadow-primary-500/25 transition-all"
          >
            前往工作台
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-5">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="group relative overflow-hidden rounded-2xl bg-white p-5 shadow-sm shadow-slate-200/60 border border-slate-100 hover:shadow-md hover:shadow-slate-200 transition-all"
            >
              <div className={cn('absolute -right-8 -top-8 h-32 w-32 rounded-full opacity-10 bg-gradient-to-br', card.gradient)} />
              <div className="relative flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">{card.label}</p>
                  <p className="mt-2 text-3xl font-bold text-slate-900 tracking-tight">{card.value}</p>
                  <p className={cn(
                    'mt-2 text-xs flex items-center gap-1',
                    card.deltaUp ? 'text-emerald-600' : 'text-rose-600'
                  )}>
                    <TrendingUp className={cn('h-3 w-3', !card.deltaUp && 'rotate-180')} />
                    {card.delta}
                  </p>
                </div>
                <div className={cn(
                  'h-11 w-11 rounded-xl flex items-center justify-center bg-gradient-to-br shadow-lg',
                  card.gradient,
                  'shadow-slate-900/10 group-hover:scale-110 transition-transform'
                )}>
                  <Icon className="h-5 w-5 text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="rounded-2xl bg-gradient-to-r from-accent-50 via-orange-50 to-amber-50 border border-accent-200/60 p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="h-12 w-12 flex-shrink-0 rounded-xl bg-gradient-to-br from-accent-500 to-orange-600 flex items-center justify-center shadow-lg shadow-accent-500/30">
          <AlertTriangle className="h-6 w-6 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-slate-900 flex items-center gap-2">
            ⚠️ 高风险行动项提醒
            <span className="px-2 py-0.5 text-xs rounded-md bg-rose-100 text-rose-700 font-medium">6 条待处理</span>
          </h3>
          <p className="text-sm text-slate-600 mt-1">
            有 <span className="font-semibold text-accent-700">4 条</span> 行动项负责人为 AI 建议待确认，
            <span className="font-semibold text-accent-700"> 2 条</span> 存在多个低置信度字段，建议前往工作台尽快人工复核，避免进度延误。
          </p>
        </div>
        <Link
          to="/workbench"
          className="flex-shrink-0 inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-accent-600 text-white text-sm font-medium hover:bg-accent-700 shadow-md shadow-accent-500/30 transition-all"
        >
          立即复核
          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="rounded-2xl bg-white shadow-sm shadow-slate-200/60 border border-slate-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-900">待确认行动项</h2>
            <p className="text-xs text-slate-500 mt-0.5">最近提取的需要人工确认的行动项</p>
          </div>
          <Link
            to="/workbench"
            className="text-xs font-medium text-primary-600 hover:text-primary-700 flex items-center gap-1"
          >
            查看全部 <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50/80 text-xs uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-5 py-3 text-left font-medium">会议标题</th>
                <th className="px-5 py-3 text-left font-medium min-w-[280px]">内容摘要</th>
                <th className="px-5 py-3 text-left font-medium">优先级</th>
                <th className="px-5 py-3 text-left font-medium">最低置信度</th>
                <th className="px-5 py-3 text-right font-medium">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {pendingItems.map((item) => {
                const meeting = mockMeetings.find((m) => m.id === item.meetingId);
                const minConf = item.fieldConfidences.reduce(
                  (m, f) => Math.min(m, f.confidence),
                  1
                );
                const minLevel =
                  minConf >= 0.85 ? 'high' : minConf >= 0.65 ? 'medium' : minConf >= 0.4 ? 'low' : 'unknown';
                return (
                  <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-5 py-4">
                      <div className="font-medium text-slate-800 truncate max-w-[180px]">
                        {meeting?.title || '-'}
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">{meeting?.date}</div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="text-slate-700 line-clamp-2">{item.content}</div>
                      {item.missingFields.length > 0 && (
                        <div className="mt-1 flex flex-wrap gap-1">
                          {item.missingFields.map((f) => (
                            <span
                              key={f}
                              className="text-[10px] px-1.5 py-0.5 rounded bg-rose-100 text-rose-700"
                            >
                              缺{f === 'assignee' ? '负责人' : f}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <span className={cn(
                        'inline-flex items-center px-2 py-1 rounded-md text-xs font-semibold',
                        item.priority === 'P0' && 'bg-rose-100 text-rose-700',
                        item.priority === 'P1' && 'bg-orange-100 text-orange-700',
                        item.priority === 'P2' && 'bg-amber-100 text-amber-700',
                        item.priority === 'P3' && 'bg-slate-100 text-slate-700'
                      )}>
                        {item.priority}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <ConfidenceBadge level={minLevel as 'high' | 'medium' | 'low' | 'unknown'} value={minConf} />
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Link
                        to={`/workbench?highlight=${item.id}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary-600 text-white text-xs font-medium hover:bg-primary-700 shadow-sm shadow-primary-500/20 transition-all"
                      >
                        去处理
                        <ChevronRight className="h-3 w-3" />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
