import React from 'react';
import ReactECharts from 'echarts-for-react';
import { Card, Typography, Empty, Spin, Tag, Space } from 'antd';
import { useDashboardStore } from '../../store/dashboard';
import { FilterState } from '../../types';

const { Title, Text } = Typography;

export const ServiceDurationChart: React.FC = () => {
  const { dashboardData, loading, setFilters, setDrillDown, activeDrillDown } = useDashboardStore();
  const data = dashboardData?.service_duration || [];

  const handleClick = (params: any) => {
    const agentName = params.name || params.axisValue;
    if (agentName && agentName !== '未分配') {
      const drillFilters: FilterState = {
        agent_names: [agentName],
        status: ['completed']
      };
      setFilters(drillFilters);
      setDrillDown('agent', drillFilters);
    }
  };

  const getOption = () => {
    const agents = data.map(d => d.agent_name || '未分配');
    const avgDurations = data.map(d => d.avg_duration);
    const medianDurations = data.map(d => d.median_duration);
    const caseCounts = data.map(d => d.case_count);

    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: (params: any) => {
          const avgItem = params.find((p: any) => p.seriesName === '平均时长');
          const medianItem = params.find((p: any) => p.seriesName === '中位时长');
          const countItem = params.find((p: any) => p.seriesName === '工单数');
          return `
            <div style="font-weight: 600; margin-bottom: 4px;">${avgItem?.axisValue}</div>
            <div>处理工单: <b>${countItem?.value || 0}</b> 单</div>
            <div>平均处理时长: <b>${avgItem?.value || 0}</b> 小时</div>
            <div>中位处理时长: <b>${medianItem?.value || 0}</b> 小时</div>
          `;
        }
      },
      legend: {
        data: ['平均时长', '中位时长', '工单数'],
        top: 0
      },
      grid: {
        left: '3%',
        right: '8%',
        bottom: '3%',
        top: '15%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: agents,
        axisLabel: { fontSize: 11, rotate: 30 }
      },
      yAxis: [
        {
          type: 'value',
          name: '小时',
          position: 'left',
          axisLabel: { fontSize: 11 }
        },
        {
          type: 'value',
          name: '单数',
          position: 'right',
          axisLabel: { fontSize: 11 },
          splitLine: { show: false }
        }
      ],
      series: [
        {
          name: '平均时长',
          type: 'bar',
          data: avgDurations,
          barWidth: '25%',
          itemStyle: {
            color: '#722ed1',
            borderRadius: [4, 4, 0, 0]
          }
        },
        {
          name: '中位时长',
          type: 'bar',
          data: medianDurations,
          barWidth: '25%',
          itemStyle: {
            color: '#13c2c2',
            borderRadius: [4, 4, 0, 0]
          }
        },
        {
          name: '工单数',
          type: 'line',
          yAxisIndex: 1,
          data: caseCounts,
          smooth: true,
          symbol: 'circle',
          symbolSize: 6,
          lineStyle: { color: '#fa8c16', width: 2 },
          itemStyle: { color: '#fa8c16' }
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
          <Title level={5} style={{ margin: 0 }}>客服处理时长分析</Title>
          {activeDrillDown && (
            <Text type="success" style={{ fontSize: 12 }}>已下钻</Text>
          )}
        </div>
      }
      extra={
        <Space size="small">
          <Tag color="purple">平均时长</Tag>
          <Tag color="cyan">中位时长</Tag>
          <Tag color="orange">工单数</Tag>
        </Space>
      }
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
