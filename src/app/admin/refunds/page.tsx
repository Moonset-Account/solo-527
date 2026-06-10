'use client';

import { useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import StatusBadge from '@/components/ui/StatusBadge';
import Button from '@/components/ui/Button';
import {
  Shield,
  Search,
  Filter,
  MoreVertical,
  Check,
  X,
  Eye,
  Download,
  Clock,
  AlertTriangle,
  FileText,
} from 'lucide-react';
import Link from 'next/link';

const mockRefunds = [
  { id: 'ref_002', invoiceNumber: 'INV-2024-000002', user: '张三', email: 'zhang@example.com', amount: 299, reasonCode: 'PRICE_TOO_HIGH', reason: '价格太贵，预算不足', note: '', status: 'PENDING', createdAt: '2024-07-07T00:00:00Z', plan: '专业版' },
  { id: 'ref_010', invoiceNumber: 'INV-2024-000010', user: '周杰', email: 'zhou@example.com', amount: 99, reasonCode: 'MISSING_FEATURES', reason: '缺少团队协作功能', note: '用户反馈需要更多团队功能', status: 'PENDING', createdAt: '2024-07-09T08:00:00Z', plan: '入门版' },
  { id: 'ref_009', invoiceNumber: 'INV-2024-000009', user: '吴敏', email: 'wu@example.com', amount: 99, reasonCode: 'TOO_COMPLEX', reason: '产品太复杂，不会用', note: '', status: 'PENDING', createdAt: '2024-07-09T06:00:00Z', plan: '入门版' },
  { id: 'ref_001', invoiceNumber: 'INV-2024-000001', user: '张三', email: 'zhang@example.com', amount: 100, reasonCode: 'MISSING_FEATURES', reason: '缺少团队协作功能', note: '用户反馈需要更多团队功能', status: 'PROCESSED', createdAt: '2024-05-28T00:00:00Z', plan: '专业版', reviewNote: '情况属实，予以部分退款', reviewedAt: '2024-05-30T00:00:00Z' },
  { id: 'ref_003', invoiceNumber: 'INV-2024-000004', user: '李四', email: 'li@example.com', amount: 0, reasonCode: 'TOO_COMPLEX', reason: '产品太复杂，不会用', note: '', status: 'REJECTED', createdAt: '2024-05-20T00:00:00Z', plan: '入门版', reviewNote: '试用期退款不受理', reviewedAt: '2024-05-21T00:00:00Z' },
  { id: 'ref_004', invoiceNumber: 'INV-2024-000008', user: '钱伟', email: 'qian@example.com', amount: 299, reasonCode: 'CUSTOMER_SERVICE', reason: '客服响应太慢', note: '用户对客服不满', status: 'PROCESSED', createdAt: '2024-04-15T00:00:00Z', plan: '专业版', reviewNote: '同意全额退款并致歉', reviewedAt: '2024-04-16T00:00:00Z' },
];

const reasonLabels: Record<string, string> = {
  PRICE_TOO_HIGH: '价格太高',
  MISSING_FEATURES: '缺少功能',
  TOO_COMPLEX: '太复杂',
  CUSTOMER_SERVICE: '服务问题',
  BUGS: 'Bug太多',
  BETTER_ALTERNATIVE: '找到更好替代',
  BUSINESS_NEEDS_CHANGE: '业务变更',
  OTHER: '其他原因',
};

export default function AdminRefundsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [reasonFilter, setReasonFilter] = useState('all');
  const [selectedRefund, setSelectedRefund] = useState<typeof mockRefunds[0] | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewNote, setReviewNote] = useState('');
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject' | null>(null);

  const filteredRefunds = mockRefunds.filter((refund) => {
    const matchesSearch = refund.user.toLowerCase().includes(searchQuery.toLowerCase()) ||
      refund.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      refund.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || refund.status === statusFilter;
    const matchesReason = reasonFilter === 'all' || refund.reasonCode === reasonFilter;
    return matchesSearch && matchesStatus && matchesReason;
  });

  const pendingCount = mockRefunds.filter((r) => r.status === 'PENDING').length;
  const totalAmount = mockRefunds
    .filter((r) => r.status === 'PROCESSED')
    .reduce((sum, r) => sum + r.amount, 0);

  const openReview = (refund: typeof mockRefunds[0], action: 'approve' | 'reject') => {
    setSelectedRefund(refund);
    setReviewAction(action);
    setReviewNote('');
    setShowReviewModal(true);
  };

  return (
    <AdminLayout>
      <div className="animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="font-display text-3xl font-bold text-slate-900">退款管理</h1>
            <p className="mt-2 text-slate-500">审核和处理用户退款申请</p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/admin/refunds/stats" className="btn-secondary text-sm">
              查看统计
            </Link>
            <Button variant="secondary" icon={<Download className="w-4 h-4" />}>
              导出
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="card p-6 animate-slide-up">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-slate-500">待审核</p>
              <Clock className="w-5 h-5 text-warning-600" />
            </div>
            <p className="font-display text-2xl font-bold text-warning-600">{pendingCount}</p>
            <p className="text-xs text-slate-400 mt-1">需要处理</p>
          </div>
          <div className="card p-6 animate-slide-up" style={{ animationDelay: '50ms' }}>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-slate-500">已通过</p>
              <Check className="w-5 h-5 text-success-600" />
            </div>
            <p className="font-display text-2xl font-bold text-success-600">
              {mockRefunds.filter((r) => r.status === 'PROCESSED').length}
            </p>
            <p className="text-xs text-slate-400 mt-1">已处理退款</p>
          </div>
          <div className="card p-6 animate-slide-up" style={{ animationDelay: '100ms' }}>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-slate-500">已拒绝</p>
              <X className="w-5 h-5 text-danger-600" />
            </div>
            <p className="font-display text-2xl font-bold text-danger-600">
              {mockRefunds.filter((r) => r.status === 'REJECTED').length}
            </p>
            <p className="text-xs text-slate-400 mt-1">拒绝申请</p>
          </div>
          <div className="card p-6 animate-slide-up" style={{ animationDelay: '150ms' }}>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-slate-500">累计退款</p>
              <Shield className="w-5 h-5 text-primary-600" />
            </div>
            <p className="font-display text-2xl font-bold text-slate-900">¥{totalAmount}</p>
            <p className="text-xs text-slate-400 mt-1">累计金额</p>
          </div>
        </div>

        <div className="card p-6 animate-slide-up" style={{ animationDelay: '200ms' }}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <h2 className="font-display text-lg font-bold text-slate-900">退款申请列表</h2>
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="搜索用户/账单..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 w-56"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
              >
                <option value="all">全部状态</option>
                <option value="PENDING">待审核</option>
                <option value="PROCESSED">已处理</option>
                <option value="REJECTED">已拒绝</option>
              </select>
              <select
                value={reasonFilter}
                onChange={(e) => setReasonFilter(e.target.value)}
                className="px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
              >
                <option value="all">全部原因</option>
                {Object.entries(reasonLabels).map(([code, label]) => (
                  <option key={code} value={code}>{label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="overflow-x-auto -mx-6 -mb-6">
            <table className="w-full">
              <thead className="bg-slate-50 border-t border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">用户</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">账单</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">套餐</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">金额</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">原因</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">状态</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">申请时间</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRefunds.map((refund, index) => (
                  <tr key={refund.id} className="hover:bg-slate-50/60 transition-colors animate-fade-in" style={{ animationDelay: `${index * 20}ms` }}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-sm font-medium">
                          {refund.user.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium text-slate-900 text-sm">{refund.user}</p>
                          <p className="text-xs text-slate-500">{refund.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-700">{refund.invoiceNumber}</td>
                    <td className="px-6 py-4 text-sm text-slate-700">{refund.plan}</td>
                    <td className="px-6 py-4 text-sm font-medium text-slate-900">¥{refund.amount}</td>
                    <td className="px-6 py-4">
                      <div className="max-w-[160px]">
                        <span className="text-xs px-2 py-1 bg-slate-100 text-slate-600 rounded-full">
                          {reasonLabels[refund.reasonCode] || refund.reasonCode}
                        </span>
                        <p className="text-xs text-slate-500 mt-1.5 line-clamp-1">{refund.reason}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={refund.status} />
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {new Date(refund.createdAt).toLocaleDateString('zh-CN')}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setSelectedRefund(refund)}
                          className="p-1.5 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                          title="查看详情"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {refund.status === 'PENDING' && (
                          <>
                            <button
                              onClick={() => openReview(refund, 'approve')}
                              className="p-1.5 text-slate-400 hover:text-success-600 hover:bg-success-50 rounded-lg transition-colors"
                              title="批准"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => openReview(refund, 'reject')}
                              className="p-1.5 text-slate-400 hover:text-danger-600 hover:bg-danger-50 rounded-lg transition-colors"
                              title="拒绝"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {selectedRefund && !showReviewModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={() => setSelectedRefund(null)}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg animate-fade-in" onClick={(e) => e.stopPropagation()}>
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-display text-xl font-bold text-slate-900">退款详情</h3>
                <button onClick={() => setSelectedRefund(null)} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-slate-500 mb-1">退款编号</p>
                    <p className="font-medium text-slate-900">{selectedRefund.id.toUpperCase()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-1">状态</p>
                    <StatusBadge status={selectedRefund.status} />
                  </div>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">申请用户</p>
                  <p className="font-medium text-slate-900">{selectedRefund.user} ({selectedRefund.email})</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-slate-500 mb-1">关联账单</p>
                    <p className="font-medium text-slate-900">{selectedRefund.invoiceNumber}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-1">退款金额</p>
                    <p className="font-display text-lg font-bold text-slate-900">¥{selectedRefund.amount}</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">退款原因</p>
                  <span className="inline-block text-xs px-2 py-1 bg-slate-100 text-slate-600 rounded-full mb-2">
                    {reasonLabels[selectedRefund.reasonCode]}
                  </span>
                  <p className="text-sm text-slate-700">{selectedRefund.reason}</p>
                </div>
                {selectedRefund.note && (
                  <div>
                    <p className="text-xs text-slate-500 mb-1">用户备注</p>
                    <p className="text-sm text-slate-700">{selectedRefund.note}</p>
                  </div>
                )}
                {selectedRefund.reviewNote && (
                  <div className="pt-4 border-t border-slate-100">
                    <p className="text-xs text-slate-500 mb-1">审核备注</p>
                    <p className="text-sm text-slate-700">{selectedRefund.reviewNote}</p>
                    {selectedRefund.reviewedAt && (
                      <p className="text-xs text-slate-400 mt-1">审核于 {new Date(selectedRefund.reviewedAt).toLocaleDateString('zh-CN')}</p>
                    )}
                  </div>
                )}
              </div>
              {selectedRefund.status === 'PENDING' && (
                <div className="p-6 border-t border-slate-100 flex justify-end gap-3">
                  <Button variant="danger" size="sm" onClick={() => openReview(selectedRefund, 'reject')}>
                    <X className="w-4 h-4" />
                    拒绝
                  </Button>
                  <Button variant="primary" size="sm" onClick={() => openReview(selectedRefund, 'approve')}>
                    <Check className="w-4 h-4" />
                    批准
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}

        {showReviewModal && selectedRefund && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-fade-in">
              <div className="p-6 border-b border-slate-100">
                <h3 className="font-display text-xl font-bold text-slate-900">
                  {reviewAction === 'approve' ? '批准退款' : '拒绝退款'}
                </h3>
                <p className="text-sm text-slate-500 mt-1">
                  {reviewAction === 'approve'
                    ? '确认批准该退款申请？款项将原路退回。'
                    : '确认拒绝该退款申请？请填写拒绝原因。'}
                </p>
              </div>
              <div className="p-6">
                <div className="bg-slate-50 rounded-lg p-4 mb-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-500">退款金额</span>
                    <span className="font-display text-xl font-bold text-slate-900">¥{selectedRefund.amount}</span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    {reviewAction === 'approve' ? '处理备注' : '拒绝原因'}
                  </label>
                  <textarea
                    rows={3}
                    placeholder={reviewAction === 'approve' ? '请输入处理备注（选填）' : '请输入拒绝原因'}
                    value={reviewNote}
                    onChange={(e) => setReviewNote(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 resize-none"
                  />
                </div>
              </div>
              <div className="p-6 border-t border-slate-100 flex justify-end gap-3">
                <Button variant="secondary" onClick={() => setShowReviewModal(false)}>
                  取消
                </Button>
                <Button
                  variant={reviewAction === 'approve' ? 'primary' : 'danger'}
                  onClick={() => {
                    setShowReviewModal(false);
                    setSelectedRefund(null);
                  }}
                >
                  确认{reviewAction === 'approve' ? '批准' : '拒绝'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
