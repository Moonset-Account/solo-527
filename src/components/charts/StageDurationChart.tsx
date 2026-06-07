import ReactECharts from 'echarts-for-react';
import { useStore } from '../../store/useStore';
import { CHART_PALETTE } from '../../utils/format';

export default function StageDurationChart() {
  const { getStageDurationData } = useStore();
  const data = getStageDurationData();

  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow',
      },
      formatter: (params: any) => {
        const d = data[params[0].dataIndex];
        return `
          <div style="padding: 8px;">
            <div style="font-weight: 600; margin-bottom: 8px;">${d.stage}</div>
            <div style="margin-bottom: 4px;">平均: <strong>${d.avgDays}</strong> 天</div>
            <div style="margin-bottom: 4px;">中位数: <strong>${d.medianDays}</strong> 天</div>
            <div style="margin-bottom: 4px;">P75: <strong>${d.p75Days}</strong> 天</div>
            <div>P90: <strong>${d.p90Days}</strong> 天</div>
          </div>
        `;
      },
    },
    legend: {
      data: ['平均耗时', 'P75分位', 'P90分位'],
      bottom: 0,
      textStyle: {
        fontSize: 12,
        color: '#64748b',
      },
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '15%',
      top: '10%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: data.map(d => d.stage),
      axisLine: {
        lineStyle: {
          color: '#e2e8f0',
        },
      },
      axisLabel: {
        color: '#64748b',
        fontSize: 11,
        rotate: 20,
      },
    },
    yAxis: {
      type: 'value',
      name: '天数',
      nameTextStyle: {
        color: '#64748b',
        fontSize: 12,
      },
      splitLine: {
        lineStyle: {
          color: '#f1f5f9',
          type: 'dashed',
        },
      },
      axisLine: {
        show: false,
      },
      axisTick: {
        show: false,
      },
      axisLabel: {
        color: '#64748b',
        fontSize: 11,
      },
    },
    series: [
      {
        name: '平均耗时',
        type: 'bar',
        barWidth: '20%',
        data: data.map(d => d.avgDays),
        itemStyle: {
          color: CHART_PALETTE[0],
          borderRadius: [4, 4, 0, 0],
        },
      },
      {
        name: 'P75分位',
        type: 'bar',
        barWidth: '20%',
        data: data.map(d => d.p75Days),
        itemStyle: {
          color: CHART_PALETTE[1],
          borderRadius: [4, 4, 0, 0],
        },
      },
      {
        name: 'P90分位',
        type: 'bar',
        barWidth: '20%',
        data: data.map(d => d.p90Days),
        itemStyle: {
          color: CHART_PALETTE[3],
          borderRadius: [4, 4, 0, 0],
        },
      },
    ],
  };

  return <ReactECharts option={option} style={{ height: '340px' }} opts={{ renderer: 'canvas' }} />;
}
