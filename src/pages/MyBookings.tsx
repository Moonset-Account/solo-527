import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClipboardList, Users, User, XCircle, AlertTriangle } from 'lucide-react';
import { bookingsApi } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import StatusBadge from '@/components/StatusBadge';
import EmptyState from '@/components/EmptyState';
import type { Booking, BookingStatus } from '@/types';

export default function MyBookings() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [tab, setTab] = useState<BookingStatus | 'all'>('all');
  const [loading, setLoading] = useState(true);
  const [cancelTarget, setCancelTarget] = useState<Booking | null>(null);

  useEffect(() => {
    loadBookings();
  }, []);

  const loadBookings = async () => {
    try {
      const data = await bookingsApi.list();
      setBookings(data);
    } catch {} finally {
      setLoading(false);
    }
  };

  const handleCancel = async (id: number) => {
    try {
      await bookingsApi.cancel(id);
      setCancelTarget(null);
      loadBookings();
    } catch {}
  };

  const filtered = tab === 'all' ? bookings : bookings.filter((b) => b.status === tab);

  const tabs: { key: BookingStatus | 'all'; label: string }[] = [
    { key: 'all', label: '全部' },
    { key: 'pending', label: '待审核' },
    { key: 'approved', label: '已通过' },
    { key: 'rejected', label: '已拒绝' },
    { key: 'completed', label: '已完成' },
    { key: 'cancelled', label: '已取消' },
  ];

  const getBorderClass = (type: string) => {
    return type === 'group' ? 'border-l-blue-500' : 'border-l-green-500';
  };

  return (
    <div className="page-enter space-y-6">
      <h1 className="page-title">我的报名</h1>

      <div className="flex gap-2 flex-wrap">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              tab === t.key
                ? 'bg-museum text-white shadow-md shadow-museum/15'
                : 'bg-white border border-gray-200 text-slate-500 hover:bg-gray-50 hover:text-slate-700 hover:border-gray-300'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-gray-200 rounded-xl skeleton-shimmer" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState message="暂无报名记录" />
      ) : (
        <div className="space-y-3">
          {filtered.map((booking, bi) => (
            <div
              key={booking.id}
              className={`card-hover bg-white rounded-xl border border-gray-100/80 border-l-4 ${getBorderClass(booking.type)} p-5 card-appear stagger-${Math.min(bi + 1, 6)}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    booking.type === 'group' ? 'bg-blue-50 text-blue-500' : 'bg-green-50 text-green-500'
                  }`}>
                    {booking.type === 'group' ? <Users size={20} /> : <User size={20} />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-museum">
                        {booking.type === 'group' ? '团体报名' : '散客报名'}
                      </span>
                      <span className="text-slate-300 text-xs">#{booking.id}</span>
                    </div>
                    <p className="text-sm font-medium text-slate-700 mt-1">
                      {booking.session?.course?.name || `场次#${booking.session_id}`}
                    </p>
                    <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-400">
                      <span className="flex items-center gap-1">
                        📅 {booking.session?.date}
                      </span>
                      <span className="flex items-center gap-1">
                        🕐 {booking.session?.start_time}-{booking.session?.end_time}
                      </span>
                      <span>{booking.total_count}人参与</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <StatusBadge status={booking.status} />
                  {booking.status === 'pending' && (
                    <button
                      onClick={() => setCancelTarget(booking)}
                      className="btn-danger text-xs !px-3 !py-1.5 flex items-center gap-1"
                    >
                      <XCircle size={12} />
                      取消
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {cancelTarget && (
        <div className="modal-overlay" onClick={() => setCancelTarget(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-11 h-11 rounded-full bg-red-50 flex items-center justify-center flex-shrink-0">
                <AlertTriangle size={22} className="text-red-500" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-800">确认取消报名</h3>
                <p className="text-sm text-slate-500 mt-0.5">此操作不可撤销</p>
              </div>
            </div>
            <p className="text-sm text-slate-600 mb-6">
              确定要取消「{cancelTarget.session?.course?.name || `场次#${cancelTarget.session_id}`}」的报名吗？
            </p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setCancelTarget(null)} className="btn-secondary">
                再想想
              </button>
              <button
                onClick={() => handleCancel(cancelTarget.id)}
                className="btn-danger"
              >
                确认取消
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
