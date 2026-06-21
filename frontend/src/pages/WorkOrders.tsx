import { useEffect, useState } from 'react';
import { workOrderApi } from '../services/workOrderApi';
import type { WorkOrder } from '../types';

const WorkOrders = () => {
  const [orders, setOrders] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const data = await workOrderApi.getAll();
      setOrders(data);
    } catch (err) {
      console.error('加载工单失败', err);
    } finally {
      setLoading(false);
    }
  };

  const getProgress = (planned: number, completed: number) => {
    if (planned === 0) return 0;
    return Math.min((completed / planned) * 100, 100);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">工单管理</h2>
      </div>

      {loading ? (
        <div className="text-center py-20">加载中...</div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">工单号</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">产品</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">计划数量</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">完成进度</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">设备</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">班组</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">计划开始</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">实际开始</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {orders.map((order) => {
                const progress = getProgress(order.plannedQuantity, order.completedQuantity);
                return (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-primary">{order.code}</td>
                    <td className="px-4 py-3">
                      <div>{order.productName}</div>
                      <div className="text-xs text-gray-400">{order.productCode}</div>
                    </td>
                    <td className="px-4 py-3 text-right">{order.plannedQuantity}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 min-w-20 bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${progress >= 100 ? 'bg-green-500' : 'bg-primary'}`}
                            style={{ width: `${progress}%` }}
                          ></div>
                        </div>
                        <span className="text-xs text-gray-500 w-12 text-right">
                          {order.completedQuantity}/{order.plannedQuantity}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{order.equipmentName || '-'}</td>
                    <td className="px-4 py-3 text-gray-500">{order.shiftName || '-'}</td>
                    <td className="px-4 py-3 text-gray-500 text-sm">
                      {new Date(order.plannedStartTime).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {order.actualStartTime
                        ? new Date(order.actualStartTime).toLocaleDateString()
                        : <span className="text-gray-400">未开始</span>
                      }
                    </td>
                  </tr>
                );
              })}
              {orders.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-gray-400">
                    暂无工单
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default WorkOrders;
