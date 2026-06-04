import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Dumbbell, Snowflake, AlertTriangle, Bell, TrendingUp, CalendarCheck, DollarSign } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useAuthStore } from '@/stores/authStore';
import { dashboardApi } from '@/utils/api';
import type { DashboardStats, Appointment } from '../../shared/types';

export default function Dashboard() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    dashboardApi.getStats()
      .then(setStats)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-4 border-accent border-t-transparent rounded-full" /></div>;
  if (error) return <div className="text-center text-danger py-8">{error}</div>;

  if (user?.role === 'admin') return <AdminDashboard stats={stats} />;
  if (user?.role === 'coach') return <CoachDashboard stats={stats} />;
  if (user?.role === 'receptionist') return <ReceptionistDashboard stats={stats} />;
  if (user?.role === 'member') return <MemberDashboard stats={stats} />;
  return null;
}

function StatCard({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: number; color: string }) {
  return (
    <div className="card flex items-center gap-4">
      <div className={`w-12 h-12 rounded-btn flex items-center justify-center ${color}`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <div>
        <div className="text-2xl font-bold text-gray-800">{value}</div>
        <div className="text-sm text-gray-500">{label}</div>
      </div>
    </div>
  );
}

function AdminDashboard({ stats }: { stats: DashboardStats | null }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Dumbbell} label="今日私教课" value={stats?.todayPrivateCount || 0} color="bg-accent" />
        <StatCard icon={Users} label="今日团课" value={stats?.todayGroupCount || 0} color="bg-blue-500" />
        <StatCard icon={Snowflake} label="待审核冻结" value={stats?.pendingFreezeCount || 0} color="bg-amber-500" />
        <StatCard icon={AlertTriangle} label="即将到期会员" value={stats?.expiringMemberCount || 0} color="bg-danger" />
      </div>

      {stats?.coachPerformance && stats.coachPerformance.length > 0 && (
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">教练业绩排名</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={stats.coachPerformance.slice(0, 10)}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" fontSize={12} />
              <YAxis fontSize={12} />
              <Tooltip />
              <Bar dataKey="revenue" fill="#F97316" name="营收" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {stats?.renewalFunnel && (
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">续费漏斗</h3>
          <div className="flex items-center gap-4">
            {[
              { label: '即将到期', value: stats.renewalFunnel.expiring, color: 'bg-amber-500' },
              { label: '已到期', value: stats.renewalFunnel.expired, color: 'bg-danger' },
              { label: '已续费', value: stats.renewalFunnel.renewed, color: 'bg-success' },
              { label: '已流失', value: stats.renewalFunnel.lost, color: 'bg-gray-400' },
            ].map((item) => (
              <div key={item.label} className="flex-1 text-center">
                <div className={`text-3xl font-bold ${item.color.replace('bg-', 'text-')}`}>{item.value}</div>
                <div className="text-sm text-gray-500 mt-1">{item.label}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function CoachDashboard({ stats }: { stats: DashboardStats | null }) {
  const perf = stats?.coachPerformance?.[0];
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard icon={CalendarCheck} label="本月课时" value={perf?.sessions || 0} color="bg-accent" />
        <StatCard icon={DollarSign} label="个人营收" value={perf?.revenue || 0} color="bg-success" />
        <StatCard icon={Bell} label="未读消息" value={stats?.unreadMessageCount || 0} color="bg-blue-500" />
      </div>
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">今日课程</h3>
        <AppointmentList appointments={stats?.todayAppointments || []} />
      </div>
    </div>
  );
}

function ReceptionistDashboard({ stats }: { stats: DashboardStats | null }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard icon={CalendarCheck} label="今日预约" value={(stats?.todayAppointments || []).length} color="bg-accent" />
        <StatCard icon={Snowflake} label="待审核冻结" value={stats?.pendingFreezeCount || 0} color="bg-amber-500" />
        <StatCard icon={Bell} label="未读消息" value={stats?.unreadMessageCount || 0} color="bg-blue-500" />
      </div>
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">今日预约</h3>
        <AppointmentList appointments={stats?.todayAppointments || []} />
      </div>
    </div>
  );
}

function MemberDashboard({ stats }: { stats: DashboardStats | null }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <StatCard icon={CalendarCheck} label="即将到来的预约" value={(stats?.todayAppointments || []).length} color="bg-accent" />
        <StatCard icon={Bell} label="未读消息" value={stats?.unreadMessageCount || 0} color="bg-blue-500" />
      </div>
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">今日预约</h3>
        <AppointmentList appointments={stats?.todayAppointments || []} />
      </div>
    </div>
  );
}

function AppointmentList({ appointments }: { appointments: Appointment[] }) {
  if (appointments.length === 0) {
    return <p className="text-gray-400 text-center py-8">暂无预约</p>;
  }
  return (
    <div className="space-y-2">
      {appointments.slice(0, 10).map((apt) => (
        <div key={apt.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-btn">
          <div>
            <span className="text-sm font-medium text-gray-700">
              {apt.start_time.slice(11, 16)} - {apt.end_time.slice(11, 16)}
            </span>
            <span className={`ml-3 text-xs px-2 py-0.5 rounded-full ${apt.type === 'private' ? 'bg-accent/10 text-accent' : 'bg-blue-500/10 text-blue-500'}`}>
              {apt.type === 'private' ? '私教' : '团课'}
            </span>
          </div>
          <span className="text-xs text-gray-500">#{apt.id}</span>
        </div>
      ))}
    </div>
  );
}
