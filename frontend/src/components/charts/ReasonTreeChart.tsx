import React from 'react';
import ReactECharts from 'echarts-for-react';
import { Card, Typography, Empty, Spin } from 'antd';
import { useDashboardStore } from '../../store/dashboard';

const { Title, Text } = Typography;

export const ReasonTreeChart: React.FC = () => {
  const { dashboardData, loading, setFilters, setDrillDown, activeDrillDown } = useDashboardStore();
  const reasonTree = dashboardData?.reason_tree || [];

  const handleClick = (params: any) => {
    if (params.data?.name) {
      if (params.treePathInfo?.length === 1) {
        setFilters({ return_reasons_level1: [params.data.name] });
        setDrillDown('reason_level1', { return_reasons_level1: [params.data.name] });
      }
    }
  };

  const getOption = () => {
    return {
      title: {
        text: '',
        left: 'center'
      },
      tooltip: {
        formatter: (params: any) => {
          const data = params.data;
          return `
            <div style="font-weight: 600; margin-bottom: 4px;">${data.name}</div>
            <div>退货数量: <b>${data.value}</b> 单</div>
            <div>退货金额: <b>¥${data.amount?.toLocaleString()}</b></div>
          `;
        }
      },
      series: [{
        type: 'tree',
        data: reasonTree.length > 0 ? reasonTree : [{ name: '暂无数据', value: 0, amount: 0 }],
        top: '5%',
        left: '15%',
        bottom: '5%',
        right: '20%',
        symbolSize: 12,
        orient: 'LR',
        label: {
          position: 'left',
          verticalAlign: 'middle',
          align: 'right',
          fontSize: 12,
          formatter: (params: any) => {
            const name = params.name.length > 8 ? params.name.slice(0, 8) + '...' : params.name;
            return `${name} (${params.value})`;
          }
        },
        leaves: {
          label: {
            position: 'right',
            verticalAlign: 'middle',
            align: 'left'
          }
        },
        emphasis: {
          focus: 'descendant'
        },
        expandAndCollapse: true,
        initialTreeDepth: 2,
        animationDuration: 550,
        animationDurationUpdate: 750,
        lineStyle: {
          color: '#1890ff',
          width: 1.5
        },
        itemStyle: {
          color: '#1890ff',
          borderColor: '#fff',
          borderWidth: 2
        }
      }]
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
          <Title level={5} style={{ margin: 0 }}>退货原因树图</Title>
          {activeDrillDown && (
            <Text type="success" style={{ fontSize: 12 }}>已下钻 · 点击图表节点联动筛选</Text>
          )}
        </div>
      }
      extra={<Text type="secondary" style={{ fontSize: 12 }}>点击节点可下钻筛选</Text>}
    >
      {reasonTree.length === 0 ? (
        <Empty description="暂无数据" />
      ) : (
        <ReactECharts
          option={getOption()}
          style={{ height: 320 }}
          onEvents={{ click: handleClick }}
          opts={{ renderer: 'canvas' }}
        />
      )}
    </Card>
  );
};
