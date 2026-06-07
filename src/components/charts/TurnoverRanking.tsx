import { useMemo, useState } from 'react';
import { useFilter } from '../../context/FilterContext';
import { mockTurnover } from '../../data/mockData';
import { InfoTooltip } from '../common/InfoTooltip';
import { EmptyState } from '../common/EmptyState';
import { TrendingUp, TrendingDown, Minus, ArrowUpDown } from 'lucide-react';

type SortField = 'turnoverDays' | 'turnoverRate' | 'totalOutbound' | 'avgInventory';
type SortOrder = 'asc' | 'desc';

export function TurnoverRanking() {
  const { filters, setSelectedSKUId, selectedSKUId } = useFilter();
  const [sortField, setSortField] = useState<SortField>('turnoverDays');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  const filteredTurnover = useMemo(() => {
    let data = [...mockTurnover];

    if (filters.skuIds.length > 0) {
      data = data.filter(t => filters.skuIds.includes(t.skuId));
    }

    if (filters.categories.length > 0) {
      data = data.filter(t => filters.categories.includes(t.category));
    }

    return data.sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];
      return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
    });
  }, [filters, sortField, sortOrder]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder(field === 'turnoverDays' ? 'asc' : 'desc');
    }
  };

  const getTurnoverLevel = (days: number) => {
    if (days <= 30) return { label: '优秀', class: 'badge-success', icon: TrendingUp };
    if (days <= 60) return { label: '良好', class: 'badge-info', icon: TrendingUp };
    if (days <= 90) return { label: '一般', class: 'badge-warning', icon: Minus };
    return { label: '较差', class: 'badge-danger', icon: TrendingDown };
  };

  const SortHeader = ({ field, label }: { field: SortField; label: string }) => (
    <th
      className="cursor-pointer hover:bg-slate-100 transition-colors"
      onClick={() => handleSort(field)}
    >
      <div className="flex items-center gap-1">
        {label}
        <ArrowUpDown className={`w-3 h-3 ${sortField === field ? 'text-primary-500' : 'text-slate-400'}`} />
      </div>
    </th>
  );

  if (filteredTurnover.length === 0) {
    return (
      <div className="card h-full">
        <div className="card-header">
          <div className="flex items-center gap-2">
            <h3 className="card-title">SKU 周转排行</h3>
            <InfoTooltip
              title="口径说明"
              content="周转率 = 统计周期出库量 / 平均库存量；周转天数 = 统计周期天数 / 周转率。周转天数越短越好。"
            />
          </div>
        </div>
        <div className="card-body h-80">
          <EmptyState type="no-result" />
        </div>
      </div>
    );
  }

  return (
    <div className="card h-full flex flex-col">
      <div className="card-header">
        <div className="flex items-center gap-2">
          <h3 className="card-title">SKU 周转排行</h3>
          <InfoTooltip
            title="口径说明"
            content="周转率 = 统计周期出库量 / 平均库存量；周转天数 = 统计周期天数 / 周转率。周转天数越短越好。"
          />
        </div>
        <span className="text-xs text-slate-500">
          统计周期: {filters.timeWindow === '7d' ? '近7天' : filters.timeWindow === '30d' ? '近30天' : filters.timeWindow === '90d' ? '近90天' : '自定义'}
        </span>
      </div>

      <div className="flex-1 overflow-auto">
        <table className="data-table">
          <thead className="sticky top-0">
            <tr>
              <th className="w-12">排名</th>
              <th>商品名称</th>
              <SortHeader field="turnoverDays" label="周转天数" />
              <SortHeader field="turnoverRate" label="周转率" />
              <SortHeader field="totalOutbound" label="出库量" />
              <SortHeader field="avgInventory" label="平均库存" />
              <th>状态</th>
            </tr>
          </thead>
          <tbody>
            {filteredTurnover.map((item, index) => {
              const level = getTurnoverLevel(item.turnoverDays);
              const Icon = level.icon;
              const isSelected = selectedSKUId === item.skuId;
              return (
                <tr
                  key={item.skuId}
                  className={`cursor-pointer transition-colors ${isSelected ? 'bg-primary-50' : ''}`}
                  onClick={() => setSelectedSKUId(isSelected ? null : item.skuId)}
                >
                  <td>
                    <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium ${
                      index < 3 ? 'bg-primary-500 text-white' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {index + 1}
                    </span>
                  </td>
                  <td>
                    <div>
                      <p className="font-medium text-slate-800">{item.skuName}</p>
                      <p className="text-xs text-slate-500">{item.category}</p>
                    </div>
                  </td>
                  <td>
                    <span className={`font-semibold ${item.turnoverDays > 90 ? 'text-danger-600' : item.turnoverDays > 60 ? 'text-warning-600' : 'text-success-600'}`}>
                      {item.turnoverDays}天
                    </span>
                  </td>
                  <td className="font-mono">{item.turnoverRate}</td>
                  <td>{item.totalOutbound.toLocaleString()}</td>
                  <td>{item.avgInventory.toLocaleString()}</td>
                  <td>
                    <span className={`badge ${level.class} flex items-center gap-1 w-fit`}>
                      <Icon className="w-3 h-3" />
                      {level.label}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="px-5 py-3 bg-slate-50 border-t border-slate-100">
        <div className="explanation-box">
          <p className="font-medium text-slate-600 mb-1">排行说明：</p>
          <ul className="text-slate-500 space-y-0.5">
            <li>• 点击行可联动筛选该 SKU，查看其各批次明细</li>
            <li>• 周转天数参考标准：食品类≤45天，用品类≤90天</li>
            <li>• 周转率低可能是采购过量或销售不及预期</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
