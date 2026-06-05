import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, Clock, MapPin, Users, BookOpen, User } from 'lucide-react';
import { sessionsApi, bookingsApi } from '@/lib/api';
import StatusBadge from '@/components/StatusBadge';
import EmptyState from '@/components/EmptyState';
import type { Session, Booking } from '@/types';

export default function SessionDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSession();
  }, [id]);

  const loadSession = async () => {
    try {
      const data = await sessionsApi.getById(Number(id));
      setSession(data);
      try {
        const bookingData = await bookingsApi.list({ session_id: String(id) });
        setBookings(bookingData);
      } catch {}
    } catch {} finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-4 page-enter">
        <div className="h-8 bg-gray-200 rounded w-1/3" />
        <div className="h-40 bg-gray-200 rounded-xl" />
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-gray-200 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!session) {
    return <EmptyState message="场次不存在" />;
  }

  const remaining = session.capacity - session.booked_count;
  const ratio = session.capacity > 0 ? session.booked_count / session.capacity : 0;
  const percentage = Math.min(ratio * 100, 100);

  const progressGradient =
    remaining === 0
      ? 'from-red-500 to-red-400'
      : remaining <= session.capacity * 0.2
      ? 'from-orange-500 to-amber-400'
      : 'from-museum to-museum-light';

  const statBorderColor: Record<string, string> = {
    open: 'border-l-green-500',
    full: 'border-l-orange-500',
    closed: 'border-l-gray-400',
    completed: 'border-l-blue-500',
  };

  const heroGradient: Record<string, string> = {
    open: 'from-green-600 to-emerald-500',
    full: 'from-orange-600 to-amber-500',
    closed: 'from-gray-600 to-slate-500',
    completed: 'from-blue-600 to-indigo-500',
  };

  return (
    <div className="space-y-6 page-enter">
      <button
        onClick={() => navigate(-1)}
        className="btn-ghost flex items-center gap-1"
      >
        <ArrowLeft size={16} />
        返回列表
      </button>

      <div className={`relative rounded-2xl overflow-hidden bg-gradient-to-r ${heroGradient[session.status] || 'from-museum to-museum-light'} p-6 text-white shadow-lg`}>
        <div className="absolute inset-0 bg-black/5" />
        <div className="relative z-10">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-white/70 text-sm mb-1">场次详情</p>
              <h1 className="page-title !text-white text-2xl mb-3">
                {session.course?.name || `场次#${session.id}`}
              </h1>
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center gap-1.5 text-sm text-white/80">
                  <Calendar size={14} />
                  {session.date}
                </span>
                <span className="inline-flex items-center gap-1.5 text-sm text-white/80">
                  <Clock size={14} />
                  {session.start_time} - {session.end_time}
                </span>
                <span className="inline-flex items-center gap-1.5 text-sm text-white/80">
                  <MapPin size={14} />
                  {session.location}
                </span>
              </div>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-lg px-3 py-1.5">
              <StatusBadge status={session.status} />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className={`stat-card border-l-4 ${statBorderColor[session.status] || 'border-l-gray-300'}`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-museum/10 flex items-center justify-center">
              <Calendar size={18} className="text-museum" />
            </div>
            <div>
              <p className="text-xs text-slate-400">日期</p>
              <p className="font-bold text-museum text-sm">{session.date}</p>
            </div>
          </div>
        </div>
        <div className={`stat-card border-l-4 ${statBorderColor[session.status] || 'border-l-gray-300'}`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-museum/10 flex items-center justify-center">
              <Clock size={18} className="text-museum" />
            </div>
            <div>
              <p className="text-xs text-slate-400">时间</p>
              <p className="font-bold text-museum text-sm">{session.start_time}-{session.end_time}</p>
            </div>
          </div>
        </div>
        <div className={`stat-card border-l-4 ${statBorderColor[session.status] || 'border-l-gray-300'}`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-museum/10 flex items-center justify-center">
              <MapPin size={18} className="text-museum" />
            </div>
            <div>
              <p className="text-xs text-slate-400">地点</p>
              <p className="font-bold text-museum text-sm">{session.location}</p>
            </div>
          </div>
        </div>
        <div className={`stat-card border-l-4 ${statBorderColor[session.status] || 'border-l-gray-300'}`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-museum/10 flex items-center justify-center">
              <Users size={18} className="text-museum" />
            </div>
            <div>
              <p className="text-xs text-slate-400">报名/容量</p>
              <p className="font-bold text-museum text-sm">{session.booked_count}/{session.capacity}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="stat-card">
        <div className="flex items-center justify-between mb-3">
          <span className="section-title text-base">报名进度</span>
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-500">
              已报名 <span className="font-bold text-museum">{session.booked_count}</span> 人
            </span>
            <span className="text-sm text-slate-400">|</span>
            <span className="text-sm text-slate-500">
              剩余 <span className={`font-bold ${remaining === 0 ? 'text-red-500' : 'text-museum'}`}>{remaining}</span> 位
            </span>
          </div>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-4 overflow-hidden">
          <div
            className={`h-4 rounded-full bg-gradient-to-r ${progressGradient} progress-bar-animated relative`}
            style={{ width: `${percentage}%` }}
          >
            <div className="absolute inset-0 bg-white/20 rounded-full" style={{
              background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.15) 50%, transparent 100%)',
              backgroundSize: '200% 100%',
              animation: 'shimmer 2s ease-in-out infinite',
            }} />
          </div>
        </div>
        <div className="flex justify-between mt-2 text-[10px] text-slate-400">
          <span>0</span>
          <span>{session.capacity}</span>
        </div>
      </div>

      {session.course && (
        <div className="stat-card">
          <h2 className="section-title mb-4 flex items-center gap-2">
            <BookOpen size={18} />
            课程信息
          </h2>
          <div className="flex gap-6">
            <div className="flex-1">
              <h3 className="font-serif font-bold text-museum text-lg mb-2">{session.course.name}</h3>
              <p className="text-sm text-slate-600 leading-relaxed">{session.course.description}</p>
            </div>
            <div className="flex flex-col gap-2">
              <div className="inline-flex items-center gap-1.5 bg-museum/5 rounded-full px-3 py-1 text-xs text-museum">
                <User size={12} />
                适合 {session.course.min_age}-{session.course.max_age} 岁
              </div>
              <div className="inline-flex items-center gap-1.5 bg-museum/5 rounded-full px-3 py-1 text-xs text-museum">
                <Clock size={12} />
                时长 {session.course.duration_minutes} 分钟
              </div>
              <div className="inline-flex items-center gap-1.5 bg-museum/5 rounded-full px-3 py-1 text-xs text-museum">
                <Users size={12} />
                容量 {session.course.capacity} 人
              </div>
            </div>
          </div>
        </div>
      )}

      {session.guide && (
        <div className="stat-card">
          <h2 className="section-title mb-4 flex items-center gap-2">
            <User size={18} />
            讲解员
          </h2>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-gold/30 to-gold/10 flex items-center justify-center text-gold font-bold text-xl shadow-sm">
              {session.guide.user?.name?.charAt(0) || '?'}
            </div>
            <div className="flex-1">
              <p className="font-medium text-slate-700 text-base">{session.guide.user?.name || `讲解员#${session.guide_id}`}</p>
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {session.guide.specialties?.split(/[,，、]/).filter(Boolean).map((spec, i) => (
                  <span key={i} className="inline-block bg-gold/10 text-gold text-[11px] px-2 py-0.5 rounded-full font-medium">
                    {spec.trim()}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {bookings.length > 0 && (
        <div className="stat-card">
          <h2 className="section-title mb-4 flex items-center gap-2">
            <Users size={18} />
            预约列表
            <span className="text-sm font-normal text-slate-400">({bookings.length})</span>
          </h2>
          <div className="space-y-2">
            {bookings.map((booking) => (
              <div
                key={booking.id}
                className="flex items-center justify-between p-3 rounded-lg bg-gray-50/80 hover:bg-gray-100/80 transition-colors border border-gray-100"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-museum/10 flex items-center justify-center">
                    <User size={14} className="text-museum" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-700">
                      {booking.user?.name || `用户#${booking.user_id}`}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      {booking.type === 'group' ? '团队预约' : '个人预约'} · {booking.total_count} 人
                    </p>
                  </div>
                </div>
                <StatusBadge status={booking.status} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
