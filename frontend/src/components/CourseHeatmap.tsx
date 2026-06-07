import React, { useEffect, useState } from 'react';
import { Table, Button, Space, Spin, Progress, Tag } from 'antd';
import { DownloadOutlined, FireOutlined } from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import { useFilterStore } from '@/store/useFilterStore';
import { apiService } from '@/services/api';
import { CourseHeatmapResponse, CourseData } from '@/types';

const CourseHeatmap: React.FC = () => {
  const { filters } = useFilterStore();
  const [data, setData] = useState<CourseHeatmapResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'chart'>('chart');

  useEffect(() => {
    loadData();
  }, [filters]);

  const loadData = async () => {
    try {
      setLoading(true);
      const result = await apiService.getCourseHeatmap(filters);
      setData(result);
    } catch (error) {
      console.error('加载课程热度失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    const url = apiService.exportCoachLoad(filters);
    window.open(url, '_blank');
  };

  const getHotColor = (score: number) => {
    if (score >= 0.7) return '#f5222d';
    if (score >= 0.5) return '#fa8c16';
    if (score >= 0.3) return '#faad14';
    return '#8c8c8c';
  };

  const columns = [
    {
      title: '课程名称',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record: CourseData) => (
        <span>
          {name}
          <Tag style={{ marginLeft: 8 }}>{record.category}</Tag>
        </span>
      ),
    },
    {
      title: '预约量',
      dataIndex: 'total_bookings',
      key: 'total_bookings',
      sorter: (a: CourseData, b: CourseData) => a.total_bookings - b.total_bookings,
    },
    {
      title: '预约率',
      dataIndex: 'booking_rate',
      key: 'booking_rate',
      render: (rate: number) => (
        <Progress 
          percent={+(rate * 100).toFixed(0)} 
          size="small"
          strokeColor="#1890ff"
        />
      ),
      sorter: (a: CourseData, b: CourseData) => a.booking_rate - b.booking_rate,
    },
    {
      title: '签到率',
      dataIndex: 'checkin_rate',
      key: 'checkin_rate',
      render: (rate: number) => `${(rate * 100).toFixed(1)}%`,
      sorter: (a: CourseData, b: CourseData) => a.checkin_rate - b.checkin_rate,
    },
    {
      title: '取消率',
      dataIndex: 'cancel_rate',
      key: 'cancel_rate',
      render: (rate: number) => (
        <span style={{ color: rate > 0.3 ? '#ff4d4f' : 'inherit' }}>
          {(rate * 100).toFixed(1)}%
        </span>
      ),
      sorter: (a: CourseData, b: CourseData) => a.cancel_rate - b.cancel_rate,
    },
    {
      title: '热度指数',
      dataIndex: 'hot_score',
      key: 'hot_score',
      render: (score: number) => (
        <span style={{ color: getHotColor(score), fontWeight: 500 }}>
          <FireOutlined style={{ marginRight: 4 }} />
          {(score * 100).toFixed(0)}
        </span>
      ),
      sorter: (a: CourseData, b: CourseData) => a.hot_score - b.hot_score,
      defaultSortOrder: 'descend' as const,
    },
  ];

  const getChartOption = () => {
    if (!data?.courses?.length) return {};

    const sortedCourses = [...data.courses].sort((a, b) => b.hot_score - a.hot_score);
    const names = sortedCourses.map(c => c.name);
    const hotScores = sortedCourses.map(c => +(c.hot_score * 100).toFixed(0));
    const bookingRates = sortedCourses.map(c => +(c.booking_rate * 100).toFixed(1));
    const checkinRates = sortedCourses.map(c => +(c.checkin_rate * 100).toFixed(1));

    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow',
        },
      },
      legend: {
        data: ['热度指数', '预约率', '签到率'],
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        data: names,
        axisLabel: {
          rotate: 30,
          interval: 0,
        },
      },
      yAxis: {
        type: 'value',
        max: 100,
        axisLabel: {
          formatter: '{value}%',
        },
      },
      series: [
        {
          name: '热度指数',
          type: 'bar',
          data: hotScores,
          itemStyle: {
            color: {
              type: 'linear',
              x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: '#ff4d4f' },
                { offset: 1, color: '#ffa940' },
              ],
            },
          },
        },
        {
          name: '预约率',
          type: 'line',
          data: bookingRates,
          smooth: true,
          itemStyle: { color: '#1890ff' },
        },
        {
          name: '签到率',
          type: 'line',
          data: checkinRates,
          smooth: true,
          itemStyle: { color: '#52c41a' },
        },
      ],
    };
  };

  if (loading) {
    return (
      <div className="card-section" style={{ textAlign: 'center', padding: '40px' }}>
        <Spin />
      </div>
    );
  }

  return (
    <div className="card-section">
      <div className="card-header">
        <div className="card-title">
          <FireOutlined style={{ color: '#fa8c16', marginRight: 8 }} />
          课程热度分析
        </div>
        <Space>
          <Button.Group>
            <Button 
              type={viewMode === 'chart' ? 'primary' : 'default'}
              onClick={() => setViewMode('chart')}
            >
              柱状图
            </Button>
            <Button 
              type={viewMode === 'table' ? 'primary' : 'default'}
              onClick={() => setViewMode('table')}
            >
              表格
            </Button>
          </Button.Group>
          <Button icon={<DownloadOutlined />} onClick={handleExport}>
            导出
          </Button>
        </Space>
      </div>

      {data?.warnings?.map((warning, idx) => (
        <div key={idx} className="sample-warning">
          ⚠️ {warning}
        </div>
      ))}

      {viewMode === 'chart' ? (
        <div className="chart-container">
          <ReactECharts option={getChartOption()} style={{ height: '100%' }} />
        </div>
      ) : (
        <Table
          columns={columns}
          dataSource={data?.courses || []}
          pagination={{ pageSize: 10 }}
          rowKey="course_id"
        />
      )}
    </div>
  );
};

export default CourseHeatmap;
