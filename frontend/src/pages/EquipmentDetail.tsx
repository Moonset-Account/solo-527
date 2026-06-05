import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams, Link } from 'react-router-dom';
import dayjs from 'dayjs';

export default function EquipmentDetail() {
  const { id } = useParams<{ id: string }>();
  const [equipment, setEquipment] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchEquipment();
    }
  }, [id]);

  const fetchEquipment = async () => {
    try {
      const response = await axios.get(`/api/equipment/${id}`);
      setEquipment(response.data);
    } catch (error) {
      console.error('获取设备详情失败:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-gray-500">加载中...</div>;
  }

  if (!equipment) {
    return <div className="text-gray-500">设备不存在</div>;
  }

  const typeLabels: Record<string, string> = {
    tractor: '拖拉机',
    transplanter: '插秧机',
    drone: '无人机',
    other: '其他设备'
  };

  const statusLabels: Record<string, string> = {
    available: '可用',
    in_use: '使用中',
    maintenance: '维修中',
    broken: '故障'
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/equipment" className="text-gray-500 hover:text-gray-700">
          ← 返回列表
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="card">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-800">{equipment.name}</h1>
                <p className="text-gray-500 mt-1">{equipment.model}</p>
              </div>
              <span className={`status-badge status-${equipment.status} text-sm px-3 py-1`}>
                {statusLabels[equipment.status]}
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-gray-50 rounded-xl">
                <p className="text-xs text-gray-500">设备类型</p>
                <p className="font-semibold mt-1">{typeLabels[equipment.type]}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-xl">
                <p className="text-xs text-gray-500">序列号</p>
                <p className="font-semibold mt-1">{equipment.serial_number || '-'}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-xl">
                <p className="text-xs text-gray-500">购买日期</p>
                <p className="font-semibold mt-1">{equipment.purchase_date || '-'}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-xl">
                <p className="text-xs text-gray-500">累计工时</p>
                <p className="font-semibold mt-1">{equipment.total_hours} 小时</p>
              </div>
            </div>
          </div>

          <div className="card">
            <h3 className="font-semibold text-lg mb-4">📊 运行统计</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-xl">
                <p className="text-2xl font-bold text-blue-600">{equipment.stats?.total_work_hours || 0}</p>
                <p className="text-xs text-blue-500 mt-1">累计作业时长</p>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-xl">
                <p className="text-2xl font-bold text-orange-600">{equipment.stats?.total_fuel || 0}</p>
                <p className="text-xs text-orange-500 mt-1">累计油耗(升)</p>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-xl">
                <p className="text-2xl font-bold text-red-600">{equipment.stats?.maintenance_count || 0}</p>
                <p className="text-xs text-red-500 mt-1">待处理维修</p>
              </div>
            </div>
          </div>

          <div className="card">
            <h3 className="font-semibold text-lg mb-4">📝 最近作业记录</h3>
            <div className="space-y-3">
              {equipment.work_records?.length > 0 ? (
                equipment.work_records.slice(0, 5).map((record: any) => (
                  <div key={record.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">{record.field_name}</p>
                      <p className="text-xs text-gray-500">
                        机手：{record.operator_name} | {dayjs(record.completed_at).format('YYYY-MM-DD')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{record.work_hours} 小时</p>
                      <p className="text-xs text-gray-500">油耗 {record.fuel_consumption}L</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-4">暂无作业记录</p>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="card">
            <h3 className="font-semibold text-lg mb-4">🔧 维修记录</h3>
            <div className="space-y-3">
              {equipment.maintenance_records?.length > 0 ? (
                equipment.maintenance_records.slice(0, 5).map((ticket: any) => (
                  <div key={ticket.id} className="p-3 border border-gray-100 rounded-lg">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-sm">{ticket.title}</p>
                      <span className={`status-badge status-${ticket.status}`}>
                        {ticket.status === 'open' ? '待处理' : ticket.status === 'in_progress' ? '处理中' : ticket.status === 'resolved' ? '已解决' : '已关闭'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {dayjs(ticket.reported_at).format('YYYY-MM-DD')}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-4 text-sm">暂无维修记录</p>
              )}
            </div>
          </div>

          <div className="card">
            <h3 className="font-semibold text-lg mb-4">⚡ 快捷操作</h3>
            <div className="space-y-3">
              <Link to="/reservations/new" className="btn-primary w-full text-center block">
                📅 预约此设备
              </Link>
              <button className="btn-secondary w-full">
                🔧 报故障维修
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
