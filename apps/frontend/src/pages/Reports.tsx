import { useState, useEffect } from 'react';
import api from '../api';
import { StatCard } from '../components/common/StatCard';
import { DataTable } from '../components/common/DataTable';
import { FilterBar } from '../components/common/FilterBar';
import { format } from 'date-fns';

interface VenueReport {
  id: number;
  date: string;
  totalHours: string;
  usedHours: string;
  utilizationRate: string;
  eventCount: number;
  courseCount: number;
  notes?: string;
}

interface DeviceStatusData {
  statusCounts: { status: string; count: number }[];
  total: number;
  intactRate: number;
}

interface IntactRateData {
  totalInspections: number;
  normalCount: number;
  intactRate: number;
  dailyData: { date: string; intactRate: number }[];
}

export function ReportsPage() {
  const [venueReports, setVenueReports] = useState<VenueReport[]>([]);
  const [deviceStatus, setDeviceStatus] = useState<DeviceStatusData | null>(null);
  const [intactRate, setIntactRate] = useState<IntactRateData | null>(null);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [filters, setFilters] = useState<Record<string, any>>({
    startDate: '',
    endDate: '',
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const params: Record<string, any> = {
        page,
        limit: pageSize,
      };
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;

      const [venueRes, deviceRes, intactRes] = await Promise.all([
        api.get('/reports/venue-usage', { params }),
        api.get('/stats/device-status'),
        api.get('/stats/device-intact-rate', { params }),
      ]);

      setVenueReports(venueRes.data.data);
      setTotal(venueRes.data.total);
      setDeviceStatus(deviceRes.data);
      setIntactRate(intactRes.data);
    } catch (e) {
      console.error('Fetch reports error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [page, filters]);

  const handleFilterChange = (newFilters: Record<string, any>) => {
    setFilters(newFilters);
    setPage(1);
  };

  const venueSummary = venueReports.reduce(
    (acc, r) => {
      acc.totalHours += parseFloat(r.totalHours || '0');
      acc.usedHours += parseFloat(r.usedHours || '0');
      acc.totalEvents += r.eventCount || 0;
      acc.totalCourses += r.courseCount || 0;
      return acc;
    },
    { totalHours: 0, usedHours: 0, totalEvents: 0, totalCourses: 0 }
  );

  const avgUtilization = venueSummary.totalHours > 0
    ? ((venueSummary.usedHours / venueSummary.totalHours) * 100).toFixed(2)
    : '0';

  const columns = [
    { key: 'date', title: '日期', dataIndex: 'date' as keyof VenueReport, width: '120px',
      render: (value: string) => value ? format(new Date(value), 'yyyy-MM-dd') : '' },
    { key: 'totalHours', title: '总时长(小时)', dataIndex: 'totalHours' as keyof VenueReport, width: '100px' },
    { key: 'usedHours', title: '已用时长(小时)', dataIndex: 'usedHours' as keyof VenueReport, width: '110px' },
    { key: 'utilizationRate', title: '利用率', dataIndex: 'utilizationRate' as keyof VenueReport, width: '100px',
      render: (value: string) => (
        <div className="flex items-center gap-2">
          <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full bg-primary-500 rounded-full" style={{ width: `${value}%` }} />
          </div>
          <span className="text-sm">{value}%</span>
        </div>
      ) },
    { key: 'eventCount', title: '赛事数量', dataIndex: 'eventCount' as keyof VenueReport, width: '90px' },
    { key: 'courseCount', title: '课程数量', dataIndex: 'courseCount' as keyof VenueReport, width: '90px' },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-800">统计报表</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="设备完好率" value={`${deviceStatus?.intactRate?.toFixed(2) || 0}%`} icon="✅" color="green" />
        <StatCard title="场地利用率" value={`${avgUtilization}%`} icon="🏊" color="blue" />
        <StatCard title="总赛事数" value={venueSummary.totalEvents} icon="🏆" color="yellow" />
        <StatCard title="巡检总数" value={intactRate?.totalInspections || 0} icon="📋" color="green" />
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">设备状态统计</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {deviceStatus?.statusCounts?.map((item) => (
            <div key={item.status} className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-3xl font-bold text-gray-800">{item.count}</p>
              <p className="text-sm text-gray-500 mt-1">
                {item.status === 'normal' && '正常'}
                {item.status === 'warning' && '预警'}
                {item.status === 'fault' && '故障'}
                {item.status === 'maintenance' && '维护中'}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-4">场地利用报表</h3>

        <FilterBar module="reports" filters={filters} onFilterChange={handleFilterChange} onSearch={() => {}}>
          <input type="date" value={filters.startDate || ''}
            onChange={(e) => handleFilterChange({ ...filters, startDate: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm" />
          <input type="date" value={filters.endDate || ''}
            onChange={(e) => handleFilterChange({ ...filters, endDate: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm" />

          <button onClick={() => handleFilterChange({ startDate: '', endDate: '' })}
            className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800">重置</button>
        </FilterBar>

        <DataTable columns={columns} data={venueReports} loading={loading}
          pagination={{ current: page, pageSize, total, onChange: setPage }} />
      </div>

      {intactRate?.dailyData && intactRate.dailyData.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">设备完好率趋势</h3>
          <div className="h-48 flex items-end gap-1">
            {intactRate.dailyData.slice(-14).map((d) => (
              <div key={d.date} className="flex-1 flex flex-col items-center">
                <div
                  className="w-full bg-green-400 rounded-t"
                  style={{ height: `${d.intactRate}%`, minHeight: '4px' }}
                />
                <span className="text-xs text-gray-500 mt-1 rotate-45 origin-top-left">
                  {d.date.slice(5)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
