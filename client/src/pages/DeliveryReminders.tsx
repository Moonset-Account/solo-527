import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  Select,
  Row,
  Col,
  Statistic,
  message,
  Input,
  Tooltip
} from 'antd';
import {
  BellOutlined,
  WarningOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  EyeOutlined,
  SearchOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useNavigate } from 'react-router-dom';
import { summaryApi } from '@/services/api';
import { DeliveryReminderDto, OrderStatus } from '@/types';
import { formatDate, formatCurrency, getStatusText, getStatusColor } from '@/utils/format';

const { Option } = Select;

const reminderLevelConfig: Record<string, { color: string; bgColor: string; icon: React.ReactNode }> = {
  critical: { color: 'red', bgColor: '#fff1f0', icon: <WarningOutlined style={{ color: '#ff4d4f' }} /> },
  high: { color: 'orange', bgColor: '#fff7e6', icon: <WarningOutlined style={{ color: '#faad14' }} /> },
  medium: { color: 'gold', bgColor: '#fffbe6', icon: <ClockCircleOutlined style={{ color: '#faad14' }} /> },
  low: { color: 'blue', bgColor: '#e6f7ff', icon: <ClockCircleOutlined style={{ color: '#1890ff' }} /> },
  normal: { color: 'green', bgColor: '#f6ffed', icon: <CheckCircleOutlined style={{ color: '#52c41a' }} /> }
};

const getReminderLevelText = (level: string) => {
  const map: Record<string, string> = {
    critical: '紧急',
    high: '高优先级',
    medium: '中优先级',
    low: '低优先级',
    normal: '正常'
  };
  return map[level] || level;
};

const DeliveryReminders: React.FC = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<DeliveryReminderDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [daysAhead, setDaysAhead] = useState<number>(7);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [filterLevel, setFilterLevel] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    loadReminders();
  }, [daysAhead]);

  const loadReminders = async () => {
    setLoading(true);
    try {
      const response = await summaryApi.getDeliveryReminders(daysAhead);
      setData(response.data);
    } catch (error) {
      message.error('加载交付提醒失败');
    } finally {
      setLoading(false);
    }
  };

  const filteredData = data.filter(item => {
    const matchesSearch = !searchKeyword || 
      item.orderNo.toLowerCase().includes(searchKeyword.toLowerCase()) ||
      item.storeName.includes(searchKeyword) ||
      item.productName.includes(searchKeyword);
    const matchesLevel = filterLevel === 'all' || item.reminderLevel === filterLevel;
    const matchesStatus = filterStatus === 'all' || item.status === filterStatus;
    return matchesSearch && matchesLevel && matchesStatus;
  });

  const stats = {
    critical: data.filter(d => d.reminderLevel === 'critical').length,
    high: data.filter(d => d.reminderLevel === 'high').length,
    medium: data.filter(d => d.reminderLevel === 'medium').length,
    overdue: data.filter(d => d.isOverdue).length,
    total: data.length
  };

  const columns: ColumnsType<DeliveryReminderDto> = [
    {
      title: '优先级',
      dataIndex: 'reminderLevel',
      key: 'reminderLevel',
      width: 100,
      fixed: 'left',
      render: (level) => {
        const config = reminderLevelConfig[level] || reminderLevelConfig.normal;
        return (
          <Tag color={config.color} style={{ margin: 0 }}>
            <Space size={4}>
              {config.icon}
              {getReminderLevelText(level)}
            </Space>
          </Tag>
        );
      },
      filters: [
        { text: '紧急', value: 'critical' },
        { text: '高优先级', value: 'high' },
        { text: '中优先级', value: 'medium' },
        { text: '低优先级', value: 'low' },
        { text: '正常', value: 'normal' }
      ],
      onFilter: (value, record) => record.reminderLevel === value
    },
    {
      title: '订单编号',
      dataIndex: 'orderNo',
      key: 'orderNo',
      width: 140,
      render: (text) => <strong>{text}</strong>
    },
    {
      title: '门店',
      dataIndex: 'storeName',
      key: 'storeName',
      width: 120
    },
    {
      title: '产品',
      dataIndex: 'productName',
      key: 'productName',
      width: 150
    },
    {
      title: '数量',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 80
    },
    {
      title: '交付日期',
      dataIndex: 'deliveryDate',
      key: 'deliveryDate',
      width: 120,
      render: (date, record) => (
        <Space direction="vertical" size={0}>
          <span>{formatDate(date)}</span>
          {record.isOverdue ? (
            <Tag color="red" style={{ margin: 0, fontSize: 12 }}>
              已逾期 {Math.abs(record.daysRemaining)} 天
            </Tag>
          ) : record.daysRemaining <= 3 ? (
            <Tag color="orange" style={{ margin: 0, fontSize: 12 }}>
              还剩 {record.daysRemaining} 天
            </Tag>
          ) : (
            <span style={{ color: '#999', fontSize: 12 }}>还剩 {record.daysRemaining} 天</span>
          )}
        </Space>
      ),
      sorter: (a, b) => new Date(a.deliveryDate).getTime() - new Date(b.deliveryDate).getTime()
    },
    {
      title: '订单状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => (
        <Tag color={getStatusColor(status)}>{getStatusText(status)}</Tag>
      )
    },
    {
      title: '操作',
      key: 'action',
      fixed: 'right',
      width: 100,
      render: (_, record) => (
        <Button
          type="link"
          size="small"
          icon={<EyeOutlined />}
          onClick={() => navigate(`/orders/${record.orderId}`)}
        >
          查看
        </Button>
      )
    }
  ];

  return (
    <div style={{ padding: 24 }}>
      <Card
        bordered={false}
        title={
          <Space>
            <BellOutlined style={{ color: '#1890ff' }} />
            <span>交付进度提醒</span>
          </Space>
        }
        extra={
          <Space>
            <Select
              value={daysAhead}
              onChange={setDaysAhead}
              style={{ width: 140 }}
            >
              <Option value={3}>未来3天</Option>
              <Option value={7}>未来7天</Option>
              <Option value={14}>未来14天</Option>
              <Option value={30}>未来30天</Option>
            </Select>
            <Button icon={<ReloadOutlined />} onClick={loadReminders} loading={loading}>
              刷新
            </Button>
          </Space>
        }
      >
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={12} sm={8} md={4}>
            <Card size="small" style={{ background: '#fff1f0' }}>
              <Statistic
                title="紧急"
                value={stats.critical}
                valueStyle={{ color: '#ff4d4f' }}
                prefix={<WarningOutlined />}
              />
            </Card>
          </Col>
          <Col xs={12} sm={8} md={4}>
            <Card size="small" style={{ background: '#fff7e6' }}>
              <Statistic
                title="高优先级"
                value={stats.high}
                valueStyle={{ color: '#faad14' }}
                prefix={<WarningOutlined />}
              />
            </Card>
          </Col>
          <Col xs={12} sm={8} md={4}>
            <Card size="small" style={{ background: '#fffbe6' }}>
              <Statistic
                title="中优先级"
                value={stats.medium}
                valueStyle={{ color: '#faad14' }}
                prefix={<ClockCircleOutlined />}
              />
            </Card>
          </Col>
          <Col xs={12} sm={8} md={4}>
            <Card size="small" style={{ background: '#fff1f0' }}>
              <Statistic
                title="已逾期"
                value={stats.overdue}
                valueStyle={{ color: '#ff4d4f' }}
                prefix={<WarningOutlined />}
              />
            </Card>
          </Col>
          <Col xs={12} sm={8} md={4}>
            <Card size="small" style={{ background: '#f0f5ff' }}>
              <Statistic
                title="待提醒总数"
                value={stats.total}
                valueStyle={{ color: '#1890ff' }}
                prefix={<BellOutlined />}
              />
            </Card>
          </Col>
          <Col xs={12} sm={8} md={4}>
            <Card size="small">
              <Input
                prefix={<SearchOutlined />}
                placeholder="搜索订单/门店/产品"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                allowClear
              />
            </Card>
          </Col>
        </Row>

        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          <Col span={12}>
            <span style={{ marginRight: 8 }}>优先级筛选:</span>
            <Select
              value={filterLevel}
              onChange={setFilterLevel}
              style={{ width: 140 }}
            >
              <Option value="all">全部</Option>
              <Option value="critical">紧急</Option>
              <Option value="high">高优先级</Option>
              <Option value="medium">中优先级</Option>
              <Option value="low">低优先级</Option>
              <Option value="normal">正常</Option>
            </Select>
          </Col>
          <Col span={12}>
            <span style={{ marginRight: 8 }}>状态筛选:</span>
            <Select
              value={filterStatus}
              onChange={setFilterStatus}
              style={{ width: 140 }}
            >
              <Option value="all">全部</Option>
              <Option value={OrderStatus.Pending}>待处理</Option>
              <Option value={OrderStatus.InProduction}>生产中</Option>
              <Option value={OrderStatus.QualityInspecting}>质检中</Option>
              <Option value={OrderStatus.Completed}>已完成</Option>
            </Select>
          </Col>
        </Row>

        <Table
          columns={columns}
          dataSource={filteredData}
          rowKey="orderId"
          loading={loading}
          scroll={{ x: 1000 }}
          pagination={{
            pageSize: 15,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条提醒`
          }}
        />
      </Card>
    </div>
  );
};

export default DeliveryReminders;
