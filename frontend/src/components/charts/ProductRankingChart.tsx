import React from 'react';
import ReactECharts from 'echarts-for-react';
import { Card, Typography, Empty, Spin } from 'antd';
import { useDashboardStore } from '../../store/dashboard';

const { Title, Text } = Typography;

export const ProductRankingChart: React.FC = () => {
  const { dashboardData, loading, setFilters, setDrillDown, activeDrillDown } = useDashboardStore();
  const data = dashboardData?.product_ranking?.slice(0, 15) || [];

  const handleClick = (params: any) => {
    if (params.data?.product_id) {
      setFilters({ product_ids: [params.data.product_id] });
      setDrillDown('product', { product_ids: [params.data.product_id] });
    }
  };

  const getOption = () => {
    const products = data.map(d => d.product_name?.length > 10
      ? d.product_name.slice(0, 10) + '...'
      : d.product_name || `商品${d.product_id}`
    ).reverse();

    const counts = data.map(d => d.return_count).reverse();
    const rates = data.map(d => d.return_rate).reverse();
    const amounts = data.map(d => d.return_amount).reverse();

    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: (params: any) => {
          const idx = params[0]?.dataIndex;
          const item = data[data.length - 1 - idx];
          if (!item) return '';
          return `
            <div style="font-weight: 600; margin-bottom: 4px;">${item.product_name}</div>
            <div>退货数量: <b>${item.return_count}</b> 单</div>
            <div>退货率: <b>${item.return_rate}%</b></div>
            <div>退货金额: <b>¥${item.return_amount?.toLocaleString()}</b></div>
          `;
        }
      },
      grid: {
        left: '3%',
        right: '8%',
        bottom: '3%',
        top: '5%',
        containLabel: true
      },
      xAxis: {
        type: 'value',
        axisLabel: { fontSize: 11 }
      },
      yAxis: {
        type: 'category',
        data: products,
        axisLabel: { fontSize: 11 }
      },
      series: [
        {
          name: '退货数量',
          type: 'bar',
          data: counts.map((c, i) => ({
            value: c,
            product_id: data[data.length - 1 - i]?.product_id,
            itemStyle: {
              color: rates[i] > 10 ? '#f5222d' : rates[i] > 5 ? '#faad14' : '#52c41a',
              borderRadius: [0, 4, 4, 0]
            }
          })),
          barWidth: '55%',
          label: {
            show: true,
            position: 'right',
            fontSize: 11,
            formatter: (p: any) => `${p.value}单 (${rates[p.dataIndex]}%)`
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
          <Title level={5} style={{ margin: 0 }}>商品退货排行 TOP15</Title>
          {activeDrillDown && (
            <Text type="success" style={{ fontSize: 12 }}>已下钻</Text>
          )}
        </div>
      }
      extra={<Text type="secondary" style={{ fontSize: 12 }}>颜色标识退货率：绿=正常 黄=关注 红=预警</Text>}
    >
      {data.length === 0 ? (
        <Empty description="暂无数据" />
      ) : (
        <ReactECharts
          option={getOption()}
          style={{ height: 400 }}
          onEvents={{ click: handleClick }}
          opts={{ renderer: 'canvas' }}
        />
      )}
    </Card>
  );
};
