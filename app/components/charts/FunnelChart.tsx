import { useMemo, useState } from 'react';
import * as echarts from 'echarts';
import { ChartCard, BaseChart } from './BaseChart';
import type { FunnelResponse } from '@shared/types';
import { STAGE_DEFINITIONS } from '../../../scripts/metrics/definitions';
import { formatNumber } from '~/utils/format';

interface Props {
  data: FunnelResponse | null;
  loading: boolean;
}

export default function FunnelChart({ data, loading }: Props) {
  const [hoveredStage, setHoveredStage] = useState<string | null>(null);

  const option = useMemo((): echarts.EChartsOption => {
    if (!data) return {};

    const stageData = data.stages.map((s) => ({
      value: s.quantity,
      name: s.name,
      itemStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
          { offset: 0, color: STAGE_DEFINITIONS[s.stage].color + 'CC' },
          { offset: 1, color: STAGE_DEFINITIONS[s.stage].color + '66' },
        ]),
      },
    }));

    return {
      tooltip: {
        trigger: 'item' as const,
        formatter: (params: any) => {
          const stage = data.stages.find((s) => s.name === params.name);
          if (!stage) return '';
          return `
            <div style="padding: 8px;">
              <div style="font-weight: 600; margin-bottom: 4px;">${stage.name}</div>
              <div>数量: ${formatNumber(stage.quantity, 0)}</div>
              <div>金额: ¥${formatNumber(stage.amount)}</div>
              <div>转化率: ${(stage.conversionRate * 100).toFixed(1)}%</div>
            </div>
          `;
        },
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        borderColor: 'rgba(71, 85, 105, 0.5)',
        textStyle: { color: '#E2E8F0' },
      },
      series: [
        {
          type: 'funnel',
          left: '10%',
          top: 20,
          bottom: 20,
          width: '80%',
          min: 0,
          max: Math.max(...data.stages.map((s) => s.quantity)),
          minSize: '30%',
          maxSize: '100%',
          sort: 'descending',
          gap: 3,
          label: {
            show: true,
            position: 'inside',
            formatter: '{b}\n{c}',
            color: '#fff',
            fontSize: 12,
          },
          labelLine: { show: false },
          itemStyle: {
            borderColor: 'rgba(15, 23, 42, 0.5)',
            borderWidth: 1,
          },
          emphasis: {
            label: { fontSize: 14, fontWeight: 'bold' },
          },
          data: stageData,
        },
      ],
    };
  }, [data]);

  return (
    <ChartCard title="临期漏斗" subtitle="入库→可售→临期→促销→报损/退货 全链路">
      {loading ? (
        <div className="h-[300px] flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-slate-600 border-t-fresh-green rounded-full animate-spin" />
        </div>
      ) : (
        <BaseChart option={option} height={300} />
      )}
    </ChartCard>
  );
}
