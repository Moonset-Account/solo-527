'use client';

import ReactECharts from 'echarts-for-react';

interface QuestionGroupHeatmapProps {
  groupNames: string[];
  sampleDurations: { groupName: string; duration: number }[][];
}

export default function QuestionGroupHeatmap({ groupNames, sampleDurations }: QuestionGroupHeatmapProps) {
  const binEdges = [0, 30, 60, 90, 120, 180, 300];
  const binLabels = ['0-30s', '31-60s', '61-90s', '91-120s', '121-180s', '180s+'];
  
  const data: (string | number)[][] = [];
  
  groupNames.forEach((groupName, groupIdx) => {
    const durations = sampleDurations
      .map(s => s.find(d => d.groupName === groupName)?.duration || 0)
      .filter(d => d > 0);
    
    binEdges.forEach((edge, binIdx) => {
      const nextEdge = binEdges[binIdx + 1] || Infinity;
      const count = durations.filter(d => d >= edge && d < nextEdge).length;
      if (count > 0) {
        data.push([groupIdx, binIdx, count]);
      }
    });
  });

  const maxCount = Math.max(...data.map(d => d[2] as number), 1);

  const option = {
    tooltip: {
      position: 'top',
      formatter: (params: any) => {
        return `${groupNames[params.data[0]]}<br/>${binLabels[params.data[1]]}<br/>样本数: <strong>${params.data[2]}</strong>`;
      },
    },
    grid: {
      left: '15%',
      right: '10%',
      bottom: '15%',
      top: '5%',
    },
    xAxis: {
      type: 'category',
      data: binLabels,
      splitArea: { show: true },
      axisLabel: {
        fontSize: 11,
        color: '#64748b',
      },
    },
    yAxis: {
      type: 'category',
      data: groupNames,
      splitArea: { show: true },
      axisLabel: {
        fontSize: 11,
        color: '#64748b',
      },
    },
    visualMap: {
      min: 0,
      max: maxCount,
      calculable: true,
      orient: 'horizontal',
      left: 'center',
      bottom: '0%',
      inRange: {
        color: ['#f0f9ff', '#bae6fd', '#7dd3fc', '#38bdf8', '#0ea5e9', '#0284c7'],
      },
      textStyle: {
        fontSize: 10,
        color: '#64748b',
      },
    },
    series: [
      {
        name: '题组耗时分布',
        type: 'heatmap',
        data: data,
        label: {
          show: true,
          fontSize: 10,
          color: '#1e293b',
        },
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowColor: 'rgba(0, 0, 0, 0.3)',
          },
        },
      },
    ],
  };

  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
      <h3 className="text-base font-semibold text-gray-900 mb-4">题组耗时热力图</h3>
      <ReactECharts option={option} style={{ height: '320px' }} />
    </div>
  );
}
