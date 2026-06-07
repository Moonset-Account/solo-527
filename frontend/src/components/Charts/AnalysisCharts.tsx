import React from 'react';
import { Row, Col, Card } from 'antd';
import ReactECharts from 'echarts-for-react';
import { BookAnalysisData, CONDITION_COLORS } from '../../types';

interface AnalysisChartsProps {
  data: BookAnalysisData[];
}

const AnalysisCharts: React.FC<AnalysisChartsProps> = ({ data }) => {
  const daysInStockOption = {
    title: {
      text: '各书籍平均滞销天数',
      left: 'center',
    },
    tooltip: {
      trigger: 'axis',
      formatter: (params: any) => {
        const p = params[0];
        const item = data[p.dataIndex];
        return `
          <div style="font-weight: bold;">${item.title}</div>
          <div>品相: ${item.condition}</div>
          <div>平均滞销天数: ${item.avg_days_in_stock.toFixed(1)}天</div>
          <div>未售出: ${item.unsold_count}本</div>
        `;
      },
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: data.map((d, i) => `${d.isbn.slice(-4)}_${d.condition}`),
      axisLabel: {
        rotate: 45,
        interval: 0,
        fontSize: 10,
      },
    },
    yAxis: {
      type: 'value',
      name: '天数',
    },
    series: [
      {
        type: 'bar',
        data: data.map((d, i) => ({
          value: d.avg_days_in_stock,
          itemStyle: {
            color: d.avg_days_in_stock > 30 ? '#f5222d' : d.avg_days_in_stock > 15 ? '#faad14' : '#52c41a',
          },
        })),
        markLine: {
          data: [{ yAxis: 30, name: '滞销阈值(30天)', lineStyle: { color: '#f5222d' } }],
        },
      },
    ],
  };

  const profitMarginOption = {
    title: {
      text: '毛利率分布',
      left: 'center',
    },
    tooltip: {
      trigger: 'axis',
      formatter: (params: any) => {
        const p = params[0];
        const item = data[p.dataIndex];
        return `
          <div style="font-weight: bold;">${item.title}</div>
          <div>品相: ${item.condition}</div>
          <div>平均毛利率: ${item.avg_profit_margin ? item.avg_profit_margin.toFixed(2) + '%' : '无数据'}</div>
          <div>平均回收价: ¥${item.avg_recycle_price}</div>
          <div>平均成交价: ¥${item.avg_sale_price || '-'}</div>
        `;
      },
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: data.map((d, i) => `${d.isbn.slice(-4)}_${d.condition}`),
      axisLabel: {
        rotate: 45,
        interval: 0,
        fontSize: 10,
      },
    },
    yAxis: {
      type: 'value',
      name: '毛利率 (%)',
    },
    series: [
      {
        type: 'bar',
        data: data.map((d) => d.avg_profit_margin || 0),
        itemStyle: {
          color: (params: any) => {
            const value = params.value;
            if (value >= 30) return '#52c41a';
            if (value >= 15) return '#1890ff';
            if (value > 0) return '#faad14';
            return '#f5222d';
          },
        },
      },
    ],
  };

  const channelCostOption = {
    title: {
      text: '各渠道平均物流成本',
      left: 'center',
    },
    tooltip: {
      trigger: 'item',
    },
    legend: {
      orient: 'vertical',
      left: 'left',
    },
    series: [
      {
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 10,
          borderColor: '#fff',
          borderWidth: 2,
        },
        label: {
          show: true,
          formatter: '{b}: ¥{c}',
        },
        data: (() => {
          const channelMap: Record<string, { total: number; count: number }> = {};
          data.forEach((d) => {
            d.channels.forEach((ch) => {
              if (!channelMap[ch]) {
                channelMap[ch] = { total: 0, count: 0 };
              }
              channelMap[ch].total += d.avg_logistics_cost;
              channelMap[ch].count += 1;
            });
          });
          return Object.entries(channelMap).map(([name, val]) => ({
            name,
            value: (val.total / val.count).toFixed(2),
          }));
        })(),
      },
    ],
  };

  const turnoverOption = {
    title: {
      text: '库存周转率',
      left: 'center',
    },
    tooltip: {
      trigger: 'axis',
      formatter: (params: any) => {
        const p = params[0];
        const item = data[p.dataIndex];
        return `
          <div style="font-weight: bold;">${item.title}</div>
          <div>品相: ${item.condition}</div>
          <div>周转率: ${(item.turnover_rate * 100).toFixed(1)}%</div>
          <div>已售出: ${item.sold_count}本</div>
          <div>总数量: ${item.total_count}本</div>
        `;
      },
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: data.map((d, i) => `${d.isbn.slice(-4)}_${d.condition}`),
      axisLabel: {
        rotate: 45,
        interval: 0,
        fontSize: 10,
      },
    },
    yAxis: {
      type: 'value',
      name: '周转率 (%)',
      axisLabel: {
        formatter: '{value}%',
      },
    },
    series: [
      {
        type: 'line',
        smooth: true,
        data: data.map((d) => (d.turnover_rate * 100).toFixed(1)),
        areaStyle: {},
        itemStyle: {
          color: '#1890ff',
        },
      },
    ],
  };

  return (
    <Row gutter={[16, 16]}>
      <Col span={12}>
        <Card>
          <ReactECharts option={daysInStockOption} style={{ height: 350 }} />
        </Card>
      </Col>
      <Col span={12}>
        <Card>
          <ReactECharts option={profitMarginOption} style={{ height: 350 }} />
        </Card>
      </Col>
      <Col span={12}>
        <Card>
          <ReactECharts option={channelCostOption} style={{ height: 350 }} />
        </Card>
      </Col>
      <Col span={12}>
        <Card>
          <ReactECharts option={turnoverOption} style={{ height: 350 }} />
        </Card>
      </Col>
    </Row>
  );
};

export default AnalysisCharts;
