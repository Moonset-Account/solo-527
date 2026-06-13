import { useEffect, useState } from 'react';
import { UserCheck, CalendarDays, MapPin, QrCode, Plus, AlertCircle, TrendingUp } from 'lucide-react';
import { useAppStore } from '@/store';
import { formatDate } from '@/utils/format';

export default function CheckinManagement() {
  const { checkins, checkinsLoading, fetchCheckins, createCheckin, repairs } = useAppStore();
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ studentId: '', location: '', method: 'qrcode', requestId: '' });

  useEffect(() => {
    fetchCheckins();
  }, [fetchCheckins]);

  const applyFilter = () => {
    fetchCheckins({ startDate: startDate || undefined, endDate: endDate || undefined });
  };

  const resetFilter = () => {
    setStartDate('');
    setEndDate('');
    fetchCheckins();
  };

  const handleCreate = async () => {
    await createCheckin(form);
    setShowForm(false);
    setForm({ studentId: '', location: '', method: 'qrcode', requestId: '' });
  };

  const today = new Date().toISOString().slice(0, 10);
  const todayCount = checkins.filter((c) => c.checkInTime.slice(0, 10) === today).length;
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  const weekStartStr = weekStart.toISOString().slice(0, 10);
  const weekCount = checkins.filter((c) => c.checkInTime.slice(0, 10) >= weekStartStr).length;
  const uncheckedRepairs = repairs.filter((r) => r.status === 'pending' || r.status === 'identity_verifying').length;
  const checkinRate = checkins.length > 0 ? ((checkins.length / (checkins.length + uncheckedRepairs)) * 100).toFixed(1) : '0.0';

  const stats = [
    { label: '今日签到人数', value: todayCount, icon: UserCheck, color: 'bg-blue-500' },
    { label: '本周签到人数', value: weekCount, icon: CalendarDays, color: 'bg-green-500' },
    { label: '未签到报修申请数', value: uncheckedRepairs, icon: AlertCircle, color: 'bg-orange-500' },
    { label: '签到率', value: `${checkinRate}%`, icon: TrendingUp, color: 'bg-purple-500' },
  ];

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">签到管理</h1>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
          <Plus size={16} /> 新建签到
        </button>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="rounded-xl bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${s.color} text-white`}>
                  <Icon size={20} />
                </div>
                <div>
                  <p className="text-xs text-slate-500">{s.label}</p>
                  <p className="text-xl font-bold text-slate-800">{s.value}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="col-span-2">
          <div className="mb-4 rounded-lg bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-end gap-3">
              <div>
                <label className="mb-1 block text-xs text-slate-500">开始日期</label>
                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="rounded-md border border-slate-300 px-3 py-1.5 text-sm" />
              </div>
              <div>
                <label className="mb-1 block text-xs text-slate-500">结束日期</label>
                <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="rounded-md border border-slate-300 px-3 py-1.5 text-sm" />
              </div>
              <button onClick={applyFilter} className="rounded-md bg-blue-600 px-4 py-1.5 text-sm text-white hover:bg-blue-700">查询</button>
              <button onClick={resetFilter} className="rounded-md border border-slate-300 px-4 py-1.5 text-sm text-slate-600 hover:bg-slate-50">重置</button>
            </div>
          </div>

          <div className="overflow-x-auto rounded-lg bg-white shadow-sm">
            {checkinsLoading ? (
              <div className="space-y-3 p-6">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-10 animate-pulse rounded bg-slate-100" />)}</div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50 text-left text-xs text-slate-500">
                    <th className="px-4 py-3">学生姓名</th>
                    <th className="px-4 py-3">学号</th>
                    <th className="px-4 py-3">关联报修单</th>
                    <th className="px-4 py-3">签到时间</th>
                    <th className="px-4 py-3">签到地点</th>
                    <th className="px-4 py-3">签到方式</th>
                  </tr>
                </thead>
                <tbody>
                  {checkins.map((c) => (
                    <tr key={c.id} className="border-b border-slate-50 hover:bg-slate-50">
                      <td className="px-4 py-3 text-slate-700">{c.studentName}</td>
                      <td className="px-4 py-3 font-mono text-xs text-slate-600">{c.studentId}</td>
                      <td className="px-4 py-3 font-mono text-xs text-slate-600">{c.requestId ? c.requestId.slice(0, 8) + '...' : '-'}</td>
                      <td className="px-4 py-3 text-slate-500">{formatDate(c.checkInTime)}</td>
                      <td className="px-4 py-3 text-slate-700">{c.location}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${c.method === 'qrcode' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-700'}`}>
                          {c.method === 'qrcode' ? <QrCode size={10} /> : <MapPin size={10} />}
                          {c.method === 'qrcode' ? '二维码' : '手动'}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {checkins.length === 0 && (
                    <tr><td colSpan={6} className="py-10 text-center text-slate-400">暂无数据</td></tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-lg font-semibold text-slate-800">扫码签到</h3>
            <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 px-8 py-16">
              <div className="mb-4 flex h-32 w-32 items-center justify-center rounded-xl border-2 border-slate-400 bg-white">
                <QrCode size={64} className="text-slate-400" />
              </div>
              <p className="text-sm font-medium text-slate-600">扫码签到</p>
              <p className="mt-1 text-xs text-slate-400">请使用手机扫描二维码完成签到</p>
            </div>
          </div>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h3 className="mb-4 text-lg font-semibold text-slate-800">新建签到</h3>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm text-slate-600">学生ID</label>
                <input type="text" value={form.studentId} onChange={(e) => setForm({ ...form, studentId: e.target.value })} placeholder="输入学生ID" className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="mb-1 block text-sm text-slate-600">关联报修单</label>
                <input type="text" value={form.requestId} onChange={(e) => setForm({ ...form, requestId: e.target.value })} placeholder="输入报修单ID（选填）" className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="mb-1 block text-sm text-slate-600">签到地点</label>
                <input type="text" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="输入签到地点" className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="mb-1 block text-sm text-slate-600">签到方式</label>
                <select value={form.method} onChange={(e) => setForm({ ...form, method: e.target.value })} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm">
                  <option value="qrcode">二维码</option>
                  <option value="manual">手动</option>
                </select>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setShowForm(false)} className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50">取消</button>
              <button onClick={handleCreate} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">确认签到</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
