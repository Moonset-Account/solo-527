import React, { useEffect, useState } from 'react';
import { Table, Button, Tag, Space, Typography, Progress, Card, Statistic, Row, Col, Select, DatePicker, message } from 'antd';
import { DownloadOutlined, BarChartOutlined } from '@ant-design/icons';
import { classApi, learningApi } from '@/api';
import SearchFilter, { SearchFilterValues } from '@/components/SearchFilter';
import { STATUS_MAP } from '@/utils/constants';
import dayjs from 'dayjs';

const { Title } = Typography;

const CompletionRate: React.FC = () => {
  const [classList, setClassList] = useState<any[]>([]);
  const [progressData, setProgressData] = useState<any[]>([]);
  const [selectedClass, setSelectedClass] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({ avgRate: 0, totalStudents: 0, completedCount: 0 });

  const loadClasses = async (filters?: SearchFilterValues) => {
    setLoading(true);
    try {
      const result = await classApi.list({ ...filters, pageNum: 1, pageSize: 100 });
      setClassList(result.records || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClasses();
  }, []);

  const loadProgress = async (classId: number) => {
    setLoading(true);
    try {
      const [progress, rate] = await Promise.all([
        learningApi.classProgress(classId),
        classApi.completionRate(classId),
      ]);
      setProgressData(progress || []);
      const completed = (progress || []).filter((p: any) => p.status === 'COMPLETED').length;
      setStats({
        avgRate: Number(rate || 0),
        totalStudents: progress?.length || 0,
        completedCount: completed,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (values: SearchFilterValues) => {
    loadClasses(values);
  };

  const handleExport = () => {
    if (!selectedClass) {
      message.warning('请先选择班级');
      return;
    }
    const headers = ['用户ID', '总课时', '已学课时', '完成率', '状态', '最后学习时间'];
    const rows = progressData.map((p: any) => [
      p.userId,
      p.totalHours,
      p.consumedHours,
      `${p.completionRate}%`,
      STATUS_MAP[p.status]?.text || p.status,
      p.lastStudyAt ? dayjs(p.lastStudyAt).format('YYYY-MM-DD HH:mm') : '-',
    ]);
    const csv = [headers, ...rows].map((r) => r.join(',')).join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `完课率报表_${dayjs().format('YYYYMMDD')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    message.success('导出成功');
  };

  const columns = [
    { title: '用户ID', dataIndex: 'userId', width: 100 },
    {
      title: '总课时',
      dataIndex: 'totalHours',
      width: 100,
      render: (v: number) => `${v} 小时`,
    },
    {
      title: '已学课时',
      dataIndex: 'consumedHours',
      width: 100,
      render: (v: number) => `${v} 小时`,
    },
    {
      title: '完课率',
      dataIndex: 'completionRate',
      width: 200,
      render: (v: number) => <Progress percent={Number(v || 0)} />,
    },
    {
      title: '完成课节',
      dataIndex: 'completedLessons',
      width: 100,
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (v: string) => (
        <Tag color={STATUS_MAP[v]?.color}>{STATUS_MAP[v]?.text || v}</Tag>
      ),
    },
    {
      title: '最后学习',
      dataIndex: 'lastStudyAt',
      width: 160,
      render: (v: string) => (v ? dayjs(v).format('YYYY-MM-DD HH:mm') : '-'),
    },
  ];

  return (
    <div>
      <Title level={3}>完课率统计</Title>

      <SearchFilter
        keywordPlaceholder="搜索班级名称"
        statusOptions={[
          { label: '进行中', value: 'RUNNING' },
          { label: '已结束', value: 'ENDED' },
        ]}
        onSearch={handleSearch}
      />

      <Space style={{ marginBottom: 16 }}>
        <Select
          placeholder="选择班级查看详情"
          style={{ width: 300 }}
          value={selectedClass}
          onChange={(v) => {
            setSelectedClass(v);
            loadProgress(v);
          }}
          allowClear
          options={classList.map((c) => ({ label: c.className, value: c.id }))}
        />
        <Button icon={<DownloadOutlined />} onClick={handleExport}>
          下载完课率报表
        </Button>
      </Space>

      {selectedClass && (
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={8}>
            <Card>
              <Statistic
                title="平均完课率"
                value={stats.avgRate}
                suffix="%"
                prefix={<BarChartOutlined />}
                valueStyle={{ color: stats.avgRate >= 80 ? '#3f8600' : stats.avgRate >= 50 ? '#fa8c16' : '#cf1322' }}
              />
            </Card>
          </Col>
          <Col span={8}>
            <Card>
              <Statistic title="学员总数" value={stats.totalStudents} />
            </Card>
          </Col>
          <Col span={8}>
            <Card>
              <Statistic title="已完成人数" value={stats.completedCount} valueStyle={{ color: '#3f8600' }} />
            </Card>
          </Col>
        </Row>
      )}

      <Table
        loading={loading}
        columns={columns}
        dataSource={selectedClass ? progressData : classList}
        rowKey={(record) => record.id || record.userId}
        pagination={{ pageSize: 20 }}
        scroll={{ x: 900 }}
      />

      {!selectedClass && (
        <div style={{ textAlign: 'center', color: '#999', padding: 20 }}>
          提示：选择上方班级可查看该班级的学员完课率详情
        </div>
      )}
    </div>
  );
};

export default CompletionRate;
