import ReactECharts from 'echarts-for-react';
import { useStore } from '../../store/useStore';
import { CHART_PALETTE } from '../../utils/format';

export default function TrendLineChart() {
  const { getTrendData } = useStore();
  const trendData = getTrendData();

  const option = {
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderColor: '#e2e8f0',
      borderWidth: 1,
      textStyle: {
        color: '#334155',
      },
    },
    legend: {
      data: ['简历数', '面试数', 'Offer数', '入职数'],
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
      boundaryGap: false,
      data: trendData.map(d => d.date),
      axisLine: {
        lineStyle: {
          color: '#e2e8f0',
        },
      },
      axisLabel: {
        color: '#64748b',
        fontSize: 11,
      },
    },
    yAxis: {
      type: 'value',
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
        name: '简历数',
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        data: trendData.map(d => d.resumeCount),
        lineStyle: {
          width: 2.5,
          color: CHART_PALETTE[0],
        },
        itemStyle: {
          color: CHART_PALETTE[0],
        },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: `${CHART_PALETTE[0]}30` },
              { offset: 1, color: `${CHART_PALETTE[0]}05` },
            ],
          },
        },
      },
      {
        name: '面试数',
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        data: trendData.map(d => d.interviewCount),
        lineStyle: {
          width: 2.5,
          color: CHART_PALETTE[2],
        },
        itemStyle: {
          color: CHART_PALETTE[2],
        },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: `${CHART_PALETTE[2]}30` },
              { offset: 1, color: `${CHART_PALETTE[2]}05` },
            ],
          },
        },
      },
      {
        name: 'Offer数',
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        data: trendData.map(d => d.offerCount),
        lineStyle: {
          width: 2.5,
          color: CHART_PALETTE[3],
        },
        itemStyle: {
          color: CHART_PALETTE[3],
        },
      },
      {
        name: '入职数',
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        data: trendData.map(d => d.onboardCount),
        lineStyle: {
          width: 2.5,
          color: CHART_PALETTE[4],
        },
        itemStyle: {
          color: CHART_PALETTE[4],
        },
      },
    ],
  };

  return <ReactECharts option={option} style={{ height: '320px' }} opts={{ renderer: 'canvas' }} />;
}
