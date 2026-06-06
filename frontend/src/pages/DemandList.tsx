import React, { useEffect, useState } from 'react';
import { Plus, Search, Filter, Calendar, Users, Eye, Edit2, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { StatusBadge } from '../components/StatusBadge';
import { demandApi } from '../services/api';
import { Demand } from '../types';
import { formatDate, formatDateTime } from '../utils/format';

export const DemandList: React.FC = () => {
  const [demands, setDemands] = useState<Demand[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: '',
    keyword: '',
    startDate: '',
    endDate: '',
    assigneeId: '',
  });
  const navigate = useNavigate();

  const fetchDemands = async () => {
    setLoading(true);
    try {
      const response = await demandApi.findAll(filters);
      setDemands(response.data);
    } catch (error) {
      console.error('Failed to fetch demands:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDemands();
  }, [filters]);

  const handleDelete = async (id: string) => {
    if (confirm('确定要删除此需求吗？')) {
      await demandApi.remove(id);
      fetchDemands();
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">客户需求</h1>
            <p className="text-slate-500 mt-1">管理客户旅行定制需求</p>
          </div>
          <button
            onClick={() => navigate('/demands/new')}
            className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors shadow-sm"
          >
            <Plus size={18} />
            新建需求
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2 flex-1 min-w-64">
              <Search size={18} className="text-slate-400" />
              <input
                type="text"
                placeholder="搜索客户名称..."
                value={filters.keyword}
                onChange={(e) => setFilters({ ...filters, keyword: e.target.value })}
                className="flex-1 bg-transparent outline-none text-slate-700 placeholder-slate-400"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter size={18} className="text-slate-400" />
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="">全部状态</option>
                <option value="pending">待处理</option>
                <option value="quoting">报价中</option>
                <option value="quoted">已报价</option>
                <option value="confirmed">已确认</option>
                <option value="cancelled">已取消</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <Calendar size={18} className="text-slate-400" />
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-teal-500"
              />
              <span className="text-slate-400">至</span>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">客户信息</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">出行信息</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">负责人</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">状态</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">创建时间</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                    <div className="inline-block animate-spin w-6 h-6 border-2 border-teal-500 border-t-transparent rounded-full" />
                  </td>
                </tr>
              ) : demands.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                    暂无需求数据
                  </td>
                </tr>
              ) : (
                demands.map((demand) => (
                  <tr key={demand.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-800">{demand.customerName}</div>
                      <div className="text-sm text-slate-500">{demand.customerPhone}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-slate-700">
                        {formatDate(demand.travelStart)} - {formatDate(demand.travelEnd)}
                      </div>
                      <div className="text-sm text-slate-500">
                        {demand.days}天 | {demand.peopleCount}人
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-teal-100 text-teal-700 rounded-full flex items-center justify-center text-sm font-medium">
                          {demand.assignee?.name?.charAt(0) || '-'}
                        </div>
                        <span className="text-sm text-slate-700">{demand.assignee?.name || '未分配'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={demand.status} type="demand" />
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      {formatDateTime(demand.createdAt)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => navigate(`/demands/${demand.id}`)}
                          className="p-2 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          onClick={() => navigate(`/quotes/new?demandId=${demand.id}`)}
                          className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="生成报价"
                        >
                          <Plus size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(demand.id)}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
};
