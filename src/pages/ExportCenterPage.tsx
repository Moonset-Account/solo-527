import { useEffect, useState } from 'react';
import { Download, FileDown } from 'lucide-react';
import { useExportStore } from '@/store/export.store';
import DataTable from '@/components/DataTable';

const dataTypeLabels: Record<string, string> = {
  tickets: '工单',
  assets: '资产',
  'config-items': '配置项',
  'audit-logs': '审计日志',
};

export default function ExportCenterPage() {
  const { records, total, loading, fetchExports, triggerExport, downloadExport } = useExportStore();
  const [page, setPage] = useState(1);
  const [exportType, setExportType] = useState('tickets');
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    fetchExports({ page, limit: 10 });
  }, [page, fetchExports]);

  const handleTriggerExport = async () => {
    setExporting(true);
    try {
      await triggerExport({ dataType: exportType });
      fetchExports({ page, limit: 10 });
    } catch {
      // error handled in store
    }
    setExporting(false);
  };

  const columns = [
    { key: 'createdAt', title: '导出时间', render: (row: Record<string, unknown>) =>
      new Date(row.createdAt as string).toLocaleString('zh-CN')
    },
    { key: 'exporterName', title: '导出人' },
    { key: 'dataType', title: '数据类型', render: (row: Record<string, unknown>) =>
      dataTypeLabels[row.dataType as string] || row.dataType
    },
    { key: 'querySummary', title: '查询口径摘要', render: (row: Record<string, unknown>) =>
      <span className="text-sm text-[var(--color-text-secondary)] max-w-xs truncate block">{row.querySummary as string}</span>
    },
    { key: 'recordCount', title: '数据条数' },
    { key: 'actions', title: '操作', render: (row: Record<string, unknown>) => (
      <button
        onClick={() => downloadExport(row.id as number)}
        className="text-[var(--color-primary)] hover:underline text-sm flex items-center gap-1"
      >
        <Download className="w-4 h-4" />
        下载
      </button>
    )},
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold" style={{ fontFamily: 'var(--font-heading)' }}>导出中心</h2>

      <div className="bg-white rounded-xl border border-[var(--color-border)] card-shadow p-6">
        <h3 className="font-semibold mb-4" style={{ fontFamily: 'var(--font-heading)' }}>触发导出</h3>
        <div className="flex items-end gap-4">
          <div className="flex-1 max-w-xs">
            <label className="block text-sm font-medium mb-1.5">数据类型</label>
            <select className="select-field" value={exportType} onChange={(e) => setExportType(e.target.value)}>
              <option value="tickets">工单</option>
              <option value="assets">资产</option>
              <option value="config-items">配置项</option>
              <option value="audit-logs">审计日志</option>
            </select>
          </div>
          <button
            onClick={handleTriggerExport}
            disabled={exporting}
            className="btn-primary flex items-center gap-2"
          >
            <FileDown className="w-4 h-4" />
            {exporting ? '导出中...' : '导出'}
          </button>
        </div>
      </div>

      <div>
        <h3 className="font-semibold mb-4" style={{ fontFamily: 'var(--font-heading)' }}>导出历史</h3>
        <DataTable
          columns={columns}
          data={records as unknown as Record<string, unknown>[]}
          total={total}
          page={page}
          pageSize={10}
          onPageChange={setPage}
          loading={loading}
          emptyText="暂无导出记录"
        />
      </div>
    </div>
  );
}
