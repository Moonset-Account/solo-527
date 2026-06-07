import React, { useEffect, useState } from 'react';
import { Table, Button, Space, Spin, Progress, Tag } from 'antd';
import { DownloadOutlined, TeamOutlined } from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import { useFilterStore } from '@/store/useFilterStore';
import { apiService } from '@/services/api';
import { CoachLoadResponse, CoachData } from '@/types';

const CoachLoad: React.FC = () => {
  const { filters } = useFilterStore();
  const [data, setData] = useState<CoachLoadResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'chart'>('chart');

  useEffect(() => {
    loadData();
  }, [filters]);

  const loadData = async () => {
    try {
      setLoading(true);
      const result = await apiService.getCoachLoad(filters);
      setData(result);
    } catch (error) {
      console.error('加载教练负载失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    const url = apiService.exportCoachLoad(filters);
    window.open(url, '_blank');
  };

  const getWorkloadColor = (hours: number) => {
    if (hours >= 30) return '#ff4d4f';
    if (hours >= 20) return '#faad14';
    return '#52c41a';
  };

  const columns = [
    {
      title: '教练姓名',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record: CoachData) => (
        <span>
          {name}
          <Tag style={{ marginLeft: 8 }} color="blue">{record.level}</Tag>
        </span>
      ),
    },
    {
      title: '所属门店',
      dataIndex: 'store',
      key: 'store',
    },
    {
      title: '周均课时',
      dataIndex: 'weekly_hours',
      key: 'weekly_hours',
      render: (hours: number) => (
        <span style={{ color: getWorkloadColor(hours), fontWeight: 500 }}>
          {hours} 小时
        </span>
      ),
      sorter: (a: CoachData, b: CoachData) => a.weekly_hours - b.weekly_hours,
    },
    {
      title: '学员数',
      dataIndex: 'student_count',
      key: 'student_count',
      sorter: (a: CoachData, b: CoachData) => a.student_count - b.student_count,
    },
    {
      title: '私教转化率',
      dataIndex: 'pt_conversion',
      key: 'pt_conversion',
      render: (rate: number) => `${(rate * 100).toFixed(1)}%`,
      sorter: (a: CoachData, b: CoachData) => a.pt_conversion - b.pt_conversion,
    },
    {
      title: '学员留存率',
      dataIndex: 'retention_rate',
      key: 'retention_rate',
      render: (rate: number) => (
        <Progress 
          percent={+(rate * 100).toFixed(0)} 
          size="small"
          strokeColor={rate >= 0.7 ? '#52c41a' : rate >= 0.5 ? '#faad14' : '#ff4d4f'}
        />
      ),
      sorter: (a: CoachData, b: CoachData) => a.retention_rate - b.retention_rate,
    },
  ];

  const getChartOption = () => {
    if (!data?.coaches?.length) return {};

    const sortedCoaches = [...data.coaches].sort((a, b) => b.weekly_hours - a.weekly_hours);
    const names = sortedCoaches.map(c => c.name);
    const weeklyHours = sortedCoaches.map(c => c.weekly_hours);
    const studentCounts = sortedCoaches.map(c => c.student_count);
    const retentionRates = sortedCoaches.map(c => +(c.retention_rate * 100).toFixed(1));

    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
      },
      legend: {
        data: ['周均课时', '学员数', '学员留存率'],
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
      yAxis: [
        {
          type: 'value',
          name: '课时/人数',
          position: 'left',
        },
        {
          type: 'value',
          name: '留存率',
          position: 'right',
          max: 100,
          axisLabel: {
            formatter: '{value}%',
          },
        },
      ],
      series: [
        {
          name: '周均课时',
          type: 'bar',
          data: weeklyHours,
          itemStyle: { color: '#1890ff' },
        },
        {
          name: '学员数',
          type: 'bar',
          data: studentCounts,
          itemStyle: { color: '#722ed1' },
        },
        {
          name: '学员留存率',
          type: 'line',
          yAxisIndex: 1,
          data: retentionRates,
          smooth: true,
          itemStyle: { color: '#52c41a' },
          lineStyle: { width: 3 },
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
          <TeamOutlined style={{ color: '#722ed1', marginRight: 8 }} />
          教练负载分析
        </div>
        <Space>
          <Button.Group>
            <Button 
              type={viewMode === 'chart' ? 'primary' : 'default'}
              onClick={() => setViewMode('chart')}
            >
              对比图
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
          dataSource={data?.coaches || []}
          pagination={{ pageSize: 10 }}
          rowKey="coach_id"
        />
      )}
    </div>
  );
};

export default CoachLoad;
