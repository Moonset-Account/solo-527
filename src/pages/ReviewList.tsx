import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, User, Clock } from 'lucide-react';
import { bookingsApi } from '@/lib/api';
import StatusBadge from '@/components/StatusBadge';
import EmptyState from '@/components/EmptyState';
import type { Booking } from '@/types';

export default function ReviewList() {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filter, setFilter] = useState<'all' | 'group' | 'individual'>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBookings();
  }, []);

  const loadBookings = async () => {
    try {
      const data = await bookingsApi.list({ status: 'pending' });
      setBookings(data);
    } catch {} finally {
      setLoading(false);
    }
  };

  const filtered = filter === 'all'
    ? bookings
    : bookings.filter((b) => b.type === filter);

  return (
    <div className="space-y-6 page-enter">
      <h1 className="page-title">审核中心</h1>

      <div className="flex gap-2">
        {[
          { key: 'all', label: '全部' },
          { key: 'group', label: '团体' },
          { key: 'individual', label: '散客' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key as any)}
            className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
              filter === tab.key
                ? 'bg-museum text-white shadow-md shadow-museum/20'
                : 'bg-white border border-gray-200 text-slate-500 hover:bg-gray-50 hover:border-gray-300 hover:text-slate-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-100 p-5 animate-pulse">
              <div className="h-5 bg-gray-200 rounded w-1/3 mb-3" />
              <div className="h-4 bg-gray-100 rounded w-2/3" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState message="暂无待审核报名" description="所有报名已处理完毕" />
      ) : (
        <div className="space-y-3">
          {filtered.map((booking, index) => (
            <button
              key={booking.id}
              onClick={() => navigate(`/review/${booking.id}`)}
              className={`w-full bg-white rounded-xl border border-gray-100 p-5 card-hover text-left border-l-4 ${
                booking.type === 'group' ? 'border-l-blue-500' : 'border-l-green-500'
              } slide-up`}
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    booking.type === 'group' ? 'bg-blue-50 text-blue-600' : 'bg-green-50 text-green-600'
                  }`}>
                    {booking.type === 'group' ? <Users size={18} /> : <User size={18} />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-museum">
                        {booking.type === 'group' ? '团体报名' : '散客报名'}
                      </p>
                      <span className="text-slate-300 text-sm">#{booking.id}</span>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                        booking.type === 'group'
                          ? 'bg-blue-50 text-blue-600'
                          : 'bg-green-50 text-green-600'
                      }`}>
                        {booking.type === 'group' ? <Users size={10} /> : <User size={10} />}
                        {booking.total_count}人
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 mt-1.5">
                      {booking.session?.course?.name || `场次#${booking.session_id}`}
                    </p>
                    <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-1">
                      <Clock size={12} />
                      <span>{booking.session?.date} {booking.session?.start_time}-{booking.session?.end_time}</span>
                    </div>
                  </div>
                </div>
                <StatusBadge status={booking.status} />
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
