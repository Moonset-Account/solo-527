import { useState, useEffect } from 'react';
import AdminLayout from '~/components/AdminLayout';
import api from '~/utils/api';
import dayjs from 'dayjs';

export default function PriceTransparencyReport() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    startDate: dayjs().subtract(30, 'day').format('YYYY-MM-DD'),
    endDate: dayjs().format('YYYY-MM-DD'),
    store: '',
    applianceType: 'all'
  });
  
  useEffect(() => {
    loadData();
  }, [filters]);
  
  const loadData = async () => {
    setLoading(true);
    try {
      const result = await api.get('/reports/price-transparency', filters);
      if (result.success) {
        setData(result.data);
      }
    } catch (error) {
      console.error('加载价格透明报表失败:', error);
    } finally {
      setLoading(false);
    }
  };
  
  if (loading) {
    return (
      <AdminLayout title="价格透明报表">
        <div className="text-center py-12">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-500">加载中...</p>
        </div>
      </AdminLayout>
    );
  }
  
  const priceComp = data?.priceComposition || {};
  const total = priceComp.total || 0;
  
  const priceItems = [
    { key: 'baseService', label: '基础服务费', color: 'bg-blue-500' },
    { key: 'parts', label: '配件费用', color: 'bg-green-500' },
    { key: 'serviceFee', label: '上门服务费', color: 'bg-purple-500' },
    { key: 'technicianFee', label: '师傅服务费', color: 'bg-orange-500' },
    { key: 'discount', label: '优惠折扣', color: 'bg-red-400' }
  ];
  
  return (
    <AdminLayout title="价格透明报表">
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
              <label className="label">门店</label>
              <input
                type="text"
                placeholder="门店名称"
                value={filters.store}
                onChange={(e) => setFilters(prev => ({ ...prev, store: e.target.value }))}
                className="input"
                style={{ width: '150px' }}
              />
            </div>
            <div>
              <label className="label">家电类型</label>
              <select
                value={filters.applianceType}
                onChange={(e) => setFilters(prev => ({ ...prev, applianceType: e.target.value }))}
                className="select"
                style={{ width: '150px' }}
              >
                <option value="all">全部类型</option>
                {['空调', '冰箱', '洗衣机', '电视', '热水器', '燃气灶', '油烟机'].map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
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
            <p className="text-3xl font-bold text-green-600 mt-2">¥{data?.summary?.totalRevenue?.toFixed(2) || '0.00'}</p>
          </div>
          <div className="card p-5">
            <p className="text-gray-500 text-sm">客单价</p>
            <p className="text-3xl font-bold text-blue-600 mt-2">¥{data?.summary?.avgOrderValue?.toFixed(2) || '0.00'}</p>
          </div>
        </div>
        
        <div className="card p-5">
          <h3 className="font-semibold text-gray-800 mb-4">价格构成分析</h3>
          <div className="space-y-4">
            {priceItems.map(item => {
              const amount = priceComp[item.key] || 0;
              const percentage = total > 0 ? ((amount / total) * 100).toFixed(1) : 0;
              
              return (
                <div key={item.key}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">{item.label}</span>
                    <span className="font-medium">
                      ¥{amount?.toFixed(2)} 
                      <span className="text-gray-400 ml-2">({percentage}%)</span>
                    </span>
                  </div>
                  <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${item.color} rounded-full transition-all duration-500`}
                      style={{ width: `${Math.abs(percentage)}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
          
          <div className="mt-6 pt-4 border-t border-gray-200 flex justify-between items-center">
            <span className="font-medium text-gray-700">总计</span>
            <span className="text-2xl font-bold text-blue-600">¥{total?.toFixed(2)}</span>
          </div>
        </div>
        
        <div className="card overflow-hidden">
          <div className="p-5 border-b border-gray-200">
            <h3 className="font-semibold text-gray-800">订单明细</h3>
          </div>
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">订单号</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">客户</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">家电类型</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">基础费用</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">配件费用</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">总金额</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">状态</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {data?.orders?.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-4 py-8 text-center text-gray-500">暂无数据</td>
                </tr>
              ) : (
                data?.orders?.map((order) => (
                  <tr key={order._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-blue-600">{order.orderNo}</td>
                    <td className="px-4 py-3 text-gray-800">{order.customerName}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full">
                        {order.applianceType}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-gray-600">¥{order.baseAmount?.toFixed(2)}</td>
                    <td className="px-4 py-3 text-right text-gray-600">¥{order.partsAmount?.toFixed(2)}</td>
                    <td className="px-4 py-3 text-right font-medium text-gray-800">¥{order.totalAmount?.toFixed(2)}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        order.status === 'completed' ? 'bg-green-100 text-green-700' :
                        order.status === 'in_progress' ? 'bg-orange-100 text-orange-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {order.status === 'completed' ? '已完成' :
                         order.status === 'in_progress' ? '维修中' :
                         order.status === 'assigned' ? '已派单' : '其他'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}
