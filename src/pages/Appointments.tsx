import { useEffect, useState } from 'react';
import { Plus, Search, CheckCircle } from 'lucide-react';
import { useAppointmentStore } from '@/stores/appointmentStore';
import { memberApi, coachApi, packageApi } from '@/utils/api';
import StatusBadge from '@/components/StatusBadge';
import type { Member, Coach, PackageType } from '../../shared/types';

export default function Appointments() {
  const { appointments, loading, fetchAppointments, createAppointment, checkIn } = useAppointmentStore();
  const [dateFilter, setDateFilter] = useState(new Date().toISOString().slice(0, 10));
  const [coachFilter, setCoachFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [members, setMembers] = useState<Member[]>([]);
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [pkgTypes, setPkgTypes] = useState<PackageType[]>([]);
  const [form, setForm] = useState({ member_id: 0, coach_id: 0, member_package_id: 0, start_time: '', end_time: '', type: 'private' as const, notes: '' });

  useEffect(() => {
    fetchAppointments({ date: dateFilter, coach_id: coachFilter ? Number(coachFilter) : undefined, status: statusFilter || undefined });
  }, [dateFilter, coachFilter, statusFilter, fetchAppointments]);

  useEffect(() => {
    memberApi.list().then(setMembers);
    coachApi.list().then(setCoaches);
    packageApi.list().then(setPkgTypes);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createAppointment(form);
    setShowModal(false);
    fetchAppointments({ date: dateFilter });
  };

  const handleCheckIn = async (id: number) => {
    await checkIn(id);
  };

  const filteredAppts = typeFilter ? appointments.filter((a) => a.type === typeFilter) : appointments;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          <input type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} className="input-field w-auto" />
          <select value={coachFilter} onChange={(e) => setCoachFilter(e.target.value)} className="input-field w-auto">
            <option value="">全部教练</option>
            {coaches.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="input-field w-auto">
            <option value="">全部状态</option>
            <option value="booked">已预约</option>
            <option value="checked_in">已签到</option>
            <option value="cancelled">已取消</option>
            <option value="no_show">未到</option>
          </select>
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="input-field w-auto">
            <option value="">全部类型</option>
            <option value="private">私教</option>
            <option value="group">团课</option>
          </select>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2"><Plus className="w-4 h-4" />创建预约</button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin w-8 h-8 border-4 border-accent border-t-transparent rounded-full" /></div>
      ) : (
        <div className="card overflow-hidden !p-0">
          <table className="w-full">
            <thead>
              <tr className="table-header">
                <th className="px-4 py-3">会员ID</th>
                <th className="px-4 py-3">教练ID</th>
                <th className="px-4 py-3">类型</th>
                <th className="px-4 py-3">开始时间</th>
                <th className="px-4 py-3">结束时间</th>
                <th className="px-4 py-3">状态</th>
                <th className="px-4 py-3">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredAppts.map((apt) => (
                <tr key={apt.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm">{apt.member_id}</td>
                  <td className="px-4 py-3 text-sm">{apt.coach_id}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${apt.type === 'private' ? 'bg-accent/10 text-accent' : 'bg-blue-500/10 text-blue-500'}`}>
                      {apt.type === 'private' ? '私教' : '团课'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{apt.start_time?.slice(0, 16).replace('T', ' ')}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{apt.end_time?.slice(11, 16)}</td>
                  <td className="px-4 py-3"><StatusBadge status={apt.status} /></td>
                  <td className="px-4 py-3">
                    {apt.status === 'booked' && (
                      <button onClick={() => handleCheckIn(apt.id)} className="flex items-center gap-1 text-success hover:bg-emerald-50 px-2 py-1 rounded text-sm">
                        <CheckCircle className="w-4 h-4" />签到
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {filteredAppts.length === 0 && <tr><td colSpan={7} className="px-4 py-12 text-center text-gray-400">暂无预约</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-btn p-6 w-full max-w-md shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-4">创建预约</h3>
            <form onSubmit={handleSubmit} className="space-y-3">
              <select value={form.member_id} onChange={(e) => setForm({ ...form, member_id: Number(e.target.value) })} className="input-field" required>
                <option value={0}>选择会员</option>
                {members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
              <select value={form.coach_id} onChange={(e) => setForm({ ...form, coach_id: Number(e.target.value) })} className="input-field" required>
                <option value={0}>选择教练</option>
                {coaches.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <select value={form.member_package_id} onChange={(e) => setForm({ ...form, member_package_id: Number(e.target.value) })} className="input-field">
                <option value={0}>选择会员套餐(可选)</option>
              </select>
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as any })} className="input-field">
                <option value="private">私教</option>
                <option value="group">团课</option>
              </select>
              <input type="datetime-local" value={form.start_time} onChange={(e) => setForm({ ...form, start_time: e.target.value })} className="input-field" required />
              <input type="datetime-local" value={form.end_time} onChange={(e) => setForm({ ...form, end_time: e.target.value })} className="input-field" required />
              <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="备注" className="input-field" rows={2} />
              <div className="flex gap-3 pt-2">
                <button type="submit" className="btn-primary flex-1">创建</button>
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">取消</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
