'use client';

import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

interface Visitor {
  id: string;
  name: string;
  phone: string;
  idCardNumber?: string;
  company?: string;
  status: string;
  checkInTime?: string;
  checkOutTime?: string;
  idPhotoPath?: string;
  meeting: {
    id: string;
    title: string;
    startTime: string;
    room?: {
      name: string;
    };
    host: {
      name: string;
    };
    department?: {
      name: string;
    };
  };
}

const statusMap: Record<string, { label: string; class: string }> = {
  INVITED: { label: '已邀请', class: 'badge-info' },
  CHECKED_IN: { label: '已入场', class: 'badge-success' },
  CHECKED_OUT: { label: '已离场', class: 'badge-secondary' },
  CANCELLED: { label: '已取消', class: 'badge-danger' },
};

export default function VisitorsPage() {
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [selectedVisitor, setSelectedVisitor] = useState<Visitor | null>(null);

  useEffect(() => {
    loadVisitors();
  }, [filter]);

  async function loadVisitors() {
    try {
      const url = filter ? `/api/visitors?status=${filter}` : '/api/visitors';
      const res = await fetch(url);
      const data = await res.json();
      setVisitors(data.visitors || []);
    } catch (error) {
      console.error('Failed to load visitors:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleCheckIn(visitorId: string) {
    try {
      const res = await fetch(`/api/visitors/${visitorId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'checkin' }),
      });

      if (res.ok) {
        alert('访客签到成功');
        loadVisitors();
        setSelectedVisitor(null);
      }
    } catch (error) {
      console.error('Failed to check in:', error);
      alert('签到失败');
    }
  }

  async function handleCheckOut(visitorId: string) {
    if (!confirm('确认访客离场？门禁权限将被撤销，证件照片将在72小时后删除。')) {
      return;
    }

    try {
      const res = await fetch(`/api/visitors/${visitorId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'checkout' }),
      });

      if (res.ok) {
        alert('访客签退成功，门禁权限已撤销');
        loadVisitors();
        setSelectedVisitor(null);
      }
    } catch (error) {
      console.error('Failed to check out:', error);
      alert('签退失败');
    }
  }

  if (loading) {
    return <div className="text-center py-12">加载中...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">访客管理</h1>
          <p className="text-gray-600 mt-1">查看和管理访客记录</p>
        </div>
        <div className="flex items-center space-x-2">
          <select
            className="input max-w-xs"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="">全部状态</option>
            <option value="INVITED">已邀请</option>
            <option value="CHECKED_IN">已入场</option>
            <option value="CHECKED_OUT">已离场</option>
            <option value="CANCELLED">已取消</option>
          </select>
        </div>
      </div>

      <div className="card">
        {visitors.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p className="text-lg">暂无访客记录</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium text-gray-600">访客姓名</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">联系方式</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">所属公司</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">会议</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">主持人</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">状态</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">操作</th>
                </tr>
              </thead>
              <tbody>
                {visitors.map((visitor) => (
                  <tr key={visitor.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <button
                        onClick={() => setSelectedVisitor(visitor)}
                        className="font-medium text-primary-600 hover:text-primary-700"
                      >
                        {visitor.name}
                      </button>
                    </td>
                    <td className="py-3 px-4">{visitor.phone}</td>
                    <td className="py-3 px-4">{visitor.company || '-'}</td>
                    <td className="py-3 px-4">
                      <p className="font-medium">{visitor.meeting.title}</p>
                      <p className="text-sm text-gray-500">
                        {format(new Date(visitor.meeting.startTime), 'MM-dd HH:mm', { locale: zhCN })}
                      </p>
                    </td>
                    <td className="py-3 px-4">{visitor.meeting.host.name}</td>
                    <td className="py-3 px-4">
                      <span className={`badge ${statusMap[visitor.status]?.class}`}>
                        {statusMap[visitor.status]?.label}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setSelectedVisitor(visitor)}
                          className="text-primary-600 hover:text-primary-700 text-sm"
                        >
                          详情
                        </button>
                        {visitor.status === 'INVITED' && (
                          <button
                            onClick={() => handleCheckIn(visitor.id)}
                            className="text-green-600 hover:text-green-700 text-sm"
                          >
                            签到
                          </button>
                        )}
                        {visitor.status === 'CHECKED_IN' && (
                          <button
                            onClick={() => handleCheckOut(visitor.id)}
                            className="text-orange-600 hover:text-orange-700 text-sm"
                          >
                            签退
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedVisitor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-6">
              <h3 className="text-xl font-semibold">访客详情</h3>
              <button
                onClick={() => setSelectedVisitor(null)}
                className="text-gray-400 hover:text-gray-600 text-xl"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">姓名</p>
                  <p className="font-medium">{selectedVisitor.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">手机号</p>
                  <p className="font-medium">{selectedVisitor.phone}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">身份证号</p>
                  <p className="font-medium">{selectedVisitor.idCardNumber || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">公司</p>
                  <p className="font-medium">{selectedVisitor.company || '-'}</p>
                </div>
              </div>

              <div className="pt-4 border-t">
                <p className="text-sm text-gray-500 mb-2">状态</p>
                <span className={`badge ${statusMap[selectedVisitor.status]?.class}`}>
                  {statusMap[selectedVisitor.status]?.label}
                </span>
              </div>

              <div className="pt-4 border-t">
                <p className="text-sm text-gray-500 mb-2">会议信息</p>
                <p className="font-medium">{selectedVisitor.meeting.title}</p>
                <p className="text-sm text-gray-600">
                  {format(new Date(selectedVisitor.meeting.startTime), 'yyyy年MM月dd日 HH:mm', { locale: zhCN })}
                </p>
                <p className="text-sm text-gray-600">
                  会议室: {selectedVisitor.meeting.room?.name || '未指定'}
                </p>
                <p className="text-sm text-gray-600">
                  主持人: {selectedVisitor.meeting.host.name}
                </p>
                {selectedVisitor.meeting.department && (
                  <p className="text-sm text-gray-600">
                    部门: {selectedVisitor.meeting.department.name}
                  </p>
                )}
              </div>

              {selectedVisitor.checkInTime && (
                <div className="pt-4 border-t">
                  <p className="text-sm text-gray-500">入场时间</p>
                  <p className="font-medium">
                    {format(new Date(selectedVisitor.checkInTime), 'yyyy-MM-dd HH:mm:ss', { locale: zhCN })}
                  </p>
                </div>
              )}

              {selectedVisitor.checkOutTime && (
                <div className="pt-4 border-t">
                  <p className="text-sm text-gray-500">离场时间</p>
                  <p className="font-medium">
                    {format(new Date(selectedVisitor.checkOutTime), 'yyyy-MM-dd HH:mm:ss', { locale: zhCN })}
                  </p>
                </div>
              )}

              {selectedVisitor.idPhotoPath && (
                <div className="pt-4 border-t">
                  <p className="text-sm text-gray-500 mb-2">证件照片</p>
                  <img
                    src={selectedVisitor.idPhotoPath}
                    alt="证件照片"
                    className="w-48 h-48 object-cover rounded-lg border"
                  />
                  <p className="text-xs text-gray-500 mt-1">照片将在72小时后自动删除</p>
                </div>
              )}

              <div className="pt-6 border-t flex space-x-3">
                {selectedVisitor.status === 'INVITED' && (
                  <button
                    onClick={() => handleCheckIn(selectedVisitor.id)}
                    className="btn btn-primary flex-1"
                  >
                    确认签到
                  </button>
                )}
                {selectedVisitor.status === 'CHECKED_IN' && (
                  <button
                    onClick={() => handleCheckOut(selectedVisitor.id)}
                    className="btn btn-primary flex-1"
                  >
                    确认签退
                  </button>
                )}
                <button
                  onClick={() => setSelectedVisitor(null)}
                  className="btn btn-secondary"
                >
                  关闭
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
