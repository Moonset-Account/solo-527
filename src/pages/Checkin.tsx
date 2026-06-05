import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Search, CheckCircle, UserCheck, Users, UserPlus } from 'lucide-react';
import { checkinApi, sessionsApi } from '@/lib/api';
import EmptyState from '@/components/EmptyState';
import type { Session, Participant } from '@/types';

export default function Checkin() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const [session, setSession] = useState<Session | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [checkedInCount, setCheckedInCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [flashId, setFlashId] = useState<number | null>(null);

  useEffect(() => {
    loadData();
  }, [sessionId]);

  const loadData = async () => {
    try {
      if (sessionId) {
        const sessionData = await sessionsApi.getById(Number(sessionId));
        setSession(sessionData);
        const status = await checkinApi.getStatus(Number(sessionId));
        setParticipants(status.participants);
        setCheckedInCount(status.checked_in_count);
        setTotalCount(status.total_count);
      }
    } catch {} finally {
      setLoading(false);
    }
  };

  const handleCheckin = async (participantId: number) => {
    try {
      await checkinApi.checkin(Number(sessionId), participantId);
      setFlashId(participantId);
      setTimeout(() => setFlashId(null), 800);
      setParticipants((prev) =>
        prev.map((p) => (p.id === participantId ? { ...p, checked_in: true, checked_in_at: new Date().toISOString() } : p))
      );
      setCheckedInCount((prev) => prev + 1);
    } catch {}
  };

  const handleBulkCheckin = async () => {
    const unchecked = filtered.filter((p) => !p.checked_in);
    for (const p of unchecked) {
      try {
        await checkinApi.checkin(Number(sessionId), p.id);
        setFlashId(p.id);
        setTimeout(() => setFlashId(null), 800);
        setParticipants((prev) =>
          prev.map((pt) => (pt.id === p.id ? { ...pt, checked_in: true, checked_in_at: new Date().toISOString() } : pt))
        );
        setCheckedInCount((prev) => prev + 1);
      } catch {}
    }
  };

  const filtered = participants.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const checkinRate = totalCount > 0 ? Math.round((checkedInCount / totalCount) * 100) : 0;
  const uncheckedFiltered = filtered.filter((p) => !p.checked_in);
  const circumference = 2 * Math.PI * 54;
  const strokeDashoffset = circumference - (checkinRate / 100) * circumference;

  if (loading) {
    return <div className="animate-pulse space-y-4"><div className="h-8 bg-gray-200 rounded w-1/3" /></div>;
  }

  if (!session) {
    return <EmptyState message="场次不存在" />;
  }

  return (
    <div className="page-enter space-y-6">
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="bg-museum-gradient p-6 pb-20 relative">
          <div className="flex items-center gap-2 mb-3">
            <UserCheck size={18} className="text-gold" />
            <span className="text-gold/80 text-xs font-medium tracking-wider uppercase">场次签到</span>
          </div>
          <h1 className="page-title text-white mb-2">{session.course?.name || '场次签到'}</h1>
          <p className="text-white/60 text-sm">
            {session.date} {session.start_time}-{session.end_time} · {session.location}
          </p>
        </div>

        <div className="px-6 -mt-14 pb-6">
          <div className="bg-white rounded-xl border border-gray-100 shadow-lg shadow-museum/5 p-5">
            <div className="flex items-center gap-6">
              <div className="relative flex-shrink-0">
                <svg width="120" height="120" viewBox="0 0 120 120">
                  <circle cx="60" cy="60" r="54" fill="none" stroke="#f1f5f9" strokeWidth="8" />
                  <circle
                    cx="60"
                    cy="60"
                    r="54"
                    fill="none"
                    stroke="url(#progressGradient)"
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    transform="rotate(-90 60 60)"
                    className="progress-bar-animated"
                  />
                  <defs>
                    <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#D4A84B" />
                      <stop offset="100%" stopColor="#1B3A5C" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-bold text-museum">{checkinRate}%</span>
                  <span className="text-xs text-slate-400">签到率</span>
                </div>
              </div>

              <div className="flex-1 grid grid-cols-2 gap-3">
                <div className="stat-card">
                  <div className="flex items-center gap-2 mb-1">
                    <Users size={14} className="text-slate-400" />
                    <span className="text-xs text-slate-400">总人数</span>
                  </div>
                  <span className="text-xl font-bold text-museum">{totalCount}</span>
                </div>
                <div className="stat-card">
                  <div className="flex items-center gap-2 mb-1">
                    <CheckCircle size={14} className="text-green-500" />
                    <span className="text-xs text-slate-400">已签到</span>
                  </div>
                  <span className="text-xl font-bold text-green-600">{checkedInCount}</span>
                </div>
                <div className="stat-card">
                  <div className="flex items-center gap-2 mb-1">
                    <UserPlus size={14} className="text-orange-400" />
                    <span className="text-xs text-slate-400">未签到</span>
                  </div>
                  <span className="text-xl font-bold text-orange-500">{totalCount - checkedInCount}</span>
                </div>
                <div className="stat-card">
                  <div className="flex items-center gap-2 mb-1">
                    <UserCheck size={14} className="text-museum" />
                    <span className="text-xs text-slate-400">签到率</span>
                  </div>
                  <span className="text-xl font-bold text-museum">{checkinRate}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="搜索参与者姓名..."
            className="input-field pl-10"
          />
        </div>
        {uncheckedFiltered.length > 0 && (
          <button onClick={handleBulkCheckin} className="btn-primary flex items-center gap-2 whitespace-nowrap">
            <UserCheck size={16} />
            全部签到 ({uncheckedFiltered.length})
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <EmptyState message="暂无参与者" />
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <table className="data-table">
            <thead>
              <tr>
                <th>序号</th>
                <th>姓名</th>
                <th>年龄</th>
                <th>签到状态</th>
                <th>签到时间</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p, i) => (
                <tr
                  key={p.id}
                  className={`${flashId === p.id ? 'animate-pulse bg-green-50' : ''}`}
                  style={{
                    transition: 'background-color 0.5s ease',
                  }}
                >
                  <td className="text-slate-400">{i + 1}</td>
                  <td className="font-medium text-slate-700">{p.name}</td>
                  <td className="text-slate-700">{p.age}岁</td>
                  <td>
                    {p.checked_in ? (
                      <span className="status-badge status-approved flex items-center gap-1 w-fit">
                        <CheckCircle size={12} />
                        已签到
                      </span>
                    ) : (
                      <span className="status-badge status-pending">未签到</span>
                    )}
                  </td>
                  <td className="text-slate-400 text-xs">
                    {p.checked_in && p.checked_in_at
                      ? new Date(p.checked_in_at).toLocaleTimeString()
                      : '-'}
                  </td>
                  <td>
                    {!p.checked_in && (
                      <button
                        onClick={() => handleCheckin(p.id)}
                        className="btn-primary py-1.5 px-3 text-xs"
                      >
                        签到
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
