import { useMemo, useState } from 'react';
import { ChartCard } from './BaseChart';
import type { SupplierResponse } from '@shared/types';
import { ArrowUp, ArrowDown } from 'lucide-react';

interface Props {
  data: SupplierResponse | null;
  loading: boolean;
}

type SortField = 'compositeScore' | 'lossRate' | 'onTimeDeliveryRate' | 'qualityIssueRate';
type SortOrder = 'asc' | 'desc';

export default function SupplierRanking({ data, loading }: Props) {
  const [sortField, setSortField] = useState<SortField>('compositeScore');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  const sortedRankings = useMemo(() => {
    if (!data) return [];
    return [...data.rankings].sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];
      return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
    });
  }, [data, sortField, sortOrder]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder(field === 'lossRate' || field === 'qualityIssueRate' ? 'asc' : 'desc');
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-fresh-green';
    if (score >= 60) return 'text-warning-orange';
    return 'text-loss-red';
  };

  const getBarWidth = (value: number, max: number) => {
    return `${Math.max(5, (value / max) * 100)}%`;
  };

  const maxSupplyQty = useMemo(() => {
    if (!sortedRankings.length) return 1;
    return Math.max(...sortedRankings.map((r) => r.totalSupplyQty));
  }, [sortedRankings]);

  const SortHeader = ({ field, label }: { field: SortField; label: string }) => (
    <th
      className="px-3 py-2.5 text-xs font-medium text-slate-400 cursor-pointer hover:text-white transition-colors select-none"
      onClick={() => handleSort(field)}
    >
      <div className="flex items-center gap-1">
        {label}
        {sortField === field && (
          sortOrder === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
        )}
      </div>
    </th>
  );

  return (
    <ChartCard title="供应商综合排行" subtitle="按综合评分、损耗率、准时率等多维度排序">
      {loading ? (
        <div className="h-[300px] flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-slate-600 border-t-fresh-green rounded-full animate-spin" />
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700/50">
                <th className="px-3 py-2.5 text-xs font-medium text-slate-400 text-left">#</th>
                <th className="px-3 py-2.5 text-xs font-medium text-slate-400 text-left">供应商</th>
                <SortHeader field="compositeScore" label="综合评分" />
                <SortHeader field="lossRate" label="损耗率" />
                <SortHeader field="onTimeDeliveryRate" label="准时率" />
                <SortHeader field="qualityIssueRate" label="品质异常率" />
                <th className="px-3 py-2.5 text-xs font-medium text-slate-400 text-left">供货量</th>
              </tr>
            </thead>
            <tbody>
              {sortedRankings.slice(0, 8).map((supplier, index) => (
                <tr 
                  key={supplier.supplierId} 
                  className="border-b border-slate-700/30 hover:bg-slate-700/20 transition-colors"
                >
                  <td className="px-3 py-2.5">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      index < 3 
                        ? 'bg-gradient-to-br from-amber-500 to-orange-600 text-white' 
                        : 'bg-slate-700 text-slate-400'
                    }`}>
                      {index + 1}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 font-medium text-white">{supplier.supplierName}</td>
                  <td className="px-3 py-2.5">
                    <span className={`font-mono font-bold ${getScoreColor(supplier.compositeScore)}`}>
                      {supplier.compositeScore}
                    </span>
                  </td>
                  <td className="px-3 py-2.5">
                    <span className="text-loss-red font-mono">{supplier.lossRate}%</span>
                  </td>
                  <td className="px-3 py-2.5">
                    <span className="text-fresh-green font-mono">{supplier.onTimeDeliveryRate}%</span>
                  </td>
                  <td className="px-3 py-2.5">
                    <span className="text-warning-orange font-mono">{supplier.qualityIssueRate}%</span>
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full transition-all duration-500"
                          style={{ width: getBarWidth(supplier.totalSupplyQty, maxSupplyQty) }}
                        />
                      </div>
                      <span className="text-xs text-slate-400 font-mono w-16 text-right">
                        {supplier.totalSupplyQty}
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </ChartCard>
  );
}
