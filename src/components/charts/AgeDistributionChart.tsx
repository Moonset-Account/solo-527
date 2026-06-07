import { useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useFilter } from '../../context/FilterContext';
import { InfoTooltip } from '../common/InfoTooltip';
import { EmptyState } from '../common/EmptyState';
import { Clock, AlertTriangle, TrendingUp } from 'lucide-react';

export function AgeDistributionChart() {
  const { filteredInventory, setFilters } = useFilter();
  const [activeRange, setActiveRange] = useState<string | null>(null);

  const distribution = useMemo(() => {
    if (filteredInventory.length === 0) return [];

    const ranges = [
      { label: '0-30天', min: 0, max: 30, color: '#22c55e' },
      { label: '31-60天', min: 31, max: 60, color: '#86efac' },
      { label: '61-90天', min: 61, max: 90, color: '#fbbf24' },
      { label: '91-180天', min: 91, max: 180, color: '#f59e0b' },
      { label: '181-365天', min: 181, max: 365, color: '#f97316' },
      { label: '365天+', min: 366, max: 9999, color: '#ef4444' },
    ];

    return ranges.map(range => {
      const items = filteredInventory.filter(
        i => i.ageDays >= range.min && i.ageDays <= range.max
      );
      return {
        range: range.label,
        minDays: range.min,
        maxDays: range.max,
        quantity: items.reduce((sum, i) => sum + i.quantity, 0),
        value: items.reduce((sum, i) => sum + i.totalValue, 0),
        count: items.length,
        color: range.color,
      };
    });
  }, [filteredInventory]);

  const nearExpiryStats = useMemo(() => {
    const nearExpiry = filteredInventory.filter(i => i.daysToExpiry < 90 && i.daysToExpiry > 0);
    const expired = filteredInventory.filter(i => i.daysToExpiry <= 0);
    return {
      nearExpiryQty: nearExpiry.reduce((sum, i) => sum + i.quantity, 0),
      nearExpiryValue: nearExpiry.reduce((sum, i) => sum + i.totalValue, 0),
      expiredQty: expired.reduce((sum, i) => sum + i.quantity, 0),
      expiredValue: expired.reduce((sum, i) => sum + i.totalValue, 0),
      nearExpiryCount: nearExpiry.length,
      expiredCount: expired.length,
    };
  }, [filteredInventory]);

  const handleBarClick = (data: any) => {
    if (!data || !data.activePayload) return;
    const clicked = data.activePayload[0].payload;
    if (activeRange === clicked.range) {
      setActiveRange(null);
      setFilters(f => ({ ...f, ageRange: null }));
    } else {
      setActiveRange(clicked.range);
      setFilters(f => ({ ...f, ageRange: [clicked.minDays, clicked.maxDays] }));
    }
  };

  if (filteredInventory.length === 0) {
    return (
      <div className="card h-full">
        <div className="card-header">
          <div className="flex items-center gap-2">
            <h3 className="card-title">库龄分布分析</h3>
            <InfoTooltip
              title="口径说明"
              content="库龄从商品入库日期开始计算。点击柱形可快速筛选对应库龄区间的商品。"
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
    <div className="card h-full">
      <div className="card-header">
        <div className="flex items-center gap-2">
          <h3 className="card-title">库龄分布分析</h3>
          <InfoTooltip
            title="口径说明"
            content="库龄从商品入库日期开始计算。点击柱形可快速筛选对应库龄区间的商品。"
          />
        </div>
        <div className="flex items-center gap-2">
          {activeRange && (
            <span className="badge badge-info">
              已筛选: {activeRange}
              <button
                className="ml-1 hover:text-white"
                onClick={() => {
                  setActiveRange(null);
                  setFilters(f => ({ ...f, ageRange: null }));
                }}
              >
                ×
              </button>
            </span>
          )}
        </div>
      </div>

      <div className="card-body">
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="bg-success-50 rounded-lg p-3">
            <div className="flex items-center gap-2 text-success-700 text-xs font-medium mb-1">
              <Clock className="w-3.5 h-3.5" />
              健康库存 (0-90天)
            </div>
            <div className="text-xl font-bold text-success-700">
              {distribution.slice(0, 3).reduce((sum, d) => sum + d.quantity, 0).toLocaleString()}
            </div>
            <div className="text-xs text-success-600">件 · 库龄合理</div>
          </div>
          <div className="bg-warning-50 rounded-lg p-3">
            <div className="flex items-center gap-2 text-warning-700 text-xs font-medium mb-1">
              <AlertTriangle className="w-3.5 h-3.5" />
              观察库存 (91-180天)
            </div>
            <div className="text-xl font-bold text-warning-700">
              {distribution[3].quantity.toLocaleString()}
            </div>
            <div className="text-xs text-warning-600">件 · 需关注动销</div>
          </div>
          <div className="bg-danger-50 rounded-lg p-3">
            <div className="flex items-center gap-2 text-danger-700 text-xs font-medium mb-1">
              <TrendingUp className="w-3.5 h-3.5" />
              滞销风险（大于180天）
            </div>
            <div className="text-xl font-bold text-danger-700">
              {distribution.slice(4).reduce((sum, d) => sum + d.quantity, 0).toLocaleString()}
            </div>
            <div className="text-xs text-danger-600">件 · 建议促销清理</div>
          </div>
        </div>

        <div className="h-44">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={distribution} onClick={handleBarClick}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="range" tick={{ fontSize: 11 }} tickLine={false} axisLine={{ stroke: '#e2e8f0' }} />
              <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={{ stroke: '#e2e8f0' }} />
              <Tooltip
                cursor={{ fill: '#f8fafc' }}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const d = payload[0].payload;
                    return (
                      <div className="bg-white p-3 rounded-lg shadow-lg border border-slate-200">
                        <p className="font-medium text-slate-800">{d.range}</p>
                        <p className="text-lg font-bold text-primary-600">{d.quantity.toLocaleString()} 件</p>
                        <p className="text-xs text-slate-500">¥{d.value.toLocaleString()} · {d.count}个批次</p>
                        <p className="text-xs text-slate-400 mt-1">点击筛选此区间</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="quantity" radius={[4, 4, 0, 0]}>
                {distribution.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.color}
                    opacity={activeRange && activeRange !== entry.range ? 0.4 : 1}
                    stroke={activeRange === entry.range ? '#1e40af' : 'transparent'}
                    strokeWidth={2}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {(nearExpiryStats.nearExpiryCount > 0 || nearExpiryStats.expiredCount > 0) && (
          <div className="mt-4 p-3 bg-gradient-to-r from-warning-50 to-danger-50 rounded-lg border border-warning-200">
            <p className="text-sm font-medium text-warning-800 mb-2 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              效期预警
            </p>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-warning-700">距效期不足90天: </span>
                <span className="font-semibold text-warning-800">
                  {nearExpiryStats.nearExpiryQty}件 / {nearExpiryStats.nearExpiryCount}批次
                </span>
              </div>
              <div>
                <span className="text-danger-700">已过期: </span>
                <span className="font-semibold text-danger-800">
                  {nearExpiryStats.expiredQty}件 / {nearExpiryStats.expiredCount}批次
                </span>
              </div>
            </div>
          </div>
        )}

        <div className="explanation-box mt-4">
          <p className="font-medium text-slate-600 mb-1">业务建议：</p>
          <ul className="text-slate-500 space-y-0.5">
            <li>• 库龄超过180天的商品占比应控制在5%以内</li>
            <li>• 同一SKU不同批次库龄差异大，需按批次先进先出</li>
            <li>• 可结合供应商供货周期优化采购批量</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
