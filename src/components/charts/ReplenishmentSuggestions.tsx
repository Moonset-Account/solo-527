import { useMemo } from 'react';
import { useFilter } from '../../context/FilterContext';
import { mockReplenishment } from '../../data/mockData';
import { InfoTooltip } from '../common/InfoTooltip';
import { EmptyState } from '../common/EmptyState';
import { AlertCircle, AlertTriangle, CheckCircle, ShoppingCart, Package } from 'lucide-react';

export function ReplenishmentSuggestions() {
  const { filters, setSelectedSKUId, selectedSKUId } = useFilter();

  const filteredSuggestions = useMemo(() => {
    let data = [...mockReplenishment];

    if (filters.skuIds.length > 0) {
      data = data.filter(s => filters.skuIds.includes(s.skuId));
    }

    if (filters.categories.length > 0) {
      data = data.filter(s => filters.categories.includes(s.category));
    }

    if (filters.supplierIds.length > 0) {
      data = data.filter(s => filters.supplierIds.includes(s.supplierId));
    }

    return data;
  }, [filters]);

  const stats = useMemo(() => {
    const high = filteredSuggestions.filter(s => s.priority === 'high');
    const medium = filteredSuggestions.filter(s => s.priority === 'medium');
    const low = filteredSuggestions.filter(s => s.priority === 'low');
    const totalSuggestedQty = filteredSuggestions.reduce((sum, s) => sum + s.suggestedQty, 0);
    const totalValue = Math.round(totalSuggestedQty * 85);
    return { high, medium, low, totalSuggestedQty, totalValue };
  }, [filteredSuggestions]);

  const getPriorityConfig = (priority: string) => {
    switch (priority) {
      case 'high':
        return {
          label: '紧急',
          icon: AlertCircle,
          bgClass: 'bg-danger-50 border-danger-200',
          textClass: 'text-danger-700',
          badgeClass: 'badge-danger',
          barColor: 'bg-danger-500',
        };
      case 'medium':
        return {
          label: '关注',
          icon: AlertTriangle,
          bgClass: 'bg-warning-50 border-warning-200',
          textClass: 'text-warning-700',
          badgeClass: 'badge-warning',
          barColor: 'bg-warning-500',
        };
      default:
        return {
          label: '正常',
          icon: CheckCircle,
          bgClass: 'bg-success-50 border-success-200',
          textClass: 'text-success-700',
          badgeClass: 'badge-success',
          barColor: 'bg-success-500',
        };
    }
  };

  if (filteredSuggestions.length === 0) {
    return (
      <div className="card h-full">
        <div className="card-header">
          <div className="flex items-center gap-2">
            <h3 className="card-title">智能补货建议</h3>
            <InfoTooltip
              title="口径说明"
              content="基于安全库存、日均销量和供货周期计算建议补货量。天数可售 = 当前库存 / 日均需求。"
            />
          </div>
        </div>
        <div className="card-body h-80">
          <EmptyState
            type="no-result"
            title="暂无补货需求"
            description="当前筛选条件下所有商品库存充足"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="card h-full flex flex-col">
      <div className="card-header">
        <div className="flex items-center gap-2">
          <h3 className="card-title">智能补货建议</h3>
          <InfoTooltip
            title="口径说明"
            content="基于安全库存、日均销量和供货周期计算建议补货量。天数可售 = 当前库存 / 日均需求。"
          />
        </div>
        <button className="btn btn-primary text-xs">
          <ShoppingCart className="w-3.5 h-3.5" />
          生成采购单
        </button>
      </div>

      <div className="px-5 py-3 bg-slate-50 border-b border-slate-100 grid grid-cols-4 gap-4">
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 text-danger-600 font-semibold">
            <AlertCircle className="w-4 h-4" />
            {stats.high.length}
          </div>
          <div className="text-xs text-slate-500">紧急补货</div>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 text-warning-600 font-semibold">
            <AlertTriangle className="w-4 h-4" />
            {stats.medium.length}
          </div>
          <div className="text-xs text-slate-500">关注补货</div>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 text-slate-700 font-semibold">
            <Package className="w-4 h-4" />
            {stats.totalSuggestedQty.toLocaleString()}
          </div>
          <div className="text-xs text-slate-500">建议补货总量</div>
        </div>
        <div className="text-center">
          <div className="text-slate-700 font-semibold">
            ¥{stats.totalValue.toLocaleString()}
          </div>
          <div className="text-xs text-slate-500">预估金额</div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4 space-y-3">
        {filteredSuggestions.map(item => {
          const config = getPriorityConfig(item.priority);
          const PriorityIcon = config.icon;
          const isSelected = selectedSKUId === item.skuId;
          const supplyRatio = Math.min(100, Math.round((item.currentStock / item.safetyStock) * 100));

          return (
            <div
              key={item.skuId}
              className={`border rounded-lg p-4 cursor-pointer transition-all ${
                isSelected
                  ? 'border-primary-300 bg-primary-50 shadow-sm'
                  : `${config.bgClass} hover:shadow-sm`
              }`}
              onClick={() => setSelectedSKUId(isSelected ? null : item.skuId)}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <PriorityIcon className={`w-4 h-4 ${config.textClass}`} />
                    <span className="font-medium text-slate-800 text-sm">{item.skuName}</span>
                    <span className={`badge ${config.badgeClass}`}>{config.label}</span>
                  </div>
                  <p className="text-xs text-slate-500">
                    {item.category} · {item.supplierName}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-slate-800">{item.suggestedQty}</div>
                  <div className="text-xs text-slate-500">建议补货(件)</div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 text-xs">
                <div>
                  <div className="text-slate-500 mb-1">当前库存 / 安全库存</div>
                  <div className="font-medium text-slate-700">
                    {item.currentStock} / {item.safetyStock}
                  </div>
                  <div className="w-full h-1.5 bg-slate-200 rounded-full mt-1 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${supplyRatio < 50 ? 'bg-danger-500' : supplyRatio < 100 ? 'bg-warning-500' : 'bg-success-500'}`}
                      style={{ width: `${Math.min(100, supplyRatio)}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="text-slate-500 mb-1">日均需求</div>
                  <div className="font-medium text-slate-700">{item.avgDailyDemand} 件/天</div>
                </div>
                <div>
                  <div className="text-slate-500 mb-1">可售天数</div>
                  <div className={`font-medium ${item.daysOfSupply < 15 ? 'text-danger-600' : item.daysOfSupply < 30 ? 'text-warning-600' : 'text-success-600'}`}>
                    {item.daysOfSupply} 天
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="px-5 py-3 bg-slate-50 border-t border-slate-100">
        <div className="explanation-box">
          <p className="font-medium text-slate-600 mb-1">补货逻辑：</p>
          <ul className="text-slate-500 space-y-0.5">
            <li>• 紧急: 可售天数不足15天或库存低于安全库存50%</li>
            <li>• 关注: 可售天数15-30天或库存低于安全库存</li>
            <li>• 建议量 = 安全库存×2 - 当前库存 + 采购周期销量</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
