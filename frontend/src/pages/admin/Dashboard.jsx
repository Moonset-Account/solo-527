import { useEffect, useState } from 'react';
import { Row, Col, Card, Statistic, Table, Tag, DatePicker, Space } from 'antd';
import {
  CalendarOutlined,
  ClockCircleOutlined,
  DollarOutlined,
  UserOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  WarningOutlined,
  RiseOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { statisticsApi } from '../../api';

const { RangePicker } = DatePicker;

function Dashboard() {
  const [overview, setOverview] = useState({});
  const [counselorStats, setCounselorStats] = useState([]);
  const [recentRecords, setRecentRecords] = useState([]);
  const [waitlistStats, setWaitlistStats] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState([
    dayjs().subtract(30, 'day'),
    dayjs(),
  ]);

  useEffect(() => {
    loadData();
  }, [dateRange]);

  const loadData = async () => {
    setLoading(true);
    try {
      const startDate = dateRange[0]?.format('YYYY-MM-DD');
      const endDate = dateRange[1]?.format('YYYY-MM-DD');

      const [overviewData, counselorData, recordsData, waitlistData] = await Promise.all([
        statisticsApi.getOverview({ startDate, endDate }),
        statisticsApi.getAppointmentsByCounselor({ startDate, endDate }),
        statisticsApi.getRecentRecords(10),
        statisticsApi.getWaitlistStats(),
      ]);

      setOverview(overviewData);
      setCounselorStats(counselorData);
      setRecentRecords(recordsData);
      setWaitlistStats(waitlistData);
    } catch (error) {
      console.error('加载数据失败', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (dates) => {
    setDateRange(dates);
  };

  const statsCards = [
    {
      title: '总预约数',
      value: overview.totalAppointments || 0,
      icon: <CalendarOutlined style={{ color: '#1890ff', fontSize: 28 }} />,
      color: '#1890ff',
    },
    {
      title: '已完成',
      value: overview.completedCount || 0,
      icon: <CheckCircleOutlined style={{ color: '#52c41a', fontSize: 28 }} />,
      color: '#52c41a',
    },
    {
      title: '爽约数',
      value: overview.noShowCount || 0,
      icon: <CloseCircleOutlined style={{ color: '#ff4d4f', fontSize: 28 }} />,
      color: '#ff4d4f',
    },
    {
      title: '爽约率',
      value: overview.noShowRate || '0%',
      icon: <WarningOutlined style={{ color: '#faad14', fontSize: 28 }} />,
      color: '#faad14',
    },
    {
      title: '支付失败',
      value: overview.paymentFailedCount || 0,
      icon: <DollarOutlined style={{ color: '#eb2f96', fontSize: 28 }} />,
      color: '#eb2f96',
    },
    {
      title: '待退款',
      value: overview.pendingRefundCount || 0,
      icon: <RiseOutlined style={{ color: '#722ed1', fontSize: 28 }} />,
      color: '#722ed1',
    },
    {
      title: '候补中',
      value: overview.waitingWaitlistCount || 0,
      icon: <ClockCircleOutlined style={{ color: '#13c2c2', fontSize: 28 }} />,
      color: '#13c2c2',
    },
    {
      title: '总用户数',
      value: '--',
      icon: <UserOutlined style={{ color: '#fa8c16', fontSize: 28 }} />,
      color: '#fa8c16',
    },
  ];

  const counselorColumns = [
    {
      title: '咨询师',
      dataIndex: 'counselorName',
      key: 'counselorName',
    },
    {
      title: '总预约',
      dataIndex: 'total',
      key: 'total',
    },
    {
      title: '已完成',
      dataIndex: 'completed',
      key: 'completed',
    },
    {
      title: '爽约',
      dataIndex: 'noShow',
      key: 'noShow',
      render: (v) => <span style={{ color: '#ff4d4f' }}>{v}</span>,
    },
    {
      title: '爽约率',
      dataIndex: 'noShowRate',
      key: 'noShowRate',
      render: (v) => <Tag color="orange">{v}</Tag>,
    },
    {
      title: '支付失败',
      dataIndex: 'paymentFailed',
      key: 'paymentFailed',
    },
  ];

  const recordColumns = [
    {
      title: '操作类型',
      dataIndex: 'type',
      key: 'type',
      render: (type) => {
        const typeMap = {
          appointment_create: '创建预约',
          appointment_cancel: '取消预约',
          appointment_complete: '完成预约',
          waitlist_add: '加入候补',
          waitlist_release: '候补释放',
          refund_create: '申请退款',
          refund_approve: '批准退款',
          refund_reject: '拒绝退款',
          schedule_update: '排班变更',
          service_update: '服务变更',
          counselor_update: '咨询师变更',
          other: '其他',
        };
        return typeMap[type] || type;
      },
    },
    {
      title: '操作人',
      dataIndex: ['operator', 'name'],
      key: 'operator',
      render: (v) => v || '--',
    },
    {
      title: '说明',
      dataIndex: 'remarks',
      key: 'remarks',
      ellipsis: true,
    },
    {
      title: '时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => new Date(date).toLocaleString('zh-CN'),
    },
  ];

  const waitlistColumns = [
    { title: '咨询师', dataIndex: 'counselorName', key: 'counselorName' },
    { title: '总候补', dataIndex: 'total', key: 'total' },
    { title: '等待中', dataIndex: 'waiting', key: 'waiting' },
    { title: '已确认', dataIndex: 'confirmed', key: 'confirmed' },
    {
      title: '转化率',
      dataIndex: 'conversionRate',
      key: 'conversionRate',
      render: (v) => <Tag color="green">{v}</Tag>,
    },
  ];

  return (
    <div>
      <div className="flex-between mb-24">
        <h2 style={{ margin: 0 }}>数据看板</h2>
        <Space>
          <span style={{ color: '#999' }}>统计周期：</span>
          <RangePicker
            value={dateRange}
            onChange={handleDateChange}
            allowClear={false}
          />
        </Space>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {statsCards.map((card, index) => (
          <Col span={6} key={index}>
            <Card>
              <div className="flex" style={{ alignItems: 'center', gap: 16 }}>
                <div
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 8,
                    background: `${card.color}15`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {card.icon}
                </div>
                <Statistic title={card.title} value={card.value} />
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      <Row gutter={16}>
        <Col span={14}>
          <Card title="咨询师业绩统计" className="mb-24">
            <Table
              columns={counselorColumns}
              dataSource={counselorStats}
              rowKey="counselorId"
              size="small"
              pagination={false}
            />
          </Card>
          <Card title="候补队列统计">
            <Table
              columns={waitlistColumns}
              dataSource={waitlistStats}
              rowKey="counselorId"
              size="small"
              pagination={false}
            />
          </Card>
        </Col>
        <Col span={10}>
          <Card title="最近操作记录">
            <Table
              columns={recordColumns}
              dataSource={recentRecords}
              rowKey="id"
              size="small"
              pagination={false}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
}

export default Dashboard;
