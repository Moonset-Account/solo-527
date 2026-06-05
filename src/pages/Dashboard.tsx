import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ClipboardList, Calendar, Users, Package,
  Clock, BookOpen, BarChart3, ArrowRight,
  Bell, CalendarDays, TrendingUp, TrendingDown,
  Minus, Activity, CheckCircle2, XCircle, AlertCircle,
  UserCheck, FileText,
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import type { Session, Notification as Notif, AuditLog } from '@/types';
import { sessionsApi, notificationsApi, auditLogsApi } from '@/lib/api';

const weeklyData = [
  { day: '周一', value: 3 },
  { day: '周二', value: 5 },
  { day: '周三', value: 2 },
  { day: '周四', value: 7 },
  { day: '周五', value: 4 },
  { day: '周六', value: 8 },
  { day: '周日', value: 6 },
];

const roleGradients: Record<string, string> = {
  admin: 'from-museum-dark via-museum to-museum-light',
  manager: 'from-museum via-museum-light to-[#3A6FA0]',
  guide: 'from-[#2D5A8E] via-[#3A7CB8] to-[#5A9BD5]',
  school_contact: 'from-[#1B3A5C] via-[#2A5070] to-[#3A6FA0]',
  parent: 'from-museum-dark via-[#2A5070] to-museum',
};

function MiniBarChart() {
  const maxVal = Math.max(...weeklyData.map(d => d.value));
  return (
    <div className="flex items-end gap-2 h-24">
      {weeklyData.map((d, i) => (
        <div key={d.day} className="flex flex-col items-center flex-1 gap-1">
          <div
            className="w-full rounded-t-sm transition-all duration-500"
            style={{
              height: `${(d.value / maxVal) * 100}%`,
              minHeight: '4px',
              background: `linear-gradient(to top, #1B3A5C, #2D5A8E)`,
              opacity: i === weeklyData.length - 1 ? 1 : 0.7,
              animationDelay: `${i * 0.08}s`,
            }}
          />
          <span className="text-[10px] text-slate-400">{d.day}</span>
        </div>
      ))}
    </div>
  );
}

function TrendIndicator({ trend }: { trend: 'up' | 'down' | 'neutral' }) {
  if (trend === 'up') return <TrendingUp size={14} className="text-emerald-500" />;
  if (trend === 'down') return <TrendingDown size={14} className="text-red-400" />;
  return <Minus size={14} className="text-slate-300" />;
}

function AuditIcon({ action }: { action: string }) {
  if (action.includes('approve') || action.includes('create')) return <CheckCircle2 size={14} className="text-emerald-500" />;
  if (action.includes('reject') || action.includes('delete')) return <XCircle size={14} className="text-red-400" />;
  if (action.includes('update') || action.includes('edit')) return <AlertCircle size={14} className="text-amber-500" />;
  return <Activity size={14} className="text-slate-400" />;
}

export default function Dashboard() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [notifications, setNotifications] = useState<Notif[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [stats, setStats] = useState({ pending: 0, today: 0, idle: 0, unreturned: 0 });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const sessionData = await sessionsApi.list({ date: today });
      setSessions(sessionData.slice(0, 5));

      const notifData = await notificationsApi.list();
      setNotifications(notifData.slice(0, 5));

      const logData = await auditLogsApi.list();
      setAuditLogs(logData.slice(0, 6));
    } catch {}
  };

  if (!user) return null;

  const roleLabels: Record<string, string> = {
    admin: '系统管理员',
    manager: '场馆管理者',
    guide: '讲解员',
    school_contact: '学校联系人',
    parent: '家长',
  };

  const gradientClass = roleGradients[user.role] || roleGradients.admin;

  const getStatsCards = () => {
    if (user.role === 'admin' || user.role === 'manager') {
      return [
        { label: '待审核报名', value: stats.pending, icon: <ClipboardList size={22} />, color: '#D4A84B', bgLight: 'bg-amber-50', trend: 'up' as const, onClick: () => navigate('/review') },
        { label: '今日场次', value: sessions.length, icon: <Calendar size={22} />, color: '#2D5A8E', bgLight: 'bg-blue-50', trend: 'neutral' as const, onClick: () => navigate('/sessions') },
        { label: '空闲讲解员', value: stats.idle, icon: <Users size={22} />, color: '#4CAF50', bgLight: 'bg-green-50', trend: 'up' as const, onClick: () => navigate('/scheduling') },
        { label: '未归还教具', value: stats.unreturned, icon: <Package size={22} />, color: '#E53935', bgLight: 'bg-red-50', trend: 'down' as const, onClick: () => navigate('/teaching-aids') },
      ];
    }
    if (user.role === 'guide') {
      return [
        { label: '今日排班', value: sessions.length, icon: <Calendar size={22} />, color: '#2D5A8E', bgLight: 'bg-blue-50', trend: 'neutral' as const, onClick: () => navigate('/my-schedule') },
        { label: '本周场次', value: 0, icon: <CalendarDays size={22} />, color: '#4CAF50', bgLight: 'bg-green-50', trend: 'up' as const, onClick: () => navigate('/my-schedule') },
        { label: '待签到场次', value: 0, icon: <Clock size={22} />, color: '#E8A317', bgLight: 'bg-orange-50', trend: 'neutral' as const, onClick: () => navigate('/checkin') },
      ];
    }
    return [
      { label: '待审核报名', value: stats.pending, icon: <ClipboardList size={22} />, color: '#D4A84B', bgLight: 'bg-amber-50', trend: 'up' as const, onClick: () => navigate('/my-bookings') },
      { label: '已通过报名', value: 0, icon: <BookOpen size={22} />, color: '#4CAF50', bgLight: 'bg-green-50', trend: 'up' as const, onClick: () => navigate('/my-bookings') },
      { label: '可报名场次', value: sessions.length, icon: <Calendar size={22} />, color: '#2D5A8E', bgLight: 'bg-blue-50', trend: 'neutral' as const, onClick: () => navigate('/courses') },
    ];
  };

  const getQuickActions = () => {
    if (user.role === 'admin' || user.role === 'manager') {
      return [
        { label: '审核报名', path: '/review', icon: <ClipboardList size={20} />, desc: '处理待审核的报名申请' },
        { label: '排班管理', path: '/scheduling', icon: <UserCheck size={20} />, desc: '安排讲解员排班' },
        { label: '后台看板', path: '/kanban', icon: <BarChart3 size={20} />, desc: '查看运营数据概览' },
      ];
    }
    if (user.role === 'guide') {
      return [
        { label: '我的排班', path: '/my-schedule', icon: <Calendar size={20} />, desc: '查看个人排班信息' },
        { label: '签到核验', path: '/checkin', icon: <Clock size={20} />, desc: '核验参与者签到' },
        { label: '课后反馈', path: '/feedback', icon: <FileText size={20} />, desc: '提交课程反馈报告' },
      ];
    }
    if (user.role === 'school_contact') {
      return [
        { label: '课程浏览', path: '/courses', icon: <BookOpen size={20} />, desc: '浏览可选课程列表' },
        { label: '团体报名', path: '/booking/group', icon: <Users size={20} />, desc: '提交团体参观报名' },
        { label: '我的报名', path: '/my-bookings', icon: <ClipboardList size={20} />, desc: '查看报名记录状态' },
      ];
    }
    return [
      { label: '课程浏览', path: '/courses', icon: <BookOpen size={20} />, desc: '浏览可选课程列表' },
      { label: '散客报名', path: '/booking/individual', icon: <Users size={20} />, desc: '提交个人参观报名' },
      { label: '我的报名', path: '/my-bookings', icon: <ClipboardList size={20} />, desc: '查看报名记录状态' },
    ];
  };

  const recentActivity = auditLogs.slice(0, 5).map((log) => ({
    id: log.id,
    icon: <AuditIcon action={log.action} />,
    text: `${log.action} - ${log.entity_type}#${log.entity_id}`,
    time: new Date(log.created_at).toLocaleString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
  }));

  return (
    <div className="space-y-6 page-enter">
      <div className={`bg-gradient-to-r ${gradientClass} rounded-2xl p-8 text-white relative overflow-hidden`}>
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-white/20 -translate-y-1/2 translate-x-1/4" />
          <div className="absolute bottom-0 left-0 w-40 h-40 rounded-full bg-white/10 translate-y-1/2 -translate-x-1/4" />
        </div>
        <div className="relative z-10 slide-up">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center border border-white/20">
              <Activity size={24} className="text-gold-light" />
            </div>
            <div>
              <h1 className="text-2xl font-serif font-bold tracking-wide">
                您好，{user.name}
              </h1>
              <p className="text-white/70 text-sm mt-0.5">
                当前角色：{roleLabels[user.role]} · 欢迎回到博研通管理平台
              </p>
            </div>
          </div>
        </div>
        <div className="relative z-10 mt-4 flex items-center gap-4 slide-up stagger-2">
          <div className="h-px flex-1 gold-accent-line opacity-30" />
          <span className="text-xs text-white/50 tracking-widest font-serif">DASHBOARD</span>
          <div className="h-px flex-1 gold-accent-line opacity-30" />
        </div>
      </div>

      <div className={`grid grid-cols-${getStatsCards().length > 3 ? 4 : 3} gap-4`}>
        {getStatsCards().map((card, i) => (
          <button
            key={card.label}
            onClick={card.onClick}
            className={`stat-card card-hover card-appear stagger-${i + 1} text-left group border-l-[3px]`}
            style={{ borderLeftColor: card.color }}
          >
            <div className="flex items-center justify-between mb-4">
              <div
                className={`w-11 h-11 rounded-xl ${card.bgLight} flex items-center justify-center shadow-sm`}
                style={{ color: card.color }}
              >
                {card.icon}
              </div>
              <TrendIndicator trend={card.trend} />
            </div>
            <p className="text-3xl font-bold text-museum tracking-tight">{card.value}</p>
            <p className="text-sm text-slate-500 mt-1.5 font-medium">{card.label}</p>
            <div className="mt-3 flex items-center gap-1 text-xs text-slate-400 group-hover:text-museum transition-colors">
              <span>查看详情</span>
              <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
            </div>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-5">
        <div className="col-span-2 space-y-5">
          <div className="bg-white rounded-xl border border-gray-100/80 p-6 slide-up stagger-2 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <h2 className="section-title">今日场次</h2>
              <button onClick={() => navigate('/sessions')} className="text-sm text-gold hover:text-gold-dark flex items-center gap-1 transition-colors">
                查看全部 <ArrowRight size={14} />
              </button>
            </div>
            {sessions.length === 0 ? (
              <div className="py-10 text-center">
                <Calendar size={32} className="mx-auto text-slate-200 mb-2" />
                <p className="text-sm text-slate-400">今日暂无场次安排</p>
              </div>
            ) : (
              <div className="space-y-2">
                {sessions.map((s) => {
                  const fillRate = s.capacity > 0 ? (s.booked_count / s.capacity) * 100 : 0;
                  return (
                    <div key={s.id} className="flex items-center justify-between py-3 px-3 rounded-lg hover:bg-museum-50/40 transition-colors group">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-museum-50 flex items-center justify-center">
                          <Calendar size={15} className="text-museum" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-700">{s.course?.name || `课程#${s.course_id}`}</p>
                          <p className="text-xs text-slate-400 mt-0.5">{s.start_time} - {s.end_time} · {s.location}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-museum font-semibold">{s.booked_count}/{s.capacity}</p>
                        <div className="w-16 h-1.5 bg-gray-100 rounded-full mt-1 overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-700"
                            style={{
                              width: `${fillRate}%`,
                              background: fillRate >= 80 ? '#E53935' : fillRate >= 50 ? '#D4A84B' : '#4CAF50',
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-5">
            <div className="bg-white rounded-xl border border-gray-100/80 p-6 slide-up stagger-3 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="section-title text-base">本周场次趋势</h2>
                <BarChart3 size={16} className="text-slate-300" />
              </div>
              <MiniBarChart />
              <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-400">
                <TrendingUp size={12} className="text-emerald-500" />
                <span>较上周增长 12%</span>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-100/80 p-6 slide-up stagger-4 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="section-title text-base">快捷操作</h2>
              </div>
              <div className="space-y-2.5">
                {getQuickActions().map((action) => (
                  <button
                    key={action.path}
                    onClick={() => navigate(action.path)}
                    className="w-full flex items-center gap-3 p-3 rounded-lg border border-gray-100 hover:border-museum/20 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 text-left group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-museum-50 flex items-center justify-center text-museum group-hover:bg-museum group-hover:text-white transition-colors">
                      {action.icon}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-700">{action.label}</p>
                      <p className="text-[11px] text-slate-400">{action.desc}</p>
                    </div>
                    <ArrowRight size={14} className="ml-auto text-slate-300 group-hover:text-museum transition-colors" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-5">
          <div className="bg-white rounded-xl border border-gray-100/80 p-6 slide-up stagger-3 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="section-title text-base">最新通知</h2>
              <button onClick={() => navigate('/notifications')} className="text-sm text-gold hover:text-gold-dark flex items-center gap-1 transition-colors">
                全部 <ArrowRight size={14} />
              </button>
            </div>
            {notifications.length === 0 ? (
              <div className="py-8 text-center">
                <Bell size={28} className="mx-auto text-slate-200 mb-2" />
                <p className="text-sm text-slate-400">暂无通知</p>
              </div>
            ) : (
              <div className="space-y-3">
                {notifications.map((n) => (
                  <div key={n.id} className="flex items-start gap-2.5 py-2 border-b border-gray-50 last:border-0 group">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${n.read ? 'bg-gray-50' : 'bg-gold/10'}`}>
                      <Bell size={12} className={n.read ? 'text-slate-300' : 'text-gold'} />
                    </div>
                    <div className="min-w-0">
                      <p className={`text-sm truncate ${n.read ? 'text-slate-400' : 'text-slate-700 font-medium'}`}>{n.title}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">{new Date(n.created_at).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })}</p>
                    </div>
                    {!n.read && <div className="w-2 h-2 rounded-full bg-gold shrink-0 mt-2" />}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl border border-gray-100/80 p-6 slide-up stagger-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="section-title text-base">最近动态</h2>
              <Activity size={16} className="text-slate-300" />
            </div>
            {recentActivity.length === 0 ? (
              <div className="py-6 text-center">
                <Activity size={28} className="mx-auto text-slate-200 mb-2" />
                <p className="text-sm text-slate-400">暂无动态</p>
              </div>
            ) : (
              <div className="relative">
                <div className="absolute left-[11px] top-2 bottom-2 w-px bg-gray-100" />
                <div className="space-y-4">
                  {recentActivity.map((item) => (
                    <div key={item.id} className="flex items-start gap-3 relative">
                      <div className="w-6 h-6 rounded-full bg-white border border-gray-100 flex items-center justify-center shrink-0 z-10 shadow-sm">
                        {item.icon}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-slate-600 leading-relaxed">{item.text}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">{item.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
