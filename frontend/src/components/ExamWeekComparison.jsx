import React, { useEffect, useState } from 'react';
import ReactECharts from 'echarts-for-react';
import { Spin, Card, Row, Col, Statistic } from 'antd';
import ChartHeader from './ChartHeader';
import { getExamWeekComparison } from '../services/api';
import { ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';

const ExamWeekComparison = () => {
  const [data, setData] = useState([]);
  const [updateTime, setUpdateTime] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await getExamWeekComparison();
      setData(res.data.data || []);
      setUpdateTime(res.data.update_time);
    } catch (error) {
      console.error('获取考试周对比数据失败:', error);
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
        axisPointer: { type: 'shadow' }
      },
      legend: {
        data: ['考试周利用率', '普通周利用率', '考试周爽约率', '普通周爽约率'],
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
        data: data.map(d => d.semester)
      },
      yAxis: [
        {
          type: 'value',
          name: '利用率 (%)',
          max: 100
        },
        {
          type: 'value',
          name: '爽约率 (%)',
          position: 'right',
          max: 30
        }
      ],
      series: [
        {
          name: '考试周利用率',
          type: 'bar',
          data: data.map(d => d.exam_utilization),
          itemStyle: { color: '#ff4d4f' },
          barWidth: '15%'
        },
        {
          name: '普通周利用率',
          type: 'bar',
          data: data.map(d => d.normal_utilization),
          itemStyle: { color: '#52c41a' },
          barWidth: '15%'
        },
        {
          name: '考试周爽约率',
          type: 'line',
          yAxisIndex: 1,
          data: data.map(d => d.exam_no_show_rate),
          itemStyle: { color: '#ff7a45' },
          lineStyle: { width: 3 },
          symbol: 'circle',
          symbolSize: 10
        },
        {
          name: '普通周爽约率',
          type: 'line',
          yAxisIndex: 1,
          data: data.map(d => d.normal_no_show_rate),
          itemStyle: { color: '#73d13d' },
          lineStyle: { width: 3 },
          symbol: 'circle',
          symbolSize: 10
        }
      ]
    };
  };

  const getLatestComparison = () => {
    if (!data || data.length === 0) return null;
    const latest = data[data.length - 1];
    const utilChange = latest.exam_utilization - latest.normal_utilization;
    const noShowChange = latest.exam_no_show_rate - latest.normal_no_show_rate;
    
    return { latest, utilChange, noShowChange };
  };

  const comparison = getLatestComparison();

  return (
    <div className="chart-container">
      <ChartHeader
        title="考试周 vs 普通周 数据对比"
        sampleSize={comparison ? comparison.latest.exam_sample_size + comparison.latest.normal_sample_size : 0}
        updateTime={updateTime}
      />
      {comparison && (
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={12}>
            <Card size="small">
              <Statistic
                title="利用率变化 (考试周 vs 普通周)"
                value={Math.abs(comparison.utilChange)}
                precision={1}
                suffix="%"
                prefix={comparison.utilChange > 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
                valueStyle={{ color: comparison.utilChange > 0 ? '#ff4d4f' : '#52c41a' }}
              />
            </Card>
          </Col>
          <Col span={12}>
            <Card size="small">
              <Statistic
                title="爽约率变化 (考试周 vs 普通周)"
                value={Math.abs(comparison.noShowChange)}
                precision={1}
                suffix="%"
                prefix={comparison.noShowChange > 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
                valueStyle={{ color: comparison.noShowChange > 0 ? '#ff4d4f' : '#52c41a' }}
              />
            </Card>
          </Col>
        </Row>
      )}
      {loading ? (
        <div style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Spin />
        </div>
      ) : (
        <ReactECharts option={getOption()} style={{ height: 300 }} />
      )}
    </div>
  );
};

export default ExamWeekComparison;
