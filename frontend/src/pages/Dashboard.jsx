import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Statistic, Table, Tag, Button, Space } from 'antd';
import {
  FileTextOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  DollarOutlined,
  ArrowUpOutlined,
  SyncOutlined,
  BellOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import request from '../utils/request.js';
import useAuthStore from '../store/authStore.js';
import dayjs from 'dayjs';

const Dashboard = () => {
  const [stats, setStats] = useState({});
  const [recentBills, setRecentBills] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const isCustomer = user?.role === 'CUSTOMER';

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const [statsRes, billsRes] = await Promise.all([
        request.get('/statistics/dashboard'),
        request.get('/bills', { params: { pageSize: 5 } }),
      ]);
      setStats(statsRes.stats);
      setRecentBills(billsRes.list || []);
    } catch (error) {
      console.error('获取工作台数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusTag = (status) => {
    const statusMap = {
      UNPAID: { color: 'orange', text: '待付款' },
      PARTIAL_PAID: { color: 'blue', text: '部分付款' },
      PAID: { color: 'green', text: '已付款' },
      OVERDUE: { color: 'red', text: '已逾期' },
      DRAFT: { color: 'default', text: '草稿' },
      WRITTEN_OFF: { color: 'purple', text: '已冲销' },
      CANCELLED: { color: 'default', text: '已取消' },
    };
    const config = statusMap[status] || { color: 'default', text: status };
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  const columns = [
    {
      title: '账单编号',
      dataIndex: 'billNo',
      key: 'billNo',
    },
    {
      title: '客户名称',
      dataIndex: ['customer', 'name'],
      key: 'customerName',
      hidden: isCustomer,
    },
    {
      title: '账期',
      dataIndex: 'billPeriod',
      key: 'billPeriod',
    },
    {
      title: '账单金额',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      render: (val) => `¥${Number(val).toLocaleString()}`,
    },
    {
      title: '待收金额',
      dataIndex: 'balanceAmount',
      key: 'balanceAmount',
      render: (val) => <span style={{ color: '#ff4d4f' }}>¥{Number(val).toLocaleString()}</span>,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: getStatusTag,
    },
    {
      title: '到期日期',
      dataIndex: 'dueDate',
      key: 'dueDate',
      render: (val) => dayjs(val).format('YYYY-MM-DD'),
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Button type="link" onClick={() => navigate(`/bills/${record.id}`)}>
          详情
        </Button>
      ),
    },
  ].filter(col => !col.hidden);

  const customerCards = [
    {
      title: '待付款账单',
      value: stats.unpaidBills || 0,
      icon: <ClockCircleOutlined style={{ color: '#faad14', fontSize: 30 }} />,
      color: '#fff7e6',
    },
    {
      title: '已逾期账单',
      value: stats.overdueBills || 0,
      icon: <WarningOutlined style={{ color: '#ff4d4f', fontSize: 30 }} />,
      color: '#fff1f0',
    },
    {
      title: '已付款账单',
      value: stats.paidBills || 0,
      icon: <CheckCircleOutlined style={{ color: '#52c41a', fontSize: 30 }} />,
      color: '#f6ffed',
    },
    {
      title: '待付金额',
      value: `¥${Number(stats.outstandingBalance || 0).toLocaleString()}`,
      icon: <DollarOutlined style={{ color: '#1890ff', fontSize: 30 }} />,
      color: '#e6f7ff',
    },
  ];

  const financeCards = [
    {
      title: '应收总额',
      value: `¥${Number(stats.totalReceivables || 0).toLocaleString()}`,
      icon: <DollarOutlined style={{ color: '#1890ff', fontSize: 30 }} />,
      color: '#e6f7ff',
    },
    {
      title: '已收款',
      value: `¥${Number(stats.totalPaid || 0).toLocaleString()}`,
      icon: <CheckCircleOutlined style={{ color: '#52c41a', fontSize: 30 }} />,
      color: '#f6ffed',
    },
    {
      title: '待收款',
      value: `¥${Number(stats.outstandingBalance || 0).toLocaleString()}`,
      icon: <ClockCircleOutlined style={{ color: '#faad14', fontSize: 30 }} />,
      color: '#fff7e6',
    },
    {
      title: '逾期账单',
      value: stats.overdueBills || 0,
      icon: <WarningOutlined style={{ color: '#ff4d4f', fontSize: 30 }} />,
      color: '#fff1f0',
    },
    {
      title: '未匹配流水',
      value: stats.unmatchedTransactions || 0,
      icon: <SyncOutlined style={{ color: '#722ed1', fontSize: 30 }} />,
      color: '#f9f0ff',
    },
    {
      title: '催收中',
      value: stats.pendingCollections || 0,
      icon: <BellOutlined style={{ color: '#eb2f96', fontSize: 30 }} />,
      color: '#fff0f6',
    },
  ];

  const cards = isCustomer ? customerCards : financeCards;

  return (
    <div>
      <div className="page-header">
        <h2>工作台</h2>
        <p style={{ color: '#666' }}>欢迎回来，{user?.name}</p>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {cards.map((card, index) => (
          <Col xs={24} sm={12} md={8} lg={isCustomer ? 6 : 8} key={index}>
            <Card bordered={false} style={{ borderRadius: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <div
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 12,
                    backgroundColor: card.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 16,
                  }}
                >
                  {card.icon}
                </div>
                <div>
                  <div style={{ color: '#666', fontSize: 14, marginBottom: 4 }}>{card.title}</div>
                  <div style={{ fontSize: 24, fontWeight: 600 }}>{card.value}</div>
                </div>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Card
            title="最近账单"
            extra={
              <Button type="link" onClick={() => navigate('/bills')}>
                查看全部
              </Button>
            }
            bordered={false}
            style={{ borderRadius: 8 }}
          >
            <Table
              dataSource={recentBills}
              columns={columns}
              rowKey="id"
              loading={loading}
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;
