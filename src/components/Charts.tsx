import ReactECharts from 'echarts-for-react';
import { useAppStore } from '@/store/appStore';
import { generateTrendData, generateBoxPlotData, formatNumber } from '@/utils/dataUtils';

export function BoxPlotChart() {
  const filteredRecords = useAppStore(state => state.filteredRecords);
  const setShowDetailDrawer = useAppStore(state => state.setShowDetailDrawer);

  const boxplotData = generateBoxPlotData(filteredRecords, 'district');

  const option = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'item',
      backgroundColor: '#0F2B4A',
      borderColor: '#1E3A5F',
      textStyle: { color: '#E2E8F0' },
      formatter: (params: any) => {
        const data = params.data;
        if (params.name === '异常值') {
          return `<div>异常值: ¥${formatNumber(params.value[1])}</div>`;
        }
        return `
          <div class="p-1">
            <div class="font-semibold mb-1">${params.name}</div>
            <div>最小值: ¥${formatNumber(data[1])}</div>
            <div>Q1: ¥${formatNumber(data[2])}</div>
            <div>中位数: ¥${formatNumber(data[3])}</div>
            <div>Q3: ¥${formatNumber(data[4])}</div>
            <div>最大值: ¥${formatNumber(data[5])}</div>
          </div>
        `;
      }
    },
    grid: {
      left: '12%',
      right: '5%',
      top: '10%',
      bottom: '15%'
    },
    xAxis: {
      type: 'category',
      data: boxplotData.map(d => d.name),
      axisLine: { lineStyle: { color: '#1E3A5F' } },
      axisLabel: {
        color: '#94A3B8',
        fontSize: 10,
        rotate: 30
      },
      axisTick: { show: false }
    },
    yAxis: {
      type: 'value',
      name: '租金 (元/月)',
      nameTextStyle: { color: '#94A3B8', fontSize: 11 },
      axisLine: { show: false },
      axisLabel: { color: '#94A3B8', fontSize: 10 },
      splitLine: { lineStyle: { color: '#1E3A5F', type: 'dashed' } }
    },
    series: [
      {
        name: '箱线图',
        type: 'boxplot',
        data: boxplotData.map(d => [d.min, d.q1, d.median, d.q3, d.max]),
        itemStyle: {
          color: 'rgba(23, 162, 184, 0.6)',
          borderColor: '#17A2B8',
          borderWidth: 1
        },
        emphasis: {
          itemStyle: {
            color: 'rgba(23, 162, 184, 0.9)',
            borderColor: '#31D2F2',
            borderWidth: 2
          }
        }
      },
      {
        name: '异常值',
        type: 'scatter',
        data: boxplotData.flatMap((d, i) =>
          d.outliers.map(v => [i, v])
        ),
        itemStyle: {
          color: '#FD7E14',
          opacity: 0.7
        },
        symbolSize: 6
      }
    ]
  };

  return (
    <div className="h-full w-full p-2">
      <ReactECharts
        option={option}
        style={{ height: '100%', width: '100%' }}
        onEvents={{
          click: () => setShowDetailDrawer(true)
        }}
      />
    </div>
  );
}

export function TrendChart() {
  const filteredRecords = useAppStore(state => state.filteredRecords);
  const trendData = generateTrendData(filteredRecords);

  const option = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      backgroundColor: '#0F2B4A',
      borderColor: '#1E3A5F',
      textStyle: { color: '#E2E8F0' },
      formatter: (params: any) => {
        const data = params[0];
        const point = trendData[data.dataIndex];
        return `
          <div class="p-1">
            <div class="font-semibold mb-1">${point.month}</div>
            <div>均价: ¥${formatNumber(point.avgRent)}</div>
            <div>中位数: ¥${formatNumber(point.medianRent)}</div>
            <div>样本量: ${point.sampleCount}</div>
          </div>
        `;
      }
    },
    legend: {
      data: ['均价', '中位数'],
      textStyle: { color: '#94A3B8', fontSize: 11 },
      top: 5
    },
    grid: {
      left: '12%',
      right: '5%',
      top: '18%',
      bottom: '12%'
    },
    xAxis: {
      type: 'category',
      data: trendData.map(d => d.month),
      axisLine: { lineStyle: { color: '#1E3A5F' } },
      axisLabel: { color: '#94A3B8', fontSize: 10 },
      axisTick: { show: false }
    },
    yAxis: {
      type: 'value',
      name: '租金 (元/月)',
      nameTextStyle: { color: '#94A3B8', fontSize: 11 },
      axisLine: { show: false },
      axisLabel: { color: '#94A3B8', fontSize: 10 },
      splitLine: { lineStyle: { color: '#1E3A5F', type: 'dashed' } }
    },
    series: [
      {
        name: '均价',
        type: 'line',
        data: trendData.map(d => d.avgRent),
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        lineStyle: { color: '#17A2B8', width: 2 },
        itemStyle: { color: '#17A2B8' },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(23, 162, 184, 0.3)' },
              { offset: 1, color: 'rgba(23, 162, 184, 0.02)' }
            ]
          }
        }
      },
      {
        name: '中位数',
        type: 'line',
        data: trendData.map(d => d.medianRent),
        smooth: true,
        symbol: 'diamond',
        symbolSize: 6,
        lineStyle: { color: '#28A745', width: 2, type: 'dashed' },
        itemStyle: { color: '#28A745' }
      }
    ]
  };

  return (
    <div className="h-full w-full p-2">
      <ReactECharts option={option} style={{ height: '100%', width: '100%' }} />
    </div>
  );
}

export function DealCycleChart() {
  const filteredRecords = useAppStore(state => state.filteredRecords);
  const dealCycleRecords = filteredRecords.filter(r => r.dealCycle !== undefined);

  const bins: { range: string; count: number; avg: number }[] = [];
  const binSize = 7;
  const maxCycle = 63;

  for (let i = 0; i < maxCycle; i += binSize) {
    const binRecords = dealCycleRecords.filter(
      r => r.dealCycle! >= i && r.dealCycle! < i + binSize
    );
    bins.push({
      range: `${i}-${i + binSize}天`,
      count: binRecords.length,
      avg: binRecords.length > 0
        ? Math.round(binRecords.reduce((a, b) => a + b.dealCycle!, 0) / binRecords.length)
        : 0
    });
  }

  const option = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      backgroundColor: '#0F2B4A',
      borderColor: '#1E3A5F',
      textStyle: { color: '#E2E8F0' }
    },
    grid: {
      left: '12%',
      right: '5%',
      top: '10%',
      bottom: '15%'
    },
    xAxis: {
      type: 'category',
      data: bins.map(b => b.range),
      axisLine: { lineStyle: { color: '#1E3A5F' } },
      axisLabel: { color: '#94A3B8', fontSize: 9, rotate: 30 },
      axisTick: { show: false }
    },
    yAxis: {
      type: 'value',
      name: '样本量',
      nameTextStyle: { color: '#94A3B8', fontSize: 11 },
      axisLine: { show: false },
      axisLabel: { color: '#94A3B8', fontSize: 10 },
      splitLine: { lineStyle: { color: '#1E3A5F', type: 'dashed' } }
    },
    series: [{
      type: 'bar',
      data: bins.map(b => b.count),
      itemStyle: {
        color: {
          type: 'linear',
          x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: '#17A2B8' },
            { offset: 1, color: '#0E6E7D' }
          ]
        },
        borderRadius: [4, 4, 0, 0]
      }
    }]
  };

  return (
    <div className="h-full w-full p-2">
      <ReactECharts option={option} style={{ height: '100%', width: '100%' }} />
    </div>
  );
}
