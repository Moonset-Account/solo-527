import { useEffect, useState } from 'react';
import { equipmentApi } from '../services/equipmentApi';
import type { Equipment } from '../types';

const EquipmentPage = () => {
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<number | ''>('');

  useEffect(() => {
    loadEquipments();
  }, [statusFilter]);

  const loadEquipments = async () => {
    try {
      setLoading(true);
      const data = statusFilter !== ''
        ? await equipmentApi.getByStatus(statusFilter)
        : await equipmentApi.getAll();
      setEquipments(data);
    } catch (err) {
      console.error('加载设备失败', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: number, statusText: string) => {
    const colors: Record<number, string> = {
      1: 'bg-green-100 text-green-700',
      2: 'bg-blue-100 text-blue-700',
      3: 'bg-red-100 text-red-700',
      4: 'bg-gray-100 text-gray-700',
      5: 'bg-yellow-100 text-yellow-700',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[status] || 'bg-gray-100'}`}>
        {statusText}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">设备列表</h2>
        <div className="flex gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value === '' ? '' : Number(e.target.value))}
            className="px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">全部状态</option>
            <option value="1">运行中</option>
            <option value="2">加工中</option>
            <option value="3">异常</option>
            <option value="4">停机</option>
            <option value="5">维护中</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20">加载中...</div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">设备编号</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">设备名称</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">型号</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">状态</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">当前工单</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">模具</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">位置</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {equipments.map((eq) => (
                <tr key={eq.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium">{eq.code}</td>
                  <td className="px-6 py-4">{eq.name}</td>
                  <td className="px-6 py-4 text-gray-500">{eq.model}</td>
                  <td className="px-6 py-4">{getStatusBadge(eq.status, eq.statusText)}</td>
                  <td className="px-6 py-4 text-primary">{eq.currentWorkOrderCode || '-'}</td>
                  <td className="px-6 py-4 text-gray-500">{eq.moldCode || '-'}</td>
                  <td className="px-6 py-4 text-gray-500">{eq.location}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default EquipmentPage;
