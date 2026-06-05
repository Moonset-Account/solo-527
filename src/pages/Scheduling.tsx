import { useEffect, useState } from 'react';
import { Users, Calendar, AlertTriangle, UserPlus, Clock } from 'lucide-react';
import { schedulingApi, sessionsApi, adminApi } from '@/lib/api';
import StatusBadge from '@/components/StatusBadge';
import EmptyState from '@/components/EmptyState';
import type { ScheduleAssignment, Session, Guide, User as UserType } from '@/types';

export default function Scheduling() {
  const [assignments, setAssignments] = useState<ScheduleAssignment[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [guides, setGuides] = useState<(Guide & { user?: UserType })[]>([]);
  const [selectedSession, setSelectedSession] = useState<number | null>(null);
  const [selectedGuide, setSelectedGuide] = useState<number | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [assignData, sessionData] = await Promise.all([
        schedulingApi.list(),
        sessionsApi.list(),
      ]);
      setAssignments(assignData);
      setSessions(sessionData);
      try {
        const users = await adminApi.listUsers();
        const guideUsers = users.filter((u) => u.role === 'guide');
        setGuides(guideUsers.map((u) => ({ id: u.id, user_id: u.id, specialties: '', status: 'active', user: u })));
      } catch {}
    } catch {} finally {
      setLoading(false);
    }
  };

  const unassignedSessions = sessions.filter(
    (s) => s.status === 'open' && !assignments.some((a) => a.session_id === s.id)
  );

  const handleAssign = async () => {
    if (!selectedSession || !selectedGuide) return;
    setError('');
    try {
      await schedulingApi.assign(selectedSession, selectedGuide);
      setShowModal(false);
      setSelectedSession(null);
      setSelectedGuide(null);
      loadData();
    } catch (err: any) {
      setError(err.message || '排班失败');
    }
  };

  const handleRemove = async (id: number) => {
    try {
      await schedulingApi.remove(id);
      loadData();
    } catch {}
  };

  const getWeekDays = () => {
    const today = new Date();
    const days: string[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() + i);
      days.push(d.toISOString().split('T')[0]);
    }
    return days;
  };

  const weekDays = getWeekDays();

  const getUrgencyColor = (date: string) => {
    const sessionDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diff = Math.ceil((sessionDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (diff <= 1) return 'border-l-red-500 bg-red-50/30';
    if (diff <= 3) return 'border-l-orange-400 bg-orange-50/20';
    return 'border-l-blue-400';
  };

  const getUrgencyBadge = (date: string) => {
    const sessionDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diff = Math.ceil((sessionDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (diff <= 1) return { text: '紧急', cls: 'bg-red-100 text-red-700' };
    if (diff <= 3) return { text: '较急', cls: 'bg-orange-100 text-orange-700' };
    return null;
  };

  const getAvailabilityScore = (guideId: number) => {
    const assigned = assignments.filter((a) => a.guide_id === guideId).length;
    return Math.max(0, 5 - assigned);
  };

  const blockColors = [
    'bg-blue-100 text-blue-700 border-blue-200',
    'bg-indigo-100 text-indigo-700 border-indigo-200',
    'bg-violet-100 text-violet-700 border-violet-200',
    'bg-cyan-100 text-cyan-700 border-cyan-200',
    'bg-teal-100 text-teal-700 border-teal-200',
  ];

  const getGuideBlockColor = (guideId: number) => {
    const index = guides.findIndex((g) => g.id === guideId);
    return blockColors[index % blockColors.length];
  };

  const avatarColors = [
    'bg-blue-100 text-blue-600',
    'bg-indigo-100 text-indigo-600',
    'bg-violet-100 text-violet-600',
    'bg-cyan-100 text-cyan-600',
    'bg-teal-100 text-teal-600',
    'bg-emerald-100 text-emerald-600',
    'bg-amber-100 text-amber-600',
  ];

  const getAvatarColor = (guideId: number) => {
    const index = guides.findIndex((g) => g.id === guideId);
    return avatarColors[index % avatarColors.length];
  };

  return (
    <div className="space-y-6 page-enter">
      <div className="flex items-center justify-between">
        <h1 className="page-title">排班管理</h1>
        <button
          onClick={() => setShowModal(true)}
          className="btn-primary flex items-center gap-2"
        >
          <UserPlus size={16} />
          分配讲解员
        </button>
      </div>

      {loading ? (
        <div className="animate-pulse space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 bg-gray-200 rounded" />
          ))}
        </div>
      ) : (
        <>
          <div className="bg-white rounded-xl border border-gray-100/80 p-5 stat-card">
            <h2 className="section-title mb-5">本周排班视图</h2>
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th className="w-36">讲解员</th>
                    {weekDays.map((day) => {
                      const isToday = day === new Date().toISOString().split('T')[0];
                      return (
                        <th key={day} className={`text-center ${isToday ? 'bg-museum/5' : ''}`}>
                          <div className={isToday ? 'text-museum font-bold' : ''}>
                            {new Date(day).toLocaleDateString('zh-CN', { weekday: 'short' })}
                          </div>
                          <div className={`text-xs ${isToday ? 'text-museum/70' : 'text-slate-400'}`}>
                            {day.slice(5)}
                          </div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {guides.map((guide) => (
                    <tr key={guide.id}>
                      <td>
                        <div className="flex items-center gap-2.5">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${getAvatarColor(guide.id)}`}>
                            {guide.user?.name?.charAt(0) || '?'}
                          </div>
                          <span className="font-medium text-museum text-sm truncate">{guide.user?.name || `讲解员#${guide.id}`}</span>
                        </div>
                      </td>
                      {weekDays.map((day) => {
                        const dayAssignments = assignments.filter(
                          (a) => a.guide_id === guide.id && a.session?.date === day
                        );
                        const isToday = day === new Date().toISOString().split('T')[0];
                        return (
                          <td key={day} className={`text-center ${isToday ? 'bg-museum/5' : ''}`}>
                            {dayAssignments.map((a) => (
                              <div
                                key={a.id}
                                className={`inline-block rounded-md px-2 py-1 text-xs font-medium border mb-1 cursor-pointer transition-all duration-200 hover:shadow-sm hover:scale-105 ${getGuideBlockColor(guide.id)}`}
                                onClick={() => handleRemove(a.id)}
                              >
                                {a.session?.start_time?.slice(0, 5)}
                              </div>
                            ))}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                  {guides.length === 0 && (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400">暂无讲解员</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-5">
            <div className="bg-white rounded-xl border border-gray-100/80 p-5 stat-card">
              <h2 className="section-title mb-5">未排班场次</h2>
              {unassignedSessions.length === 0 ? (
                <EmptyState message="所有场次已排班" />
              ) : (
                <div className="space-y-2">
                  {unassignedSessions.map((s) => {
                    const urgency = getUrgencyBadge(s.date);
                    return (
                      <div
                        key={s.id}
                        className={`flex items-center justify-between py-3 px-4 rounded-lg border-l-4 transition-colors hover:bg-gray-50/50 ${getUrgencyColor(s.date)}`}
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-slate-700">{s.course?.name || `课程#${s.course_id}`}</p>
                            {urgency && (
                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${urgency.cls}`}>
                                {urgency.text}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-1">
                            <Clock size={11} />
                            <span>{s.date} {s.start_time}-{s.end_time}</span>
                          </div>
                        </div>
                        <StatusBadge status={s.status} />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="bg-white rounded-xl border border-gray-100/80 p-5 stat-card">
              <h2 className="section-title mb-5">空闲讲解员</h2>
              {guides.length === 0 ? (
                <EmptyState message="暂无讲解员" />
              ) : (
                <div className="space-y-2">
                  {guides.map((g) => {
                    const score = getAvailabilityScore(g.id);
                    const assignedCount = assignments.filter((a) => a.guide_id === g.id).length;
                    return (
                      <div key={g.id} className="flex items-center gap-3 py-3 px-4 rounded-lg hover:bg-gray-50/50 transition-colors">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${getAvatarColor(g.id)}`}>
                          {g.user?.name?.charAt(0) || '?'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-700">{g.user?.name}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-500 ${
                                  score >= 4 ? 'bg-green-500' : score >= 2 ? 'bg-yellow-500' : 'bg-red-400'
                                }`}
                                style={{ width: `${(score / 5) * 100}%` }}
                              />
                            </div>
                            <span className="text-xs text-slate-400 shrink-0">
                              已排 {assignedCount} 场
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2 className="section-title mb-5">分配讲解员</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">选择场次</label>
                <select
                  value={selectedSession || ''}
                  onChange={(e) => setSelectedSession(Number(e.target.value))}
                  className="select-field"
                >
                  <option value="">请选择场次</option>
                  {unassignedSessions.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.course?.name || `课程#${s.course_id}`} - {s.date} {s.start_time}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">选择讲解员</label>
                <select
                  value={selectedGuide || ''}
                  onChange={(e) => setSelectedGuide(Number(e.target.value))}
                  className="select-field"
                >
                  <option value="">请选择讲解员</option>
                  {guides.map((g) => (
                    <option key={g.id} value={g.id}>{g.user?.name}</option>
                  ))}
                </select>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-2.5 rounded-lg flex items-center gap-2">
                  <AlertTriangle size={16} />
                  {error}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowModal(false)} className="btn-secondary">
                取消
              </button>
              <button
                onClick={handleAssign}
                disabled={!selectedSession || !selectedGuide}
                className="btn-primary"
              >
                确认分配
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
