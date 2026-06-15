
import { useState, useEffect } from 'react';
import { Row, Col, Card, Table, Tag, Space, Button, Statistic, Progress, List } from 'antd';
import {
  FileTextOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  ExportOutlined,
  PlusOutlined,
  EyeOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import ReactECharts from 'echarts-for-react';
import { orderApi, summaryApi, storeApi, equipmentApi } from '@/services/api';
import { OrderDto, OrderStatus, StoreSummaryDto, DeliveryReminderDto, EquipmentDto, EquipmentStatus } from '@/types';
import { getOrderStatusText, getOrderStatusColor, formatDate, formatCurrency, getReminderLevelText, getReminderLevelColor } from '@/utils/format';

const Dashboard = () => {
  const navigate = useNavigate();
  const [recentOrders, setRecentOrders] = useState<OrderDto[]>([]);
  const [storeSummaries, setStoreSummaries] = useState<StoreSummaryDto[]>([]);
  const [deliveryReminders, setDeliveryReminders] = useState<DeliveryReminderDto[]>([]);
  const [equipment, setEquipment] = useState<EquipmentDto[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [ordersRes, summaryRes, remindersRes, equipmentRes] = await Promise.all([
        orderApi.getList({ pageSize: 10 }),
        summaryApi.getStoreSummary(),
        summaryApi.getDeliveryReminders(7),
        equipmentApi.getList()
      ]);

      setRecentOrders(ordersRes.data);
      setStoreSummaries(summaryRes.data);
      setDeliveryReminders(remindersRes.data.slice(0, 5));
      setEquipment(equipmentRes.data);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalOrders = storeSummaries.reduce((sum, s) => sum + s.totalOrders, 0);
  const totalAmount = storeSummaries.reduce((sum, s) => sum + s.totalAmount, 0);
  const pendingOrders = storeSummaries.reduce((sum, s) => sum + s.pendingOrders, 0);
  const overdueOrders = storeSummaries.reduce((sum, s) => sum + s.overdueOrders, 0);
  const idleEquipment = equipment.filter(e => e.status === EquipmentStatus.Idle).length;

  const orderStatusChart = {
    tooltip: { trigger: 'item' },
    legend: { bottom: 0 },
    series: [
      {
        name: '订单状态',
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: { borderRadius: 10, borderColor: '#fff', borderWidth: 2 },
        label: { show: false, position: 'center' },
        emphasis: {
          label: { show: true, fontSize: 20, fontWeight: 'bold' }
        },
        labelLine: { show: false },
        data: [
          { value: pendingOrders, name: '待处理', itemStyle: { color: '#d9d9d9' } },
          { value: storeSummaries.reduce((sum, s) => sum + s.inProductionOrders, 0), name: '生产中', itemStyle: { color: '#1890ff' } },
          { value: storeSummaries.reduce((sum, s) => sum + s.qualityFailedOrders, 0), name: '质检不合格', itemStyle: { color: '#ff4d4f' } },
          { value: storeSummaries.reduce((sum, s) => sum + s.completedOrders, 0), name: '已完成', itemStyle: { color: '#52c41a' } },
          { value: storeSummaries.reduce((sum, s) => sum + s.deliveredOrders, 0), name: '已交付', itemStyle: { color: '#13c2c2' } }
        ]
      }
    ]
  };

  const storeChart = {
    tooltip: { trigger: 'axis' },
    legend: { data: ['总订单', '已交付', '金额(万)'] },
    xAxis: {
      type: 'category',
      data: storeSummaries.slice(0, 5).map(s => s.storeName)
    },
    yAxis: [{ type: 'value', name: '订单数' }, { type: 'value', name: '金额(万)' }],
    series: [
      {
        name: '总订单',
        type: 'bar',
        data: storeSummaries.slice(0, 5).map(s => s.totalOrders),
        itemStyle: { color: '#1890ff' }
      },
      {
        name: '已交付',
        type: 'bar',
        data: storeSummaries.slice(0, 5).map(s => s.deliveredOrders),
        itemStyle: { color: '#52c41a' }
      },
      {
        name: '金额(万)',
        type: 'line',
        yAxisIndex: 1,
        data: storeSummaries.slice(0, 5).map(s => (s.totalAmount / 10000).toFixed(1)),
        itemStyle: { color: '#fa8c16' }
      }
    ]
  };

  const columns = [
    {
      title: '订单号',
      dataIndex: 'orderNo',
      key: 'orderNo',
      render: (text: string) => <a onClick={() => navigate(`/orders/${recentOrders.find(o => o.orderNo === text)?.id}`)}>{text}</a>
    },
    {
      title: '门店',
      dataIndex: 'storeName',
      key: 'storeName'
    },
    {
      title: '产品名称',
      dataIndex: 'productName',
      key: 'productName'
    },
    {
      title: '数量',
      dataIndex: 'quantity',
      key: 'quantity',
      render: (q: number, record: OrderDto) => `${q} ${record.unit}`
    },
    {
      title: '金额',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      render: (v: number) => formatCurrency(v)
    },
    {
      title: '交付日期',
      dataIndex: 'deliveryDate',
      key: 'deliveryDate',
      render: (d: string) => formatDate(d)
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (s: OrderStatus) => (
        <Tag color={getOrderStatusColor(s)}>{getOrderStatusText(s)}</Tag>
      )
    },
    {
      title: '操作',
      key: 'actions',
      render: (_: any, record: OrderDto) => (
        <Space>
          <Button size="small" icon={<EyeOutlined />} onClick={() => navigate(`/orders/${record.id}`)}>
            查看
          </Button>
        </Space>
      )
    }
  ];

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ margin: 0 }}>工作台</h2>
            <p style={{ margin: '8px 0 0 0', color: '#888' }}>
              欢迎使用印刷厂订单门店协同台面系统
            </p>
          </div>
          <Space>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/orders/create')}>
              快速录单
            </Button>
            <Button icon={<ExportOutlined />} onClick={() => navigate('/batch-operations')}>
              批量处理
            </Button>
          </Space>
        </div>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={12} md={6}>
          <Card>
            <Statistic
              title="总订单数"
              value={totalOrders}
              prefix={<FileTextOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={12} md={6}>
          <Card>
            <Statistic
              title="总金额"
              value={totalAmount}
              precision={2}
              prefix="¥"
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={12} md={6}>
          <Card>
            <Statistic
              title="待处理订单"
              value={pendingOrders}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={12} md={6}>
          <Card>
            <Statistic
              title="逾期订单"
              value={overdueOrders}
              prefix={<WarningOutlined />}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={24} md={12}>
          <Card title="设备状态" extra={<a onClick={() => navigate('/equipment')}>查看全部</a>}>
            <Row gutter={[8, 8]}>
              <Col span={12}>
                <Card size="small" style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 24, color: '#52c41a', marginBottom: 8 }}>
                    <CheckCircleOutlined />
                  </div>
                  <div style={{ fontSize: 20, fontWeight: 'bold', color: '#52c41a' }}>{idleEquipment}</div>
                  <div style={{ color: '#888', fontSize: 12 }}>空闲设备</div>
                </Card>
              </Col>
              <Col span={12}>
                <Card size="small" style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 24, color: '#1890ff', marginBottom: 8 }}>
                    <ClockCircleOutlined />
                  </div>
                  <div style={{ fontSize: 20, fontWeight: 'bold', color: '#1890ff' }}>
                    {equipment.filter(e => e.status === EquipmentStatus.InUse).length}
                  </div>
                  <div style={{ color: '#888', fontSize: 12 }}>使用中</div>
                </Card>
              </Col>
            </Row>
            <Progress
              style={{ marginTop: 16 }}
              percent={Math.round((idleEquipment / equipment.length) * 100)}
              format={(p) => `${p}% 空闲率`}
            />
          </Card>
        </Col>
        <Col xs={24} sm={24} md={12}>
          <Card title="订单状态分布" extra={<a onClick={() => navigate('/orders')}>查看全部</a>}>
            <ReactECharts option={orderStatusChart} style={{ height: 250 }} />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} md={16}>
          <Card title="最近订单" extra={<a onClick={() => navigate('/orders')}>更多</a>}>
            <Table
              columns={columns}
              dataSource={recentOrders}
              rowKey="id"
              size="small"
              pagination={false}
              loading={loading}
            />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card 
            title="交付提醒" 
            extra={<a onClick={() => navigate('/delivery-reminders')}>更多</a>}
            className="delivery-reminders-card"
          >
            <List
              dataSource={deliveryReminders}
              renderItem={(item) => (
                <List.Item
                  className={`delivery-reminder-card reminder-${item.reminderLevel}`}
                  onClick={() => navigate(`/orders/${item.orderId}`)}
                  style={{ marginBottom: 8, borderRadius: 4 }}
                >
                  <List.Item.Meta
                    title={
                      <Space>
                        <span>{item.orderNo}</span>
                        <Tag color={getReminderLevelColor(item.reminderLevel)}>
                          {getReminderLevelText(item.reminderLevel)}
                        </Tag>
                      </Space>
                    }
                    description={
                      <div>
                        <div>{item.storeName} - {item.productName}</div>
                        <div style={{ color: item.isOverdue ? '#ff4d4f' : '#888' }}>
                          {item.isOverdue ? `已逾期 ${Math.abs(item.daysRemaining)} 天` : `剩余 ${item.daysRemaining} 天`}
                          ，交付日期：{formatDate(item.deliveryDate)}
                        </div>
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Card title="门店业绩对比">
            <ReactECharts option={storeChart} style={{ height: 350 }} />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;
