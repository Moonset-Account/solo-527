import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Calendar, AlertTriangle, Loader2 } from 'lucide-react';
import StatusBadge from '@/components/StatusBadge';
import Modal from '@/components/Modal';
import { useAppointmentStore } from '@/stores/appointmentStore';
import { useRoomStore } from '@/stores/roomStore';

const statusOptions = [
  { value: '', label: '全部状态' },
  { value: 'pending', label: '待确认' },
  { value: 'confirmed', label: '已确认' },
  { value: 'completed', label: '已完成' },
  { value: 'cancelled', label: '已取消' },
  { value: 'conflict', label: '冲突' },
];

export default function AppointmentList() {
  const { appointments, loading, createLoading, fetchAppointments, createAppointment } = useAppointmentStore();
  const { rooms, fetchRooms } = useRoomStore();
  const [statusFilter, setStatusFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ roomId: '', tenantName: '', time: '', duration: '60' });
  const [conflictWarning, setConflictWarning] = useState(false);

  useEffect(() => {
    fetchAppointments(statusFilter ? { status: statusFilter } : undefined);
  }, [statusFilter, fetchAppointments]);

  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  const handleStatusChange = (status: string) => {
    setStatusFilter(status);
  };

  const handleSubmit = async () => {
    if (!form.roomId || !form.tenantName || !form.time) {
      return;
    }
    const success = await createAppointment({
      roomId: Number(form.roomId),
      tenantName: form.tenantName,
      appointmentTime: form.time,
      duration: Number(form.duration),
    });
    if (success) {
      setShowModal(false);
      setConflictWarning(false);
      setForm({ roomId: '', tenantName: '', time: '', duration: '60' });
      fetchAppointments(statusFilter ? { status: statusFilter } : undefined);
    } else {
      const error = useAppointmentStore.getState().error;
      if (error && error.includes('冲突')) {
        setConflictWarning(true);
      }
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium text-[#F1F5F9]">预约看房</h2>
        <div className="flex items-center gap-3">
          <Link
            to="/appointments/calendar"
            className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm text-[#94A3B8] hover:bg-[#334155] transition-colors"
          >
            <Calendar size={16} /> 日历视图
          </Link>
          <button
            onClick={() => setShowModal(true)}
            disabled={createLoading}
            className="flex items-center gap-1 px-4 py-2 rounded-lg bg-[#F97316] text-white text-sm font-medium hover:bg-[#EA580C] transition-colors disabled:opacity-50"
          >
            <Plus size={16} /> 新建预约
          </button>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <select
          value={statusFilter}
          onChange={(e) => handleStatusChange(e.target.value)}
          className="bg-[#1E293B] rounded-lg px-3 py-2 border border-[#334155] text-sm text-[#F1F5F9] outline-none"
        >
          {statusOptions.map((o) => (
            <option key={o.value} value={o.value} className="bg-[#1E293B]">{o.label}</option>
          ))}
        </select>
      </div>

      <div className="bg-[#1E293B] rounded-lg border border-[#334155] overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={32} className="animate-spin text-[#F97316]" />
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#334155]">
                <th className="px-4 py-3 text-left text-[#94A3B8] font-medium">房源</th>
                <th className="px-4 py-3 text-left text-[#94A3B8] font-medium">租客</th>
                <th className="px-4 py-3 text-left text-[#94A3B8] font-medium">预约时间</th>
                <th className="px-4 py-3 text-left text-[#94A3B8] font-medium">时长</th>
                <th className="px-4 py-3 text-left text-[#94A3B8] font-medium">顾问</th>
                <th className="px-4 py-3 text-left text-[#94A3B8] font-medium">状态</th>
              </tr>
            </thead>
            <tbody>
              {appointments.map((a) => (
                <tr key={a.id} className={`border-b border-[#334155]/50 hover:bg-[#334155]/30 ${a.status === 'conflict' ? 'border-l-2 border-l-rose-500' : ''}`}>
                  <td className="px-4 py-3 text-[#F1F5F9]">{a.roomName}</td>
                  <td className="px-4 py-3 text-[#CBD5E1]">{a.tenantName}</td>
                  <td className="px-4 py-3 text-[#CBD5E1]">{a.appointmentTime.replace('T', ' ')}</td>
                  <td className="px-4 py-3 text-[#CBD5E1]">{a.duration}分钟</td>
                  <td className="px-4 py-3 text-[#CBD5E1]">{a.consultantName || '-'}</td>
                  <td className="px-4 py-3"><StatusBadge status={a.status} pulse={a.status === 'conflict'} /></td>
                </tr>
              ))}
              {appointments.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-[#64748B]">暂无预约数据</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      <Modal open={showModal} onClose={() => { setShowModal(false); setConflictWarning(false); }} title="新建预约">
        <div className="space-y-4">
          {conflictWarning && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30">
              <AlertTriangle size={16} className="text-rose-400" />
              <span className="text-sm text-rose-400">该房源在所选时间已有预约，存在冲突！</span>
            </div>
          )}
          <div>
            <label className="block text-sm text-[#94A3B8] mb-1">房源</label>
            <select
              value={form.roomId}
              onChange={(e) => setForm({ ...form, roomId: e.target.value })}
              className="w-full bg-[#0F172A] rounded-lg px-3 py-2 border border-[#334155] text-sm text-[#F1F5F9] outline-none"
            >
              <option value="" className="bg-[#0F172A]">选择房源</option>
              {rooms.map((r) => (
                <option key={r.id} value={r.id} className="bg-[#0F172A]">{r.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-[#94A3B8] mb-1">租客姓名</label>
            <input
              type="text"
              value={form.tenantName}
              onChange={(e) => setForm({ ...form, tenantName: e.target.value })}
              className="w-full bg-[#0F172A] rounded-lg px-3 py-2 border border-[#334155] text-sm text-[#F1F5F9] outline-none"
              placeholder="输入租客姓名"
            />
          </div>
          <div>
            <label className="block text-sm text-[#94A3B8] mb-1">预约时间</label>
            <input
              type="datetime-local"
              value={form.time}
              onChange={(e) => setForm({ ...form, time: e.target.value })}
              className="w-full bg-[#0F172A] rounded-lg px-3 py-2 border border-[#334155] text-sm text-[#F1F5F9] outline-none"
            />
          </div>
          <div>
            <label className="block text-sm text-[#94A3B8] mb-1">时长(分钟)</label>
            <select
              value={form.duration}
              onChange={(e) => setForm({ ...form, duration: e.target.value })}
              className="w-full bg-[#0F172A] rounded-lg px-3 py-2 border border-[#334155] text-sm text-[#F1F5F9] outline-none"
            >
              <option value="30" className="bg-[#0F172A]">30分钟</option>
              <option value="60" className="bg-[#0F172A]">60分钟</option>
              <option value="90" className="bg-[#0F172A]">90分钟</option>
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => { setShowModal(false); setConflictWarning(false); }} className="px-4 py-2 rounded-lg text-sm text-[#94A3B8] hover:bg-[#334155]">
              取消
            </button>
            <button onClick={handleSubmit} disabled={createLoading} className="px-4 py-2 rounded-lg bg-[#F97316] text-white text-sm font-medium hover:bg-[#EA580C] disabled:opacity-50 flex items-center gap-1">
              {createLoading && <Loader2 size={16} className="animate-spin" />}
              确认预约
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
