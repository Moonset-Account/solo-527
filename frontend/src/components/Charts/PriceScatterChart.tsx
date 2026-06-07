import React from 'react';
import ReactECharts from 'echarts-for-react';
import { PriceScatterData, CONDITION_COLORS } from '../../types';

interface PriceScatterChartProps {
  data: PriceScatterData[];
  onPointClick?: (data: PriceScatterData) => void;
}

const PriceScatterChart: React.FC<PriceScatterChartProps> = ({ data, onPointClick }) => {
  const conditionGroups: Record<string, PriceScatterData[]> = {};

  data.forEach((item) => {
    if (!conditionGroups[item.condition]) {
      conditionGroups[item.condition] = [];
    }
    conditionGroups[item.condition].push(item);
  });

  const series = Object.entries(conditionGroups).map(([condition, items]) => ({
    name: condition,
    type: 'scatter',
    data: items.map((item) => [
      item.recycle_price,
      item.sale_price || 0,
      item,
    ]),
    itemStyle: {
      color: CONDITION_COLORS[condition] || '#999',
      opacity: 0.7,
    },
    symbolSize: (data: any) => {
      const item = data[2] as PriceScatterData;
      const baseSize = 12;
      const abnormalBonus = item.is_abnormal ? 8 : 0;
      const setBonus = item.is_set ? 4 : 0;
      return baseSize + abnormalBonus + setBonus;
    },
  }));

  const option = {
    title: {
      text: '价格散点图',
      subtext: '横坐标：回收价，纵坐标：成交价，点大小：异常/套装标记',
      left: 'center',
    },
    tooltip: {
      trigger: 'item',
      formatter: (params: any) => {
        const item = params.data[2] as PriceScatterData;
        return `
          <div style="font-weight: bold; margin-bottom: 8px;">${item.title}</div>
          <div>ISBN: ${item.isbn}</div>
          <div>品相: ${item.condition}</div>
          <div>回收价: ¥${item.recycle_price}</div>
          <div>建议价: ¥${item.suggested_price || '-'}</div>
          <div>成交价: ¥${item.sale_price || '未售出'}</div>
          <div>渠道: ${item.channel}</div>
          <div>在库天数: ${item.days_in_stock}天</div>
          <div>毛利率: ${item.profit_margin ? item.profit_margin + '%' : '-'}</div>
          ${item.is_abnormal ? '<div style="color: #f5222d;">⚠️ 价格异常</div>' : ''}
          ${item.is_set ? '<div style="color: #1890ff;">📚 套装书</div>' : ''}
        `;
      },
    },
    legend: {
      data: Object.keys(conditionGroups),
      bottom: 10,
    },
    grid: {
      left: '10%',
      right: '10%',
      top: '15%',
      bottom: '15%',
    },
    xAxis: {
      name: '回收价 (元)',
      nameLocation: 'middle',
      nameGap: 30,
      type: 'value',
      scale: true,
    },
    yAxis: {
      name: '成交价 (元)',
      nameLocation: 'middle',
      nameGap: 40,
      type: 'value',
      scale: true,
    },
    series,
  };

  const onChartClick = (params: any) => {
    if (onPointClick && params.data && params.data[2]) {
      onPointClick(params.data[2] as PriceScatterData);
    }
  };

  return (
    <ReactECharts
      option={option}
      style={{ height: 500 }}
      onEvents={{ click: onChartClick }}
    />
  );
};

export default PriceScatterChart;
