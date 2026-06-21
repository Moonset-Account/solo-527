import { useEffect, useState } from 'react';
import { workReportApi } from '../services/workReportApi';
import { useAuthStore } from '../stores/authStore';
import type { WorkReport } from '../types';

const WorkReport = () => {
  const [reports, setReports] = useState<WorkReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<number | ''>('');
  const [selectedReport, setSelectedReport] = useState<WorkReport | null>(null);
  const [auditComment, setAuditComment] = useState('');
  const { user } = useAuthStore();

  useEffect(() => {
    loadReports();
  }, [statusFilter]);

  const loadReports = async () => {
    try {
      setLoading(true);
      const result = await workReportApi.getPaged(0, 50, statusFilter !== '' ? statusFilter : undefined);
      setReports(result.items);
    } catch (err) {
      console.error('加载报工失败', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAudit = async (isApproved: boolean) => {
    if (!selectedReport || !user) return;
    try {
      await workReportApi.audit({
        reportId: selectedReport.id,
        reviewerId: user.id,
        isApproved,
        comment: auditComment,
      });
      setSelectedReport(null);
      setAuditComment('');
      loadReports();
    } catch (err) {
      console.error('审核失败', err);
    }
  };

  const getStatusBadge = (status: number, statusText: string) => {
    const colors: Record<number, string> = {
      1: 'bg-yellow-100 text-yellow-700',
      2: 'bg-blue-100 text-blue-700',
      3: 'bg-green-100 text-green-700',
      4: 'bg-red-100 text-red-700',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[status] || 'bg-gray-100'}`}>
        {statusText}
      </span>
    );
  };

  const canAudit = user?.role === 2 || user?.role === 3;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">报工管理</h2>
        <div className="flex gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value === '' ? '' : Number(e.target.value))}
            className="px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">全部状态</option>
            <option value="1">待审核</option>
            <option value="2">审核中</option>
            <option value="3">已通过</option>
            <option value="4">已驳回</option>
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
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">工单号</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">设备</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">操作人</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">班组</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">合格数</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">不良数</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">工时</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">状态</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {reports.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-primary font-medium">{r.workOrderCode}</td>
                  <td className="px-4 py-3">{r.equipmentName}</td>
                  <td className="px-4 py-3">{r.operatorName}</td>
                  <td className="px-4 py-3 text-gray-500">{r.shiftName}</td>
                  <td className="px-4 py-3 text-right font-medium">{r.completedQuantity}</td>
                  <td className="px-4 py-3 text-right text-red-500">{r.defectiveQuantity}</td>
                  <td className="px-4 py-3 text-right">{r.workHours.toFixed(1)}h</td>
                  <td className="px-4 py-3">{getStatusBadge(r.status, r.statusText)}</td>
                  <td className="px-4 py-3">
                    {canAudit && r.status === 1 && (
                      <button
                        onClick={() => setSelectedReport(r)}
                        className="text-primary hover:underline text-sm"
                      >
                        审核
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {reports.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-gray-400">
                    暂无数据
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {selectedReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl w-full max-w-lg mx-4">
            <h3 className="text-lg font-bold mb-4">报工审核</h3>
            <div className="space-y-3 mb-4 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">工单号</span>
                <span className="font-medium">{selectedReport.workOrderCode}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">操作人</span>
                <span>{selectedReport.operatorName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">设备</span>
                <span>{selectedReport.equipmentName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">合格数量</span>
                <span className="font-medium">{selectedReport.completedQuantity}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">不良数量</span>
                <span className="text-red-500">{selectedReport.defectiveQuantity}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">工时</span>
                <span>{selectedReport.workHours.toFixed(1)} 小时</span>
              </div>
              {selectedReport.remarks && (
                <div className="flex justify-between">
                  <span className="text-gray-500">备注</span>
                  <span>{selectedReport.remarks}</span>
                </div>
              )}
            </div>
            <div className="mb-4">
              <label className="block text-sm text-gray-600 mb-1">审核意见</label>
              <textarea
                value={auditComment}
                onChange={(e) => setAuditComment(e.target.value)}
                rows={2}
                className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-primary resize-none"
                placeholder="请输入审核意见（选填）"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setSelectedReport(null)}
                className="flex-1 py-2 border rounded-lg hover:bg-gray-50 transition"
              >
                取消
              </button>
              <button
                onClick={() => handleAudit(false)}
                className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
              >
                驳回
              </button>
              <button
                onClick={() => handleAudit(true)}
                className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition"
              >
                通过
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkReport;
