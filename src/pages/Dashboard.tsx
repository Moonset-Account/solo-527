import { useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Wrench,
  Phone,
  FileText,
  CheckCircle,
  AlertTriangle,
  Clock,
  ArrowRight,
  Loader2,
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useVacancyStore } from '@/stores/vacancyStore';
import { useWorkOrderStore } from '@/stores/workOrderStore';
import { useAppointmentStore } from '@/stores/appointmentStore';
import { useContractStore } from '@/stores/contractStore';
import { useSettlementStore } from '@/stores/settlementStore';
import { useExceptionStore } from '@/stores/exceptionStore';
import { useRoomStore } from '@/stores/roomStore';
import { format, isSameDay } from 'date-fns';
import { zhCN } from 'date-fns/locale';

export default function Dashboard() {
  const { stats, alerts, loading: statsLoading, alertsLoading, fetchStats, fetchAlerts } = useVacancyStore();
  const { workOrders, total: workOrderTotal, loading: workOrderLoading, fetchWorkOrders } = useWorkOrderStore();
  const { appointments, total: appointmentTotal, loading: appointmentLoading, fetchAppointments } = useAppointmentStore();
  const { contracts, total: contractTotal, loading: contractLoading, fetchContracts } = useContractStore();
  const { settlements, total: settlementTotal, loading: settlementLoading, fetchSettlements } = useSettlementStore();
  const { exceptions, loading: exceptionLoading, fetchExceptions } = useExceptionStore();
  const { total: roomTotal, loading: roomLoading, fetchRooms } = useRoomStore();

  useEffect(() => {
    fetchStats(30);
    fetchAlerts();
    fetchWorkOrders({ limit: 100 });
    fetchAppointments({ limit: 100 });
    fetchContracts({ limit: 100 });
    fetchSettlements({ limit: 100 });
    fetchExceptions({ limit: 10, status: 'open' });
    fetchRooms({ limit: 1 });
  }, []);

  const today = new Date();

  const todayAppointments = useMemo(() => {
    return appointments.filter((apt) => isSameDay(new Date(apt.appointmentTime), today));
  }, [appointments, today]);

  const pendingWorkOrders = useMemo(() => {
    return workOrders.filter((wo) => wo.status === 'pending' || wo.status === 'in_progress').length;
  }, [workOrders]);

  const pendingContracts = useMemo(() => {
    return contracts.filter((c) => c.status === 'draft' || c.status === 'owner_signed').length;
  }, [contracts]);

  const pendingSettlements = useMemo(() => {
    return settlements.filter((s) => s.status === 'pending').length;
  }, [settlements]);

  const statCards = [
    { label: '待处理工单', count: pendingWorkOrders, icon: Wrench, color: 'text-[#F97316]', bg: 'bg-[#F97316]/10', to: '/work-orders', loading: workOrderLoading },
    { label: '预约总数', count: appointmentTotal, icon: Phone, color: 'text-blue-400', bg: 'bg-blue-400/10', to: '/appointments', loading: appointmentLoading },
    { label: '待签署合同', count: pendingContracts, icon: FileText, color: 'text-amber-400', bg: 'bg-amber-400/10', to: '/contracts', loading: contractLoading },
    { label: '待审批结算', count: pendingSettlements, icon: CheckCircle, color: 'text-emerald-400', bg: 'bg-emerald-400/10', to: '/settlements', loading: settlementLoading },
  ];

  const unreadAlerts = useMemo(() => alerts.filter((a) => !a.isRead), [alerts]);

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
                  {card.loading ? (
                    <div className="mt-2">
                      <Loader2 size={20} className="animate-spin text-[#64748B]" />
                    </div>
                  ) : (
                    <p className="text-3xl font-bold text-[#F1F5F9] mt-1">{card.count}</p>
                  )}
                </div>
                <div className={`p-3 rounded-lg ${card.bg}`}>
                  <Icon size={24} className={card.color} />
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {!alertsLoading && unreadAlerts.length > 0 && (
        <div className="grid grid-cols-2 gap-4">
          {unreadAlerts.map((alert) => (
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
            {!roomLoading && roomTotal > 0 && (
              <span className="text-xs text-[#94A3B8]">在租房源 {roomTotal} 套</span>
            )}
          </div>
          {statsLoading ? (
            <div className="h-[220px] flex items-center justify-center">
              <Loader2 size={24} className="animate-spin text-[#F97316]" />
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={stats}>
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
          )}
        </div>

        <div className="bg-[#1E293B] rounded-lg p-5 border border-[#334155]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-medium text-[#F1F5F9]">今日预约</h3>
            <Link to="/appointments" className="text-xs text-[#F97316] hover:underline flex items-center gap-1">
              查看全部 <ArrowRight size={12} />
            </Link>
          </div>
          {appointmentLoading ? (
            <div className="h-40 flex items-center justify-center">
              <Loader2 size={20} className="animate-spin text-[#64748B]" />
            </div>
          ) : todayAppointments.length > 0 ? (
            <div className="space-y-3">
              {todayAppointments.map((apt) => (
                <div key={apt.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-[#334155]/30">
                  <div className="flex items-center gap-1.5 text-[#94A3B8]">
                    <Clock size={14} />
                    <span className="text-sm font-mono">
                      {format(new Date(apt.appointmentTime), 'HH:mm')}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-[#F1F5F9] truncate">{apt.roomName}</p>
                    <p className="text-xs text-[#94A3B8]">{apt.tenantName}</p>
                  </div>
                  <span
                    className={`text-xs px-1.5 py-0.5 rounded ${
                      apt.status === 'confirmed'
                        ? 'bg-blue-500/20 text-blue-400'
                        : apt.status === 'pending'
                        ? 'bg-amber-500/20 text-amber-400'
                        : apt.status === 'cancelled'
                        ? 'bg-gray-500/20 text-gray-400'
                        : 'bg-green-500/20 text-green-400'
                    }`}
                  >
                    {apt.status === 'confirmed' ? '已确认' : apt.status === 'pending' ? '待确认' : apt.status === 'cancelled' ? '已取消' : '已完成'}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-40 flex items-center justify-center text-sm text-[#64748B]">
              今日暂无预约
            </div>
          )}
        </div>
      </div>

      <div className="bg-[#1E293B] rounded-lg p-5 border border-[#334155]">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-medium text-[#F1F5F9]">异常提醒</h3>
          <Link to="/exceptions" className="text-xs text-[#F97316] hover:underline flex items-center gap-1">
            查看全部 <ArrowRight size={12} />
          </Link>
        </div>
        {exceptionLoading ? (
          <div className="h-20 flex items-center justify-center">
            <Loader2 size={20} className="animate-spin text-[#64748B]" />
          </div>
        ) : exceptions.length > 0 ? (
          <div className="space-y-2">
            {exceptions.slice(0, 5).map((ex) => (
              <div
                key={ex.id}
                className="flex items-center gap-3 p-3 rounded-lg border border-[#334155] hover:border-rose-500/50 transition-colors"
              >
                <AlertTriangle size={16} className="text-rose-400 shrink-0" />
                <span className="text-sm text-[#F1F5F9] flex-1">{ex.description}</span>
                <span className="text-xs text-[#64748B]">
                  {format(new Date(ex.createdAt), 'MM-dd HH:mm')}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="h-20 flex items-center justify-center text-sm text-[#64748B]">
            暂无异常提醒
          </div>
        )}
      </div>
    </div>
  );
}
