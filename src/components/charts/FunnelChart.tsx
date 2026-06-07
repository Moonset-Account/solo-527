import ReactECharts from 'echarts-for-react';
import { useStore } from '../../store/useStore';
import { CHART_PALETTE, STAGE_COLORS } from '../../utils/format';

export default function FunnelChart() {
  const { getFunnelData, drillDown } = useStore();
  const funnelData = getFunnelData();

  const option = {
    tooltip: {
      trigger: 'item',
      formatter: (params: any) => {
        const data = funnelData[params.dataIndex];
        return `
          <div style="padding: 8px;">
            <div style="font-weight: 600; margin-bottom: 4px;">${params.name}</div>
            <div>数量: <strong>${data.count}</strong> 人</div>
            <div>转化率: <strong>${data.conversionRate}%</strong></div>
          </div>
        `;
      },
    },
    legend: {
      show: false,
    },
    series: [
      {
        name: '招聘漏斗',
        type: 'funnel',
        left: '10%',
        top: 20,
        bottom: 20,
        width: '80%',
        min: 0,
        max: funnelData.length > 0 ? funnelData[0].count : 100,
        minSize: '0%',
        maxSize: '100%',
        sort: 'descending',
        gap: 2,
        label: {
          show: true,
          position: 'inside',
          formatter: (params: any) => {
            const data = funnelData[params.dataIndex];
            return `${params.name}\n${data.count}人`;
          },
          fontSize: 12,
          color: '#fff',
          fontWeight: 500,
        },
        labelLine: {
          length: 10,
          lineStyle: {
            width: 1,
            type: 'solid',
          },
        },
        itemStyle: {
          borderColor: '#fff',
          borderWidth: 2,
        },
        emphasis: {
          label: {
            fontSize: 14,
          },
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.2)',
          },
        },
        data: funnelData.map((item, index) => ({
          value: item.count,
          name: item.stage,
          itemStyle: {
            color: STAGE_COLORS[item.stageType] || CHART_PALETTE[index % CHART_PALETTE.length],
          },
        })),
      },
    ],
  };

  const onEvents = {
    click: (params: any) => {
      const data = funnelData[params.dataIndex];
      drillDown('stage', data.stageType);
    },
  };

  return (
    <ReactECharts
      option={option}
      style={{ height: '360px' }}
      onEvents={onEvents}
      opts={{ renderer: 'canvas' }}
    />
  );
}
