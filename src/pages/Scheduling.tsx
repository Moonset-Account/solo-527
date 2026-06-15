import { useState, useMemo } from 'react';
import { Plus, Store, ChevronLeft, ChevronRight } from 'lucide-react';
import { useStore } from '@/store';
import Modal from '@/components/Modal';
import type { ShiftType } from '../../shared/types';

const doctorColors = [
  'bg-primary/20 text-primary-dark',
  'bg-blue-100 text-blue-800',
  'bg-purple-100 text-purple-800',
  'bg-amber-100 text-amber-800',
  'bg-rose-100 text-rose-800',
];

function getWeekDates(baseDate: Date): Date[] {
  const day = baseDate.getDay();
  const monday = new Date(baseDate);
  monday.setDate(baseDate.getDate() - ((day + 6) % 7));
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

function formatDate(d: Date): string {
  return d.toISOString().split('T')[0];
}

const weekDayNames = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];

export default function Scheduling() {
  const { schedules, doctors, timeSlots, closures, currentOperator, createSchedule, createClosure } = useStore();
  const [baseDate, setBaseDate] = useState(new Date());
  const [selectedDoctors, setSelectedDoctors] = useState<string[]>(doctors.filter((d) => d.isActive).map((d) => d.id));
  const [batchModalOpen, setBatchModalOpen] = useState(false);
  const [closureModalOpen, setClosureModalOpen] = useState(false);
  const [cellModalOpen, setCellModalOpen] = useState(false);
  const [selectedCell, setSelectedCell] = useState<{ date: string; timeSlotId: string } | null>(null);

  const [batchForm, setBatchForm] = useState({
    doctorId: '',
    dateRange: '' as string,
    shiftType: 'morning' as ShiftType,
    timeSlotIds: [] as string[],
  });
  const [closureForm, setClosureForm] = useState({
    date: '',
    startTime: '',
    endTime: '',
    reason: '',
  });
  const [cellForm, setCellForm] = useState({
    doctorId: '',
    shiftType: 'morning' as ShiftType,
  });

  const weekDates = useMemo(() => getWeekDates(baseDate), [baseDate]);

  const filteredSchedules = useMemo(
    () => schedules.filter((s) => selectedDoctors.includes(s.doctorId)),
    [schedules, selectedDoctors]
  );

  const weekClosures = useMemo(
    () => {
      const start = formatDate(weekDates[0]);
      const end = formatDate(weekDates[6]);
      return closures.filter((c) => c.date >= start && c.date <= end);
    },
    [closures, weekDates]
  );

  const toggleDoctor = (id: string) => {
    setSelectedDoctors((prev) =>
      prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id]
    );
  };

  const handlePrevWeek = () => {
    const d = new Date(baseDate);
    d.setDate(d.getDate() - 7);
    setBaseDate(d);
  };

  const handleNextWeek = () => {
    const d = new Date(baseDate);
    d.setDate(d.getDate() + 7);
    setBaseDate(d);
  };

  const handleCellClick = (date: string, timeSlotId: string) => {
    setSelectedCell({ date, timeSlotId });
    setCellForm({ doctorId: doctors[0]?.id || '', shiftType: 'morning' });
    setCellModalOpen(true);
  };

  const handleCellSubmit = () => {
    if (!selectedCell || !cellForm.doctorId) return;
    createSchedule({
      doctorId: cellForm.doctorId,
      date: selectedCell.date,
      timeSlotId: selectedCell.timeSlotId,
      shiftType: cellForm.shiftType,
      createdBy: currentOperator.id,
    });
    setCellModalOpen(false);
  };

  const handleBatchSubmit = () => {
    if (!batchForm.doctorId || !batchForm.dateRange || batchForm.timeSlotIds.length === 0) return;
    const [startStr, endStr] = batchForm.dateRange.split('~');
    if (!startStr || !endStr) return;
    const start = new Date(startStr);
    const end = new Date(endStr);
    const newSchedules = [];
    const current = new Date(start);
    while (current <= end) {
      const dateStr = formatDate(current);
      for (const tsId of batchForm.timeSlotIds) {
        newSchedules.push({
          doctorId: batchForm.doctorId,
          date: dateStr,
          timeSlotId: tsId,
          shiftType: batchForm.shiftType,
          createdBy: currentOperator.id,
        });
      }
      current.setDate(current.getDate() + 1);
    }
    if (newSchedules.length > 0) {
      useStore.getState().batchCreateSchedules(newSchedules);
    }
    setBatchModalOpen(false);
  };

  const handleClosureSubmit = () => {
    if (!closureForm.date || !closureForm.reason) return;
    createClosure({
      date: closureForm.date,
      startTime: closureForm.startTime || undefined,
      endTime: closureForm.endTime || undefined,
      reason: closureForm.reason,
      createdBy: currentOperator.id,
    });
    setClosureModalOpen(false);
    setClosureForm({ date: '', startTime: '', endTime: '', reason: '' });
  };

  const toggleTimeSlot = (tsId: string) => {
    setBatchForm((prev) => ({
      ...prev,
      timeSlotIds: prev.timeSlotIds.includes(tsId)
        ? prev.timeSlotIds.filter((id) => id !== tsId)
        : [...prev.timeSlotIds, tsId],
    }));
  };

  const getScheduleForCell = (date: string, timeSlotId: string) => {
    return filteredSchedules.find((s) => s.date === date && s.timeSlotId === timeSlotId);
  };

  const getDoctorColor = (doctorId: string) => {
    const idx = doctors.findIndex((d) => d.id === doctorId);
    return doctorColors[idx % doctorColors.length];
  };

  const isClosureDay = (date: string) => weekClosures.some((c) => c.date === date);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-zinc-900">排班管理</h2>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setBatchModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors"
          >
            <Plus className="w-4 h-4" />
            批量排班
          </button>
          <button
            onClick={() => setClosureModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 text-white rounded-lg text-sm font-medium hover:bg-amber-600 transition-colors"
          >
            <Store className="w-4 h-4" />
            临时关店
          </button>
        </div>
      </div>

      <div className="flex gap-6">
        <div className="w-48 shrink-0 bg-white rounded-lg border border-zinc-200 p-4">
          <h3 className="text-sm font-medium text-zinc-700 mb-3">医生/技师</h3>
          <div className="space-y-2">
            {doctors.map((doctor) => (
              <label key={doctor.id} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedDoctors.includes(doctor.id)}
                  onChange={() => toggleDoctor(doctor.id)}
                  className="rounded border-zinc-300 text-primary focus:ring-primary"
                />
                <span className="text-sm text-zinc-700">{doctor.name}</span>
                {!doctor.isActive && <span className="text-xs text-zinc-400">(停用)</span>}
              </label>
            ))}
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <button onClick={handlePrevWeek} className="p-1 rounded hover:bg-zinc-100">
                <ChevronLeft className="w-5 h-5 text-zinc-600" />
              </button>
              <span className="text-sm font-medium text-zinc-700">
                {formatDate(weekDates[0])} ~ {formatDate(weekDates[6])}
              </span>
              <button onClick={handleNextWeek} className="p-1 rounded hover:bg-zinc-100">
                <ChevronRight className="w-5 h-5 text-zinc-600" />
              </button>
            </div>
            <button
              onClick={() => setBaseDate(new Date())}
              className="text-sm text-primary hover:text-primary-dark transition-colors"
            >
              回到本周
            </button>
          </div>

          <div className="bg-white rounded-lg border border-zinc-200 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200">
                  <th className="text-left px-3 py-2 text-zinc-500 font-medium w-28 bg-zinc-50">时段</th>
                  {weekDates.map((date, i) => (
                    <th key={i} className={`text-left px-3 py-2 text-zinc-500 font-medium bg-zinc-50 ${isClosureDay(formatDate(date)) ? 'bg-red-50' : ''}`}>
                      <div>{weekDayNames[i]}</div>
                      <div className="text-xs text-zinc-400">{formatDate(date).slice(5)}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {timeSlots.map((slot) => (
                  <tr key={slot.id} className="border-b border-zinc-100 last:border-0">
                    <td className="px-3 py-2 text-zinc-600 bg-zinc-50/50 text-xs">{slot.label}</td>
                    {weekDates.map((date, i) => {
                      const dateStr = formatDate(date);
                      const schedule = getScheduleForCell(dateStr, slot.id);
                      const isClosed = isClosureDay(dateStr);
                      return (
                        <td
                          key={i}
                          className={`px-2 py-1.5 ${isClosed ? 'bg-red-50' : ''}`}
                          onClick={() => !isClosed && handleCellClick(dateStr, slot.id)}
                        >
                          {isClosed ? (
                            <span className="text-xs text-red-400">关店</span>
                          ) : schedule ? (
                            <div className={`text-xs px-2 py-1 rounded ${getDoctorColor(schedule.doctorId)}`}>
                              {doctors.find((d) => d.id === schedule.doctorId)?.name || '未知'}
                            </div>
                          ) : (
                            <div className="text-xs text-zinc-300 cursor-pointer hover:text-primary transition-colors">+</div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {weekClosures.length > 0 && (
        <div className="bg-white rounded-lg border border-zinc-200 p-5">
          <h3 className="text-sm font-medium text-zinc-900 mb-3">本周关店记录</h3>
          <div className="space-y-2">
            {weekClosures.map((closure) => (
              <div key={closure.id} className="flex items-center justify-between py-2 border-b border-zinc-100 last:border-0">
                <div className="flex items-center gap-3">
                  <span className="text-sm text-zinc-700">{closure.date}</span>
                  {closure.startTime && closure.endTime && (
                    <span className="text-xs text-zinc-500">{closure.startTime} - {closure.endTime}</span>
                  )}
                </div>
                <span className="text-sm text-red-500">{closure.reason}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <Modal isOpen={cellModalOpen} onClose={() => setCellModalOpen(false)} title="添加排班">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">医生</label>
            <select
              value={cellForm.doctorId}
              onChange={(e) => setCellForm((prev) => ({ ...prev, doctorId: e.target.value }))}
              className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              {doctors.filter((d) => d.isActive).map((d) => (
                <option key={d.id} value={d.id}>{d.name} - {d.title}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">班次</label>
            <select
              value={cellForm.shiftType}
              onChange={(e) => setCellForm((prev) => ({ ...prev, shiftType: e.target.value as ShiftType }))}
              className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              <option value="morning">上午</option>
              <option value="afternoon">下午</option>
              <option value="full_day">全天</option>
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setCellModalOpen(false)} className="px-4 py-2 text-sm text-zinc-600 hover:text-zinc-800">
              取消
            </button>
            <button onClick={handleCellSubmit} className="px-4 py-2 bg-primary text-white rounded-lg text-sm hover:bg-primary-dark transition-colors">
              确认
            </button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={batchModalOpen} onClose={() => setBatchModalOpen(false)} title="批量排班" maxWidth="max-w-xl">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">医生</label>
            <select
              value={batchForm.doctorId}
              onChange={(e) => setBatchForm((prev) => ({ ...prev, doctorId: e.target.value }))}
              className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              <option value="">请选择医生</option>
              {doctors.filter((d) => d.isActive).map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">日期范围</label>
            <input
              type="text"
              placeholder="格式: 2024-01-01~2024-01-07"
              value={batchForm.dateRange}
              onChange={(e) => setBatchForm((prev) => ({ ...prev, dateRange: e.target.value }))}
              className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">班次</label>
            <select
              value={batchForm.shiftType}
              onChange={(e) => setBatchForm((prev) => ({ ...prev, shiftType: e.target.value as ShiftType }))}
              className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              <option value="morning">上午</option>
              <option value="afternoon">下午</option>
              <option value="full_day">全天</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">时段（多选）</label>
            <div className="grid grid-cols-5 gap-2">
              {timeSlots.map((ts) => (
                <label key={ts.id} className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={batchForm.timeSlotIds.includes(ts.id)}
                    onChange={() => toggleTimeSlot(ts.id)}
                    className="rounded border-zinc-300 text-primary focus:ring-primary"
                  />
                  <span className="text-xs text-zinc-600">{ts.label}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setBatchModalOpen(false)} className="px-4 py-2 text-sm text-zinc-600 hover:text-zinc-800">
              取消
            </button>
            <button onClick={handleBatchSubmit} className="px-4 py-2 bg-primary text-white rounded-lg text-sm hover:bg-primary-dark transition-colors">
              确认排班
            </button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={closureModalOpen} onClose={() => setClosureModalOpen(false)} title="临时关店">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">关店日期</label>
            <input
              type="date"
              value={closureForm.date}
              onChange={(e) => setClosureForm((prev) => ({ ...prev, date: e.target.value }))}
              className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">开始时间（可选）</label>
              <input
                type="time"
                value={closureForm.startTime}
                onChange={(e) => setClosureForm((prev) => ({ ...prev, startTime: e.target.value }))}
                className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">结束时间（可选）</label>
              <input
                type="time"
                value={closureForm.endTime}
                onChange={(e) => setClosureForm((prev) => ({ ...prev, endTime: e.target.value }))}
                className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">关店原因</label>
            <textarea
              value={closureForm.reason}
              onChange={(e) => setClosureForm((prev) => ({ ...prev, reason: e.target.value }))}
              rows={3}
              className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
              placeholder="请输入关店原因"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setClosureModalOpen(false)} className="px-4 py-2 text-sm text-zinc-600 hover:text-zinc-800">
              取消
            </button>
            <button onClick={handleClosureSubmit} className="px-4 py-2 bg-amber-500 text-white rounded-lg text-sm hover:bg-amber-600 transition-colors">
              确认关店
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
