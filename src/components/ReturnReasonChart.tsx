import { useEffect, useRef, useState } from 'react';
import * as echarts from 'echarts';
import { useStore } from '@/store/useStore';
import { api } from '@/api';
import type { ReturnReason, ReturnDetail } from '@/types';
import { ChevronRight, X } from 'lucide-react';

const REASON_COLORS = [
  '#0F766E', '#D97706', '#7C3AED', '#DC2626', '#2563EB',
  '#059669', '#EA580C', '#4F46E5', '#BE185D', '#6B7280',
];

export default function ReturnReasonChart() {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);
  const [reasons, setReasons] = useState<ReturnReason[]>([]);
  const [details, setDetails] = useState<ReturnDetail[]>([]);
  const [drillReason, setDrillReason] = useState<string | null>(null);
  const { filters } = useStore();

  useEffect(() => {
    api.getReturnReasons(filters).then(setReasons);
  }, [filters]);

  useEffect(() => {
    if (!chartRef.current) return;
    if (!chartInstance.current) {
      chartInstance.current = echarts.init(chartRef.current);
    }

    const chartData = reasons.map((r, i) => ({
      name: r.reason,
      value: r.count,
      itemStyle: { color: REASON_COLORS[i % REASON_COLORS.length] },
    }));

    const option: echarts.EChartsOption = {
      tooltip: {
        trigger: 'item',
        formatter: (params: any) => `${params.name}<br/>次数：${params.value}<br/>占比：${params.percent}%`,
      },
      series: [
        {
          type: 'pie',
          radius: ['40%', '70%'],
          center: ['50%', '50%'],
          avoidLabelOverlap: true,
          itemStyle: {
            borderRadius: 6,
            borderColor: '#fff',
            borderWidth: 2,
          },
          label: {
            show: true,
            formatter: '{b}\n{d}%',
            fontSize: 11,
            color: '#52525B',
          },
          emphasis: {
            label: { show: true, fontSize: 13, fontWeight: 'bold' },
          },
          data: chartData,
        },
      ],
    };

    chartInstance.current.setOption(option, true);

    chartInstance.current.off('click');
    chartInstance.current.on('click', (params: any) => {
      const reason = params.name;
      setDrillReason(reason);
      api.getReturnDetails(reason).then(setDetails);
    });

    const handleResize = () => chartInstance.current?.resize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [reasons]);

  const closeDrill = () => {
    setDrillReason(null);
    setDetails([]);
  };

  return (
    <div className="bg-white border border-zinc-200 rounded-xl shadow-sm p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-zinc-800">退餐原因分布</h3>
        {drillReason && (
          <button
            onClick={closeDrill}
            className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-700"
          >
            <X className="w-3.5 h-3.5" />
            关闭明细
          </button>
        )}
      </div>

      <div className="flex gap-4">
        <div className={`${drillReason ? 'w-1/2' : 'w-full'} transition-all`}>
          <div ref={chartRef} style={{ width: '100%', height: '320px' }} />
        </div>

        {drillReason && (
          <div className="w-1/2 border-l border-zinc-100 pl-4">
            <div className="flex items-center gap-1 mb-3">
              <ChevronRight className="w-3.5 h-3.5 text-amber-600" />
              <span className="text-xs font-medium text-zinc-700">
                退餐原因：{drillReason}
              </span>
            </div>
            <div className="max-h-[280px] overflow-y-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-zinc-100">
                    <th className="text-left py-1.5 text-zinc-500 font-medium">菜品</th>
                    <th className="text-left py-1.5 text-zinc-500 font-medium">窗口</th>
                    <th className="text-left py-1.5 text-zinc-500 font-medium">日期</th>
                    <th className="text-right py-1.5 text-zinc-500 font-medium">次数</th>
                  </tr>
                </thead>
                <tbody>
                  {details.slice(0, 20).map((d, i) => (
                    <tr key={i} className="border-b border-zinc-50 hover:bg-zinc-50/50">
                      <td className="py-1.5 text-zinc-700">{d.dish_name}</td>
                      <td className="py-1.5 text-zinc-500">{d.window_name}</td>
                      <td className="py-1.5 text-zinc-500">{d.date}</td>
                      <td className="py-1.5 text-right text-zinc-700">{d.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-zinc-400 mt-2">点击环形图扇区可下钻到当天窗口明细</p>
          </div>
        )}
      </div>
    </div>
  );
}
