import { useState, useMemo } from 'react';
import { Plus, ChevronDown, Eye, XCircle, StickyNote } from 'lucide-react';
import { useStore } from '@/store';
import Modal from '@/components/Modal';
import StatusBadge from '@/components/StatusBadge';
import Pagination from '@/components/Pagination';
import type { AppointmentStatus } from '../../shared/types';

const statusOptions: { value: AppointmentStatus; label: string }[] = [
  { value: 'pending', label: '待确认' },
  { value: 'confirmed', label: '已确认' },
  { value: 'arrived', label: '已到店' },
  { value: 'completed', label: '已完成' },
  { value: 'no_show', label: '爽约' },
  { value: 'cancelled', label: '已取消' },
];

const PAGE_SIZE = 8;

export default function Appointments() {
  const {
    appointments, doctors, timeSlots, services, appointmentHistories,
    currentOperator, createAppointment, updateAppointmentStatus, markNoShow,
  } = useStore();

  const [filterDate, setFilterDate] = useState('');
  const [filterDoctor, setFilterDoctor] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterName, setFilterName] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [noShowModalOpen, setNoShowModalOpen] = useState(false);
  const [selectedAppt, setSelectedAppt] = useState<string | null>(null);
  const [newStatus, setNewStatus] = useState<AppointmentStatus>('confirmed');
  const [statusRemark, setStatusRemark] = useState('');
  const [noShowReason, setNoShowReason] = useState('');

  const [createForm, setCreateForm] = useState({
    patientName: '',
    patientPhone: '',
    doctorId: '',
    date: '',
    timeSlotId: '',
    serviceId: '',
  });

  const [notesMap, setNotesMap] = useState<Record<string, string[]>>({});
  const [newNote, setNewNote] = useState('');

  const filteredAppointments = useMemo(() => {
    return appointments.filter((a) => {
      if (filterDate && a.date !== filterDate) return false;
      if (filterDoctor && a.doctorId !== filterDoctor) return false;
      if (filterStatus && a.status !== filterStatus) return false;
      if (filterName && !a.patientName.includes(filterName)) return false;
      return true;
    });
  }, [appointments, filterDate, filterDoctor, filterStatus, filterName]);

  const totalPages = Math.ceil(filteredAppointments.length / PAGE_SIZE);
  const paginatedAppointments = filteredAppointments.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  const openStatusModal = (apptId: string) => {
    setSelectedAppt(apptId);
    const appt = appointments.find((a) => a.id === apptId);
    setNewStatus(appt?.status === 'pending' ? 'confirmed' : appt?.status === 'confirmed' ? 'arrived' : 'completed');
    setStatusRemark('');
    setStatusModalOpen(true);
  };

  const openNoShowModal = (apptId: string) => {
    setSelectedAppt(apptId);
    setNoShowReason('');
    setNoShowModalOpen(true);
  };

  const handleStatusChange = () => {
    if (!selectedAppt) return;
    updateAppointmentStatus(selectedAppt, newStatus, statusRemark);
    setStatusModalOpen(false);
  };

  const handleNoShow = () => {
    if (!selectedAppt || !noShowReason) return;
    markNoShow(selectedAppt, noShowReason);
    setNoShowModalOpen(false);
  };

  const handleCreate = () => {
    if (!createForm.patientName || !createForm.doctorId || !createForm.date || !createForm.timeSlotId || !createForm.serviceId) return;
    createAppointment({
      patientName: createForm.patientName,
      patientPhone: createForm.patientPhone,
      doctorId: createForm.doctorId,
      scheduleId: '',
      date: createForm.date,
      timeSlotId: createForm.timeSlotId,
      serviceId: createForm.serviceId,
      status: 'pending',
      createdBy: currentOperator.id,
    });
    setCreateModalOpen(false);
    setCreateForm({ patientName: '', patientPhone: '', doctorId: '', date: '', timeSlotId: '', serviceId: '' });
  };

  const handleAddNote = (apptId: string) => {
    if (!newNote.trim()) return;
    setNotesMap((prev) => ({
      ...prev,
      [apptId]: [...(prev[apptId] || []), newNote.trim()],
    }));
    setNewNote('');
  };

  const getHistory = (apptId: string) => appointmentHistories.filter((h) => h.appointmentId === apptId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-zinc-900">预约管理</h2>
        <button
          onClick={() => setCreateModalOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors"
        >
          <Plus className="w-4 h-4" />
          新建预约
        </button>
      </div>

      <div className="bg-white rounded-lg border border-zinc-200 p-4">
        <div className="flex items-center gap-4 flex-wrap">
          <input
            type="date"
            value={filterDate}
            onChange={(e) => { setFilterDate(e.target.value); setCurrentPage(1); }}
            className="border border-zinc-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
          <select
            value={filterDoctor}
            onChange={(e) => { setFilterDoctor(e.target.value); setCurrentPage(1); }}
            className="border border-zinc-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            <option value="">全部医生</option>
            {doctors.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
          <select
            value={filterStatus}
            onChange={(e) => { setFilterStatus(e.target.value); setCurrentPage(1); }}
            className="border border-zinc-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            <option value="">全部状态</option>
            {statusOptions.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
          <input
            type="text"
            placeholder="搜索患者姓名"
            value={filterName}
            onChange={(e) => { setFilterName(e.target.value); setCurrentPage(1); }}
            className="border border-zinc-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 w-40"
          />
        </div>
      </div>

      <div className="bg-white rounded-lg border border-zinc-200">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-200 bg-zinc-50">
              <th className="text-left px-4 py-3 text-zinc-500 font-medium">患者姓名</th>
              <th className="text-left px-4 py-3 text-zinc-500 font-medium">电话</th>
              <th className="text-left px-4 py-3 text-zinc-500 font-medium">医生</th>
              <th className="text-left px-4 py-3 text-zinc-500 font-medium">日期</th>
              <th className="text-left px-4 py-3 text-zinc-500 font-medium">时段</th>
              <th className="text-left px-4 py-3 text-zinc-500 font-medium">服务项目</th>
              <th className="text-left px-4 py-3 text-zinc-500 font-medium">状态</th>
              <th className="text-left px-4 py-3 text-zinc-500 font-medium">操作</th>
            </tr>
          </thead>
          <tbody>
            {paginatedAppointments.map((appt) => {
              const doctor = doctors.find((d) => d.id === appt.doctorId);
              const slot = timeSlots.find((t) => t.id === appt.timeSlotId);
              const service = services.find((s) => s.id === appt.serviceId);
              const isExpanded = expandedRow === appt.id;
              const history = getHistory(appt.id);
              const notes = notesMap[appt.id] || [];

              return (
                <tr key={appt.id} className="border-b border-zinc-100 last:border-0">
                  <td colSpan={8} className="p-0">
                    <div
                      className="cursor-pointer hover:bg-zinc-50"
                      onClick={() => setExpandedRow(isExpanded ? null : appt.id)}
                    >
                      <div className="flex items-center px-4 py-3">
                        <div className="flex-1 grid grid-cols-8 gap-2 items-center">
                          <span className="text-zinc-900">{appt.patientName}</span>
                          <span className="text-zinc-600">{appt.patientPhone}</span>
                          <span className="text-zinc-600">{doctor?.name || '-'}</span>
                          <span className="text-zinc-600">{appt.date}</span>
                          <span className="text-zinc-600">{slot?.label || '-'}</span>
                          <span className="text-zinc-600">{service?.name || '-'}</span>
                          <StatusBadge status={appt.status} />
                          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                            <button onClick={() => openStatusModal(appt.id)} className="p-1 rounded hover:bg-zinc-100 text-zinc-500 hover:text-primary transition-colors" title="状态变更">
                              <ChevronDown className="w-4 h-4" />
                            </button>
                            <button onClick={() => openNoShowModal(appt.id)} className="p-1 rounded hover:bg-zinc-100 text-zinc-500 hover:text-red-500 transition-colors" title="标记爽约">
                              <XCircle className="w-4 h-4" />
                            </button>
                            <button className="p-1 rounded hover:bg-zinc-100 text-zinc-500 hover:text-primary transition-colors" title="查看详情">
                              <Eye className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                    {isExpanded && (
                      <div className="px-6 py-4 bg-zinc-50/50 border-t border-zinc-200">
                        <div className="grid grid-cols-2 gap-6">
                          <div>
                            <h4 className="text-sm font-medium text-zinc-700 mb-2">状态变更记录</h4>
                            {history.length === 0 ? (
                              <p className="text-xs text-zinc-400">暂无变更记录</p>
                            ) : (
                              <div className="space-y-2">
                                {history.map((h) => (
                                  <div key={h.id} className="flex items-center gap-2 text-xs">
                                    <span className="text-zinc-400">{new Date(h.changedAt).toLocaleString()}</span>
                                    <StatusBadge status={h.fromStatus} />
                                    <span className="text-zinc-400">→</span>
                                    <StatusBadge status={h.toStatus} />
                                    {h.remark && <span className="text-zinc-500">({h.remark})</span>}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                          <div>
                            <h4 className="text-sm font-medium text-zinc-700 mb-2 flex items-center gap-1">
                              <StickyNote className="w-3.5 h-3.5" />
                              备注
                            </h4>
                            <div className="space-y-1 mb-2">
                              {notes.map((note, i) => (
                                <div key={i} className="text-xs text-zinc-600 bg-white px-2 py-1 rounded border border-zinc-200">
                                  {note}
                                </div>
                              ))}
                            </div>
                            <div className="flex items-center gap-2">
                              <input
                                type="text"
                                value={newNote}
                                onChange={(e) => setNewNote(e.target.value)}
                                placeholder="添加备注..."
                                className="flex-1 border border-zinc-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-primary/50"
                                onKeyDown={(e) => e.key === 'Enter' && handleAddNote(appt.id)}
                              />
                              <button
                                onClick={() => handleAddNote(appt.id)}
                                className="text-xs text-primary hover:text-primary-dark"
                              >
                                添加
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {paginatedAppointments.length === 0 && (
          <p className="text-center text-zinc-400 py-8 text-sm">暂无预约数据</p>
        )}
        <div className="px-4">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            total={filteredAppointments.length}
            onPageChange={setCurrentPage}
          />
        </div>
      </div>

      <Modal isOpen={createModalOpen} onClose={() => setCreateModalOpen(false)} title="新建预约" maxWidth="max-w-xl">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">患者姓名</label>
              <input
                type="text"
                value={createForm.patientName}
                onChange={(e) => setCreateForm((p) => ({ ...p, patientName: e.target.value }))}
                className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">联系电话</label>
              <input
                type="text"
                value={createForm.patientPhone}
                onChange={(e) => setCreateForm((p) => ({ ...p, patientPhone: e.target.value }))}
                className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">医生</label>
              <select
                value={createForm.doctorId}
                onChange={(e) => setCreateForm((p) => ({ ...p, doctorId: e.target.value }))}
                className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                <option value="">请选择</option>
                {doctors.filter((d) => d.isActive).map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">预约日期</label>
              <input
                type="date"
                value={createForm.date}
                onChange={(e) => setCreateForm((p) => ({ ...p, date: e.target.value }))}
                className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">时段</label>
              <select
                value={createForm.timeSlotId}
                onChange={(e) => setCreateForm((p) => ({ ...p, timeSlotId: e.target.value }))}
                className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                <option value="">请选择</option>
                {timeSlots.map((ts) => <option key={ts.id} value={ts.id}>{ts.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">服务项目</label>
              <select
                value={createForm.serviceId}
                onChange={(e) => setCreateForm((p) => ({ ...p, serviceId: e.target.value }))}
                className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                <option value="">请选择</option>
                {services.map((s) => <option key={s.id} value={s.id}>{s.name} - ¥{s.price}</option>)}
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setCreateModalOpen(false)} className="px-4 py-2 text-sm text-zinc-600 hover:text-zinc-800">取消</button>
            <button onClick={handleCreate} className="px-4 py-2 bg-primary text-white rounded-lg text-sm hover:bg-primary-dark transition-colors">确认预约</button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={statusModalOpen} onClose={() => setStatusModalOpen(false)} title="状态变更">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">新状态</label>
            <select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value as AppointmentStatus)}
              className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              {statusOptions.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">备注（可选）</label>
            <textarea
              value={statusRemark}
              onChange={(e) => setStatusRemark(e.target.value)}
              rows={2}
              className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
            />
          </div>
          {selectedAppt && getHistory(selectedAppt).length > 0 && (
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-2">历史变更</label>
              <div className="space-y-1">
                {getHistory(selectedAppt).map((h) => (
                  <div key={h.id} className="flex items-center gap-2 text-xs">
                    <span className="text-zinc-400">{new Date(h.changedAt).toLocaleString()}</span>
                    <StatusBadge status={h.fromStatus} />
                    <span className="text-zinc-400">→</span>
                    <StatusBadge status={h.toStatus} />
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setStatusModalOpen(false)} className="px-4 py-2 text-sm text-zinc-600 hover:text-zinc-800">取消</button>
            <button onClick={handleStatusChange} className="px-4 py-2 bg-primary text-white rounded-lg text-sm hover:bg-primary-dark transition-colors">确认变更</button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={noShowModalOpen} onClose={() => setNoShowModalOpen(false)} title="标记爽约">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">爽约原因</label>
            <textarea
              value={noShowReason}
              onChange={(e) => setNoShowReason(e.target.value)}
              rows={3}
              className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
              placeholder="请输入爽约原因"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setNoShowModalOpen(false)} className="px-4 py-2 text-sm text-zinc-600 hover:text-zinc-800">取消</button>
            <button onClick={handleNoShow} disabled={!noShowReason} className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600 transition-colors disabled:opacity-50">确认爽约</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
