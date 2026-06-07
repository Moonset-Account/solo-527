import { useEffect, useState } from 'react';
import { api } from '@/api';
import type { SupplierChangeEvent, BatchRecallEvent } from '@/types';
import { Download, FileSpreadsheet } from 'lucide-react';
import { useStore } from '@/store/useStore';

export default function EventPanel() {
  const [supplierChanges, setSupplierChanges] = useState<SupplierChangeEvent[]>([]);
  const [batchRecalls, setBatchRecalls] = useState<BatchRecallEvent[]>([]);
  const { filters } = useStore();

  useEffect(() => {
    api.getSupplierChanges().then(setSupplierChanges);
    api.getBatchRecalls().then(setBatchRecalls);
  }, []);

  const handleExport = (format: string) => {
    api.exportReport(filters, format);
  };

  return (
    <div className="bg-white border border-zinc-200 rounded-xl shadow-sm p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-zinc-800">事件标记与报表</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleExport('csv')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-teal-700 border border-teal-200 rounded-lg hover:bg-teal-50 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            导出 CSV
          </button>
          <button
            onClick={() => handleExport('excel')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-teal-700 border border-teal-200 rounded-lg hover:bg-teal-50 transition-colors"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            导出 Excel
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h4 className="text-xs font-medium text-zinc-600 mb-2 flex items-center gap-1.5">
            <span className="inline-block w-2.5 h-2.5 bg-amber-600 rotate-45" />
            供应商更换记录
          </h4>
          {supplierChanges.length === 0 ? (
            <p className="text-xs text-zinc-400">暂无记录</p>
          ) : (
            <div className="space-y-2 max-h-[200px] overflow-y-auto">
              {supplierChanges.map((sc) => (
                <div
                  key={sc.id}
                  className="flex items-start gap-2 p-2 rounded-lg bg-amber-50/50 border border-amber-100"
                >
                  <span className="inline-block w-2 h-2 bg-amber-600 rotate-45 mt-1 shrink-0" />
                  <div className="text-xs">
                    <div className="text-zinc-700 font-medium">{sc.window_name}</div>
                    <div className="text-zinc-500">
                      {sc.change_date} | {sc.old_supplier} → {sc.new_supplier}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <h4 className="text-xs font-medium text-zinc-600 mb-2 flex items-center gap-1.5">
            <span className="inline-block w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-b-[8px] border-b-violet-600" />
            食材批次召回记录
          </h4>
          {batchRecalls.length === 0 ? (
            <p className="text-xs text-zinc-400">暂无记录</p>
          ) : (
            <div className="space-y-2 max-h-[200px] overflow-y-auto">
              {batchRecalls.map((br) => (
                <div
                  key={br.id}
                  className="flex items-start gap-2 p-2 rounded-lg bg-violet-50/50 border border-violet-100"
                >
                  <span className="inline-block w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-b-[7px] border-b-violet-600 mt-1 shrink-0" />
                  <div className="text-xs">
                    <div className="text-zinc-700 font-medium">
                      批次 {br.batch_id} - {br.ingredient_name}
                    </div>
                    <div className="text-zinc-500">召回日期：{br.recall_date}</div>
                    <div className="text-violet-600 mt-0.5">
                      受影响菜品：{br.affected_dishes.map((d) => d.name).join('、')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
