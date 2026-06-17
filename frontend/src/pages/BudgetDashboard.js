import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Statistic, Progress, Table, Tag, Button, Space } from 'antd';
import {
  DollarOutlined,
  AlertOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  DownloadOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';

const BudgetDashboard = () => {
  const [data, setData] = useState(null);
  const [warnings, setWarnings] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [dashboardRes, warningsRes] = await Promise.all([
        api.get('/budgets/dashboard/'),
        api.get('/budgets/warnings/?is_resolved=false'),
      ]);
      setData(dashboardRes.data);
      setWarnings(warningsRes.data.results || warningsRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const chartOption = data ? {
    tooltip: { trigger: 'axis' },
    legend: { data: ['预算金额', '实际支出', '变更金额'] },
    xAxis: { type: 'category', data: (data.projects || []).map(p => p.project_name) },
    yAxis: { type: 'value' },
    series: [
      { name: '预算金额', type: 'bar', data: (data.projects || []).map(p => p.budget_amount) },
      { name: '实际支出', type: 'bar', data: (data.projects || []).map(p => p.budget_amount * 0.7) },
      { name: '变更金额', type: 'bar', data: (data.projects || []).map(p => p.change_amount) },
    ],
  } : {};

  const columns = [
    { title: '项目编号', dataIndex: 'project_code', key: 'project_code' },
    { title: '项目名称', dataIndex: 'project_name', key: 'project_name' },
    {
      title: '预算金额',
      dataIndex: 'budget_amount',
      key: 'budget_amount',
      render: (v) => `¥${v?.toLocaleString()}`,
    },
    {
      title: '变更金额',
      dataIndex: 'change_amount',
      key: 'change_amount',
      render: (v) => <span className="text-warning">¥{v?.toLocaleString()}</span>,
    },
    {
      title: '总金额',
      dataIndex: 'total_with_changes',
      key: 'total_with_changes',
      render: (v) => <span className="text-primary">¥{v?.toLocaleString()}</span>,
    },
    {
      title: '预警数',
      dataIndex: 'warning_count',
      key: 'warning_count',
      render: (v) => v > 0 ? <Tag color="red">{v}</Tag> : <Tag color="green">0</Tag>,
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Button size="small" icon={<EyeOutlined />} onClick={() => navigate(`/budgets/${record.budget_id}`)}>
            查看
          </Button>
          <Button
            size="small"
            icon={<DownloadOutlined />}
            onClick={() => window.open(`/api/budgets/${record.budget_id}/export_excel/`, '_blank')}
          >
            下载
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="page-container">
      <div className="page-header">
        <h2 className="page-title">预算看板</h2>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="预算总额"
              value={data?.summary?.total_budget || 0}
              precision={2}
              prefix={<DollarOutlined />}
              suffix="元"
              valueStyle={{ color: '#1677ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="材料成本"
              value={data?.summary?.total_material || 0}
              precision={2}
              prefix={<DollarOutlined />}
              suffix="元"
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="人工成本"
              value={data?.summary?.total_labor || 0}
              precision={2}
              prefix={<DollarOutlined />}
              suffix="元"
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="活跃预警"
              value={data?.summary?.active_warnings || 0}
              prefix={<AlertOutlined />}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <Card title="各项目预算执行情况" loading={loading}>
            <ReactECharts option={chartOption} style={{ height: 350 }} />
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title="最新预警" loading={loading} extra={<Tag color="red">{warnings.length}</Tag>}>
            {warnings.slice(0, 5).map(w => (
              <div key={w.id} style={{ padding: '12px 0', borderBottom: '1px solid #f0f0f0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <WarningOutlined className="text-danger" />
                  <Tag color={w.level === 'danger' ? 'red' : 'orange'}>{w.level_display}</Tag>
                  <strong>{w.title}</strong>
                </div>
                <div style={{ fontSize: 12, color: '#666' }}>{w.message}</div>
                <div style={{ fontSize: 11, color: '#999', marginTop: 4 }}>{w.project_name} · {w.created_at}</div>
              </div>
            ))}
            {warnings.length === 0 && <div style={{ color: '#999', textAlign: 'center', padding: 24 }}>暂无预警</div>}
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col span={24}>
          <Card title="项目预算明细" loading={loading}>
            <Table
              columns={columns}
              dataSource={data?.projects || []}
              rowKey="project_id"
              pagination={false}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default BudgetDashboard;
