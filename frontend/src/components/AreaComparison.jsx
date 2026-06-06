import React, { useEffect, useState } from 'react';
import ReactECharts from 'echarts-for-react';
import { Spin } from 'antd';
import ChartHeader from './ChartHeader';
import { useFilter } from '../context/FilterContext';
import { getAreaComparison } from '../services/api';

const AreaComparison = () => {
  const { filters, handleDrillDown } = useFilter();
  const [data, setData] = useState([]);
  const [meta, setMeta] = useState({ sampleSize: 0, updateTime: null });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, [filters]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await getAreaComparison(filters);
      setData(res.data.data || []);
      setMeta({
        sampleSize: res.data.sample_size,
        updateTime: res.data.update_time
      });
    } catch (error) {
      console.error('获取区域对比数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const getOption = () => {
    if (!data || data.length === 0) {
      return {
        title: { text: '暂无数据', left: 'center', top: 'center', textStyle: { color: '#8c8c8c' } }
      };
    }

    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: (params) => {
          const idx = params[0].dataIndex;
          const item = data[idx];
          return `
            <div style="padding: 8px;">
              <div><strong>${item.area_name}</strong></div>
              <div>利用率: ${item.utilization_rate}%</div>
              <div>爽约率: ${item.no_show_rate}%</div>
              <div>平均等待: ${item.avg_wait_time}分钟</div>
              <div>样本量: ${item.sample_size}</div>
              <div>座位数: ${item.seat_count}</div>
            </div>
          `;
        }
      },
      legend: {
        data: ['利用率(%)', '爽约率(%)', '平均等待(分钟)'],
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
        data: data.map(d => d.area_name),
        axisLabel: { rotate: 30, fontSize: 11 }
      },
      yAxis: [
        {
          type: 'value',
          name: '比率 (%)',
          max: 100
        },
        {
          type: 'value',
          name: '等待时间 (分钟)',
          position: 'right'
        }
      ],
      series: [
        {
          name: '利用率(%)',
          type: 'bar',
          data: data.map(d => d.utilization_rate),
          itemStyle: { color: '#1890ff' },
          barWidth: '20%'
        },
        {
          name: '爽约率(%)',
          type: 'bar',
          data: data.map(d => d.no_show_rate),
          itemStyle: { color: '#ff4d4f' },
          barWidth: '20%'
        },
        {
          name: '平均等待(分钟)',
          type: 'line',
          yAxisIndex: 1,
          data: data.map(d => d.avg_wait_time),
          itemStyle: { color: '#faad14' },
          lineStyle: { width: 3 },
          symbol: 'circle',
          symbolSize: 8
        }
      ]
    };
  };

  const handleChartClick = (params) => {
    if (params.componentType === 'series') {
      const areaName = params.name;
      const area = data.find(d => d.area_name === areaName);
      if (area) {
        console.log('点击区域:', areaName);
      }
    }
  };

  const onEvents = {
    click: handleChartClick
  };

  return (
    <div className="chart-container">
      <ChartHeader
        title="各区域指标对比"
        sampleSize={meta.sampleSize}
        updateTime={meta.updateTime}
        filters={filters}
      />
      {loading ? (
        <div style={{ height: 350, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Spin />
        </div>
      ) : (
        <ReactECharts option={getOption()} onEvents={onEvents} style={{ height: 350 }} />
      )}
    </div>
  );
};

export default AreaComparison;
