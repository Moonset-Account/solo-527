import React, { useState, useEffect, useMemo } from 'react';
import {
  Card,
  Typography,
  Row,
  Col,
  Statistic,
  Tabs,
  List,
  Tag,
  Space,
  Avatar,
  Button,
  App as AntdApp,
  Empty,
  Spin,
} from 'antd';
import {
  InboxOutlined,
  SendOutlined,
  WarningOutlined,
  BellOutlined,
  DatabaseOutlined,
  ClockCircleOutlined,
  ScanOutlined,
  ShoppingCartOutlined,
  FileTextOutlined,
  ArrowRightOutlined,
  ShopOutlined,
  BarChartOutlined,
} from '@ant-design/icons';
import { Line, Column } from '@ant-design/plots';
import { useNavigate } from 'react-router-dom';
import { statsApi, alertApi, exceptionApi } from '@/api/index.js';
import StatusTag from '@/components/StatusTag';
import {
  fmtNum,
  fmtMoney,
  fmtDateTime,
  fromNow,
} from '@/utils/format.js';
import { EXCEPTION_TYPE, ALERT_TYPE } from '@/utils/constants.js';
import { useAppStore } from '@/store/index.js';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

const KPI_COLORS = {
  blue: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  green: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  orange: 'linear-gradient(135deg, #f6d365 0%, #fda085 100%)',
  red: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  purple: 'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
  cyan: 'linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%)',
};

const QUICK_ENTRIES = [
  { key: 'inbound-scan', label: '扫码入库', icon: <ScanOutlined />, color: KPI_COLORS.blue, path: '/inbound/scan' },
  { key: 'outbound-scan', label: '扫码出库', icon: <SendOutlined />, color: KPI_COLORS.green, path: '/outbound/scan' },
  { key: 'purchase', label: '新建采购', icon: <ShoppingCartOutlined />, color: KPI_COLORS.purple, path: '/purchase-orders' },
  { key: 'near-expiry', label: '效期临近', icon: <ClockCircleOutlined />, color: KPI_COLORS.orange, path: '/inventory/near-expiry' },
  { key: 'exceptions', label: '异常处理', icon: <WarningOutlined />, color: KPI_COLORS.red, path: '/exceptions' },
  { key: 'restock', label: '补货建议', icon: <BarChartOutlined />, color: KPI_COLORS.cyan, path: '/restock' },
];

const TODO_TABS = [
  { key: 'qc', label: '待质检入库' },
  { key: 'exception', label: '待处理异常' },
  { key: 'purchase', label: '待确认采购单' },
];

export default function Dashboard() {
  const { message: msg } = AntdApp.useApp();
  const navigate = useNavigate();
  const user = useAppStore((s) => s.user);

  const [loading, setLoading] = useState(false);
  const [overview, setOverview] = useState(null);
  const [supplierTop5, setSupplierTop5] = useState([]);
  const [dailyTrend, setDailyTrend] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [todoTab, setTodoTab] = useState('qc');

  const [qcTodos, setQcTodos] = useState([]);
  const [exceptionTodos, setExceptionTodos] = useState([]);
  const [purchaseTodos, setPurchaseTodos] = useState([]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [overviewRes, supplierRes, trendRes, alertRes] = await Promise.all([
        statsApi.overview(),
        statsApi.supplierPerformance({ page: 1, pageSize: 5 }),
        statsApi.dailyTrend({ days: 7 }),
        alertApi.list({ page: 1, pageSize: 5 }),
      ]);

      setOverview(overviewRes.data || {});
      setSupplierTop5(supplierRes.data?.list?.slice(0, 5) || supplierRes.data?.records?.slice(0, 5) || []);
      setDailyTrend(trendRes.data?.list || trendRes.data?.records || []);
      setAlerts(alertRes.data?.list || alertRes.data?.records || []);
    } catch (e) {
      msg.error('加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const greeting = useMemo(() => {
    const hour = dayjs().hour();
    if (hour < 6) return '凌晨好';
    if (hour < 12) return '上午好';
    if (hour < 14) return '中午好';
    if (hour < 18) return '下午好';
    return '晚上好';
  }, []);

  const todayStr = useMemo(() => {
    const weekMap = ['日', '一', '二', '三', '四', '五', '六'];
    return `${dayjs().month() + 1}月${dayjs().date()}日 星期${weekMap[dayjs().day()]}`;
  }, []);

  const supplierChartData = useMemo(() => {
    return supplierTop5.flatMap((s) => [
      { supplier: (s.name || s.supplierName || '').slice(0, 6), type: '准时率', value: s.onTimeRate || 0 },
      { supplier: (s.name || s.supplierName || '').slice(0, 6), type: '合格率', value: s.passRate || 0 },
    ]);
  }, [supplierTop5]);

  const trendChartData = useMemo(() => {
    return dailyTrend.map((d) => ({
      date: d.date ? d.date.slice(5) : d.day?.slice(5) || '',
      入库: d.inboundCount || d.inboundQty || 0,
      出库: d.outboundCount || d.outboundQty || 0,
    }));
  }, [dailyTrend]);

  const kpiCards = [
    {
      title: '今日入库量',
      value: overview?.todayInbound || 0,
      suffix: '件',
      icon: <InboxOutlined />,
      color: 'blue',
    },
    {
      title: '今日出库量',
      value: overview?.todayOutbound || 0,
      suffix: '件',
      icon: <SendOutlined />,
      color: 'green',
    },
    {
      title: '待处理异常',
      value: overview?.pendingException || 0,
      suffix: '条',
      icon: <WarningOutlined />,
      color: 'red',
    },
    {
      title: '未读提醒',
      value: overview?.unreadAlert || 0,
      suffix: '条',
      icon: <BellOutlined />,
      color: 'orange',
    },
    {
      title: '低库存SKU数',
      value: overview?.lowStockSku || 0,
      suffix: '个',
      icon: <DatabaseOutlined />,
      color: 'purple',
    },
    {
      title: '效期临近数',
      value: overview?.nearExpiry || 0,
      suffix: '批',
      icon: <ClockCircleOutlined />,
      color: 'cyan',
    },
  ];

  const goAlertDetail = (item) => {
    if (item.relatedType === 'EXCEPTION' && item.relatedId) {
      navigate(`/exceptions/${item.relatedId}`);
    } else if (item.relatedType === 'PURCHASE_ORDER' && item.relatedId) {
      navigate(`/purchase-orders/${item.relatedId}`);
    } else if (item.relatedType === 'INBOUND_ORDER' && item.relatedId) {
      navigate(`/inbound-orders/${item.relatedId}`);
    } else {
      navigate('/alerts');
    }
  };

  const getAlertIcon = (type) => {
    const cfg = ALERT_TYPE[type];
    return <BellOutlined />;
  };

  return (
    <div className="app-page">
      <Card style={{ marginBottom: 16 }} bodyStyle={{ padding: '20px 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <Title level={3} style={{ margin: 0, marginBottom: 6 }}>
              {greeting}，{user?.name || user?.username || '用户'} 👋
            </Title>
            <Text type="secondary">今天是 {todayStr}</Text>
          </div>
          <Button type="primary" onClick={() => fetchData()}>
            刷新数据
          </Button>
        </div>
      </Card>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        {kpiCards.map((card, idx) => (
          <Col span={4} key={idx}>
            <Card bodyStyle={{ padding: 16 }} hoverable>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 12,
                    background: KPI_COLORS[card.color],
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    fontSize: 20,
                    flexShrink: 0,
                  }}
                >
                  {card.icon}
                </div>
                <div>
                  <Text type="secondary" style={{ fontSize: 13 }}>
                    {card.title}
                  </Text>
                  <div style={{ fontSize: 22, fontWeight: 700, marginTop: 2 }}>
                    {fmtNum(card.value)}
                    <Text type="secondary" style={{ fontSize: 12, fontWeight: 400, marginLeft: 4 }}>
                      {card.suffix}
                    </Text>
                  </div>
                </div>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      <Row gutter={16}>
        <Col span={14}>
          <Card
            title="供应商履约 Top5"
            extra={<a onClick={() => navigate('/suppliers')}>查看全部 <ArrowRightOutlined /></a>}
            style={{ marginBottom: 16 }}
          >
            <Column
              data={supplierChartData}
              xField="supplier"
              yField="value"
              seriesField="type"
              isGroup
              color={['#5B8FF9', '#5AD8A6']}
              height={220}
              label={{ position: 'top' }}
            />
            <List
              size="small"
              dataSource={supplierTop5}
              renderItem={(item, idx) => (
                <List.Item
                  key={item.id}
                  actions={[
                    <a key="view" onClick={() => navigate(`/suppliers/${item.id}`)}>
                      查看
                    </a>,
                  ]}
                >
                  <List.Item.Meta
                    avatar={
                      <Tag color={idx < 3 ? 'gold' : 'default'} style={{ width: 28, textAlign: 'center' }}>
                        {idx + 1}
                      </Tag>
                    }
                    title={item.name || item.supplierName}
                    description={
                      <Space size="middle">
                        <Tag color="blue">准时率 {item.onTimeRate || 0}%</Tag>
                        <Tag color="green">合格率 {item.passRate || 0}%</Tag>
                      </Space>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>

          <Card title="7天出入库趋势">
            <Line
              data={trendChartData}
              xField="date"
              yField="value"
              seriesField="type"
              height={260}
              smooth
              point={{ size: 4, shape: 'circle' }}
              color={['#52c41a', '#1677ff']}
              lineStyle={{ lineWidth: 2 }}
            />
          </Card>
        </Col>

        <Col span={10}>
          <Card
            title="待办事项"
            style={{ marginBottom: 16 }}
            tabList={TODO_TABS.map((t) => ({ key: t.key, tab: t.label }))}
            activeTabKey={todoTab}
            onTabChange={setTodoTab}
          >
            {todoTab === 'qc' && (
              <div>
                {qcTodos.length > 0 ? (
                  <List
                    size="small"
                    dataSource={qcTodos}
                    renderItem={(item) => (
                      <List.Item
                        key={item.id}
                        style={{ cursor: 'pointer' }}
                        onClick={() => navigate(`/inbound-orders/${item.id}`)}
                      >
                        <List.Item.Meta
                          title={item.inboundNo || item.no}
                          description={
                            <Space>
                              <Text type="secondary">{item.supplierName || '-'}</Text>
                              <Tag color="blue">{fmtNum(item.qty || 0)}件</Tag>
                            </Space>
                          }
                        />
                        <Tag color="orange">待质检</Tag>
                      </List.Item>
                    )}
                  />
                ) : (
                  <Empty description="暂无待质检入库" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                )}
                <div style={{ marginTop: 12, textAlign: 'center' }}>
                  <a onClick={() => navigate('/inbound-orders')}>查看全部入库单</a>
                </div>
              </div>
            )}

            {todoTab === 'exception' && (
              <div>
                {exceptionTodos.length > 0 ? (
                  <List
                    size="small"
                    dataSource={exceptionTodos}
                    renderItem={(item) => (
                      <List.Item
                        key={item.id}
                        style={{ cursor: 'pointer' }}
                        onClick={() => navigate(`/exceptions/${item.id}`)}
                      >
                        <List.Item.Meta
                          title={item.exceptionNo}
                          description={
                            <Space>
                              <StatusTag statusKey="EXCEPTION_TYPE" value={item.type} />
                              <Text type="secondary">{item.title}</Text>
                            </Space>
                          }
                        />
                        <Tag color="red">待处理</Tag>
                      </List.Item>
                    )}
                  />
                ) : (
                  <Empty description="暂无待处理异常" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                )}
                <div style={{ marginTop: 12, textAlign: 'center' }}>
                  <a onClick={() => navigate('/exceptions')}>查看全部异常</a>
                </div>
              </div>
            )}

            {todoTab === 'purchase' && (
              <div>
                {purchaseTodos.length > 0 ? (
                  <List
                    size="small"
                    dataSource={purchaseTodos}
                    renderItem={(item) => (
                      <List.Item
                        key={item.id}
                        style={{ cursor: 'pointer' }}
                        onClick={() => navigate(`/purchase-orders/${item.id}`)}
                      >
                        <List.Item.Meta
                          title={item.poNo}
                          description={
                            <Space>
                              <Text type="secondary">{item.supplierName || '-'}</Text>
                              <Text type="secondary">{fmtMoney(item.totalAmount)}</Text>
                            </Space>
                          }
                        />
                        <Tag color="warning">待确认</Tag>
                      </List.Item>
                    )}
                  />
                ) : (
                  <Empty description="暂无待确认采购单" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                )}
                <div style={{ marginTop: 12, textAlign: 'center' }}>
                  <a onClick={() => navigate('/purchase-orders')}>查看全部采购单</a>
                </div>
              </div>
            )}
          </Card>

          <Card
            title="最新提醒"
            extra={<a onClick={() => navigate('/alerts')}>更多 <ArrowRightOutlined /></a>}
          >
            <List
              size="small"
              dataSource={alerts}
              renderItem={(item) => {
                const typeCfg = ALERT_TYPE[item.type] || { label: item.type, color: 'default' };
                return (
                  <List.Item
                    key={item.id}
                    style={{ cursor: 'pointer', opacity: item.isRead ? 0.6 : 1 }}
                    onClick={() => goAlertDetail(item)}
                  >
                    <List.Item.Meta
                      avatar={
                        <Avatar
                          style={{
                            background: typeCfg.color,
                            verticalAlign: 'middle',
                          }}
                          icon={getAlertIcon(item.type)}
                        />
                      }
                      title={
                        <Space size="small">
                          <Tag color={typeCfg.color} style={{ margin: 0 }}>
                            {typeCfg.label}
                          </Tag>
                          {!item.isRead && <span style={{ color: '#ff4d4f', fontSize: 8 }}>●</span>}
                        </Space>
                      }
                      description={
                        <div>
                          <div style={{ fontSize: 13, color: '#262626', marginBottom: 2 }}>
                            {item.title}
                          </div>
                          <div style={{ fontSize: 11, color: '#bfbfbf' }}>
                            {fromNow(item.createdAt)}
                          </div>
                        </div>
                      }
                    />
                  </List.Item>
                );
              }}
            />
          </Card>
        </Col>
      </Row>

      <Card title="快捷入口" style={{ marginTop: 16 }}>
        <Row gutter={[16, 16]}>
          {QUICK_ENTRIES.map((entry) => (
            <Col span={4} key={entry.key}>
              <Card
                hoverable
                bodyStyle={{ padding: 20, cursor: 'pointer' }}
                onClick={() => navigate(entry.path)}
              >
                <div style={{ textAlign: 'center' }}>
                  <div
                    style={{
                      width: 56,
                      height: 56,
                      borderRadius: 16,
                      background: entry.color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 12px',
                      color: '#fff',
                      fontSize: 24,
                    }}
                  >
                    {entry.icon}
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 500 }}>{entry.label}</div>
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      </Card>
    </div>
  );
}
