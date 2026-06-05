import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, XCircle, AlertTriangle, ShieldCheck, Clock } from 'lucide-react';
import { bookingsApi } from '@/lib/api';
import StatusBadge from '@/components/StatusBadge';
import type { Booking } from '@/types';

export default function ReviewDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [action, setAction] = useState<'approve' | 'reject' | null>(null);
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    loadBooking();
  }, [id]);

  const loadBooking = async () => {
    try {
      const data = await bookingsApi.getById(Number(id));
      setBooking(data);
    } catch {} finally {
      setLoading(false);
    }
  };

  const handleReview = async () => {
    if (!action) return;
    setSubmitting(true);
    setError('');
    try {
      await bookingsApi.review(Number(id), action, note);
      navigate('/review');
    } catch (err: any) {
      setError(err.message || '操作失败');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="animate-pulse space-y-4"><div className="h-8 bg-gray-200 rounded w-1/3" /></div>;
  }

  if (!booking) {
    return <div className="text-center py-16 text-slate-500">报名记录不存在</div>;
  }

  const course = booking.session?.course;
  const ageOutOfRange = booking.participants?.filter(
    (p) => course && (p.age < course.min_age || p.age > course.max_age)
  );

  const infoItems = [
    { label: '报名类型', value: booking.type === 'group' ? '团体' : '散客', highlight: true },
    { label: '报名编号', value: `#${booking.id}` },
    { label: '课程名称', value: course?.name || '-', highlight: true },
    { label: '场次时间', value: `${booking.session?.date} ${booking.session?.start_time}-${booking.session?.end_time}` },
    { label: '活动地点', value: booking.session?.location || '-' },
    { label: '参与人数', value: `${booking.total_count}人`, highlight: true },
    { label: '提交时间', value: new Date(booking.created_at).toLocaleString() },
    { label: '报名容量', value: `${booking.session?.booked_count}/${booking.session?.capacity}` },
  ];

  return (
    <div className="space-y-6 page-enter">
      <button
        onClick={() => navigate(-1)}
        className="btn-ghost flex items-center gap-1.5"
      >
        <ArrowLeft size={16} />
        返回
      </button>

      <div className="flex items-center justify-between">
        <h1 className="page-title">报名审核</h1>
        <StatusBadge status={booking.status} />
      </div>

      <div className="grid grid-cols-3 gap-5">
        <div className="col-span-2 space-y-5">
          <div className="bg-white rounded-xl border border-gray-100/80 p-6 stat-card">
            <h2 className="section-title mb-5">报名信息</h2>
            <div className="grid grid-cols-2 gap-4">
              {infoItems.map((item) => (
                <div key={item.label} className="bg-gray-50/60 rounded-lg px-4 py-3">
                  <p className="text-xs text-slate-400 mb-1">{item.label}</p>
                  <p className={`text-sm ${item.highlight ? 'text-museum font-medium' : 'text-slate-700'}`}>
                    {item.value}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-100/80 p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="section-title">参与者名单</h2>
              {course && (
                <span className="text-xs text-slate-400 bg-gray-50 px-3 py-1 rounded-full">
                  年龄要求：{course.min_age}-{course.max_age}岁
                </span>
              )}
            </div>

            {ageOutOfRange && ageOutOfRange.length > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 text-sm px-4 py-3 rounded-lg mb-4 flex items-center gap-2">
                <AlertTriangle size={16} />
                有 {ageOutOfRange.length} 名参与者年龄不在课程要求范围内
              </div>
            )}

            <table className="data-table">
              <thead>
                <tr>
                  <th>序号</th>
                  <th>姓名</th>
                  <th>年龄</th>
                  <th>年龄匹配</th>
                </tr>
              </thead>
              <tbody>
                {booking.participants?.map((p, i) => {
                  const inRange = !course || (p.age >= course.min_age && p.age <= course.max_age);
                  return (
                    <tr key={p.id} className={!inRange ? 'bg-red-50/40' : i % 2 === 0 ? '' : 'bg-gray-50/30'}>
                      <td className="text-slate-400">{i + 1}</td>
                      <td className="text-slate-700 font-medium">{p.name}</td>
                      <td className="text-slate-700">{p.age}岁</td>
                      <td>
                        {inRange ? (
                          <span className="inline-flex items-center gap-1 text-green-600 text-xs bg-green-50 px-2 py-1 rounded-full">
                            <CheckCircle size={12} /> 符合
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-red-600 text-xs bg-red-50 px-2 py-1 rounded-full">
                            <XCircle size={12} /> 不符合
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {booking.status === 'pending' ? (
          <div className="space-y-5">
            <div className="bg-white rounded-xl border border-gray-100/80 p-6 stat-card">
              <h2 className="section-title mb-5">审核操作</h2>

              <div className="space-y-3 mb-5">
                <button
                  onClick={() => setAction('approve')}
                  className={`w-full py-3 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
                    action === 'approve'
                      ? 'bg-green-600 text-white shadow-md shadow-green-600/20'
                      : 'bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 hover:border-green-300'
                  }`}
                >
                  <CheckCircle size={18} />
                  通过
                </button>
                <button
                  onClick={() => setAction('reject')}
                  className={`w-full py-3 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
                    action === 'reject'
                      ? 'bg-red-600 text-white shadow-md shadow-red-600/20'
                      : 'bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 hover:border-red-300'
                  }`}
                >
                  <XCircle size={18} />
                  拒绝
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">审核备注</label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={3}
                  className="input-field resize-none"
                  placeholder="请输入审核意见..."
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-2.5 rounded-lg mt-3 flex items-center gap-2">
                  <AlertTriangle size={14} />
                  {error}
                </div>
              )}

              <button
                onClick={() => {
                  if (action) setShowConfirm(true);
                }}
                disabled={!action || submitting}
                className="btn-primary w-full mt-4 py-2.5"
              >
                {submitting ? '提交中...' : '提交审核'}
              </button>
            </div>

            {booking.reviewed_at && (
              <div className="bg-slate-50 rounded-xl border border-gray-100/80 p-5">
                <div className="flex items-center gap-2 mb-3">
                  <ShieldCheck size={16} className="text-museum" />
                  <h3 className="font-medium text-museum text-sm">审核记录</h3>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Clock size={12} />
                  <span>{new Date(booking.reviewed_at).toLocaleString()}</span>
                </div>
                {booking.review_note && (
                  <p className="text-sm text-slate-600 mt-2 bg-white rounded-md px-3 py-2 border border-gray-100">
                    {booking.review_note}
                  </p>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-5">
            <div className="bg-slate-50 rounded-xl border border-gray-100/80 p-6">
              <div className="flex items-center gap-2.5 mb-4">
                <ShieldCheck size={18} className="text-museum" />
                <h2 className="section-title">审核记录</h2>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-slate-400">审核结果：</span>
                  <StatusBadge status={booking.status} />
                </div>
                {booking.reviewed_by && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-slate-400">审核人：</span>
                    <span className="text-slate-700 font-medium">管理员#{booking.reviewed_by}</span>
                  </div>
                )}
                {booking.reviewed_at && (
                  <div className="flex items-center gap-2 text-sm">
                    <Clock size={14} className="text-slate-400" />
                    <span className="text-slate-400">审核时间：</span>
                    <span className="text-slate-700">{new Date(booking.reviewed_at).toLocaleString()}</span>
                  </div>
                )}
                {booking.review_note && (
                  <div className="mt-3 bg-white rounded-lg px-4 py-3 border border-gray-100">
                    <p className="text-xs text-slate-400 mb-1">审核备注</p>
                    <p className="text-sm text-slate-600">{booking.review_note}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {showConfirm && (
        <div className="modal-overlay" onClick={() => setShowConfirm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                action === 'approve' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
              }`}>
                {action === 'approve' ? <CheckCircle size={20} /> : <XCircle size={20} />}
              </div>
              <div>
                <h3 className="font-serif font-bold text-museum">确认操作</h3>
                <p className="text-sm text-slate-500">
                  确定要{action === 'approve' ? '通过' : '拒绝'}该报名申请吗？
                </p>
              </div>
            </div>

            {note && (
              <div className="bg-gray-50 rounded-lg px-4 py-3 mb-4">
                <p className="text-xs text-slate-400 mb-1">审核备注</p>
                <p className="text-sm text-slate-600">{note}</p>
              </div>
            )}

            <div className="flex justify-end gap-3">
              <button onClick={() => setShowConfirm(false)} className="btn-secondary">
                取消
              </button>
              <button
                onClick={handleReview}
                disabled={submitting}
                className={`px-5 py-2 rounded-lg text-sm font-medium text-white transition-all duration-200 disabled:opacity-50 ${
                  action === 'approve'
                    ? 'bg-green-600 hover:bg-green-700 shadow-md shadow-green-600/20'
                    : 'bg-red-600 hover:bg-red-700 shadow-md shadow-red-600/20'
                }`}
              >
                {submitting ? '提交中...' : `确认${action === 'approve' ? '通过' : '拒绝'}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
