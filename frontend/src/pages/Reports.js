import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  DatePicker,
  Statistic,
  Row,
  Col,
  Tag,
  Space,
  message,
  Modal,
  Form,
  Select,
} from 'antd';
import {
  BarChartOutlined,
  UserOutlined,
  PlayCircleOutlined,
  DollarOutlined,
  ReloadOutlined,
  CheckOutlined,
  TicketOutlined,
} from '@ant-design/icons';
import { reportsAPI } from '../services/api';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;
const { Option } = Select;

function Reports() {
  const [dashboardData, setDashboardData] = useState(null);
  const [reconciliations, setReconciliations] = useState([]);
  const [screeningsStats, setScreeningsStats] = useState([]);
  const [membersStats, setMembersStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [generateModalVisible, setGenerateModalVisible] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    loadDashboard();
    loadReconciliations();
    loadMembersStats();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const res = await reportsAPI.dashboard();
      setDashboardData(res.data);
    } catch (error) {
      message.error('加载仪表盘数据失败');
    } finally {
      setLoading(false);
    }
  };

  const loadReconciliations = async () => {
    try {
      const res = await reportsAPI.listReconciliations();
      setReconciliations(res.data);
    } catch (error) {
      message.error('加载对账记录失败');
    }
  };

  const loadMembersStats = async () => {
    try {
      const res = await reportsAPI.membersStats();
      setMembersStats(res.data);
    } catch (error) {
      message.error('加载会员统计失败');
    }
  };

  const handleLoadScreeningsStats = async (dates) => {
    if (!dates || dates.length !== 2) return;
    try {
      setLoading(true);
      const res = await reportsAPI.screeningsStats(
        dates[0].format('YYYY-MM-DD'),
        dates[1].format('YYYY-MM-DD')
      );
      setScreeningsStats(res.data);
    } catch (error) {
      message.error('加载场次统计失败');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateReconciliation = async () => {
    try {
      const values = await form.validateFields();
      await reportsAPI.generateReconciliation(values.month);
      message.success('对账单生成成功');
      setGenerateModalVisible(false);
      form.resetFields();
      loadReconciliations();
    } catch (error) {
      message.error('生成对账单失败');
    }
  };

  const handleConfirmReconciliation = async (id) => {
    try {
      await reportsAPI.confirmReconciliation(id);
      message.success('对账已确认');
      loadReconciliations();
    } catch (error) {
      message.error('确认对账失败');
    }
  };

  const reconciliationColumns = [
    {
      title: '月份',
      dataIndex: 'month',
      key: 'month',
      render: (text) => text.replace('-', '年') + '月',
    },
    { title: '场次总数', dataIndex: 'total_screenings', key: 'total_screenings' },
    { title: '报名总数', dataIndex: 'total_bookings', key: 'total_bookings' },
    { title: '签到人数', dataIndex: 'checked_in_count', key: 'checked_in_count' },
    { title: '会员收入', dataIndex: 'member_revenue', key: 'member_revenue' },
    { title: '嘉宾收入', dataIndex: 'guest_revenue', key: 'guest_revenue' },
    { title: '总收入', dataIndex: 'total_revenue', key: 'total_revenue' },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const colors = { draft: 'orange', confirmed: 'green' };
        const labels = { draft: '待确认', confirmed: '已确认' };
        return <Tag color={colors[status]}>{labels[status]}</Tag>;
      },
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space>
          {record.status === 'draft' && (
            <Button
              type="primary"
              size="small"
              icon={<CheckOutlined />}
              onClick={() => handleConfirmReconciliation(record.id)}
            >
              确认
            </Button>
          )}
        </Space>
      ),
    },
  ];

  const screeningsStatsColumns = [
    { title: '日期', dataIndex: 'date', key: 'date' },
    { title: '场次数量', dataIndex: 'count', key: 'count' },
    { title: '总座位数', dataIndex: 'total_seats', key: 'total_seats' },
    { title: '报名数', dataIndex: 'bookings_count', key: 'bookings_count' },
    { title: '签到数', dataIndex: 'checked_in_count', key: 'checked_in_count' },
    {
      title: '上座率',
      dataIndex: 'attendance_rate',
      key: 'attendance_rate',
      render: (rate) => `${(rate * 100).toFixed(1)}%`,
    },
  ];

  const months = [];
  for (let i = 0; i < 12; i++) {
    const month = dayjs().subtract(i, 'month');
    months.push(month.format('YYYY-MM'));
  }

  return (
    <div>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Card title="数据概览" extra={
          <Button icon={<ReloadOutlined />} onClick={loadDashboard} loading={loading}>
            刷新
          </Button>
        }>
          <Row gutter={16}>
            <Col span={6}>
              <Card>
                <Statistic
                  title="今日场次"
                  value={dashboardData?.today_screenings || 0}
                  prefix={<PlayCircleOutlined />}
                  valueStyle={{ color: '#3f8600' }}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="今日报名"
                  value={dashboardData?.today_bookings || 0}
                  prefix={<TicketOutlined />}
                  valueStyle={{ color: '#1890ff' }}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="活跃会员"
                  value={dashboardData?.active_members || 0}
                  prefix={<UserOutlined />}
                  valueStyle={{ color: '#722ed1' }}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="本月收入"
                  value={dashboardData?.monthly_revenue || 0}
                  prefix={<DollarOutlined />}
                  precision={2}
                  valueStyle={{ color: '#cf1322' }}
                />
              </Card>
            </Col>
          </Row>
        </Card>

        <Card title="场次统计">
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <RangePicker onChange={handleLoadScreeningsStats} />
            <Table
              columns={screeningsStatsColumns}
              dataSource={screeningsStats}
              rowKey="date"
              loading={loading}
              pagination={false}
            />
          </Space>
        </Card>

        {membersStats && (
          <Card title="会员统计">
            <Row gutter={16}>
              <Col span={8}>
                <Card>
                  <Statistic title="会员总数" value={membersStats.total_members} />
                </Card>
              </Col>
              <Col span={8}>
                <Card>
                  <Statistic title="活跃会员" value={membersStats.active_members} />
                </Card>
              </Col>
              <Col span={8}>
                <Card>
                  <Statistic title="即将到期" value={membersStats.expiring_soon} />
                </Card>
              </Col>
            </Row>
            <div style={{ marginTop: 16 }}>
              <h4>各等级会员分布</h4>
              <Row gutter={16}>
                {membersStats.by_level?.map((item) => (
                  <Col span={8} key={item.level}>
                    <Card size="small">
                      <Statistic title={item.level_name} value={item.count} />
                    </Card>
                  </Col>
                ))}
              </Row>
            </div>
          </Card>
        )}

        <Card
          title="月度对账"
          extra={
            <Button type="primary" onClick={() => setGenerateModalVisible(true)}>
              生成对账单
            </Button>
          }
        >
          <Table
            columns={reconciliationColumns}
            dataSource={reconciliations}
            rowKey="id"
            loading={loading}
          />
        </Card>
      </Space>

      <Modal
        title="生成月度对账单"
        open={generateModalVisible}
        onOk={handleGenerateReconciliation}
        onCancel={() => setGenerateModalVisible(false)}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="month"
            label="选择月份"
            rules={[{ required: true, message: '请选择月份' }]}
          >
            <Select placeholder="请选择月份">
              {months.map((m) => (
                <Option key={m} value={m}>
                  {m.replace('-', '年') + '月'}
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default Reports;
