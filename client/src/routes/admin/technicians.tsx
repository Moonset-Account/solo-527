import { createFileRoute } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { technicianApi } from '../../api';
import dayjs from 'dayjs';

export const Route = createFileRoute('/admin/technicians')({
  component: TechniciansPage,
});

function TechniciansPage() {
  const [technicians, setTechnicians] = useState<any[]>([]);
  const [loads, setLoads] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedTech, setSelectedTech] = useState<number | null>(null);
  const [techDetail, setTechDetail] = useState<any>(null);

  const [filters, setFilters] = useState({
    city: '',
    startDate: '',
    endDate: '',
  });

  useEffect(() => {
    fetchTechnicians();
    fetchLoads();
  }, [filters]);

  useEffect(() => {
    if (selectedTech) {
      fetchTechDetail();
    } else {
      setTechDetail(null);
    }
  }, [selectedTech]);

  const fetchTechnicians = async () => {
    try {
      const params: any = {};
      if (filters.city) params.city = filters.city;
      const data: any = await technicianApi.list(params);
      setTechnicians(data);
    } catch (error) {
      console.error('Failed to fetch technicians:', error);
    }
  };

  const fetchLoads = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (filters.city) params.city = filters.city;
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;
      const data: any = await technicianApi.loads(params);
      setLoads(data);
    } catch (error) {
      console.error('Failed to fetch loads:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTechDetail = async () => {
    if (!selectedTech) return;
    try {
      const params: any = {};
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;
      const data = await technicianApi.detail(selectedTech, params);
      setTechDetail(data);
    } catch (error) {
      console.error('Failed to fetch tech detail:', error);
    }
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const getLoadColor = (rate: number) => {
    if (rate > 100) return 'bg-red-500';
    if (rate > 80) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getLoadTextColor = (rate: number) => {
    if (rate > 100) return 'text-red-600';
    if (rate > 80) return 'text-yellow-600';
    return 'text-green-600';
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">师傅负载</h1>
        <p className="text-gray-500 mt-1">查看各师傅的工作负载和分配情况</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">筛选条件</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">城市</label>
            <select
              name="city"
              value={filters.city}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-sm"
            >
              <option value="">全部城市</option>
              {['北京', '上海', '广州', '深圳', '杭州', '成都'].map((city) => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">开始日期</label>
            <input
              type="date"
              name="startDate"
              value={filters.startDate}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">结束日期</label>
            <input
              type="date"
              name="endDate"
              value={filters.endDate}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-sm"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b">
            <h3 className="font-semibold text-gray-800">师傅列表</h3>
          </div>
          <div className="divide-y max-h-96 overflow-y-auto">
            {technicians.map((tech) => (
              <div
                key={tech.id}
                onClick={() => setSelectedTech(tech.id)}
                className={`p-4 cursor-pointer transition-colors ${
                  selectedTech === tech.id ? 'bg-primary-50' : 'hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-800">{tech.name}</p>
                    <p className="text-sm text-gray-500">{tech.city} · 等级{tech.skillLevel}</p>
                  </div>
                  <div className={`w-2 h-2 rounded-full ${tech.isActive ? 'bg-green-500' : 'bg-gray-300'}`} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-2">
          {selectedTech && techDetail ? (
            <div className="space-y-6">
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-800">
                    {techDetail.technician?.name} - 负载明细
                  </h3>
                  <div className="text-sm text-gray-500">
                    日均负载：<span className={`font-semibold ${getLoadTextColor(parseFloat(techDetail.summary?.avgLoadRate || 0))}`}>
                      {techDetail.summary?.avgLoadRate || 0}%
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-4 mb-6">
                  <div className="bg-blue-50 rounded-lg p-4 text-center">
                    <p className="text-2xl font-bold text-blue-600">{techDetail.summary?.totalAssigned || 0}</p>
                    <p className="text-sm text-blue-600">总派单</p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4 text-center">
                    <p className="text-2xl font-bold text-green-600">{techDetail.summary?.totalCompleted || 0}</p>
                    <p className="text-sm text-green-600">已完成</p>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-4 text-center">
                    <p className="text-2xl font-bold text-purple-600">{techDetail.summary?.totalDays || 0}</p>
                    <p className="text-sm text-purple-600">统计天数</p>
                  </div>
                  <div className="bg-orange-50 rounded-lg p-4 text-center">
                    <p className="text-2xl font-bold text-orange-600">
                      {techDetail.technician?.dailyCapacity || 5}
                    </p>
                    <p className="text-sm text-orange-600">日产能</p>
                  </div>
                </div>

                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {techDetail.loads?.map((load: any) => (
                    <div key={load.id} className="flex items-center gap-4 py-2">
                      <span className="text-sm text-gray-600 w-28 flex-shrink-0">
                        {dayjs(load.date).format('MM-DD')}
                      </span>
                      <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${getLoadColor(parseFloat(load.loadRate))}`}
                          style={{ width: `${Math.min(parseFloat(load.loadRate), 100)}%` }}
                        />
                      </div>
                      <span className={`text-sm font-medium w-20 text-right ${getLoadTextColor(parseFloat(load.loadRate))}`}>
                        {load.loadRate}%
                      </span>
                      <span className="text-xs text-gray-500 w-16 text-right">
                        {load.completedCount}/{load.assignedCount}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">近期订单</h3>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {techDetail.orders?.map((order: any) => (
                    <div key={order.id} className="flex items-center justify-between py-2 border-b last:border-b-0">
                      <div>
                        <p className="font-medium text-gray-800">{order.orderNo}</p>
                        <p className="text-sm text-gray-500">{order.applianceType} · {order.city}</p>
                      </div>
                      <span className="text-sm text-gray-500">
                        {dayjs(order.scheduledDate).format('MM-DD')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm p-12 text-center text-gray-500">
              <p className="text-4xl mb-4">👈</p>
              <p>请选择左侧的师傅查看详细负载信息</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
