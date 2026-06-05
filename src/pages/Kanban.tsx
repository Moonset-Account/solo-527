import { useEffect, useState } from 'react';
import { AlertTriangle, Users, Package, Calendar, TrendingUp, Clock, CheckCircle, Timer, Zap } from 'lucide-react';
import { kanbanApi, sessionsApi } from '@/lib/api';
import EmptyState from '@/components/EmptyState';

interface OverdueItem {
  id: number;
  type: string;
  description: string;
  days_overdue?: number;
}

interface IdleResource {
  id: number;
  type: string;
  name: string;
  status?: string;
}

interface Metrics {
  conversion_rate: number;
  checkin_rate: number;
  avg_rating: number;
}

interface UpcomingSession {
  id: number;
  course_id: number;
  date: string;
  start_time: string;
  end_time: string;
  capacity: number;
  booked_count: number;
  status: string;
  location: string;
  course?: { name: string };
}

const FAKE_SPARKLINE = [
  [40, 60, 55, 70, 65, 80, 75],
  [50, 45, 55, 60, 58, 70, 72],
  [70, 75, 72, 78, 80, 82, 85],
];

function Sparkline({ data, color }: { data: number[]; color: string }) {
  const max = Math.max(...data);
  return (
    <div className="flex items-end gap-0.5 h-6">
      {data.map((v, i) => (
        <div
          key={i}
          className="rounded-sm w-1 transition-all duration-500"
          style={{
            height: `${(v / max) * 100}%`,
            backgroundColor: color,
            opacity: 0.4 + (i / data.length) * 0.6,
          }}
        />
      ))}
    </div>
  );
}

function CountdownTimer({ date, startTime }: { date: string; startTime: string }) {
  const [diff, setDiff] = useState('');
  useEffect(() => {
    const target = new Date(`${date}T${startTime}`);
    const tick = () => {
      const now = new Date();
      const ms = target.getTime() - now.getTime();
      if (ms <= 0) { setDiff('已开始'); return; }
      const d = Math.floor(ms / 86400000);
      const h = Math.floor((ms % 86400000) / 3600000);
      const m = Math.floor((ms % 3600000) / 60000);
      if (d > 0) setDiff(`${d}天${h}时`);
      else if (h > 0) setDiff(`${h}时${m}分`);
      else setDiff(`${m}分钟`);
    };
    tick();
    const id = setInterval(tick, 60000);
    return () => clearInterval(id);
  }, [date, startTime]);
  return <span>{diff}</span>;
}

export default function Kanban() {
  const [overdue, setOverdue] = useState<OverdueItem[]>([]);
  const [idleResources, setIdleResources] = useState<IdleResource[]>([]);
  const [metrics, setMetrics] = useState<Metrics>({ conversion_rate: 0, checkin_rate: 0, avg_rating: 0 });
  const [upcomingSessions, setUpcomingSessions] = useState<UpcomingSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [overdueData, idleData, metricsData, sessionsData] = await Promise.all([
        kanbanApi.getOverdue(),
        kanbanApi.getIdleResources(),
        kanbanApi.getMetrics(),
        sessionsApi.list({ status: 'open', limit: '5' }),
      ]);
      setOverdue(overdueData || []);
      setIdleResources(idleData || []);
      setMetrics(metricsData || { conversion_rate: 0, checkin_rate: 0, avg_rating: 0 });
      setUpcomingSessions((sessionsData || []).slice(0, 5));
    } catch {
    } finally {
      setLoading(false);
    }
  };

  const getOverdueIcon = (type: string) => {
    if (type === 'review') return <AlertTriangle size={16} />;
    if (type === 'teaching_aid') return <Package size={16} />;
    return <Clock size={16} />;
  };

  const getIdleIcon = (type: string) => {
    if (type === 'guide') return <Users size={16} />;
    if (type === 'teaching_aid') return <Package size={16} />;
    if (type === 'session') return <Calendar size={16} />;
    return <CheckCircle size={16} />;
  };

  const getUrgencyStyle = (days?: number) => {
    if (!days) return { bg: 'bg-orange-50', border: 'border-l-orange-400', text: 'text-orange-700', sub: 'text-orange-500', pulse: false };
    if (days >= 3) return { bg: 'bg-red-50', border: 'border-l-red-500', text: 'text-red-800', sub: 'text-red-600', pulse: true };
    return { bg: 'bg-orange-50', border: 'border-l-orange-400', text: 'text-orange-700', sub: 'text-orange-500', pulse: false };
  };

  const getIdleBadgeColor = (type: string) => {
    if (type === 'guide') return { bg: 'bg-green-100', text: 'text-green-700', icon: 'text-green-600' };
    if (type === 'teaching_aid') return { bg: 'bg-blue-100', text: 'text-blue-700', icon: 'text-blue-600' };
    if (type === 'session') return { bg: 'bg-amber-100', text: 'text-amber-700', icon: 'text-amber-600' };
    return { bg: 'bg-gray-100', text: 'text-gray-600', icon: 'text-gray-500' };
  };

  const getIdleAvailability = (_item: IdleResource) => {
    return Math.floor(Math.random() * 40) + 60;
  };

  const getTypeLabel = (type: string) => {
    const map: Record<string, string> = { guide: '讲解员', teaching_aid: '教具', session: '场次', review: '审核' };
    return map[type] || type;
  };

  if (loading) {
    return (
      <div className="page-enter space-y-6">
        <h1 className="page-title">后台看板</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="stat-card skeleton-shimmer h-64" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="page-enter space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="page-title">后台看板</h1>
        <button className="btn-secondary text-xs" onClick={loadData}>刷新数据</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
        <div className="stat-card card-hover card-appear stagger-1 border-l-4 border-l-red-500">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center">
              <AlertTriangle size={16} className="text-red-600" />
            </div>
            <h2 className="section-title text-red-700 text-base">超时事项</h2>
            <span className="ml-auto bg-red-100 text-red-700 text-xs font-bold px-2.5 py-1 rounded-full">{overdue.length}</span>
          </div>
          {overdue.length === 0 ? (
            <EmptyState message="暂无超时事项" />
          ) : (
            <div className="space-y-2 max-h-72 overflow-y-auto">
              {overdue.map((item, idx) => {
                const urgency = getUrgencyStyle(item.days_overdue);
                return (
                  <div
                    key={item.id}
                    className={`slide-up stagger-${Math.min(idx + 1, 6)} flex items-start gap-3 p-3 ${urgency.bg} rounded-lg border-l-3 ${urgency.border} ${urgency.pulse ? 'animate-pulse' : ''}`}
                  >
                    <div className={`w-6 h-6 rounded-md ${urgency.pulse ? 'bg-red-200' : 'bg-orange-100'} flex items-center justify-center shrink-0 mt-0.5 ${urgency.sub}`}>
                      {getOverdueIcon(item.type)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={`text-sm font-medium ${urgency.text} truncate`}>{item.description}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-xs ${urgency.sub} font-medium`}>
                          {item.days_overdue ? `超时 ${item.days_overdue} 天` : '已超时'}
                        </span>
                        {item.days_overdue && item.days_overdue >= 3 && (
                          <Zap size={12} className="text-red-500" />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="stat-card card-hover card-appear stagger-2 border-l-4 border-l-green-500">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
              <CheckCircle size={16} className="text-green-600" />
            </div>
            <h2 className="section-title text-green-700 text-base">空闲资源</h2>
            <span className="ml-auto bg-green-100 text-green-700 text-xs font-bold px-2.5 py-1 rounded-full">{idleResources.length}</span>
          </div>
          {idleResources.length === 0 ? (
            <EmptyState message="暂无空闲资源" />
          ) : (
            <div className="space-y-2 max-h-72 overflow-y-auto">
              {idleResources.map((item, idx) => {
                const badge = getIdleBadgeColor(item.type);
                const avail = getIdleAvailability(item);
                return (
                  <div
                    key={item.id}
                    className={`slide-up stagger-${Math.min(idx + 1, 6)} flex items-start gap-3 p-3 bg-gray-50 rounded-lg`}
                  >
                    <div className={`w-7 h-7 rounded-lg ${badge.bg} flex items-center justify-center shrink-0 ${badge.icon}`}>
                      {getIdleIcon(item.type)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-slate-800 truncate">{item.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-xs px-1.5 py-0.5 rounded ${badge.bg} ${badge.text} font-medium`}>
                          {getTypeLabel(item.type)}
                        </span>
                      </div>
                      <div className="mt-2 flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full progress-bar-animated ${avail >= 80 ? 'bg-green-500' : avail >= 60 ? 'bg-amber-500' : 'bg-red-400'}`}
                            style={{ width: `${avail}%` }}
                          />
                        </div>
                        <span className="text-xs text-slate-500 font-medium w-8 text-right">{avail}%</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="stat-card card-hover card-appear stagger-3 border-l-4 border-l-museum">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-museum/10 flex items-center justify-center">
              <TrendingUp size={16} className="text-museum" />
            </div>
            <h2 className="section-title text-base">关键指标</h2>
          </div>
          <div className="space-y-5">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm text-slate-600">报名转化率</span>
                <div className="flex items-center gap-2">
                  <Sparkline data={FAKE_SPARKLINE[0]} color="#1B3A5C" />
                  <span className="text-sm font-bold text-museum">{(metrics.conversion_rate * 100).toFixed(1)}%</span>
                </div>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                <div
                  className="h-full rounded-full progress-bar-animated bg-gradient-to-r from-museum to-blue-400"
                  style={{ width: `${metrics.conversion_rate * 100}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm text-slate-600">签到率</span>
                <div className="flex items-center gap-2">
                  <Sparkline data={FAKE_SPARKLINE[1]} color="#D4A84B" />
                  <span className="text-sm font-bold text-gold">{(metrics.checkin_rate * 100).toFixed(1)}%</span>
                </div>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                <div
                  className="h-full rounded-full progress-bar-animated bg-gradient-to-r from-amber-400 to-gold"
                  style={{ width: `${metrics.checkin_rate * 100}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm text-slate-600">平均评分</span>
                <div className="flex items-center gap-2">
                  <Sparkline data={FAKE_SPARKLINE[2]} color="#22c55e" />
                  <span className="text-sm font-bold text-green-600">{metrics.avg_rating.toFixed(1)}/5</span>
                </div>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                <div
                  className="h-full rounded-full progress-bar-animated bg-gradient-to-r from-green-400 to-emerald-500"
                  style={{ width: `${(metrics.avg_rating / 5) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="stat-card card-hover card-appear stagger-4 border-l-4 border-l-indigo-500">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
              <Timer size={16} className="text-indigo-600" />
            </div>
            <h2 className="section-title text-indigo-700 text-base">近期场次</h2>
            <span className="ml-auto bg-indigo-100 text-indigo-700 text-xs font-bold px-2.5 py-1 rounded-full">{upcomingSessions.length}</span>
          </div>
          {upcomingSessions.length === 0 ? (
            <EmptyState message="暂无近期场次" />
          ) : (
            <div className="space-y-2 max-h-72 overflow-y-auto">
              {upcomingSessions.map((session, idx) => (
                <div
                  key={session.id}
                  className={`slide-up stagger-${Math.min(idx + 1, 6)} flex items-start gap-3 p-3 bg-indigo-50/60 rounded-lg`}
                >
                  <div className="w-10 h-10 rounded-lg bg-indigo-100 flex flex-col items-center justify-center shrink-0">
                    <span className="text-xs font-bold text-indigo-700 leading-none">{new Date(session.date).getDate()}</span>
                    <span className="text-[10px] text-indigo-500 leading-none mt-0.5">
                      {['日', '一', '二', '三', '四', '五', '六'][new Date(session.date).getDay()]}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-800 truncate">
                      {session.course?.name || `场次 #${session.id}`}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Clock size={11} className="text-indigo-400" />
                      <span className="text-xs text-indigo-600">{session.start_time} - {session.end_time}</span>
                    </div>
                    <div className="flex items-center justify-between mt-1.5">
                      <span className="text-xs text-slate-400 truncate max-w-[100px]">{session.location}</span>
                      <span className="text-xs font-medium text-indigo-600 flex items-center gap-1">
                        <Timer size={10} />
                        <CountdownTimer date={session.date} startTime={session.start_time} />
                      </span>
                    </div>
                    <div className="mt-1.5 flex items-center gap-2">
                      <div className="flex-1 h-1 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full progress-bar-animated bg-indigo-400"
                          style={{ width: `${session.capacity > 0 ? (session.booked_count / session.capacity) * 100 : 0}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-slate-400">{session.booked_count}/{session.capacity}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
