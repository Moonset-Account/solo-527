import { useMemo } from 'react';
import { useFilter } from '../../context/FilterContext';
import { Package, TrendingUp, AlertTriangle, DollarSign } from 'lucide-react';
import { InfoTooltip } from './InfoTooltip';
import { InventoryItem } from '../../types';

interface MetricCardProps {
  label: string;
  value: string | number;
  unit?: string;
  icon: React.ElementType;
  color: string;
  trend?: { value: number; label: string };
  tooltip?: string;
}

function MetricCard({ label, value, unit, icon: Icon, color, trend, tooltip }: MetricCardProps) {
  return (
    <div className="metric-card">
      <div className="flex items-start justify-between">
        <div>
          <div className="metric-label flex items-center gap-1">
            {label}
            {tooltip && <InfoTooltip content={tooltip} />}
          </div>
          <div className="flex items-baseline gap-1">
            <span className="metric-value">{value}</span>
            {unit && <span className="text-sm text-slate-500">{unit}</span>}
          </div>
          {trend && (
            <div className={`flex items-center gap-1 text-xs mt-1 ${
              trend.value >= 0 ? 'text-success-600' : 'text-danger-600'
            }`}>
              <TrendingUp className={`w-3 h-3 ${trend.value < 0 ? 'rotate-180' : ''}`} />
              <span>{Math.abs(trend.value)}%</span>
              <span className="text-slate-400">{trend.label}</span>
            </div>
          )}
        </div>
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );
}

export function KeyMetrics() {
  const { filteredInventory } = useFilter();

  const metrics = useMemo(() => {
    const totalQty = filteredInventory.reduce((sum: number, i: InventoryItem) => sum + i.quantity, 0);
    const totalValue = filteredInventory.reduce((sum: number, i: InventoryItem) => sum + i.totalValue, 0);
    const skuCount = new Set(filteredInventory.map((i: InventoryItem) => i.skuId)).size;
    const batchCount = filteredInventory.length;
    const nearExpiryCount = filteredInventory.filter((i: InventoryItem) => i.daysToExpiry < 90 && i.daysToExpiry > 0).length;
    const slowMovingQty = filteredInventory.filter((i: InventoryItem) => i.ageDays > 180).reduce((sum: number, i: InventoryItem) => sum + i.quantity, 0);
    const avgTurnoverDays = Math.round(
      filteredInventory.reduce((sum: number, i: InventoryItem) => sum + i.ageDays, 0) / (filteredInventory.length || 1)
    );

    return {
      totalQty,
      totalValue,
      skuCount,
      batchCount,
      nearExpiryCount,
      slowMovingQty,
      avgTurnoverDays,
    };
  }, [filteredInventory]);

  return (
    <div className="grid grid-cols-4 gap-4 mb-6">
      <MetricCard
        label="库存总量"
        value={metrics.totalQty.toLocaleString()}
        unit="件"
        icon={Package}
        color="bg-primary-500"
        tooltip="筛选范围内所有批次的库存数量之和"
        trend={{ value: 5.2, label: '较上周' }}
      />
      <MetricCard
        label="库存金额"
        value={`¥${(metrics.totalValue / 10000).toFixed(1)}`}
        unit="万"
        icon={DollarSign}
        color="bg-emerald-500"
        tooltip="按批次入库成本价计算的库存总金额"
        trend={{ value: -2.1, label: '较上周' }}
      />
      <MetricCard
        label="平均库龄"
        value={metrics.avgTurnoverDays}
        unit="天"
        icon={TrendingUp}
        color="bg-indigo-500"
        tooltip="所有在库批次的库龄加权平均值，越低周转越快"
        trend={{ value: -8.5, label: '较上周' }}
      />
      <MetricCard
        label="近效期批次"
        value={metrics.nearExpiryCount}
        unit="个"
        icon={AlertTriangle}
        color={metrics.nearExpiryCount > 0 ? 'bg-warning-500' : 'bg-slate-400'}
        tooltip="距有效期不足90天的批次数量，需优先处理"
      />
    </div>
  );
}
