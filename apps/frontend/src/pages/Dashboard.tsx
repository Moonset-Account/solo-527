import { useState, useEffect } from 'react';
import api from '../api';
import { StatCard } from '../components/common/StatCard';
import { useAuthStore } from '../store/auth';

interface DeviceStatus {
  status: string;
  count: number;
}

interface RepairSummary {
  status: string;
  count: number;
}

interface IntactRate {
  totalInspections: number;
  normalCount: number;
  intactRate: number;
}

interface VenueSummary {
  totalHours: number;
  usedHours: number;
  avgUtilization: number;
}

export function DashboardPage() {
  const { user } = useAuthStore();
  const [deviceStatus, setDeviceStatus] = useState<DeviceStatus[]>([]);
  const [intactRate, setIntactRate] = useState<IntactRate | null>(null);
  const [repairSummary, setRepairSummary] = useState<RepairSummary[]>([]);
  const [venueSummary, setVenueSummary] = useState<VenueSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [deviceRes, intactRes, repairRes, venueRes] = await Promise.all([
          api.get('/stats/device-status'),
          api.get('/stats/device-intact-rate'),
          api.get('/stats/repair-summary'),
          api.get('/stats/venue-utilization'),
        ]);

        setDeviceStatus(deviceRes.data.statusCounts || []);
        setIntactRate(intactRes.data);
        setRepairSummary(repairRes.data);
        setVenueSummary(venueRes.data.summary);
      } catch (e) {
        console.error('Fetch dashboard error:', e);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const totalDevices = deviceStatus.reduce((sum, d) => sum + d.count, 0);
  const normalDevices = deviceStatus.find((d) => d.status === 'normal')?.count || 0;
  const pendingRepairs = repairSummary.find((r) => r.status === 'pending')?.count || 0;
  const inProgressRepairs = repairSummary.find((r) => r.status === 'in_progress')?.count || 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-800">欢迎回来，{user?.name}</h2>
        <p className="text-gray-500 mt-1">今天是 {new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="设备总数"
          value={totalDevices}
          icon="⚙️"
          color="blue"
        />
        <StatCard
          title="设备完好率"
          value={`${intactRate?.intactRate?.toFixed(2) || 0}%`}
          icon="✅"
          color="green"
        />
        <StatCard
          title="待处理维修"
          value={pendingRepairs}
          icon="🔧"
          color="yellow"
        />
        <StatCard
          title="场地利用率"
          value={`${venueSummary?.avgUtilization?.toFixed(2) || 0}%`}
          icon="🏊"
          color="blue"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">设备状态分布</h3>
          {loading ? (
            <p className="text-gray-500">加载中...</p>
          ) : (
            <div className="space-y-3">
              {deviceStatus.map((item) => (
                <div key={item.status} className="flex items-center">
                  <span className="w-20 text-sm text-gray-600">
                    {item.status === 'normal' && '正常'}
                    {item.status === 'warning' && '预警'}
                    {item.status === 'fault' && '故障'}
                    {item.status === 'maintenance' && '维护中'}
                  </span>
                  <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        item.status === 'normal'
                          ? 'bg-green-500'
                          : item.status === 'warning'
                          ? 'bg-yellow-500'
                          : item.status === 'fault'
                          ? 'bg-red-500'
                          : 'bg-blue-500'
                      }`}
                      style={{ width: `${totalDevices > 0 ? (item.count / totalDevices) * 100 : 0}%` }}
                    />
                  </div>
                  <span className="w-12 text-right text-sm font-medium">{item.count}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">维修工单状态</h3>
          {loading ? (
            <p className="text-gray-500">加载中...</p>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {repairSummary.map((item) => (
                <div
                  key={item.status}
                  className="p-4 bg-gray-50 rounded-lg text-center"
                >
                  <p className="text-2xl font-bold text-gray-800">{item.count}</p>
                  <p className="text-sm text-gray-500 mt-1">
                    {item.status === 'pending' && '待处理'}
                    {item.status === 'assigned' && '已指派'}
                    {item.status === 'in_progress' && '处理中'}
                    {item.status === 'completed' && '已完成'}
                    {item.status === 'verified' && '已复核'}
                    {item.status === 'closed' && '已关闭'}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">快捷操作</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {user?.role === 'staff' || user?.role === 'admin' ? (
            <>
              <QuickAction icon="📋" label="提交巡检" to="/inspections" />
              <QuickAction icon="⚠️" label="上报异常" to="/repairs" />
            </>
          ) : null}
          {user?.role === 'admin' ? (
            <>
              <QuickAction icon="⚙️" label="设备管理" to="/devices" />
              <QuickAction icon="🔧" label="维修管理" to="/repairs" />
            </>
          ) : null}
          {user?.role === 'coach_supervisor' || user?.role === 'admin' ? (
            <>
              <QuickAction icon="📅" label="排班管理" to="/schedules" />
              <QuickAction icon="💰" label="价格规则" to="/pricing" />
              <QuickAction icon="📝" label="候补名单" to="/waitlist" />
            </>
          ) : null}
          {user?.role === 'manager' || user?.role === 'admin' ? (
            <>
              <QuickAction icon="🏆" label="赛事管理" to="/events" />
              <QuickAction icon="📈" label="统计报表" to="/reports" />
            </>
          ) : null}
          {user?.role === 'admin' ? (
            <QuickAction icon="📜" label="操作日志" to="/logs" />
          ) : null}
        </div>
      </div>
    </div>
  );
}

function QuickAction({ icon, label, to }: { icon: string; label: string; to: string }) {
  return (
    <button
      onClick={() => (window.location.href = to)}
      className="p-4 bg-gray-50 rounded-lg hover:bg-primary-50 hover:text-primary-600 transition-colors text-center"
    >
      <div className="text-3xl mb-2">{icon}</div>
      <span className="text-sm text-gray-700">{label}</span>
    </button>
  );
}
