import { useState, useEffect } from 'react';
import AdminLayout from '~/components/AdminLayout';
import api from '~/utils/api';
import dayjs from 'dayjs';

export default function SalesReport() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    startDate: dayjs().subtract(30, 'day').format('YYYY-MM-DD'),
    endDate: dayjs().format('YYYY-MM-DD'),
    groupBy: 'day'
  });
  
  useEffect(() => {
    loadData();
  }, [filters]);
  
  const loadData = async () => {
    setLoading(true);
    try {
      const result = await api.get('/reports/sales', filters);
      if (result.success) {
        setData(result.data);
      }
    } catch (error) {
      console.error('加载销售报表失败:', error);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <AdminLayout title="销售报表">
      <div className="space-y-6">
        <div className="card p-5">
          <div className="flex flex-wrap gap-4 items-end">
            <div>
              <label className="label">开始日期</label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
                className="input"
                style={{ width: '150px' }}
              />
            </div>
            <div>
              <label className="label">结束日期</label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
                className="input"
                style={{ width: '150px' }}
              />
            </div>
            <div>
              <label className="label">统计维度</label>
              <select
                value={filters.groupBy}
                onChange={(e) => setFilters(prev => ({ ...prev, groupBy: e.target.value }))}
                className="select"
                style={{ width: '150px' }}
              >
                <option value="day">按日</option>
                <option value="month">按月</option>
                <option value="store">按门店</option>
                <option value="customerService">按客服</option>
                <option value="applianceType">按家电类型</option>
              </select>
            </div>
            <button onClick={loadData} className="btn btn-primary">
              查询
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="card p-5">
            <p className="text-gray-500 text-sm">订单总数</p>
            <p className="text-3xl font-bold text-gray-800 mt-2">{data?.summary?.totalOrders || 0}</p>
          </div>
          <div className="card p-5">
            <p className="text-gray-500 text-sm">总营收</p>
            <p className="text-3xl font-bold text-green-600 mt-2">
              ¥{data?.summary?.totalRevenue?.toFixed(2) || '0.00'}
            </p>
          </div>
          <div className="card p-5">
            <p className="text-gray-500 text-sm">客单价</p>
            <p className="text-3xl font-bold text-blue-600 mt-2">
              ¥{data?.summary?.avgOrderValue?.toFixed(2) || '0.00'}
            </p>
          </div>
        </div>
        
        <div className="card overflow-hidden">
          <div className="p-5 border-b border-gray-200">
            <h3 className="font-semibold text-gray-800">销售明细</h3>
          </div>
          
          {loading ? (
            <div className="text-center py-12 text-gray-500">加载中...</div>
          ) : data?.salesData?.length === 0 ? (
            <div className="text-center py-12 text-gray-500">暂无数据</div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">日期/分类</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">订单数</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">总营收</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">客单价</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">配件收入</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {data?.salesData?.map((item, idx) => {
                  let label = '';
                  if (filters.groupBy === 'day') {
                    label = `${item._id.year}-${String(item._id.month).padStart(2, '0')}-${String(item._id.day).padStart(2, '0')}`;
                  } else if (filters.groupBy === 'month') {
                    label = `${item._id.year}-${String(item._id.month).padStart(2, '0')}`;
                  } else {
                    label = item._id || '未分类';
                  }
                  
                  return (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-800">{label}</td>
                      <td className="px-4 py-3 text-right">{item.orderCount}</td>
                      <td className="px-4 py-3 text-right font-medium text-green-600">
                        ¥{item.totalRevenue?.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-600">
                        ¥{item.avgOrderValue?.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-600">
                        ¥{item.partsRevenue?.toFixed(2) || '0.00'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
        
        {data?.applianceStats && data.applianceStats.length > 0 && (
          <div className="card p-5">
            <h3 className="font-semibold text-gray-800 mb-4">家电类型分布</h3>
            <div className="space-y-3">
              {data.applianceStats.map((item, idx) => {
                const total = data.summary?.totalOrders || 1;
                const percentage = ((item.count / total) * 100).toFixed(1);
                
                return (
                  <div key={idx}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-700">{item._id}</span>
                      <span className="text-gray-500">{item.count} 单 · ¥{item.revenue?.toFixed(0)}</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-blue-500 rounded-full"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
