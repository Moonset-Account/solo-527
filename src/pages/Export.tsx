import { useState, useMemo } from 'react';
import { Download, FileDown, ChevronDown, ChevronUp } from 'lucide-react';
import { useStore } from '@/store';
import type { AppointmentStatus } from '../../shared/types';

const statusOptions: { value: AppointmentStatus; label: string }[] = [
  { value: 'pending', label: '待确认' },
  { value: 'confirmed', label: '已确认' },
  { value: 'arrived', label: '已到店' },
  { value: 'completed', label: '已完成' },
  { value: 'no_show', label: '爽约' },
  { value: 'cancelled', label: '已取消' },
];

const dataTypes = [
  { key: 'schedule', label: '排班数据' },
  { key: 'appointment', label: '预约数据' },
  { key: 'noshow', label: '爽约数据' },
  { key: 'service', label: '服务项目数据' },
];

export default function Export() {
  const { appointments, closures, doctors, exportRecords, createExport, currentOperator } = useStore();
  const [dateRange, setDateRange] = useState('');
  const [selectedDoctors, setSelectedDoctors] = useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [selectedDataTypes, setSelectedDataTypes] = useState<string[]>(['appointment']);
  const [expandedRecord, setExpandedRecord] = useState<string | null>(null);

  const preview = useMemo(() => {
    let filtered = [...appointments];
    if (dateRange) {
      const [start, end] = dateRange.split('~');
      if (start && end) {
        filtered = filtered.filter((a) => a.date >= start && a.date <= end);
      }
    }
    if (selectedDoctors.length > 0) {
      filtered = filtered.filter((a) => selectedDoctors.includes(a.doctorId));
    }
    if (selectedStatuses.length > 0) {
      filtered = filtered.filter((a) => selectedStatuses.includes(a.status));
    }
    const arrived = filtered.filter((a) => ['arrived', 'completed'].includes(a.status));
    const arrivalRate = filtered.length > 0 ? arrived.length / filtered.length : 0;

    let closureCount = 0;
    if (dateRange) {
      const [start, end] = dateRange.split('~');
      if (start && end) {
        closureCount = closures.filter((c) => c.date >= start && c.date <= end).length;
      }
    }

    const lastChange = filtered.length > 0
      ? filtered.reduce((latest, a) => (a.updatedAt > latest ? a.updatedAt : latest), filtered[0].updatedAt)
      : '-';

    return {
      recordCount: filtered.length,
      arrivalRate,
      closureCount,
      lastChange,
    };
  }, [appointments, closures, dateRange, selectedDoctors, selectedStatuses]);

  const toggleDoctor = (id: string) => {
    setSelectedDoctors((prev) =>
      prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id]
    );
  };

  const toggleStatus = (status: string) => {
    setSelectedStatuses((prev) =>
      prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status]
    );
  };

  const toggleDataType = (key: string) => {
    setSelectedDataTypes((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const handleExport = () => {
    createExport({
      dateRange,
      doctors: selectedDoctors,
      statuses: selectedStatuses,
      dataTypes: selectedDataTypes,
      operatorId: currentOperator.id,
      operatorName: currentOperator.name,
      arrivalRate: preview.arrivalRate,
      closureCount: preview.closureCount,
    });
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-zinc-900">数据导出</h2>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 bg-white rounded-lg border border-zinc-200 p-5 space-y-5">
          <h3 className="text-sm font-medium text-zinc-900">导出配置</h3>

          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">日期范围</label>
            <input
              type="text"
              placeholder="格式: 2024-01-01~2024-01-31"
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-2">医生筛选</label>
            <div className="flex flex-wrap gap-3">
              {doctors.map((d) => (
                <label key={d.id} className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedDoctors.includes(d.id)}
                    onChange={() => toggleDoctor(d.id)}
                    className="rounded border-zinc-300 text-primary focus:ring-primary"
                  />
                  <span className="text-sm text-zinc-600">{d.name}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-2">状态筛选</label>
            <div className="flex flex-wrap gap-3">
              {statusOptions.map((s) => (
                <label key={s.value} className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedStatuses.includes(s.value)}
                    onChange={() => toggleStatus(s.value)}
                    className="rounded border-zinc-300 text-primary focus:ring-primary"
                  />
                  <span className="text-sm text-zinc-600">{s.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-2">数据类型</label>
            <div className="flex flex-wrap gap-3">
              {dataTypes.map((dt) => (
                <label key={dt.key} className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedDataTypes.includes(dt.key)}
                    onChange={() => toggleDataType(dt.key)}
                    className="rounded border-zinc-300 text-primary focus:ring-primary"
                  />
                  <span className="text-sm text-zinc-600">{dt.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={handleExport}
              className="flex items-center gap-1.5 px-5 py-2.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors"
            >
              <Download className="w-4 h-4" />
              导出
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-zinc-200 p-5 space-y-4">
          <h3 className="text-sm font-medium text-zinc-900">导出预览</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-zinc-100">
              <span className="text-sm text-zinc-500">预计记录数</span>
              <span className="text-sm font-medium text-zinc-900">{preview.recordCount}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-zinc-100">
              <span className="text-sm text-zinc-500">到店率</span>
              <span className="text-sm font-medium text-primary">{(preview.arrivalRate * 100).toFixed(1)}%</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-zinc-100">
              <span className="text-sm text-zinc-500">临时关店次数</span>
              <span className="text-sm font-medium text-amber-500">{preview.closureCount}</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-sm text-zinc-500">最近变更时间</span>
              <span className="text-sm font-medium text-zinc-700">{preview.lastChange}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-zinc-200 p-5">
        <h3 className="text-sm font-medium text-zinc-900 mb-4 flex items-center gap-2">
          <FileDown className="w-4 h-4" />
          导出历史
        </h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-200">
              <th className="text-left py-2 text-zinc-500 font-medium">导出时间</th>
              <th className="text-left py-2 text-zinc-500 font-medium">操作者</th>
              <th className="text-left py-2 text-zinc-500 font-medium">筛选口径</th>
              <th className="text-left py-2 text-zinc-500 font-medium">到店率</th>
              <th className="text-left py-2 text-zinc-500 font-medium">关店数</th>
              <th className="text-left py-2 text-zinc-500 font-medium">下载</th>
            </tr>
          </thead>
          <tbody>
            {exportRecords.map((record) => {
              const isExpanded = expandedRecord === record.id;
              return (
                <tr key={record.id} className="border-b border-zinc-100 last:border-0">
                  <td colSpan={6} className="p-0">
                    <div
                      className="cursor-pointer hover:bg-zinc-50"
                      onClick={() => setExpandedRecord(isExpanded ? null : record.id)}
                    >
                      <div className="flex items-center px-0 py-2">
                        <div className="flex-1 grid grid-cols-6 gap-2 items-center">
                          <span className="text-zinc-700">{new Date(record.generatedAt).toLocaleString()}</span>
                          <span className="text-zinc-600">{record.operatorName}</span>
                          <span className="text-zinc-600 text-xs truncate">{JSON.stringify(record.filterCriteria).slice(0, 30)}...</span>
                          <span className="text-primary">{(record.arrivalRate * 100).toFixed(1)}%</span>
                          <span className="text-amber-500">{record.closureCount}</span>
                          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                            <a href={record.fileUrl} className="text-primary text-xs hover:underline">下载</a>
                            {isExpanded ? <ChevronUp className="w-3 h-3 text-zinc-400" /> : <ChevronDown className="w-3 h-3 text-zinc-400" />}
                          </div>
                        </div>
                      </div>
                    </div>
                    {isExpanded && (
                      <div className="px-4 py-3 bg-zinc-50 border-t border-zinc-200">
                        <p className="text-xs text-zinc-500 mb-1">完整筛选条件:</p>
                        <pre className="text-xs text-zinc-700 bg-white p-2 rounded border border-zinc-200 overflow-x-auto">
                          {JSON.stringify(record.filterCriteria, null, 2)}
                        </pre>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {exportRecords.length === 0 && (
          <p className="text-center text-zinc-400 py-8 text-sm">暂无导出记录</p>
        )}
      </div>
    </div>
  );
}
