import ReactECharts from 'echarts-for-react';
import { useStore } from '../../store/useStore';
import { CHART_PALETTE } from '../../utils/format';

export default function InterviewerLoadChart() {
  const { getInterviewerLoadData } = useStore();
  const data = getInterviewerLoadData().slice(0, 10);

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
            <div style="font-weight: 600; margin-bottom: 4px;">${d.interviewerName}</div>
            <div>部门: ${d.department}</div>
            <div>面试次数: <strong>${d.interviewCount}</strong> 次</div>
            <div>总时长: <strong>${d.totalHours}</strong> 小时</div>
            <div>周均: <strong>${d.avgPerWeek}</strong> 次</div>
          </div>
        `;
      },
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: '5%',
      containLabel: true,
    },
    xAxis: {
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
    yAxis: {
      type: 'category',
      data: data.map(d => d.interviewerName),
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
    series: [
      {
        name: '面试次数',
        type: 'bar',
        barWidth: '60%',
        data: data.map((d, idx) => ({
          value: d.interviewCount,
          itemStyle: {
            color: CHART_PALETTE[idx % CHART_PALETTE.length],
            borderRadius: [0, 4, 4, 0],
          },
        })),
        label: {
          show: true,
          position: 'right',
          color: '#64748b',
          fontSize: 11,
          formatter: '{c}次',
        },
      },
    ],
  };

  return <ReactECharts option={option} style={{ height: '340px' }} opts={{ renderer: 'canvas' }} />;
}
