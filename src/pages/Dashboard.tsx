import { Calendar, ClipboardList, UserCheck, UserX } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useStore } from '@/store';
import StatusBadge from '@/components/StatusBadge';

const arrivalTrendData = [
  { date: '周一', rate: 85 },
  { date: '周二', rate: 90 },
  { date: '周三', rate: 78 },
  { date: '周四', rate: 92 },
  { date: '周五', rate: 88 },
  { date: '周六', rate: 70 },
  { date: '周日', rate: 60 },
];

export default function Dashboard() {
  const { dashboardStats, appointments, doctors, timeSlots, schedules } = useStore();
  const today = new Date().toISOString().split('T')[0];
  const todayAppointments = appointments.filter((a) => a.date === today).slice(0, 10);
  const todaySchedules = schedules.filter((s) => s.date === today);

  const statCards = [
    { label: '今日排班数', value: dashboardStats.totalSchedulesToday, icon: Calendar, color: 'bg-primary/10 text-primary' },
    { label: '今日预约数', value: dashboardStats.totalAppointmentsToday, icon: ClipboardList, color: 'bg-blue-50 text-blue-600' },
    { label: '到店率', value: `${(dashboardStats.arrivalRate * 100).toFixed(0)}%`, icon: UserCheck, color: 'bg-green-50 text-green-600' },
    { label: '爽约数', value: dashboardStats.noShowCount, icon: UserX, color: 'bg-red-50 text-red-600' },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-zinc-900">仪表盘</h2>

      <div className="grid grid-cols-4 gap-4">
        {statCards.map((card) => (
          <div key={card.label} className="bg-white rounded-lg border border-zinc-200 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-500">{card.label}</p>
                <p className="text-2xl font-bold text-zinc-900 mt-1">{card.value}</p>
              </div>
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${card.color}`}>
                <card.icon className="w-5 h-5" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border border-zinc-200 p-5">
          <h3 className="text-sm font-medium text-zinc-900 mb-4">到店率趋势</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={arrivalTrendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#a1a1aa" />
              <YAxis tick={{ fontSize: 12 }} stroke="#a1a1aa" domain={[0, 100]} unit="%" />
              <Tooltip formatter={(value: number) => [`${value}%`, '到店率']} />
              <Line type="monotone" dataKey="rate" stroke="#0D9488" strokeWidth={2} dot={{ fill: '#0D9488', r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-lg border border-zinc-200 p-5">
          <h3 className="text-sm font-medium text-zinc-900 mb-4">今日排班概览</h3>
          <div className="space-y-2">
            {todaySchedules.length === 0 ? (
              <p className="text-sm text-zinc-400 py-4 text-center">今日暂无排班</p>
            ) : (
              todaySchedules.map((schedule) => {
                const doctor = doctors.find((d) => d.id === schedule.doctorId);
                const slot = timeSlots.find((t) => t.id === schedule.timeSlotId);
                return (
                  <div key={schedule.id} className="flex items-center justify-between py-2 border-b border-zinc-100 last:border-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-zinc-700">{doctor?.name || '未知'}</span>
                      <span className="text-xs text-zinc-400">{doctor?.title}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-zinc-500 bg-zinc-100 px-2 py-0.5 rounded">{slot?.label}</span>
                      <span className="text-xs text-zinc-400">
                        {schedule.shiftType === 'morning' ? '上午' : schedule.shiftType === 'afternoon' ? '下午' : '全天'}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-zinc-200 p-5">
        <h3 className="text-sm font-medium text-zinc-900 mb-4">最近预约</h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-200">
              <th className="text-left py-2 text-zinc-500 font-medium">患者姓名</th>
              <th className="text-left py-2 text-zinc-500 font-medium">医生</th>
              <th className="text-left py-2 text-zinc-500 font-medium">时段</th>
              <th className="text-left py-2 text-zinc-500 font-medium">服务</th>
              <th className="text-left py-2 text-zinc-500 font-medium">状态</th>
            </tr>
          </thead>
          <tbody>
            {todayAppointments.map((appt) => {
              const doctor = doctors.find((d) => d.id === appt.doctorId);
              const slot = timeSlots.find((t) => t.id === appt.timeSlotId);
              const service = useStore.getState().services.find((s) => s.id === appt.serviceId);
              return (
                <tr key={appt.id} className="border-b border-zinc-100 last:border-0">
                  <td className="py-2 text-zinc-900">{appt.patientName}</td>
                  <td className="py-2 text-zinc-600">{doctor?.name || '-'}</td>
                  <td className="py-2 text-zinc-600">{slot?.label || '-'}</td>
                  <td className="py-2 text-zinc-600">{service?.name || '-'}</td>
                  <td className="py-2"><StatusBadge status={appt.status} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {todayAppointments.length === 0 && (
          <p className="text-center text-zinc-400 py-4 text-sm">今日暂无预约</p>
        )}
      </div>
    </div>
  );
}
