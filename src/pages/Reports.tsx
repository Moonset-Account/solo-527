import { useState, useEffect, useCallback } from 'react';
import { Download, ArrowUpDown } from 'lucide-react';
import { getOverdueDetails, getMismatches, getLastActions, getOverdueExportUrl, getMismatchExportUrl } from '@/api/reports';
import type { OverdueDetail, MismatchRecord } from '@/types';

type TabKey = 'overdue' | 'mismatch' | 'actions';

interface LastAction {
  reminder_id: number;
  reconciliation_id: number;
  project_name: string;
  assignee_name: string;
  status: string;
  handled_at: string | null;
  escalation_level: number;
}

const tabs: { key: TabKey; label: string }[] = [
  { key: 'overdue', label: '逾期金额明细' },
  { key: 'mismatch', label: '流水不匹配' },
  { key: 'actions', label: '最后处理记录' },
];

function getOverdueHeatColor(days: number): string {
  if (days < 30) return 'bg-blue-100 text-blue-700';
  if (days < 60) return 'bg-amber-100 text-amber-700';
  return 'bg-red-100 text-red-700';
}

type SortField = 'project_name' | 'client_name' | 'overdue_days' | 'difference_amount' | 'assignee_name';
type SortDir = 'asc' | 'desc';

export default function Reports() {
  const [activeTab, setActiveTab] = useState<TabKey>('overdue');
  const [overdueData, setOverdueData] = useState<OverdueDetail[]>([]);
  const [mismatchData, setMismatchData] = useState<MismatchRecord[]>([]);
  const [actionData, setActionData] = useState<LastAction[]>([]);
  const [loading, setLoading] = useState(false);
  const [sortField, setSortField] = useState<SortField>('overdue_days');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const fetchOverdue = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getOverdueDetails();
      setOverdueData(res.data);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchMismatch = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getMismatches();
      setMismatchData(res.data);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchActions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getLastActions();
      setActionData(res.data as LastAction[]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'overdue') fetchOverdue();
    else if (activeTab === 'mismatch') fetchMismatch();
    else fetchActions();
  }, [activeTab, fetchOverdue, fetchMismatch, fetchActions]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const sortedOverdue = [...overdueData].sort((a, b) => {
    const va = a[sortField];
    const vb = b[sortField];
    if (typeof va === 'number' && typeof vb === 'number') {
      return sortDir === 'asc' ? va - vb : vb - va;
    }
    const sa = String(va);
    const sb = String(vb);
    return sortDir === 'asc' ? sa.localeCompare(sb) : sb.localeCompare(sa);
  });

  const SortHeader = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <th
      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700 select-none"
      onClick={() => toggleSort(field)}
    >
      <span className="inline-flex items-center gap-1">
        {children}
        <ArrowUpDown className="w-3 h-3" />
      </span>
    </th>
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">明细报表</h1>
      </div>

      <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
              activeTab === tab.key
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">加载中...</div>
      ) : (
        <>
          {activeTab === 'overdue' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="flex justify-end px-4 pt-4">
                <a
                  href={getOverdueExportUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-amber-700 bg-amber-50 rounded-lg hover:bg-amber-100 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  导出Excel
                </a>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <SortHeader field="project_name">项目</SortHeader>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">客户</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">逾期金额</th>
                      <SortHeader field="overdue_days">逾期天数</SortHeader>
                      <SortHeader field="assignee_name">负责人</SortHeader>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">最后操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {sortedOverdue.map((row) => (
                      <tr key={row.id} className="hover:bg-gray-50/50">
                        <td className="px-4 py-3 text-sm text-gray-900">{row.project_name}</td>
                        <td className="px-4 py-3 text-sm text-gray-500">{row.client_name}</td>
                        <td className="px-4 py-3 text-sm text-gray-900 font-medium">
                          ¥{row.difference_amount.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getOverdueHeatColor(row.overdue_days)}`}>
                            {row.overdue_days}天
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">{row.assignee_name}</td>
                        <td className="px-4 py-3 text-sm text-gray-400">{row.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'mismatch' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="flex justify-end px-4 pt-4">
                <a
                  href={getMismatchExportUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-amber-700 bg-amber-50 rounded-lg hover:bg-amber-100 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  导出Excel
                </a>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">对账单ID</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">项目</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">类型</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">系统值</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">实际值</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">差异</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {mismatchData.map((row) => (
                      <tr key={row.id} className="hover:bg-gray-50/50">
                        <td className="px-4 py-3 text-sm text-gray-900">#{row.reconciliation_id}</td>
                        <td className="px-4 py-3 text-sm text-gray-500">{row.project_name}</td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700">
                            {row.item_type}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 font-mono">{row.system_value}</td>
                        <td className="px-4 py-3 text-sm text-gray-900 font-mono">{row.uploaded_value}</td>
                        <td className="px-4 py-3 text-sm text-red-600 font-medium font-mono">
                          {row.system_value !== row.uploaded_value && '✕'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'actions' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">项目</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">客户</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">最后操作</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作时间</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {actionData.map((row, idx) => (
                      <tr key={idx} className="hover:bg-gray-50/50">
                        <td className="px-4 py-3 text-sm text-gray-900">{row.project_name}</td>
                        <td className="px-4 py-3 text-sm text-gray-500">{row.assignee_name}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            row.status === 'handled' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                          }`}>
                            {row.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-400">
                          {row.handled_at ? new Date(row.handled_at).toLocaleString('zh-CN') : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
