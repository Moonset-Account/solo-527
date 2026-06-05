import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Users, Clock, BookOpen } from 'lucide-react';
import { coursesApi } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import StatusBadge from '@/components/StatusBadge';
import EmptyState from '@/components/EmptyState';
import type { Course } from '@/types';

const STAGGER = ['stagger-1', 'stagger-2', 'stagger-3', 'stagger-4', 'stagger-5', 'stagger-6'] as const;

function getAgeColor(_min: number, max: number): string {
  if (max <= 6) return 'bg-pink-100 text-pink-700';
  if (max <= 10) return 'bg-sky-100 text-sky-700';
  if (max <= 14) return 'bg-violet-100 text-violet-700';
  return 'bg-emerald-100 text-emerald-700';
}

export default function CourseList() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [courses, setCourses] = useState<Course[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    try {
      const data = await coursesApi.list();
      setCourses(data);
    } catch {} finally {
      setLoading(false);
    }
  };

  const filtered = courses.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  const canCreate = user?.role === 'admin' || user?.role === 'manager';

  return (
    <div className="space-y-6 page-enter">
      <div className="relative bg-museum-gradient bg-noise rounded-2xl p-6 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />
        <div className="relative flex items-center justify-between">
          <div>
            <h1 className="page-title text-white">课程管理</h1>
            <p className="text-sm text-white/50 mt-1">管理和浏览所有博物馆课程</p>
          </div>
          {canCreate && (
            <button className="btn-primary flex items-center gap-2 !bg-white/15 !text-white !border !border-white/20 hover:!bg-white/25">
              <Plus size={16} />
              创建课程
            </button>
          )}
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-px gold-accent-line" />
      </div>

      <div className="relative">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="搜索课程名称..."
          className="input-field pl-10"
        />
      </div>

      {loading ? (
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-100 p-5 animate-pulse">
              <div className="h-5 bg-gray-200 rounded w-2/3 mb-3" />
              <div className="h-4 bg-gray-100 rounded w-full mb-2" />
              <div className="h-4 bg-gray-100 rounded w-3/4" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center card-appear">
          <div className="w-20 h-20 rounded-full bg-museum-50 flex items-center justify-center mx-auto mb-5">
            <BookOpen size={32} className="text-museum/40" />
          </div>
          <p className="text-lg font-serif font-bold text-museum mb-2">暂无课程</p>
          <p className="text-sm text-slate-400">尚未创建任何课程，期待精彩内容的到来</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {filtered.map((course, index) => (
            <button
              key={course.id}
              onClick={() => navigate(`/courses/${course.id}`)}
              className={`card-appear ${STAGGER[index % STAGGER.length]} bg-white rounded-xl border border-gray-100 card-hover text-left overflow-hidden group`}
            >
              <div className="relative h-20 bg-gradient-to-br from-museum/5 via-museum/10 to-gold/10 p-4">
                <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent" />
                <div className="relative flex items-start justify-between">
                  <div className="w-9 h-9 rounded-lg bg-white/80 backdrop-blur-sm flex items-center justify-center shadow-sm">
                    <BookOpen size={16} className="text-museum" />
                  </div>
                  <StatusBadge status={course.status} />
                </div>
              </div>

              <div className="p-5 pt-3">
                <h3 className="font-serif font-bold text-museum mb-1.5">{course.name}</h3>
                <p className="text-sm text-slate-500 line-clamp-2 mb-4">{course.description}</p>

                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${getAgeColor(course.min_age, course.max_age)}`}>
                      {course.min_age}-{course.max_age}岁
                    </span>
                    <span className="inline-flex items-center gap-1 text-xs text-slate-400">
                      <Clock size={12} />
                      {course.duration_minutes}分钟
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Users size={12} className="text-slate-400 shrink-0" />
                    <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-museum/60 to-museum rounded-full progress-bar-animated"
                        style={{ width: `${Math.min((course.capacity / 50) * 100, 100)}%` }}
                      />
                    </div>
                    <span className="text-xs text-slate-400 shrink-0">{course.capacity}人</span>
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
