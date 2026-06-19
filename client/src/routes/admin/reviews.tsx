import { createFileRoute } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { reviewApi } from '../../api';
import dayjs from 'dayjs';

export const Route = createFileRoute('/admin/reviews')({
  component: ReviewsPage,
});

const reviewStatusMap: Record<string, { label: string; color: string }> = {
  pending: { label: '待处理', color: 'bg-gray-100 text-gray-800' },
  follow_up: { label: '跟进中', color: 'bg-yellow-100 text-yellow-800' },
  resolved: { label: '已解决', color: 'bg-green-100 text-green-800' },
  escalated: { label: '已升级', color: 'bg-red-100 text-red-800' },
};

function ReviewsPage() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'bad'>('bad');

  const [filters, setFilters] = useState({
    page: 1,
    pageSize: 20,
    status: '',
    startDate: '',
    endDate: '',
  });

  const [followUpModal, setFollowUpModal] = useState<{ id: number } | null>(null);
  const [followUpStatus, setFollowUpStatus] = useState<'follow_up' | 'resolved' | 'escalated'>('follow_up');
  const [followUpNote, setFollowUpNote] = useState('');

  useEffect(() => {
    fetchReviews();
  }, [filters, activeTab]);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const params: any = { ...filters };
      Object.keys(params).forEach((key) => {
        if (!params[key] || params[key] === '') delete params[key];
      });

      let data: any;
      if (activeTab === 'bad') {
        data = await reviewApi.badReviews(params);
      } else {
        data = await reviewApi.list(params);
      }
      setReviews(data.data);
      setTotal(data.total);
    } catch (error) {
      console.error('Failed to fetch reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value, page: 1 }));
  };

  const handleFollowUp = async () => {
    if (!followUpModal) return;
    try {
      await reviewApi.followUp(followUpModal.id, {
        status: followUpStatus,
        followUpNote,
      });
      setFollowUpModal(null);
      setFollowUpNote('');
      fetchReviews();
    } catch (error) {
      alert('处理失败');
    }
  };

  const totalPages = Math.ceil(total / filters.pageSize);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">差评跟进</h1>
        <p className="text-gray-500 mt-1">共 {total} 条评价记录</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm">
        <div className="border-b px-6">
          <div className="flex gap-6">
            <button
              onClick={() => setActiveTab('bad')}
              className={`py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'bad'
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              差评待处理
            </button>
            <button
              onClick={() => setActiveTab('all')}
              className={`py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'all'
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              全部评价
            </button>
          </div>
        </div>

        <div className="p-6 border-b">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">状态</label>
              <select
                name="status"
                value={filters.status}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-sm"
              >
                <option value="">全部状态</option>
                {Object.entries(reviewStatusMap).map(([key, val]) => (
                  <option key={key} value={key}>{val.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">开始日期</label>
              <input
                type="date"
                name="startDate"
                value={filters.startDate}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">结束日期</label>
              <input
                type="date"
                name="endDate"
                value={filters.endDate}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-sm"
              />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-20 text-gray-500">加载中...</div>
        ) : (
          <>
            <div className="divide-y">
              {reviews.map((review) => (
                <div key={review.id} className="p-6 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-yellow-500 text-lg">
                          {'⭐'.repeat(review.rating)}
                        </span>
                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${reviewStatusMap[review.status]?.color}`}>
                          {reviewStatusMap[review.status]?.label}
                        </span>
                      </div>
                      {review.comment && (
                        <p className="text-gray-700 mb-3">{review.comment}</p>
                      )}
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span>订单号：{review.order?.orderNo || '-'}</span>
                        <span>客户：{review.user?.name || '-'}</span>
                        <span>{dayjs(review.createdAt).format('YYYY-MM-DD HH:mm')}</span>
                      </div>
                      {review.followUpNote && (
                        <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                          <p className="text-sm text-blue-800">
                            <span className="font-medium">跟进记录：</span>
                            {review.followUpNote}
                          </p>
                          {review.follower && (
                            <p className="text-xs text-blue-600 mt-1">
                              — {review.follower.name} · {dayjs(review.followedAt).format('YYYY-MM-DD HH:mm')}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex-shrink-0 ml-4">
                      <button
                        onClick={() => setFollowUpModal({ id: review.id })}
                        className="px-4 py-2 text-sm text-primary-600 border border-primary-600 rounded-lg hover:bg-primary-50 transition-colors"
                      >
                        跟进处理
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {reviews.length === 0 && (
              <div className="text-center py-20 text-gray-500">暂无评价数据</div>
            )}

            {totalPages > 1 && (
              <div className="px-6 py-4 flex items-center justify-between border-t">
                <div className="text-sm text-gray-500">
                  共 {total} 条，第 {filters.page} / {totalPages} 页
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setFilters((p) => ({ ...p, page: Math.max(1, p.page - 1) }))}
                    disabled={filters.page <= 1}
                    className="px-3 py-1 border rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    上一页
                  </button>
                  <button
                    onClick={() => setFilters((p) => ({ ...p, page: Math.min(totalPages, p.page + 1) }))}
                    disabled={filters.page >= totalPages}
                    className="px-3 py-1 border rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    下一页
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {followUpModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">评价跟进</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">处理状态</label>
                <select
                  value={followUpStatus}
                  onChange={(e) => setFollowUpStatus(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                >
                  <option value="follow_up">跟进中</option>
                  <option value="resolved">已解决</option>
                  <option value="escalated">已升级</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">跟进说明</label>
                <textarea
                  value={followUpNote}
                  onChange={(e) => setFollowUpNote(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none resize-none"
                  placeholder="请输入跟进内容和处理结果"
                />
              </div>
            </div>
            <div className="flex gap-3 justify-end mt-6">
              <button
                onClick={() => { setFollowUpModal(null); setFollowUpNote(''); }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                取消
              </button>
              <button
                onClick={handleFollowUp}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                确认
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
