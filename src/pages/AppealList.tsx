import React, { useEffect, useState } from 'react';
import { CheckCircle, XCircle, CloudRain, Calendar, MapPin } from 'lucide-react';
import { AppealStatusBadge } from '@/components/Badges';
import { appealApi } from '@/services/api';
import type { AppealRecord, PaginatedResponse } from '@/types';
import { formatDateTime } from '@/utils';

const AppealListPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<PaginatedResponse<AppealRecord> | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await appealApi.getList(page, pageSize, statusFilter !== 'all' ? { status: statusFilter } : {});
      setData(res);
    } catch (error) {
      console.error('Failed to load appeals:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [statusFilter, page]);

  const handleApprove = async (appealId: string) => {
    try {
      await appealApi.handleAppeal(appealId, { result: 'approved', remark: '申诉通过，准予延期' });
      loadData();
    } catch (error) {
      console.error('Failed to approve appeal:', error);
    }
  };

  const handleReject = async (appealId: string) => {
    try {
      await appealApi.handleAppeal(appealId, { result: 'rejected', remark: '申诉理由不充分' });
      loadData();
    } catch (error) {
      console.error('Failed to reject appeal:', error);
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">申诉处理</h1>
        <p className="text-gray-500 mt-1">班组逾期申诉审核与佐证材料查看</p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-base font-semibold text-gray-900">申诉列表</h3>
          <div className="flex items-center gap-2">
            {(['all', 'pending', 'approved', 'rejected'] as const).map((status) => (
              <button
                key={status}
                onClick={() => {
                  setStatusFilter(status);
                  setPage(1);
                }}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  statusFilter === status
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {status === 'all' ? '全部' :
                 status === 'pending' ? '待处理' :
                 status === 'approved' ? '已通过' : '已驳回'}
              </button>
            ))}
          </div>
        </div>

        <div className="divide-y divide-gray-100">
          {loading ? (
            <div className="p-12 text-center text-gray-500">
              <div className="animate-pulse">加载中...</div>
            </div>
          ) : data?.items.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              暂无申诉记录
            </div>
          ) : (
            data?.items.map((appeal) => (
              <div key={appeal.id} className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <AppealStatusBadge status={appeal.status} />
                      <span className="text-sm text-gray-500">
                        申请于 {formatDateTime(appeal.createdAt)}
                      </span>
                    </div>
                    <p className="text-base text-gray-900 font-medium mb-2">{appeal.reason}</p>
                  </div>
                  {appeal.status === 'pending' && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleApprove(appeal.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700 transition-colors"
                      >
                        <CheckCircle className="w-4 h-4" />
                        通过
                      </button>
                      <button
                        onClick={() => handleReject(appeal.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700 transition-colors"
                      >
                        <XCircle className="w-4 h-4" />
                        驳回
                      </button>
                    </div>
                  )}
                </div>

                {appeal.weatherEvidence && appeal.weatherEvidence.length > 0 && (
                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <CloudRain className="w-4 h-4 text-blue-500" />
                      <span className="text-sm font-medium text-gray-700">天气佐证</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {appeal.weatherEvidence.map((w) => (
                        <div
                          key={w.date}
                          className="px-3 py-2 bg-blue-50 border border-blue-100 rounded-lg text-sm"
                        >
                          <div className="text-blue-700 font-medium">{w.date}</div>
                          <div className="text-blue-600 text-xs">
                            {w.weather} · {w.temperature}°C · {w.windLevel}级风
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {appeal.stopWorkEvidence && appeal.stopWorkEvidence.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="w-4 h-4 text-orange-500" />
                      <span className="text-sm font-medium text-gray-700">停工记录佐证</span>
                    </div>
                    <div className="space-y-2">
                      {appeal.stopWorkEvidence.map((s) => (
                        <div
                          key={s.id}
                          className="p-3 bg-orange-50 border border-orange-100 rounded-lg"
                        >
                          <div className="flex items-center gap-2 text-orange-700 text-sm font-medium">
                            <span>{s.startDate} ~ {s.endDate}</span>
                          </div>
                          <p className="text-orange-600 text-sm mt-1">{s.reason}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {appeal.handleRemark && (
                  <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                    <p className="text-xs text-gray-500 mb-1">处理意见</p>
                    <p className="text-sm text-gray-700">{appeal.handleRemark}</p>
                    {appeal.handledAt && (
                      <p className="text-xs text-gray-400 mt-1">
                        处理于 {formatDateTime(appeal.handledAt)}
                      </p>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default AppealListPage;
