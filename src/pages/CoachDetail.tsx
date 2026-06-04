import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Calendar, TrendingUp, Clock } from 'lucide-react';
import { useCoachStore } from '@/stores/coachStore';
import { useAuthStore } from '@/stores/authStore';
import StatusBadge from '@/components/StatusBadge';

export default function CoachDetail() {
  const { id } = useParams();
  const { user } = useAuthStore();
  const { currentCoach, performance, schedule, fetchCoach, fetchPerformance, fetchSchedule } = useCoachStore();
  const [activeTab, setActiveTab] = useState<'schedule' | 'performance'>('schedule');

  const coachId = Number(id);

  useEffect(() => {
    if (coachId) {
      fetchCoach(coachId);
      fetchSchedule(coachId);
      if (user?.role === 'admin' || (user?.role === 'coach' && user.coach_id === coachId)) {
        fetchPerformance(coachId);
      }
    }
  }, [coachId]);

  if (!currentCoach) return <div className="flex justify-center py-12"><div className="animate-spin w-8 h-8 border-4 border-accent border-t-transparent rounded-full" /></div>;

  const canViewPerformance = user?.role === 'admin' || (user?.role === 'coach' && user.coach_id === coachId);

  return (
    <div className="space-y-6">
      <div className="card">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center text-accent text-xl font-bold">
            {currentCoach.name.charAt(0)}
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-800">{currentCoach.name}</h2>
            <p className="text-sm text-gray-500">{currentCoach.phone} · {currentCoach.email || '无邮箱'}</p>
            <div className="flex items-center gap-2 mt-1">
              <StatusBadge status={currentCoach.status} />
              {currentCoach.specialties && <span className="text-xs text-gray-500">{currentCoach.specialties}</span>}
            </div>
          </div>
        </div>
        {currentCoach.bio && <p className="mt-3 text-sm text-gray-600">{currentCoach.bio}</p>}
      </div>

      <div className="flex gap-2 border-b border-gray-200 pb-2">
        <button onClick={() => setActiveTab('schedule')} className={`flex items-center gap-1.5 px-3 py-2 text-sm rounded-t transition-colors ${activeTab === 'schedule' ? 'text-accent border-b-2 border-accent font-medium' : 'text-gray-500 hover:text-gray-700'}`}>
          <Calendar className="w-4 h-4" />排班
        </button>
        {canViewPerformance && (
          <button onClick={() => setActiveTab('performance')} className={`flex items-center gap-1.5 px-3 py-2 text-sm rounded-t transition-colors ${activeTab === 'performance' ? 'text-accent border-b-2 border-accent font-medium' : 'text-gray-500 hover:text-gray-700'}`}>
            <TrendingUp className="w-4 h-4" />业绩
          </button>
        )}
      </div>

      {activeTab === 'schedule' && (
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">排班日历</h3>
          {schedule.length === 0 ? (
            <p className="text-gray-400 text-center py-8">暂无排班</p>
          ) : (
            <div className="space-y-2">
              {schedule.map((s) => (
                <div key={s.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-btn">
                  <div className="flex items-center gap-3">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span className="text-sm font-medium text-gray-700">{s.date}</span>
                    <span className="text-sm text-gray-500">{s.start_time} - {s.end_time}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${s.type === 'private' ? 'bg-accent/10 text-accent' : s.type === 'group' ? 'bg-blue-500/10 text-blue-500' : s.type === 'rest' ? 'bg-gray-200 text-gray-500' : 'bg-purple-100 text-purple-600'}`}>
                      {s.type === 'private' ? '私教' : s.type === 'group' ? '团课' : s.type === 'rest' ? '休息' : '请假'}
                    </span>
                  </div>
                  <StatusBadge status={s.status} />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'performance' && canViewPerformance && performance && (
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">业绩数据</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-accent/5 rounded-btn text-center">
              <div className="text-3xl font-bold text-accent">{performance.sessions}</div>
              <div className="text-sm text-gray-500 mt-1">总课时</div>
            </div>
            <div className="p-4 bg-success/5 rounded-btn text-center">
              <div className="text-3xl font-bold text-success">¥{performance.revenue}</div>
              <div className="text-sm text-gray-500 mt-1">总营收</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
