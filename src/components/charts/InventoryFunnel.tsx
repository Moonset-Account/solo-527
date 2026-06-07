import { useMemo } from 'react';
import { Funnel, FunnelChart, Tooltip, LabelList, ResponsiveContainer, Cell } from 'recharts';
import { useFilter } from '../../context/FilterContext';
import { mockFunnelData } from '../../data/mockData';
import { InfoTooltip } from '../common/InfoTooltip';
import { EmptyState } from '../common/EmptyState';
import { AlertTriangle } from 'lucide-react';

const COLORS = ['#3b82f6', '#60a5fa', '#93c5fd', '#f59e0b', '#ef4444'];

export function InventoryFunnel() {
  const { filteredInventory, setSelectedSKUId } = useFilter();

  const funnelData = useMemo(() => {
    if (filteredInventory.length === 0) return [];

    const totalQty = filteredInventory.reduce((sum, i) => sum + i.quantity, 0);
    const availableQty = filteredInventory.reduce((sum, i) => sum + i.availableQty, 0);
    const nearExpiryQty = filteredInventory.filter(i => i.daysToExpiry < 90).reduce((sum, i) => sum + i.quantity, 0);
    const slowMovingQty = filteredInventory.filter(i => i.ageDays > 180).reduce((sum, i) => sum + i.quantity, 0);

    return [
      { ...mockFunnelData[0], value: Math.round(totalQty * 1.68) },
      { ...mockFunnelData[1], value: totalQty },
      { ...mockFunnelData[2], value: availableQty },
      { ...mockFunnelData[3], value: nearExpiryQty },
      { ...mockFunnelData[4], value: slowMovingQty },
    ];
  }, [filteredInventory]);

  const nearExpiryItems = useMemo(() => {
    return filteredInventory
      .filter(i => i.daysToExpiry < 90)
      .sort((a, b) => a.daysToExpiry - b.daysToExpiry)
      .slice(0, 3);
  }, [filteredInventory]);

  if (filteredInventory.length === 0) {
    return (
      <div className="card h-full">
        <div className="card-header">
          <div className="flex items-center gap-2">
            <h3 className="card-title">库存漏斗分析</h3>
            <InfoTooltip
              title="口径说明"
              content="展示库存从入库到滞销的全链路转化。近效期指距有效期不足90天，滞销指库龄超180天且无出库记录。"
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
          <h3 className="card-title">库存漏斗分析</h3>
          <InfoTooltip
            title="口径说明"
            content="展示库存从入库到滞销的全链路转化。近效期指距有效期不足90天，滞销指库龄超180天且无出库记录。"
          />
        </div>
        <span className="text-xs text-slate-500">
          数据口径: {filteredInventory.length} 个批次
        </span>
      </div>

      <div className="card-body">
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <FunnelChart>
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-white p-3 rounded-lg shadow-lg border border-slate-200">
                        <p className="font-medium text-slate-800">{data.stage}</p>
                        <p className="text-lg font-bold text-primary-600">{data.value.toLocaleString()} 件</p>
                        <p className="text-xs text-slate-500 mt-1">{data.description}</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Funnel dataKey="value" data={funnelData} isAnimationActive>
                <LabelList
                  position="right"
                  fill="#334155"
                  stroke="none"
                  dataKey="stage"
                  fontSize={12}
                />
                <LabelList
                  position="center"
                  fill="#fff"
                  stroke="none"
                  dataKey="value"
                  formatter={(val: number) => val.toLocaleString()}
                  fontSize={13}
                  fontWeight={600}
                />
                {funnelData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Funnel>
            </FunnelChart>
          </ResponsiveContainer>
        </div>

        {nearExpiryItems.length > 0 && (
          <div className="mt-4 near-expiry-alert">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 text-warning-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-warning-700 mb-2">近效期提醒 ({nearExpiryItems.length} 个批次)</p>
                <div className="space-y-1">
                  {nearExpiryItems.map(item => (
                    <div
                      key={item.batchId}
                      className="flex items-center justify-between text-xs cursor-pointer hover:bg-warning-100 -mx-2 px-2 py-1 rounded transition-colors"
                      onClick={() => setSelectedSKUId(item.skuId)}
                    >
                      <span className="text-slate-700 truncate flex-1">{item.skuName}</span>
                      <span className="text-slate-500 mx-2">批次 {item.batchNo.slice(-6)}</span>
                      <span className={`font-medium ${item.daysToExpiry < 30 ? 'text-danger-600' : 'text-warning-600'}`}>
                        剩{item.daysToExpiry}天
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="explanation-box mt-4">
          <p className="font-medium text-slate-600 mb-1">如何解读：</p>
          <ul className="text-slate-500 space-y-0.5">
            <li>• 漏斗收窄过快说明出库效率高但可能存在缺货风险</li>
            <li>• 近效期占比超过10%建议启动促销或调拨</li>
            <li>• 滞销库存占比过高会占用资金和仓位资源</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
