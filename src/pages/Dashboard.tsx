import { Link } from 'react-router-dom';
import {
  Wrench,
  Phone,
  FileText,
  CheckCircle,
  AlertTriangle,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import type { VacancyStats, VacancyAlert } from '@/types';

const vacancyData: VacancyStats[] = Array.from({ length: 30 }, (_, i) => {
  const d = new Date();
  d.setDate(d.getDate() - (29 - i));
  return {
    date: d.toISOString().slice(0, 10),
    totalRooms: 120,
    vacantRooms: 15 + Math.floor(Math.random() * 10),
    vacancyRate: (15 + Math.floor(Math.random() * 10)) / 120,
  };
});

const alertData: VacancyAlert[] = [
  { id: 1, projectArea: '朝阳区·望京项目', vacancyRate: 0.22, threshold: 0.15, triggeredAt: '2026-06-16T08:00:00Z', isRead: false },
  { id: 2, projectArea: '海淀区·中关村项目', vacancyRate: 0.18, threshold: 0.15, triggeredAt: '2026-06-16T07:30:00Z', isRead: false },
];

const statCards = [
  { label: '待处理派工', count: 12, icon: Wrench, color: 'text-[#F97316]', bg: 'bg-[#F97316]/10', to: '/work-orders' },
  { label: '待回访', count: 8, icon: Phone, color: 'text-blue-400', bg: 'bg-blue-400/10', to: '/work-orders' },
  { label: '待签署合同', count: 5, icon: FileText, color: 'text-amber-400', bg: 'bg-amber-400/10', to: '/contracts' },
  { label: '待审批结算', count: 3, icon: CheckCircle, color: 'text-emerald-400', bg: 'bg-emerald-400/10', to: '/settlements' },
];

const todayAppointments = [
  { id: 1, time: '09:00', room: '望京SOHO-A1201', tenant: '张先生', status: 'confirmed' as const },
  { id: 2, time: '10:30', room: '中关村-B0803', tenant: '李女士', status: 'pending' as const },
  { id: 3, time: '14:00', room: '望京SOHO-A1203', tenant: '王先生', status: 'confirmed' as const },
  { id: 4, time: '16:00', room: '朝阳区-C0502', tenant: '赵女士', status: 'pending' as const },
];

const exceptionReminders = [
  { id: 1, type: 'room_conflict', desc: '望京SOHO-A1201预约时间冲突', time: '2分钟前' },
  { id: 2, type: 'payment_failed', desc: '租客张先生支付失败', time: '15分钟前' },
  { id: 3, type: 'message_failed', desc: '短信发送失败(3次)', time: '1小时前' },
];

export default function Dashboard() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-4 gap-4">
        {statCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <Link
              key={card.label}
              to={card.to}
              className={`bg-[#1E293B] rounded-lg p-5 border border-[#334155] hover:border-[#F97316]/50 transition-all animate-fade-in-up stagger-${i + 1}`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[#94A3B8]">{card.label}</p>
                  <p className="text-3xl font-bold text-[#F1F5F9] mt-1">{card.count}</p>
                </div>
                <div className={`p-3 rounded-lg ${card.bg}`}>
                  <Icon size={24} className={card.color} />
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {alertData.length > 0 && (
        <div className="grid grid-cols-2 gap-4">
          {alertData.map((alert) => (
            <div
              key={alert.id}
              className="bg-[#1E293B] rounded-lg p-4 border border-rose-500/50 animate-pulse-alert"
            >
              <div className="flex items-center gap-2">
                <AlertTriangle size={18} className="text-rose-400" />
                <span className="text-sm font-medium text-rose-400">空置率预警</span>
              </div>
              <p className="text-[#F1F5F9] mt-2 text-sm">{alert.projectArea}</p>
              <p className="text-rose-400 text-lg font-bold mt-1">
                {(alert.vacancyRate * 100).toFixed(1)}%
                <span className="text-xs text-[#94A3B8] font-normal ml-2">
                  阈值 {(alert.threshold * 100).toFixed(0)}%
                </span>
              </p>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2 bg-[#1E293B] rounded-lg p-5 border border-[#334155]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-medium text-[#F1F5F9]">空置率趋势 (近30天)</h3>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={vacancyData}>
              <defs>
                <linearGradient id="vacancyGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#F97316" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#F97316" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="date"
                tickFormatter={(v) => v.slice(5)}
                tick={{ fill: '#94A3B8', fontSize: 12 }}
                axisLine={{ stroke: '#334155' }}
                tickLine={false}
              />
              <YAxis
                tickFormatter={(v) => `${(v * 100).toFixed(0)}%`}
                tick={{ fill: '#94A3B8', fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{ background: '#1E293B', border: '1px solid #334155', borderRadius: 8 }}
                labelStyle={{ color: '#94A3B8' }}
                formatter={(v: number) => `${(v * 100).toFixed(1)}%`}
              />
              <Area type="monotone" dataKey="vacancyRate" stroke="#F97316" fill="url(#vacancyGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-[#1E293B] rounded-lg p-5 border border-[#334155]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-medium text-[#F1F5F9]">今日预约</h3>
            <Link to="/appointments" className="text-xs text-[#F97316] hover:underline flex items-center gap-1">
              查看全部 <ArrowRight size={12} />
            </Link>
          </div>
          <div className="space-y-3">
            {todayAppointments.map((apt) => (
              <div key={apt.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-[#334155]/30">
                <div className="flex items-center gap-1.5 text-[#94A3B8]">
                  <Clock size={14} />
                  <span className="text-sm font-mono">{apt.time}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-[#F1F5F9] truncate">{apt.room}</p>
                  <p className="text-xs text-[#94A3B8]">{apt.tenant}</p>
                </div>
                <span
                  className={`text-xs px-1.5 py-0.5 rounded ${
                    apt.status === 'confirmed'
                      ? 'bg-blue-500/20 text-blue-400'
                      : 'bg-amber-500/20 text-amber-400'
                  }`}
                >
                  {apt.status === 'confirmed' ? '已确认' : '待确认'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-[#1E293B] rounded-lg p-5 border border-[#334155]">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-medium text-[#F1F5F9]">异常提醒</h3>
          <Link to="/exceptions" className="text-xs text-[#F97316] hover:underline flex items-center gap-1">
            查看全部 <ArrowRight size={12} />
          </Link>
        </div>
        <div className="space-y-2">
          {exceptionReminders.map((ex) => (
            <div
              key={ex.id}
              className="flex items-center gap-3 p-3 rounded-lg border border-[#334155] hover:border-rose-500/50 transition-colors"
            >
              <AlertTriangle size={16} className="text-rose-400 shrink-0" />
              <span className="text-sm text-[#F1F5F9] flex-1">{ex.desc}</span>
              <span className="text-xs text-[#64748B]">{ex.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
