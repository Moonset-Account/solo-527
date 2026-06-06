import React from 'react';
import ReactECharts from 'echarts-for-react';
import { Card, Typography, Empty, Spin } from 'antd';
import { useDashboardStore } from '../../store/dashboard';
import { FilterState } from '../../types';

const { Title, Text } = Typography;

const CYCLE_BUCKET_MAP: Record<string, { min: number; max?: number }> = {
  '0-1天': { min: 0, max: 1 },
  '1-3天': { min: 1, max: 3 },
  '3-7天': { min: 3, max: 7 },
  '7-15天': { min: 7, max: 15 },
  '15-30天': { min: 15, max: 30 },
  '30天以上': { min: 30 },
};

export const CycleDistributionChart: React.FC = () => {
  const { dashboardData, loading, setFilters, setDrillDown, activeDrillDown } = useDashboardStore();
  const data = dashboardData?.cycle_distribution || [];

  const handleClick = (params: any) => {
    const bucketName = params.name || params.axisValue;
    if (bucketName && CYCLE_BUCKET_MAP[bucketName]) {
      const range = CYCLE_BUCKET_MAP[bucketName];
      const drillFilters: FilterState = {
        status: ['completed'],
        min_refund_days: range.min,
      };
      if (range.max !== undefined) {
        drillFilters.max_refund_days = range.max;
      }
      setFilters(drillFilters);
      setDrillDown('cycle_bucket', drillFilters);
    }
  };

  const getOption = () => {
    const buckets = data.map(d => d.bucket);
    const counts = data.map(d => d.count);
    const avgDays = data.map(d => d.avg_days);

    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'cross' },
        formatter: (params: any) => {
          const countItem = params.find((p: any) => p.seriesName === '退货单数');
          const avgItem = params.find((p: any) => p.seriesName === '平均天数');
          return `
            <div style="font-weight: 600; margin-bottom: 4px;">${countItem?.axisValue}</div>
            <div>退货单数: <b>${countItem?.value || 0}</b> 单</div>
            <div>平均退款周期: <b>${avgItem?.value || 0}</b> 天</div>
          `;
        }
      },
      legend: {
        data: ['退货单数', '平均天数'],
        top: 0
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        top: '15%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: buckets,
        axisLabel: { fontSize: 11, rotate: 0 },
        axisTick: { alignWithLabel: true }
      },
      yAxis: [
        {
          type: 'value',
          name: '单数',
          position: 'left',
          axisLabel: { fontSize: 11 }
        },
        {
          type: 'value',
          name: '天数',
          position: 'right',
          axisLabel: { fontSize: 11 },
          splitLine: { show: false }
        }
      ],
      series: [
        {
          name: '退货单数',
          type: 'bar',
          data: counts,
          barWidth: '40%',
          itemStyle: {
            color: {
              type: 'linear',
              x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: '#1890ff' },
                { offset: 1, color: '#69c0ff' }
              ]
            },
            borderRadius: [4, 4, 0, 0]
          },
          label: {
            show: true,
            position: 'top',
            fontSize: 11
          }
        },
        {
          name: '平均天数',
          type: 'line',
          yAxisIndex: 1,
          data: avgDays,
          smooth: true,
          symbol: 'circle',
          symbolSize: 8,
          lineStyle: { color: '#faad14', width: 2 },
          itemStyle: { color: '#faad14' },
          label: {
            show: true,
            position: 'top',
            fontSize: 11,
            formatter: '{c}天'
          }
        }
      ]
    };
  };

  if (loading) {
    return (
      <Card size="small">
        <Spin />
      </Card>
    );
  }

  return (
    <Card
      size="small"
      title={
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Title level={5} style={{ margin: 0 }}>退款周期分布</Title>
          {activeDrillDown && (
            <Text type="success" style={{ fontSize: 12 }}>已下钻</Text>
          )}
        </div>
      }
      extra={<Text type="secondary" style={{ fontSize: 12 }}>柱状图+折线图，看周期分布和效率</Text>}
    >
      {data.length === 0 ? (
        <Empty description="暂无数据" />
      ) : (
        <ReactECharts
          option={getOption()}
          style={{ height: 300 }}
          onEvents={{ click: handleClick }}
          opts={{ renderer: 'canvas' }}
        />
      )}
    </Card>
  );
};
