import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, Clock, Package, Calendar } from 'lucide-react';
import { coursesApi, sessionsApi } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import StatusBadge from '@/components/StatusBadge';
import EmptyState from '@/components/EmptyState';
import type { Course, Session } from '@/types';

const STAT_BORDERS = [
  'border-l-4 border-l-museum',
  'border-l-4 border-l-gold',
  'border-l-4 border-l-sky-500',
  'border-l-4 border-l-emerald-500',
];

export default function CourseDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [course, setCourse] = useState<Course | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      const courseData = await coursesApi.getById(Number(id));
      setCourse(courseData);
      const sessionData = await sessionsApi.list({ course_id: id! });
      setSessions(sessionData);
    } catch {} finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-gray-200 rounded w-1/3" />
        <div className="h-4 bg-gray-100 rounded w-2/3" />
      </div>
    );
  }

  if (!course) {
    return <EmptyState message="课程不存在" />;
  }

  const canBook = user?.role === 'school_contact' || user?.role === 'parent';

  const stats = [
    { icon: <Users size={18} className="text-museum" />, label: '适合年龄', value: `${course.min_age}-${course.max_age}岁` },
    { icon: <Users size={18} className="text-gold" />, label: '课程容量', value: `${course.capacity}人` },
    { icon: <Clock size={18} className="text-sky-500" />, label: '课程时长', value: `${course.duration_minutes}分钟` },
    { icon: <Package size={18} className="text-emerald-500" />, label: '所需教具', value: `${course.teaching_aids?.length || 0}种` },
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

      <div className="relative bg-museum-gradient bg-noise rounded-2xl p-8 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />
        <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full bg-white/5 pointer-events-none" />
        <div className="absolute -right-2 top-16 w-24 h-24 rounded-full bg-gold/10 pointer-events-none" />
        <div className="relative flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <h1 className="text-2xl font-serif font-bold text-white">{course.name}</h1>
              <StatusBadge status={course.status} />
            </div>
            <p className="text-white/60 text-sm max-w-xl">{course.description}</p>
          </div>
          {canBook && (
            <button
              onClick={() => navigate(user?.role === 'school_contact' ? '/booking/group' : '/booking/individual')}
              className="btn-primary shrink-0 flex items-center gap-2 !bg-white/15 !text-white !border !border-white/20 hover:!bg-white/25"
            >
              报名此课程
            </button>
          )}
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-px gold-accent-line" />
      </div>

      <div className="grid grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <div key={stat.label} className={`stat-card ${STAT_BORDERS[i]} card-appear stagger-${i + 1}`}>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center">
                {stat.icon}
              </div>
              <span className="text-xs text-slate-500">{stat.label}</span>
            </div>
            <p className="text-lg font-bold text-museum pl-11">{stat.value}</p>
          </div>
        ))}
      </div>

      {course.teaching_aids && course.teaching_aids.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100/80 p-6">
          <h2 className="section-title mb-4">所需教具</h2>
          <div className="flex flex-wrap gap-2">
            {course.teaching_aids.map((aid) => (
              <span key={aid.id} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-museum/5 text-museum text-sm font-medium border border-museum/10 hover:bg-museum/10 transition-colors">
                <Package size={13} className="text-gold" />
                {aid.name}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-100/80 p-6">
        <h2 className="section-title mb-4">场次安排</h2>
        {sessions.length === 0 ? (
          <EmptyState message="暂无场次安排" />
        ) : (
          <div className="overflow-x-auto -mx-6">
            <table className="data-table">
              <thead>
                <tr>
                  <th>日期</th>
                  <th>时间</th>
                  <th>地点</th>
                  <th>报名 / 容量</th>
                  <th>状态</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map((s) => {
                  const ratio = s.capacity > 0 ? s.booked_count / s.capacity : 0;
                  return (
                    <tr key={s.id}>
                      <td className="text-slate-700 font-medium">{s.date}</td>
                      <td className="text-slate-700">{s.start_time} - {s.end_time}</td>
                      <td className="text-slate-700">{s.location}</td>
                      <td>
                        <div className="flex items-center gap-2 min-w-[140px]">
                          <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full progress-bar-animated ${ratio >= 1 ? 'bg-red-400' : ratio >= 0.8 ? 'bg-amber-400' : 'bg-gradient-to-r from-museum/60 to-museum'}`}
                              style={{ width: `${Math.min(ratio * 100, 100)}%` }}
                            />
                          </div>
                          <span className="text-xs text-slate-500 shrink-0 whitespace-nowrap">
                            <span className={`font-medium ${ratio >= 1 ? 'text-red-500' : 'text-museum'}`}>{s.booked_count}</span>
                            <span className="text-slate-400">/{s.capacity}</span>
                          </span>
                        </div>
                      </td>
                      <td><StatusBadge status={s.status} /></td>
                      <td>
                        <button
                          onClick={() => navigate(`/sessions/${s.id}`)}
                          className="text-gold hover:text-gold-dark text-sm font-medium transition-colors"
                        >
                          查看详情
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
