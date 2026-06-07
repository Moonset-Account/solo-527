import { useEffect, useState } from 'react';
import { useStore } from '@/store/useStore';
import { api } from '@/api';
import type { AbnormalDish } from '@/types';
import { AlertTriangle, Diamond, Triangle } from 'lucide-react';

const SAMPLE_THRESHOLD = 30;

export default function AbnormalDishTable() {
  const [data, setData] = useState<AbnormalDish[]>([]);
  const { filters } = useStore();

  useEffect(() => {
    api.getAbnormalDishes(filters).then(setData);
  }, [filters]);

  const getScoreColor = (score: number, sampleCount: number) => {
    if (sampleCount < SAMPLE_THRESHOLD) return 'text-zinc-400';
    if (score < 3.0) return 'text-red-600';
    if (score < 3.5) return 'text-amber-600';
    return 'text-teal-700';
  };

  const getReturnRateColor = (rate: number) => {
    if (rate > 12) return 'text-red-600 bg-red-50';
    if (rate > 8) return 'text-amber-600 bg-amber-50';
    return 'text-zinc-700';
  };

  return (
    <div className="bg-white border border-zinc-200 rounded-xl shadow-sm p-5">
      <div className="flex items-center gap-2 mb-4">
        <AlertTriangle className="w-4 h-4 text-amber-600" />
        <h3 className="text-sm font-semibold text-zinc-800">异常菜品明细</h3>
        <span className="text-xs text-zinc-400 ml-auto">
          样本量阈值：{SAMPLE_THRESHOLD}（低于阈值的菜品不参与低分排行）
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b-2 border-zinc-100">
              <th className="text-left py-2 px-2 text-zinc-500 font-medium">菜品</th>
              <th className="text-left py-2 px-2 text-zinc-500 font-medium">窗口</th>
              <th className="text-left py-2 px-2 text-zinc-500 font-medium">菜系</th>
              <th className="text-center py-2 px-2 text-zinc-500 font-medium">评分</th>
              <th className="text-center py-2 px-2 text-zinc-500 font-medium">样本量</th>
              <th className="text-center py-2 px-2 text-zinc-500 font-medium">退餐率</th>
              <th className="text-center py-2 px-2 text-zinc-500 font-medium">成本</th>
              <th className="text-center py-2 px-2 text-zinc-500 font-medium">毛利率</th>
              <th className="text-left py-2 px-2 text-zinc-500 font-medium">异常类型</th>
              <th className="text-center py-2 px-2 text-zinc-500 font-medium">标记</th>
            </tr>
          </thead>
          <tbody>
            {data.map((d) => {
              const isLowSample = d.sample_count < SAMPLE_THRESHOLD;
              return (
                <tr
                  key={d.dish_id}
                  className={`border-b border-zinc-50 hover:bg-zinc-50/50 transition-colors ${
                    isLowSample ? 'opacity-60' : ''
                  }`}
                >
                  <td className="py-2 px-2 font-medium text-zinc-800">
                    {d.dish_name}
                    {isLowSample && (
                      <span className="ml-1.5 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] bg-zinc-100 text-zinc-400 border border-dashed border-zinc-300">
                        样本不足
                      </span>
                    )}
                  </td>
                  <td className="py-2 px-2 text-zinc-600">{d.window_name}</td>
                  <td className="py-2 px-2 text-zinc-600">{d.cuisine_type}</td>
                  <td className={`py-2 px-2 text-center font-medium ${getScoreColor(d.avg_score, d.sample_count)}`}>
                    {d.avg_score}
                  </td>
                  <td className="py-2 px-2 text-center text-zinc-600">{d.sample_count}</td>
                  <td className="py-2 px-2 text-center">
                    <span className={`inline-block px-1.5 py-0.5 rounded ${getReturnRateColor(d.return_rate)}`}>
                      {d.return_rate}%
                    </span>
                  </td>
                  <td className="py-2 px-2 text-center text-zinc-600">¥{d.cost}</td>
                  <td className="py-2 px-2 text-center text-zinc-600">{d.profit_rate}%</td>
                  <td className="py-2 px-2">
                    <div className="flex flex-wrap gap-1">
                      {d.abnormal_type.map((t) => (
                        <span
                          key={t}
                          className={`inline-block px-1.5 py-0.5 rounded text-[10px] ${
                            t === '评分偏低'
                              ? 'bg-red-50 text-red-600'
                              : t === '退餐率偏高'
                              ? 'bg-amber-50 text-amber-700'
                              : 'bg-blue-50 text-blue-600'
                          }`}
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="py-2 px-2 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      {d.supplier_changed && (
                        <span title={`供应商更换日: ${d.supplier_change_date || ''}`}>
                          <Diamond className="w-3.5 h-3.5 text-amber-600" />
                        </span>
                      )}
                      {d.batch_recalled && (
                        <span title={`食材批次召回: ${d.recall_batch_id || ''}`}>
                          <Triangle className="w-3.5 h-3.5 text-violet-600" />
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
            {data.length === 0 && (
              <tr>
                <td colSpan={10} className="py-8 text-center text-zinc-400">
                  暂无异常菜品数据
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center gap-4 mt-3 text-xs text-zinc-400">
        <span className="flex items-center gap-1">
          <Diamond className="w-3 h-3 text-amber-600" />
          供应商更换日（口味评价单独标记，不与历史混算）
        </span>
        <span className="flex items-center gap-1">
          <Triangle className="w-3 h-3 text-violet-600" />
          食材批次召回
        </span>
      </div>
    </div>
  );
}
