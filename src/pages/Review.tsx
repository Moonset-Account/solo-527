import { useState, useMemo } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useStore } from '@/store';
import StatusBadge from '@/components/StatusBadge';

const PIE_COLORS = ['#0D9488', '#F59E0B', '#EF4444', '#8B5CF6', '#3B82F6', '#EC4899'];

type TabType = 'schedule' | 'noshow' | 'service';

export default function Review() {
  const { appointments, doctors, timeSlots, services, schedules } = useStore();
  const [activeTab, setActiveTab] = useState<TabType>('schedule');
  const [dateRange, setDateRange] = useState('');

  const filteredAppointments = useMemo(() => {
    if (!dateRange) return appointments;
    const [start, end] = dateRange.split('~');
    if (!start || !end) return appointments;
    return appointments.filter((a) => a.date >= start && a.date <= end);
  }, [appointments, dateRange]);

  const noShowAppointments = filteredAppointments.filter((a) => a.status === 'no_show');
  const arrivedAppointments = filteredAppointments.filter((a) => ['arrived', 'completed'].includes(a.status));

  const noShowReasonData = useMemo(() => {
    const reasonMap: Record<string, number> = {};
    noShowAppointments.forEach((a) => {
      const reason = a.noShowReason || '未填写原因';
      reasonMap[reason] = (reasonMap[reason] || 0) + 1;
    });
    return Object.entries(reasonMap).map(([reason, count]) => ({ name: reason, value: count }));
  }, [noShowAppointments]);

  const noShowByDoctorData = useMemo(() => {
    const doctorMap: Record<string, { name: string; noShow: number; total: number }> = {};
    filteredAppointments.forEach((a) => {
      const doctor = doctors.find((d) => d.id === a.doctorId);
      const name = doctor?.name || '未知';
      if (!doctorMap[a.doctorId]) {
        doctorMap[a.doctorId] = { name, noShow: 0, total: 0 };
      }
      doctorMap[a.doctorId].total++;
      if (a.status === 'no_show') doctorMap[a.doctorId].noShow++;
    });
    return Object.values(doctorMap);
  }, [filteredAppointments, doctors]);

  const serviceData = useMemo(() => {
    const serviceMap: Record<string, { name: string; count: number; id: string }> = {};
    filteredAppointments.forEach((a) => {
      const service = services.find((s) => s.id === a.serviceId);
      const name = service?.name || '未知';
      if (!serviceMap[a.serviceId]) {
        serviceMap[a.serviceId] = { name, count: 0, id: a.serviceId };
      }
      serviceMap[a.serviceId].count++;
    });
    return Object.values(serviceMap).sort((a, b) => b.count - a.count);
  }, [filteredAppointments, services]);

  const scheduleDates = useMemo(() => {
    const dateSet = new Set(schedules.map((s) => s.date));
    return Array.from(dateSet).sort();
  }, [schedules]);

  const tabs: { key: TabType; label: string }[] = [
    { key: 'schedule', label: '排班回顾' },
    { key: 'noshow', label: '爽约分析' },
    { key: 'service', label: '服务项目' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-zinc-900">业务复盘</h2>
        <input
          type="text"
          placeholder="日期范围: 2024-01-01~2024-01-31"
          value={dateRange}
          onChange={(e) => setDateRange(e.target.value)}
          className="border border-zinc-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 w-64"
        />
      </div>

      <div className="flex gap-2 border-b border-zinc-200">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.key
                ? 'border-primary text-primary'
                : 'border-transparent text-zinc-500 hover:text-zinc-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'schedule' && (
        <div className="space-y-4">
          <div className="bg-white rounded-lg border border-zinc-200 p-5">
            <h3 className="text-sm font-medium text-zinc-900 mb-4">排班回顾日历</h3>
            <div className="space-y-2">
              {scheduleDates.slice(0, 14).map((date) => {
                const daySchedules = schedules.filter((s) => s.date === date);
                const dayAppointments = filteredAppointments.filter((a) => a.date === date);
                return (
                  <div key={date} className="flex items-center gap-4 py-2 border-b border-zinc-100 last:border-0">
                    <span className="text-sm font-medium text-zinc-700 w-24">{date}</span>
                    <div className="flex-1 flex items-center gap-2">
                      <span className="text-xs text-zinc-500">
                        排班 {daySchedules.length} 人次
                      </span>
                      <span className="text-xs text-zinc-300">|</span>
                      <span className="text-xs text-zinc-500">
                        预约 {dayAppointments.length} 人次
                      </span>
                      <span className="text-xs text-zinc-300">|</span>
                      <span className="text-xs text-green-600">
                        到店 {dayAppointments.filter((a) => ['arrived', 'completed'].includes(a.status)).length}
                      </span>
                      <span className="text-xs text-zinc-300">|</span>
                      <span className="text-xs text-red-500">
                        爽约 {dayAppointments.filter((a) => a.status === 'no_show').length}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'noshow' && (
        <div className="space-y-6">
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-white rounded-lg border border-zinc-200 p-4">
              <p className="text-sm text-zinc-500">总预约</p>
              <p className="text-2xl font-bold text-zinc-900 mt-1">{filteredAppointments.length}</p>
            </div>
            <div className="bg-white rounded-lg border border-zinc-200 p-4">
              <p className="text-sm text-zinc-500">已到店</p>
              <p className="text-2xl font-bold text-green-600 mt-1">{arrivedAppointments.length}</p>
            </div>
            <div className="bg-white rounded-lg border border-zinc-200 p-4">
              <p className="text-sm text-zinc-500">爽约数</p>
              <p className="text-2xl font-bold text-red-500 mt-1">{noShowAppointments.length}</p>
            </div>
            <div className="bg-white rounded-lg border border-zinc-200 p-4">
              <p className="text-sm text-zinc-500">爽约率</p>
              <p className="text-2xl font-bold text-amber-500 mt-1">
                {filteredAppointments.length > 0
                  ? `${((noShowAppointments.length / filteredAppointments.length) * 100).toFixed(1)}%`
                  : '0%'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="bg-white rounded-lg border border-zinc-200 p-5">
              <h3 className="text-sm font-medium text-zinc-900 mb-4">爽约原因分布</h3>
              {noShowReasonData.length === 0 ? (
                <p className="text-center text-zinc-400 py-8 text-sm">暂无爽约数据</p>
              ) : (
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie data={noShowReasonData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                      {noShowReasonData.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="bg-white rounded-lg border border-zinc-200 p-5">
              <h3 className="text-sm font-medium text-zinc-900 mb-4">医生爽约统计</h3>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={noShowByDoctorData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="#a1a1aa" />
                  <YAxis tick={{ fontSize: 12 }} stroke="#a1a1aa" />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="noShow" name="爽约数" fill="#EF4444" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="total" name="总预约" fill="#0D9488" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-zinc-200 p-5">
            <h3 className="text-sm font-medium text-zinc-900 mb-3">爽约患者列表</h3>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200">
                  <th className="text-left py-2 text-zinc-500 font-medium">患者姓名</th>
                  <th className="text-left py-2 text-zinc-500 font-medium">电话</th>
                  <th className="text-left py-2 text-zinc-500 font-medium">医生</th>
                  <th className="text-left py-2 text-zinc-500 font-medium">日期</th>
                  <th className="text-left py-2 text-zinc-500 font-medium">爽约原因</th>
                  <th className="text-left py-2 text-zinc-500 font-medium">状态</th>
                </tr>
              </thead>
              <tbody>
                {noShowAppointments.map((a) => {
                  const doctor = doctors.find((d) => d.id === a.doctorId);
                  return (
                    <tr key={a.id} className="border-b border-zinc-100 last:border-0">
                      <td className="py-2 text-zinc-900">{a.patientName}</td>
                      <td className="py-2 text-zinc-600">{a.patientPhone}</td>
                      <td className="py-2 text-zinc-600">{doctor?.name || '-'}</td>
                      <td className="py-2 text-zinc-600">{a.date}</td>
                      <td className="py-2 text-zinc-600">{a.noShowReason || '-'}</td>
                      <td className="py-2"><StatusBadge status={a.status} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {noShowAppointments.length === 0 && (
              <p className="text-center text-zinc-400 py-4 text-sm">暂无爽约记录</p>
            )}
          </div>
        </div>
      )}

      {activeTab === 'service' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg border border-zinc-200 p-5">
            <h3 className="text-sm font-medium text-zinc-900 mb-4">服务项目分布</h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={serviceData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" />
                <XAxis type="number" tick={{ fontSize: 12 }} stroke="#a1a1aa" />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} stroke="#a1a1aa" width={80} />
                <Tooltip />
                <Bar dataKey="count" name="预约数" fill="#0D9488" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-lg border border-zinc-200 p-5">
            <h3 className="text-sm font-medium text-zinc-900 mb-3">服务项目明细</h3>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200">
                  <th className="text-left py-2 text-zinc-500 font-medium">服务项目</th>
                  <th className="text-left py-2 text-zinc-500 font-medium">类别</th>
                  <th className="text-left py-2 text-zinc-500 font-medium">时长(分钟)</th>
                  <th className="text-left py-2 text-zinc-500 font-medium">价格</th>
                  <th className="text-left py-2 text-zinc-500 font-medium">预约次数</th>
                </tr>
              </thead>
              <tbody>
                {serviceData.map((item) => {
                  const service = services.find((s) => s.id === item.id);
                  return (
                    <tr key={item.id} className="border-b border-zinc-100 last:border-0 hover:bg-zinc-50 cursor-pointer">
                      <td className="py-2 text-zinc-900 font-medium">{item.name}</td>
                      <td className="py-2 text-zinc-600">{service?.category || '-'}</td>
                      <td className="py-2 text-zinc-600">{service?.duration || '-'}</td>
                      <td className="py-2 text-zinc-600">¥{service?.price || '-'}</td>
                      <td className="py-2 text-primary font-medium">{item.count}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
