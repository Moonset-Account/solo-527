import { useEffect, useState } from 'react';
import { Download, Filter, Save, RotateCcw, AlertTriangle, Clock, CheckCircle, XCircle } from 'lucide-react';
import { useAppStore } from '@/store';
import { formatDate, formatDuration } from '@/utils/format';
import type { RequestStatus } from '@/types';

const tabList = [
  { key: 'seat', label: '座位利用明细' },
  { key: 'identity', label: '身份审核失败明细' },
  { key: 'processing', label: '处理记录汇总' },
] as const;

type TabKey = typeof tabList[number]['key'];

const buildings = Array.from({ length: 10 }, (_, i) => `${i + 1}号楼`);
const statusOptions: RequestStatus[] = ['pending', 'identity_verifying', 'processing', 'completed', 'rejected'];
const fieldOptions = {
  seat: ['自习室', '总座位', '已占用', '利用率', '平均占用时长'],
  identity: ['申请单号', '学生姓名', '学号', '失败原因', '失败时间', '重试次数'],
  processing: ['申请单号', '报修类型', '提交时间', '完成时间', '处理时长', '是否超时', '处理人'],
};

export default function DetailsExport() {
  const {
    seatUtilization, seatUtilizationLoading, fetchSeatUtilization,
    identityFailures, identityFailuresLoading, fetchIdentityFailures,
    processingRecords, processingRecordsLoading, fetchProcessingRecords,
    exportLoading, exportData,
  } = useAppStore();

  const [tab, setTab] = useState<TabKey>('seat');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedBuildings, setSelectedBuildings] = useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [exportFormat, setExportFormat] = useState<'csv' | 'excel'>('csv');
  const [selectedFields, setSelectedFields] = useState<string[]>(fieldOptions.seat);

  useEffect(() => {
    fetchSeatUtilization();
    fetchIdentityFailures();
    fetchProcessingRecords();
  }, [fetchSeatUtilization, fetchIdentityFailures, fetchProcessingRecords]);

  useEffect(() => {
    setSelectedFields(fieldOptions[tab]);
  }, [tab]);

  const toggleBuilding = (b: string) => {
    setSelectedBuildings((prev) => prev.includes(b) ? prev.filter((x) => x !== b) : [...prev, b]);
  };

  const toggleStatus = (s: string) => {
    setSelectedStatuses((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]);
  };

  const toggleField = (f: string) => {
    setSelectedFields((prev) => prev.includes(f) ? prev.filter((x) => x !== f) : [...prev, f]);
  };

  const saveFilter = () => {
    localStorage.setItem('detail_filter', JSON.stringify({ startDate, endDate, selectedBuildings, selectedStatuses }));
  };

  const loadFilter = () => {
    const saved = localStorage.getItem('detail_filter');
    if (saved) {
      const parsed = JSON.parse(saved);
      setStartDate(parsed.startDate || '');
      setEndDate(parsed.endDate || '');
      setSelectedBuildings(parsed.selectedBuildings || []);
      setSelectedStatuses(parsed.selectedStatuses || []);
    }
  };

  const resetFilter = () => {
    setStartDate('');
    setEndDate('');
    setSelectedBuildings([]);
    setSelectedStatuses([]);
  };

  const handleExport = () => {
    exportData({
      type: tab === 'seat' ? 'seat_utilization' : tab === 'identity' ? 'identity_failure' : 'processing_record',
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      format: exportFormat,
    });
  };

  const completedRecords = processingRecords.filter((r) => r.completedAt);
  const avgDuration = completedRecords.length > 0 ? completedRecords.reduce((s, r) => s + (r.processingDuration || 0), 0) / completedRecords.length : 0;
  const overdueRate = processingRecords.length > 0 ? ((processingRecords.filter((r) => r.isOverdue).length / processingRecords.length) * 100).toFixed(1) : '0.0';
  const completionRate = processingRecords.length > 0 ? ((completedRecords.length / processingRecords.length) * 100).toFixed(1) : '0.0';

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-slate-800">明细导出</h1>

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
          <div>
            <label className="mb-1 block text-xs text-slate-500">楼栋</label>
            <div className="flex flex-wrap gap-1">
              {buildings.slice(0, 5).map((b) => (
                <button key={b} onClick={() => toggleBuilding(b)} className={`rounded px-2 py-1 text-xs ${selectedBuildings.includes(b) ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}>{b}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-500">状态</label>
            <div className="flex flex-wrap gap-1">
              {statusOptions.slice(0, 4).map((s) => (
                <button key={s} onClick={() => toggleStatus(s)} className={`rounded px-2 py-1 text-xs ${selectedStatuses.includes(s) ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}>{s === 'pending' ? '待处理' : s === 'processing' ? '处理中' : s === 'completed' ? '已完成' : '已驳回'}</button>
              ))}
            </div>
          </div>
          <button onClick={saveFilter} className="flex items-center gap-1 rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50">
            <Save size={14} /> 保存筛选方案
          </button>
          <button onClick={loadFilter} className="flex items-center gap-1 rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50">
            <Filter size={14} /> 应用
          </button>
          <button onClick={resetFilter} className="flex items-center gap-1 rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50">
            <RotateCcw size={14} /> 重置
          </button>
        </div>
      </div>

      <div className="mb-4 flex gap-1">
        {tabList.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)} className={`rounded-t-lg px-4 py-2 text-sm font-medium ${tab === t.key ? 'border border-b-0 border-slate-200 bg-white text-blue-600' : 'bg-slate-100 text-slate-500'}`}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="rounded-lg bg-white p-4 shadow-sm">
        {tab === 'seat' && (
          <>
            {seatUtilizationLoading ? (
              <div className="py-8 text-center text-slate-400">加载中...</div>
            ) : seatUtilization.length === 0 ? (
              <div className="py-8 text-center text-slate-400">暂无数据</div>
            ) : (
              <>
                <table className="mb-6 w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 text-left text-xs text-slate-500">
                      <th className="px-4 py-3">自习室</th>
                      <th className="px-4 py-3">总座位</th>
                      <th className="px-4 py-3">已占用</th>
                      <th className="px-4 py-3">利用率</th>
                      <th className="px-4 py-3">平均占用时长</th>
                    </tr>
                  </thead>
                  <tbody>
                    {seatUtilization.map((s) => (
                      <tr key={s.studyRoom} className="border-b border-slate-50">
                        <td className="px-4 py-3 text-slate-700">{s.studyRoom}</td>
                        <td className="px-4 py-3 text-slate-700">{s.totalSeats}</td>
                        <td className="px-4 py-3 text-slate-700">{s.occupiedSeats}</td>
                        <td className="px-4 py-3 text-slate-700">{s.utilizationRate.toFixed(1)}%</td>
                        <td className="px-4 py-3 text-slate-700">{formatDuration(s.averageDuration)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="space-y-2">
                  {seatUtilization.map((s) => (
                    <div key={s.studyRoom} className="flex items-center gap-3">
                      <span className="w-20 text-xs text-slate-600">{s.studyRoom}</span>
                      <div className="flex-1">
                        <div className="h-6 overflow-hidden rounded bg-slate-100">
                          <div className="flex h-full items-center rounded bg-blue-500 px-2 text-xs text-white transition-all" style={{ width: `${Math.max((s.utilizationRate), 2)}%` }}>
                            {s.utilizationRate.toFixed(0)}%
                          </div>
                        </div>
                      </div>
                      <span className="w-16 text-right text-xs text-slate-500">{s.occupiedSeats}/{s.totalSeats}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        )}

        {tab === 'identity' && (
          <>
            {identityFailuresLoading ? (
              <div className="py-8 text-center text-slate-400">加载中...</div>
            ) : identityFailures.length === 0 ? (
              <div className="py-8 text-center text-slate-400">暂无数据</div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-left text-xs text-slate-500">
                    <th className="px-4 py-3">申请单号</th>
                    <th className="px-4 py-3">学生姓名</th>
                    <th className="px-4 py-3">学号</th>
                    <th className="px-4 py-3">失败原因</th>
                    <th className="px-4 py-3">失败时间</th>
                    <th className="px-4 py-3">重试次数</th>
                  </tr>
                </thead>
                <tbody>
                  {identityFailures.map((f) => (
                    <tr key={f.requestId} className="border-b border-slate-50">
                      <td className="px-4 py-3 font-mono text-xs text-slate-600">{f.requestId.slice(0, 8)}...</td>
                      <td className="px-4 py-3 text-slate-700">{f.studentName}</td>
                      <td className="px-4 py-3 font-mono text-xs text-slate-600">{f.studentId}</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-700">{f.failureReason}</span>
                      </td>
                      <td className="px-4 py-3 text-slate-500">{formatDate(f.failedAt)}</td>
                      <td className="px-4 py-3 text-slate-700">{f.retryCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </>
        )}

        {tab === 'processing' && (
          <>
            <div className="mb-4 grid grid-cols-3 gap-4">
              <div className="rounded-lg bg-blue-50 p-3">
                <div className="flex items-center gap-2"><Clock size={16} className="text-blue-600" /><span className="text-xs text-slate-500">平均处理时长</span></div>
                <p className="mt-1 text-lg font-bold text-blue-800">{formatDuration(avgDuration)}</p>
              </div>
              <div className="rounded-lg bg-red-50 p-3">
                <div className="flex items-center gap-2"><XCircle size={16} className="text-red-600" /><span className="text-xs text-slate-500">超时率</span></div>
                <p className="mt-1 text-lg font-bold text-red-800">{overdueRate}%</p>
              </div>
              <div className="rounded-lg bg-green-50 p-3">
                <div className="flex items-center gap-2"><CheckCircle size={16} className="text-green-600" /><span className="text-xs text-slate-500">完结率</span></div>
                <p className="mt-1 text-lg font-bold text-green-800">{completionRate}%</p>
              </div>
            </div>
            {processingRecordsLoading ? (
              <div className="py-8 text-center text-slate-400">加载中...</div>
            ) : processingRecords.length === 0 ? (
              <div className="py-8 text-center text-slate-400">暂无数据</div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-left text-xs text-slate-500">
                    <th className="px-4 py-3">申请单号</th>
                    <th className="px-4 py-3">报修类型</th>
                    <th className="px-4 py-3">提交时间</th>
                    <th className="px-4 py-3">完成时间</th>
                    <th className="px-4 py-3">处理时长</th>
                    <th className="px-4 py-3">是否超时</th>
                    <th className="px-4 py-3">处理人</th>
                  </tr>
                </thead>
                <tbody>
                  {processingRecords.map((r) => (
                    <tr key={r.requestId} className={`border-b border-slate-50 ${r.isOverdue ? 'bg-red-50' : ''}`}>
                      <td className="px-4 py-3 font-mono text-xs text-slate-600">{r.requestId.slice(0, 8)}...</td>
                      <td className="px-4 py-3 text-slate-700">{r.repairType}</td>
                      <td className="px-4 py-3 text-slate-500">{formatDate(r.submittedAt)}</td>
                      <td className="px-4 py-3 text-slate-500">{r.completedAt ? formatDate(r.completedAt) : '-'}</td>
                      <td className="px-4 py-3 text-slate-700">{r.processingDuration ? formatDuration(r.processingDuration) : '-'}</td>
                      <td className="px-4 py-3">
                        {r.isOverdue ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700"><AlertTriangle size={10} />超时</span>
                        ) : (
                          <span className="inline-flex rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">正常</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-700">{r.handler}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </>
        )}
      </div>

      <div className="mt-4 rounded-lg bg-white p-4 shadow-sm">
        <h3 className="mb-3 text-sm font-semibold text-slate-700">导出设置</h3>
        <div className="flex flex-wrap items-start gap-6">
          <div>
            <p className="mb-2 text-xs text-slate-500">导出格式</p>
            <div className="flex gap-3">
              <label className="flex items-center gap-1 text-sm"><input type="radio" name="format" checked={exportFormat === 'csv'} onChange={() => setExportFormat('csv')} className="accent-blue-600" /> CSV</label>
              <label className="flex items-center gap-1 text-sm"><input type="radio" name="format" checked={exportFormat === 'excel'} onChange={() => setExportFormat('excel')} className="accent-blue-600" /> Excel</label>
            </div>
          </div>
          <div>
            <p className="mb-2 text-xs text-slate-500">导出字段</p>
            <div className="flex flex-wrap gap-2">
              {fieldOptions[tab].map((f) => (
                <label key={f} className="flex items-center gap-1 text-sm">
                  <input type="checkbox" checked={selectedFields.includes(f)} onChange={() => toggleField(f)} className="accent-blue-600" /> {f}
                </label>
              ))}
            </div>
          </div>
          <div className="flex items-end">
            <button onClick={handleExport} disabled={exportLoading} className="flex items-center gap-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">
              <Download size={16} /> {exportLoading ? '导出中...' : '导出'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
