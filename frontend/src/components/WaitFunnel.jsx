import React, { useEffect, useState } from 'react';
import ReactECharts from 'echarts-for-react';
import { Spin } from 'antd';
import ChartHeader from './ChartHeader';
import { useFilter } from '../context/FilterContext';
import { getFunnel } from '../services/api';

const WaitFunnel = () => {
  const { filters } = useFilter();
  const [data, setData] = useState([]);
  const [meta, setMeta] = useState({ sampleSize: 0, updateTime: null });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, [filters]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await getFunnel(filters);
      setData(res.data.data || []);
      setMeta({
        sampleSize: res.data.sample_size,
        updateTime: res.data.update_time
      });
    } catch (error) {
      console.error('获取漏斗图数据失败:', error);
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

    const colors = ['#1890ff', '#52c41a', '#faad14', '#fa8c16', '#ff4d4f'];

    const funnelData = data.map((d, i) => ({
      value: d.value,
      name: d.name,
      conversion_rate: d.conversion_rate,
      itemStyle: { color: colors[i] }
    }));

    return {
      tooltip: {
        trigger: 'item',
        formatter: (params) => {
          const d = data[params.dataIndex];
          return `
            <div style="padding: 8px;">
              <div><strong>${d.name}</strong></div>
              <div>人数: ${d.value.toLocaleString()}</div>
              <div>转化率: ${d.conversion_rate.toFixed(1)}%</div>
            </div>
          `;
        }
      },
      legend: {
        data: data.map(d => d.name),
        top: 0,
        orient: 'horizontal'
      },
      series: [
        {
          name: '预约转化漏斗',
          type: 'funnel',
          left: '10%',
          top: 60,
          bottom: 20,
          width: '80%',
          min: 0,
          max: data[0]?.value || 100,
          minSize: '0%',
          maxSize: '100%',
          sort: 'descending',
          gap: 2,
          label: {
            show: true,
            position: 'inside',
            formatter: (params) => `${params.name}\n${params.value.toLocaleString()}`,
            fontSize: 12,
            color: '#fff',
            fontWeight: 'bold'
          },
          labelLine: {
            length: 10,
            lineStyle: { width: 1, type: 'solid' }
          },
          itemStyle: {
            borderColor: '#fff',
            borderWidth: 1
          },
          emphasis: {
            label: {
              fontSize: 14
            }
          },
          data: funnelData
        }
      ]
    };
  };

  return (
    <div className="chart-container">
      <ChartHeader
        title="等待队列转化漏斗"
        sampleSize={meta.sampleSize}
        updateTime={meta.updateTime}
        filters={filters}
      />
      {loading ? (
        <div style={{ height: 350, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Spin />
        </div>
      ) : (
        <ReactECharts option={getOption()} style={{ height: 350 }} />
      )}
    </div>
  );
};

export default WaitFunnel;
