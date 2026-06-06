import React, { useEffect, useState } from 'react';
import ReactECharts from 'echarts-for-react';
import { Spin } from 'antd';
import ChartHeader from './ChartHeader';
import { useFilter } from '../context/FilterContext';
import { getNoShowTrend } from '../services/api';
import dayjs from 'dayjs';

const NoShowTrend = () => {
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
      const res = await getNoShowTrend(filters);
      setData(res.data.data || []);
      setMeta({
        sampleSize: res.data.sample_size,
        updateTime: res.data.update_time
      });
    } catch (error) {
      console.error('获取爽约趋势数据失败:', error);
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

    const examWeekData = data.filter(d => d.is_exam_week);
    const normalWeekData = data.filter(d => !d.is_exam_week);

    const markAreas = [];
    let examStart = null;
    
    for (let i = 0; i < data.length; i++) {
      if (data[i].is_exam_week && examStart === null) {
        examStart = i;
      } else if (!data[i].is_exam_week && examStart !== null) {
        markAreas.push([
          { xAxis: examStart, itemStyle: { color: 'rgba(255, 77, 79, 0.1)' } },
          { xAxis: i - 1 }
        ]);
        examStart = null;
      }
    }
    if (examStart !== null) {
      markAreas.push([
        { xAxis: examStart, itemStyle: { color: 'rgba(255, 77, 79, 0.1)' } },
        { xAxis: data.length - 1 }
      ]);
    }

    return {
      tooltip: {
        trigger: 'axis',
        formatter: (params) => {
          const p = params[0];
          const item = data[p.dataIndex];
          return `
            <div style="padding: 8px;">
              <div><strong>${dayjs(item.date).format('YYYY-MM-DD')}</strong></div>
              <div>爽约率: ${item.value.toFixed(2)}%</div>
              <div>样本量: ${item.sample_size}</div>
              <div>${item.is_exam_week ? '<span class="exam-week-badge">考试周</span>' : '<span class="normal-week-badge">普通周</span>'}</div>
            </div>
          `;
        }
      },
      legend: {
        data: ['爽约率', '考试周标记'],
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
        data: data.map(d => dayjs(d.date).format('MM-DD')),
        axisLabel: { rotate: 45, fontSize: 10 }
      },
      yAxis: {
        type: 'value',
        name: '爽约率 (%)',
        max: 30
      },
      series: [
        {
          name: '爽约率',
          type: 'line',
          data: data.map(d => d.value),
          smooth: true,
          lineStyle: { color: '#ff4d4f', width: 2 },
          itemStyle: { color: '#ff4d4f' },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(255, 77, 79, 0.3)' },
                { offset: 1, color: 'rgba(255, 77, 79, 0.05)' }
              ]
            }
          },
          markLine: {
            silent: true,
            data: [{ type: 'average', name: '平均值' }],
            lineStyle: { color: '#faad14' }
          },
          markArea: {
            silent: true,
            data: markAreas
          }
        }
      ]
    };
  };

  return (
    <div className="chart-container">
      <ChartHeader
        title="爽约率趋势图（考试周 vs 普通周）"
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

export default NoShowTrend;
