import { useEffect, useState } from 'react';
import FilterBar from '@/components/filters/FilterBar';
import { api } from '@/services/api';
import type { AnomalyEvent, DoorRecord } from '@shared/types';
import { AlertTriangle, Clock, User, ChevronDown, ChevronUp, DoorOpen } from 'lucide-react';
import dayjs from 'dayjs';

export default function Exception() {
  const [anomalies, setAnomalies] = useState<AnomalyEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [relatedDoors, setRelatedDoors] = useState<Record<string, DoorRecord[]>>({});
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [filterType, setFilterType] = useState<string>('');
  const [filterSeverity, setFilterSeverity] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');

  useEffect(() => {
    loadData();
  }, [page, filterType, filterSeverity, filterStatus]);

  const loadData = async () => {
    setLoading(true);
    try {
      const filters: any = {};
      if (filterType) filters.type = filterType;
      if (filterSeverity) filters.severity = filterSeverity;
      if (filterStatus) filters.status = filterStatus;
      
      const result = await api.getAnomalyList(page, 10, Object.keys(filters).length > 0 ? filters : undefined);
      setAnomalies(result.list);
      setTotal(result.total);
    } catch (error) {
      console.error('Failed to load anomalies:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadDetail = async (id: string) => {
    if (relatedDoors[id]) return;
    try {
      const detail = await api.getAnomalyDetail(id);
      setRelatedDoors(prev => ({ ...prev, [id]: detail.relatedDoors }));
    } catch (error) {
      console.error('Failed to load anomaly detail:', error);
    }
  };

  const handleExpand = (id: string) => {
    if (expandedId === id) {
      setExpandedId(null);
    } else {
      setExpandedId(id);
      loadDetail(id);
    }
  };

  const getAnomalyTypeLabel = (type: string) => {
    const map: Record<string, string> = {
      temp_high: '温度过高',
      temp_low: '温度过低',
      door_open: '车门异常开启',
      delay: '配送延迟',
    };
    return map[type] || type;
  };

  const getSeverityColor = (severity: string) => {
    const map: Record<string, string> = {
      low: 'bg-green-100 text-green-700',
      medium: 'bg-yellow-100 text-yellow-700',
      high: 'bg-red-100 text-red-700',
    };
    return map[severity] || 'bg-gray-100 text-gray-700';
  };

  const getStatusColor = (status: string) => {
    const map: Record<string, string> = {
      pending: 'bg-red-100 text-red-700',
      processing: 'bg-yellow-100 text-yellow-700',
      resolved: 'bg-green-100 text-green-700',
    };
    return map[status] || 'bg-gray-100 text-gray-700';
  };

  const getStatusLabel = (status: string) => {
    const map: Record<string, string> = {
      pending: '待处理',
      processing: '处理中',
      resolved: '已解决',
    };
    return map[status] || status;
  };

  const getTypeIcon = (type: string) => {
    if (type === 'door_open') return DoorOpen;
    return AlertTriangle;
  };

  const totalPages = Math.ceil(total / 10);

  return (
    <div>
      <FilterBar />

      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-5 border-b border-gray-100">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h3 className="text-lg font-semibold text-gray-800">异常事件列表</h3>
            <div className="flex flex-wrap gap-2">
              <select
                value={filterType}
                onChange={(e) => { setFilterType(e.target.value); setPage(1); }}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">全部类型</option>
                <option value="temp_high">温度过高</option>
                <option value="temp_low">温度过低</option>
                <option value="door_open">车门异常开启</option>
                <option value="delay">配送延迟</option>
              </select>
              <select
                value={filterSeverity}
                onChange={(e) => { setFilterSeverity(e.target.value); setPage(1); }}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">全部级别</option>
                <option value="low">低</option>
                <option value="medium">中</option>
                <option value="high">高</option>
              </select>
              <select
                value={filterStatus}
                onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">全部状态</option>
                <option value="pending">待处理</option>
                <option value="processing">处理中</option>
                <option value="resolved">已解决</option>
              </select>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-gray-500">加载中...</div>
        ) : (
          <>
            <div className="divide-y divide-gray-100">
              {anomalies.map((anomaly) => {
                const TypeIcon = getTypeIcon(anomaly.type);
                const isExpanded = expandedId === anomaly.id;
                return (
                  <div key={anomaly.id}>
                    <div
                      className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => handleExpand(anomaly.id)}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`p-2 rounded-lg ${getSeverityColor(anomaly.severity)}`}>
                          <TypeIcon className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3">
                            <h4 className="font-medium text-gray-800">{getAnomalyTypeLabel(anomaly.type)}</h4>
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${getSeverityColor(anomaly.severity)}`}>
                              {anomaly.severity === 'high' ? '高级' : anomaly.severity === 'medium' ? '中级' : '低级'}
                            </span>
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(anomaly.status)}`}>
                              {getStatusLabel(anomaly.status)}
                            </span>
                          </div>
                          <p className="text-sm text-gray-500 mt-1">{anomaly.description}</p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {dayjs(anomaly.startTime).format('YYYY-MM-DD HH:mm')}
                            </span>
                            <span className="flex items-center gap-1">
                              <User className="w-3 h-3" />
                              责任人: {anomaly.responsible}
                            </span>
                            <span>
                              持续时长: {Math.round(anomaly.duration / 60)} 分钟
                            </span>
                          </div>
                        </div>
                        <button className="p-2 hover:bg-gray-200 rounded-lg transition-colors">
                          {isExpanded ? (
                            <ChevronUp className="w-5 h-5 text-gray-400" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-gray-400" />
                          )}
                        </button>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="px-4 pb-4">
                        <div className="ml-12 p-4 bg-gray-50 rounded-lg">
                          <h5 className="text-sm font-medium text-gray-700 mb-3">责任段定位与关联操作</h5>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <p className="text-gray-500">异常开始时间</p>
                              <p className="font-medium text-gray-800">
                                {dayjs(anomaly.startTime).format('YYYY-MM-DD HH:mm:ss')}
                              </p>
                            </div>
                            <div>
                              <p className="text-gray-500">异常结束时间</p>
                              <p className="font-medium text-gray-800">
                                {anomaly.endTime ? dayjs(anomaly.endTime).format('YYYY-MM-DD HH:mm:ss') : '进行中'}
                              </p>
                            </div>
                          </div>

                          {relatedDoors[anomaly.id] && relatedDoors[anomaly.id].length > 0 && (
                            <div className="mt-4">
                              <h6 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                                <DoorOpen className="w-4 h-4" />
                                关联开门记录
                              </h6>
                              <div className="space-y-2">
                                {relatedDoors[anomaly.id].map((door) => (
                                  <div key={door.id} className="flex items-center justify-between p-2 bg-white rounded text-sm">
                                    <span>
                                      {dayjs(door.openTime).format('HH:mm')} - {dayjs(door.closeTime).format('HH:mm')}
                                    </span>
                                    <span className="text-gray-500">
                                      时长: {Math.round(door.duration / 60)} 分钟 | 操作人: {door.operator}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {totalPages > 1 && (
              <div className="p-4 border-t border-gray-100 flex items-center justify-between">
                <span className="text-sm text-gray-500">共 {total} 条记录</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-3 py-1 border border-gray-200 rounded text-sm disabled:opacity-50 hover:bg-gray-50"
                  >
                    上一页
                  </button>
                  <span className="px-3 py-1 text-sm text-gray-600">
                    {page} / {totalPages}
                  </span>
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="px-3 py-1 border border-gray-200 rounded text-sm disabled:opacity-50 hover:bg-gray-50"
                  >
                    下一页
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
