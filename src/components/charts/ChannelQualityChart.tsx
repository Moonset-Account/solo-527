import ReactECharts from 'echarts-for-react';
import { useStore } from '../../store/useStore';
import { CHART_PALETTE } from '../../utils/format';

export default function ChannelQualityChart() {
  const { getChannelQualityData } = useStore();
  const data = getChannelQualityData();

  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow',
      },
    },
    legend: {
      data: ['简历数', '面试率%', '入职率%', '质量评分'],
      bottom: 0,
      textStyle: {
        fontSize: 12,
        color: '#64748b',
      },
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '18%',
      top: '8%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: data.map(d => d.channelName),
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
    yAxis: [
      {
        type: 'value',
        name: '数量/评分',
        position: 'left',
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
      {
        type: 'value',
        name: '转化率%',
        position: 'right',
        nameTextStyle: {
          color: '#64748b',
          fontSize: 12,
        },
        min: 0,
        max: 100,
        splitLine: {
          show: false,
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
          formatter: '{value}%',
        },
      },
    ],
    series: [
      {
        name: '简历数',
        type: 'bar',
        yAxisIndex: 0,
        barWidth: '15%',
        data: data.map(d => d.resumeCount),
        itemStyle: {
          color: CHART_PALETTE[0],
          borderRadius: [4, 4, 0, 0],
        },
      },
      {
        name: '面试率%',
        type: 'line',
        yAxisIndex: 1,
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        data: data.map(d => d.interviewRate),
        lineStyle: {
          width: 2,
          color: CHART_PALETTE[2],
        },
        itemStyle: {
          color: CHART_PALETTE[2],
        },
      },
      {
        name: '入职率%',
        type: 'line',
        yAxisIndex: 1,
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        data: data.map(d => d.onboardRate),
        lineStyle: {
          width: 2,
          color: CHART_PALETTE[4],
        },
        itemStyle: {
          color: CHART_PALETTE[4],
        },
      },
      {
        name: '质量评分',
        type: 'bar',
        yAxisIndex: 0,
        barWidth: '15%',
        data: data.map(d => d.qualityScore),
        itemStyle: {
          color: CHART_PALETTE[3],
          borderRadius: [4, 4, 0, 0],
        },
      },
    ],
  };

  return <ReactECharts option={option} style={{ height: '340px' }} opts={{ renderer: 'canvas' }} />;
}
