import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Calendar, AlertTriangle } from 'lucide-react';
import StatusBadge from '@/components/StatusBadge';
import Modal from '@/components/Modal';
import type { Appointment } from '@/types';

const mockAppointments: Appointment[] = [
  { id: 1, roomId: 1, roomName: '望京SOHO-A1201', tenantId: 1, tenantName: '张先生', consultantId: 1, consultantName: '顾问A', appointmentTime: '2026-06-17T09:00:00', duration: 60, status: 'confirmed', remark: '', createdAt: '2026-06-16' },
  { id: 2, roomId: 2, roomName: '中关村-B0803', tenantId: 2, tenantName: '李女士', consultantId: 2, consultantName: '顾问B', appointmentTime: '2026-06-17T10:30:00', duration: 60, status: 'pending', remark: '', createdAt: '2026-06-16' },
  { id: 3, roomId: 1, roomName: '望京SOHO-A1201', tenantId: 3, tenantName: '王先生', consultantId: 1, consultantName: '顾问A', appointmentTime: '2026-06-17T09:00:00', duration: 60, status: 'conflict', remark: '时间冲突', createdAt: '2026-06-16' },
  { id: 4, roomId: 3, roomName: '望京SOHO-A1203', tenantId: 4, tenantName: '赵女士', consultantId: 3, consultantName: '顾问C', appointmentTime: '2026-06-18T14:00:00', duration: 90, status: 'completed', remark: '', createdAt: '2026-06-15' },
  { id: 5, roomId: 4, roomName: '朝阳区-C0502', tenantId: 5, tenantName: '孙先生', consultantId: 2, consultantName: '顾问B', appointmentTime: '2026-06-16T16:00:00', duration: 60, status: 'cancelled', remark: '租客取消', createdAt: '2026-06-14' },
];

const statusOptions = [
  { value: '', label: '全部状态' },
  { value: 'pending', label: '待确认' },
  { value: 'confirmed', label: '已确认' },
  { value: 'completed', label: '已完成' },
  { value: 'cancelled', label: '已取消' },
  { value: 'conflict', label: '冲突' },
];

export default function AppointmentList() {
  const [statusFilter, setStatusFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ roomId: '', tenantName: '', time: '', duration: '60' });
  const [conflictWarning, setConflictWarning] = useState(false);

  const filtered = mockAppointments.filter((a) => !statusFilter || a.status === statusFilter);

  const handleSubmit = () => {
    const hasConflict = mockAppointments.some(
      (a) => a.roomId === Number(form.roomId) && a.appointmentTime === form.time && a.status !== 'cancelled'
    );
    if (hasConflict) {
      setConflictWarning(true);
      return;
    }
    setShowModal(false);
    setConflictWarning(false);
    setForm({ roomId: '', tenantName: '', time: '', duration: '60' });
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
            className="flex items-center gap-1 px-4 py-2 rounded-lg bg-[#F97316] text-white text-sm font-medium hover:bg-[#EA580C] transition-colors"
          >
            <Plus size={16} /> 新建预约
          </button>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-[#1E293B] rounded-lg px-3 py-2 border border-[#334155] text-sm text-[#F1F5F9] outline-none"
        >
          {statusOptions.map((o) => (
            <option key={o.value} value={o.value} className="bg-[#1E293B]">{o.label}</option>
          ))}
        </select>
      </div>

      <div className="bg-[#1E293B] rounded-lg border border-[#334155] overflow-hidden">
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
            {filtered.map((a) => (
              <tr key={a.id} className={`border-b border-[#334155]/50 hover:bg-[#334155]/30 ${a.status === 'conflict' ? 'border-l-2 border-l-rose-500' : ''}`}>
                <td className="px-4 py-3 text-[#F1F5F9]">{a.roomName}</td>
                <td className="px-4 py-3 text-[#CBD5E1]">{a.tenantName}</td>
                <td className="px-4 py-3 text-[#CBD5E1]">{a.appointmentTime.replace('T', ' ')}</td>
                <td className="px-4 py-3 text-[#CBD5E1]">{a.duration}分钟</td>
                <td className="px-4 py-3 text-[#CBD5E1]">{a.consultantName}</td>
                <td className="px-4 py-3"><StatusBadge status={a.status} pulse={a.status === 'conflict'} /></td>
              </tr>
            ))}
          </tbody>
        </table>
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
              <option value="1" className="bg-[#0F172A]">望京SOHO-A1201</option>
              <option value="2" className="bg-[#0F172A]">中关村-B0803</option>
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
            <button onClick={handleSubmit} className="px-4 py-2 rounded-lg bg-[#F97316] text-white text-sm font-medium hover:bg-[#EA580C]">
              确认预约
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
