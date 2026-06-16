import React, { useState, useEffect, useMemo } from 'react';
import {
  Card,
  Typography,
  Row,
  Col,
  Statistic,
  Tabs,
  Select,
  DatePicker,
  Table,
  Tag,
  Space,
  Drawer,
  List,
  Empty,
  Button,
  App as AntdApp,
  Tooltip,
  Divider,
  Progress,
} from 'antd';
import {
  TeamOutlined,
  CheckCircleOutlined,
  StarOutlined,
  ClockCircleOutlined,
  WarningOutlined,
  RiseOutlined,
  FallOutlined,
  BarChartOutlined,
  PieChartOutlined,
  LineChartOutlined,
  FileTextOutlined,
  ShoppingCartOutlined,
  InboxOutlined,
  ArrowRightOutlined,
  FilterOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { Line, Column, Pie } from '@ant-design/plots';
import { useNavigate } from 'react-router-dom';
import { statsApi, batchApi } from '@/api/index.js';
import StatusTag from '@/components/StatusTag';
import {
  fmtMoney,
  fmtNum,
  fmtPct,
  fmtDateTime,
  fmtDuration,
  expiryTag,
} from '@/utils/format.js';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

const TAB_ITEMS = [
  { key: 'supplier', label: '供应商履约', icon: <TeamOutlined /> },
  { key: 'expiry', label: '效期分析', icon: <ClockCircleOutlined /> },
  { key: 'efficiency', label: '处理效率', icon: <BarChartOutlined /> },
  { key: 'dashboard', label: '综合看板', icon: <PieChartOutlined /> },
];

const CAUSE_TABS = [
  { key: 'INBOUND_DELAY', label: '入库延迟' },
  { key: 'LOW_TURNOVER', label: '周转慢' },
  { key: 'OVER_PURCHASE', label: '采购过量' },
  { key: 'OTHER', label: '其他' },
];

export default function StatisticsIndex() {
  const { message: msg } = AntdApp.useApp();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('supplier');

  const [supplierLoading, setSupplierLoading] = useState(false);
  const [supplierData, setSupplierData] = useState([]);
  const [trendData, setTrendData] = useState([]);

  const [expiryLoading, setExpiryLoading] = useState(false);
  const [expiryData, setExpiryData] = useState(null);
  const [nearExpiryList, setNearExpiryList] = useState([]);
  const [expiryCause, setExpiryCause] = useState('INBOUND_DELAY');
  const [causeDrawerOpen, setCauseDrawerOpen] = useState(false);
  const [currentCause, setCurrentCause] = useState(null);

  const [efficiencyLoading, setEfficiencyLoading] = useState(false);
  const [efficiencyData, setEfficiencyData] = useState(null);

  const [dateRange, setDateRange] = useState(null);
  const [supplierCategory, setSupplierCategory] = useState(null);
  const [supplierLevel, setSupplierLevel] = useState(null);

  const fetchSupplierPerformance = async () => {
    setSupplierLoading(true);
    try {
      const res = await statsApi.supplierPerformance({
        dateRange,
        category: supplierCategory,
        level: supplierLevel,
      });
      setSupplierData(res.data?.list || res.data?.records || []);
    } catch (e) {
      msg.error('加载供应商数据失败');
    } finally {
      setSupplierLoading(false);
    }
  };

  const fetchDailyTrend = async () => {
    try {
      const res = await statsApi.dailyTrend({ days: 30 });
      const data = res.data?.list || res.data?.records || [];
      setTrendData(data);
    } catch (e) {}
  };

  const fetchExpiryAnalysis = async () => {
    setExpiryLoading(true);
    try {
      const res = await statsApi.expiryAnalysis();
      setExpiryData(res.data || {});
    } catch (e) {
      msg.error('加载效期数据失败');
    } finally {
      setExpiryLoading(false);
    }
  };

  const fetchNearExpiry = async () => {
    try {
      const res = await batchApi.nearExpiry({ page: 1, pageSize: 50 });
      setNearExpiryList(res.data?.list || res.data?.records || []);
    } catch (e) {}
  };

  const fetchEfficiency = async () => {
    setEfficiencyLoading(true);
    try {
      const res = await statsApi.exceptionEfficiency();
      setEfficiencyData(res.data || {});
    } catch (e) {
      msg.error('加载效率数据失败');
    } finally {
      setEfficiencyLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'supplier') {
      fetchSupplierPerformance();
      fetchDailyTrend();
    }
  }, [activeTab, dateRange, supplierCategory, supplierLevel]);

  useEffect(() => {
    if (activeTab === 'expiry') {
      fetchExpiryAnalysis();
      fetchNearExpiry();
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'efficiency') {
      fetchEfficiency();
    }
  }, [activeTab]);

  const supplierChartData = useMemo(() => {
    return supplierData.slice(0, 10).flatMap((s) => [
      { supplier: s.name || s.supplierName, type: '准时率', value: s.onTimeRate || 0 },
      { supplier: s.name || s.supplierName, type: '合格率', value: s.passRate || 0 },
      { supplier: s.name || s.supplierName, type: '综合分', value: (s.score || 0) * 20 },
    ]);
  }, [supplierData]);

  const levelDistribution = useMemo(() => {
    const levels = [1, 2, 3, 4, 5];
    return levels.map((lv) => ({
      type: `${lv}星`,
      value: supplierData.filter((s) => (s.level || s.rating) === lv).length,
    }));
  }, [supplierData]);

  const trendChartData = useMemo(() => {
    return trendData.map((d) => ({
      date: d.date || d.day,
      订单数: d.orderCount || 0,
      履约数: d.fulfilledCount || 0,
    }));
  }, [trendData]);

  const expiryDistribution = useMemo(() => {
    if (!expiryData?.distribution) {
      return [
        { range: '≤1天', count: 5 },
        { range: '≤7天', count: 12 },
        { range: '≤15天', count: 25 },
        { range: '≤30天', count: 40 },
        { range: '≤90天', count: 60 },
        { range: '>90天', count: 100 },
      ];
    }
    return expiryData.distribution;
  }, [expiryData]);

  const typeEfficiencyData = useMemo(() => {
    if (!efficiencyData?.byType) return [];
    return efficiencyData.byType.map((t) => ({
      type: t.typeName || t.type,
      平均处理时长: t.avgDuration || 0,
    }));
  }, [efficiencyData]);

  const handlerRanking = useMemo(() => {
    if (!efficiencyData?.handlerRanking) return [];
    return efficiencyData.handlerRanking;
  }, [efficiencyData]);

  const weeklyTrend = useMemo(() => {
    if (!efficiencyData?.weeklyTrend) return [];
    return efficiencyData.weeklyTrend.map((d) => ({
      date: d.date || d.day,
      处理数量: d.count || 0,
      按时率: d.onTimeRate || 0,
    }));
  }, [efficiencyData]);

  const supplierColumns = [
    {
      title: '排名',
      key: 'rank',
      width: 60,
      render: (_, __, idx) => {
        if (idx === 0) return <Tag color="gold">🥇 1</Tag>;
        if (idx === 1) return <Tag color="silver">🥈 2</Tag>;
        if (idx === 2) return <Tag color="bronze">🥉 3</Tag>;
        return <Text type="secondary">{idx + 1}</Text>;
      },
    },
    {
      title: '供应商',
      dataIndex: 'name',
      key: 'name',
      render: (v, r) => (
        <a onClick={() => navigate(`/suppliers/${r.id || r.supplierId}`)}>
          {v || r.supplierName}
        </a>
      ),
    },
    {
      title: '准时率',
      dataIndex: 'onTimeRate',
      key: 'onTimeRate',
      width: 120,
      render: (v) => (
        <div>
          <Progress percent={v || 0} size="small" />
          <Text type="secondary" style={{ fontSize: 12 }}>{fmtPct(v)}</Text>
        </div>
      ),
    },
    {
      title: '合格率',
      dataIndex: 'passRate',
      key: 'passRate',
      width: 120,
      render: (v) => (
        <div>
          <Progress percent={v || 0} size="small" status={v >= 90 ? 'success' : 'exception'} />
          <Text type="secondary" style={{ fontSize: 12 }}>{fmtPct(v)}</Text>
        </div>
      ),
    },
    {
      title: '综合评分',
      dataIndex: 'score',
      key: 'score',
      width: 120,
      render: (v) => {
        const stars = '★'.repeat(Math.floor(v || 0)) + '☆'.repeat(5 - Math.floor(v || 0));
        return <span style={{ color: '#faad14' }}>{stars}</span>;
      },
    },
    {
      title: '订单数',
      dataIndex: 'orderCount',
      key: 'orderCount',
      width: 100,
      align: 'right',
      render: (v) => fmtNum(v),
    },
  ];

  const causeItems = useMemo(() => {
    const items = nearExpiryList.filter((_, i) => i % 4 === CAUSE_TABS.findIndex((t) => t.key === expiryCause));
    return items.length > 0 ? items : nearExpiryList.slice(0, 10);
  }, [nearExpiryList, expiryCause]);

  const openCauseDrawer = (cause) => {
    setCurrentCause(cause);
    setCauseDrawerOpen(true);
  };

  const handlerRankColumns = [
    {
      title: '排名',
      key: 'rank',
      width: 60,
      render: (_, __, idx) => {
        if (idx === 0) return <Tag color="gold">🥇</Tag>;
        if (idx === 1) return <Tag color="silver">🥈</Tag>;
        if (idx === 2) return <Tag color="bronze">🥉</Tag>;
        return <Text type="secondary">{idx + 1}</Text>;
      },
    },
    { title: '处理人', dataIndex: 'handlerName', key: 'handlerName', render: (v) => v || '-' },
    {
      title: '处理数量',
      dataIndex: 'count',
      key: 'count',
      align: 'right',
      render: (v) => fmtNum(v),
    },
    {
      title: '平均时长',
      dataIndex: 'avgDuration',
      key: 'avgDuration',
      align: 'right',
      render: (v) => fmtDuration(v * 3600 * 1000),
    },
    {
      title: '按时率',
      dataIndex: 'onTimeRate',
      key: 'onTimeRate',
      render: (v) => <Tag color={v >= 90 ? 'green' : 'orange'}>{fmtPct(v)}</Tag>,
    },
  ];

  const columnConfig = {
    isGroup: true,
    columnField: 'type',
    color: ['#5B8FF9', '#5AD8A6', '#5D7092'],
  };

  return (
    <div className="app-page">
      <Card
        title={<Title level={4} style={{ margin: 0 }}>数据统计</Title>}
        extra={
          <Button icon={<ReloadOutlined />} onClick={() => {
            if (activeTab === 'supplier') { fetchSupplierPerformance(); fetchDailyTrend(); }
            if (activeTab === 'expiry') { fetchExpiryAnalysis(); fetchNearExpiry(); }
            if (activeTab === 'efficiency') { fetchEfficiency(); }
          }}>
            刷新
          </Button>
        }
      >
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={TAB_ITEMS}
          size="large"
        />

        {activeTab === 'supplier' && (
          <div>
            <Card size="small" style={{ marginBottom: 16 }} variant="borderless">
              <Row gutter={[16, 12]} align="middle">
                <Col span={8}>
                  <span style={{ marginRight: 8 }}>时间范围：</span>
                  <RangePicker
                    value={dateRange}
                    onChange={setDateRange}
                    style={{ width: 280 }}
                  />
                </Col>
                <Col span={6}>
                  <span style={{ marginRight: 8 }}>供应商分类：</span>
                  <Select
                    placeholder="全部"
                    allowClear
                    style={{ width: 150 }}
                    value={supplierCategory}
                    onChange={setSupplierCategory}
                  >
                    <Option value="蔬菜">蔬菜类</Option>
                    <Option value="水果">水果类</Option>
                    <Option value="肉类">肉类</Option>
                    <Option value="水产">水产类</Option>
                    <Option value="熟食">熟食类</Option>
                  </Select>
                </Col>
                <Col span={6}>
                  <span style={{ marginRight: 8 }}>等级：</span>
                  <Select
                    placeholder="全部"
                    allowClear
                    style={{ width: 150 }}
                    value={supplierLevel}
                    onChange={setSupplierLevel}
                  >
                    <Option value={5}>5星</Option>
                    <Option value={4}>4星及以上</Option>
                    <Option value={3}>3星及以上</Option>
                  </Select>
                </Col>
              </Row>
            </Card>

            <Row gutter={16} style={{ marginBottom: 16 }}>
              <Col span={6}>
                <Card size="small">
                  <Statistic
                    title="供应商总数"
                    value={supplierData.length || 0}
                    prefix={<TeamOutlined style={{ color: '#1677ff' }} />}
                    valueStyle={{ color: '#1677ff' }}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card size="small">
                  <Statistic
                    title="平均准时率"
                    value={supplierData.reduce((a, b) => a + (b.onTimeRate || 0), 0) / (supplierData.length || 1)}
                    suffix="%"
                    precision={1}
                    prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
                    valueStyle={{ color: '#52c41a' }}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card size="small">
                  <Statistic
                    title="平均合格率"
                    value={supplierData.reduce((a, b) => a + (b.passRate || 0), 0) / (supplierData.length || 1)}
                    suffix="%"
                    precision={1}
                    prefix={<RiseOutlined style={{ color: '#13c2c2' }} />}
                    valueStyle={{ color: '#13c2c2' }}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card size="small">
                  <Statistic
                    title="平均综合分"
                    value={supplierData.reduce((a, b) => a + (b.score || 0), 0) / (supplierData.length || 1)}
                    precision={1}
                    prefix={<StarOutlined style={{ color: '#faad14' }} />}
                    valueStyle={{ color: '#faad14' }}
                  />
                </Card>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={16}>
                <Card title="供应商履约排行榜 Top10" loading={supplierLoading}>
                  <Column
                    data={supplierChartData}
                    xField="supplier"
                    yField="value"
                    seriesField="type"
                    isGroup
                    color={['#5B8FF9', '#5AD8A6', '#F6BD16']}
                    height={320}
                    label={{ position: 'middle' }}
                    xAxis={{ label: { autoRotate: true, rotate: 30 } }}
                  />
                </Card>
              </Col>
              <Col span={8}>
                <Card title="履约等级分布" loading={supplierLoading}>
                  <Pie
                    data={levelDistribution}
                    angleField="value"
                    colorField="type"
                    radius={0.8}
                    height={320}
                    label={{ type: 'outer', content: '{name} {percentage}' }}
                    legend={{ position: 'bottom' }}
                  />
                </Card>
              </Col>
            </Row>

            <Card
              title="订单履约趋势（近30天）"
              style={{ marginTop: 16 }}
              loading={supplierLoading}
            >
              <Line
                data={trendChartData}
                xField="date"
                yField="value"
                seriesField="type"
                height={280}
                smooth
                point={{ size: 3, shape: 'diamond' }}
                color={['#5B8FF9', '#5AD8A6']}
              />
            </Card>

            <Card
              title="供应商履约明细表"
              style={{ marginTop: 16 }}
              loading={supplierLoading}
            >
              <Table
                rowKey="id"
                columns={supplierColumns}
                dataSource={supplierData}
                pagination={false}
                size="small"
              />
            </Card>
          </div>
        )}

        {activeTab === 'expiry' && (
          <div>
            <Row gutter={16} style={{ marginBottom: 16 }}>
              <Col span={6}>
                <Card size="small">
                  <Statistic
                    title="临期批次数"
                    value={expiryData?.nearExpiryCount || 0}
                    prefix={<ClockCircleOutlined style={{ color: '#faad14' }} />}
                    valueStyle={{ color: '#faad14' }}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card size="small">
                  <Statistic
                    title="过期批次数"
                    value={expiryData?.expiredCount || 0}
                    prefix={<WarningOutlined style={{ color: '#ff4d4f' }} />}
                    valueStyle={{ color: '#ff4d4f' }}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card size="small">
                  <Statistic
                    title="预警商品数"
                    value={expiryData?.alertProductCount || 0}
                    prefix={<FallOutlined style={{ color: '#722ed1' }} />}
                    valueStyle={{ color: '#722ed1' }}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card size="small">
                  <Statistic
                    title="损失预估金额"
                    value={expiryData?.estimatedLoss || 0}
                    prefix="¥"
                    precision={2}
                    valueStyle={{ color: '#eb2f96' }}
                  />
                </Card>
              </Col>
            </Row>

            <Card title="到期分布" style={{ marginBottom: 16 }} loading={expiryLoading}>
              <Column
                data={expiryDistribution}
                xField="range"
                yField="count"
                color="#5B8FF9"
                height={280}
                label={{ position: 'top' }}
              />
            </Card>

            <Card title="效期临近原因分析" loading={expiryLoading}>
              <Tabs activeKey={expiryCause} onChange={setExpiryCause} items={CAUSE_TABS} />
              <List
                dataSource={causeItems}
                renderItem={(item, idx) => (
                  <List.Item
                    key={item.id || idx}
                    actions={[
                      <Button type="link" size="small" onClick={() => openCauseDrawer(item)}>
                        查看详情
                      </Button>,
                    ]}
                  >
                    <List.Item.Meta
                      avatar={
                        <div style={{
                          width: 48,
                          height: 48,
                          borderRadius: 8,
                          background: '#f0f5ff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}>
                          <FileTextOutlined style={{ color: '#1677ff', fontSize: 20 }} />
                        </div>
                      }
                      title={item.productName || item.batchNo}
                      description={
                        <Space size="middle">
                          <Tag>{item.batchNo}</Tag>
                          <Text type="secondary">责任人：{item.handlerName || '-'}</Text>
                          <Text type="secondary">
                            处理时效：{item.handleTime ? fmtDuration(item.handleTime * 3600 * 1000) : '-'}
                          </Text>
                        </Space>
                      }
                    />
                    <Space>
                      <Tag color={item.daysLeft <= 7 ? 'red' : 'orange'}>
                        {item.daysLeft}天到期
                      </Tag>
                      <Text type="secondary">{fmtNum(item.quantity)}件</Text>
                    </Space>
                  </List.Item>
                )}
              />
            </Card>
          </div>
        )}

        {activeTab === 'efficiency' && (
          <div>
            <Row gutter={16} style={{ marginBottom: 16 }}>
              <Col span={6}>
                <Card size="small">
                  <Statistic
                    title="平均处理时长"
                    value={efficiencyData?.avgDuration || 0}
                    suffix="小时"
                    precision={1}
                    prefix={<ClockCircleOutlined style={{ color: '#1677ff' }} />}
                    valueStyle={{ color: '#1677ff' }}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card size="small">
                  <Statistic
                    title="按时完成率"
                    value={efficiencyData?.onTimeRate || 0}
                    suffix="%"
                    precision={1}
                    prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
                    valueStyle={{ color: '#52c41a' }}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card size="small">
                  <Statistic
                    title="升级率"
                    value={efficiencyData?.escalationRate || 0}
                    suffix="%"
                    precision={1}
                    prefix={<RiseOutlined style={{ color: '#722ed1' }} />}
                    valueStyle={{ color: '#722ed1' }}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card size="small">
                  <Statistic
                    title="待处理数"
                    value={efficiencyData?.pendingCount || 0}
                    prefix={<WarningOutlined style={{ color: '#ff4d4f' }} />}
                    valueStyle={{ color: '#ff4d4f' }}
                  />
                </Card>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={16}>
                <Card title="按类型分组 - 平均处理时长" loading={efficiencyLoading}>
                  <Column
                    data={typeEfficiencyData}
                    xField="type"
                    yField="平均处理时长"
                    color="#5B8FF9"
                    height={320}
                    label={{ position: 'top' }}
                    xAxis={{ label: { autoRotate: true, rotate: 20 } }}
                  />
                </Card>
              </Col>
              <Col span={8}>
                <Card title="责任人排行榜 Top10" loading={efficiencyLoading}>
                  <List
                    dataSource={handlerRanking.slice(0, 10)}
                    renderItem={(item, idx) => (
                      <List.Item key={item.id || idx}>
                        <Space style={{ width: '100%' }}>
                          <Tag color={idx < 3 ? 'gold' : 'default'}>{idx + 1}</Tag>
                          <Text style={{ flex: 1 }}>{item.handlerName}</Text>
                          <Text type="secondary">{fmtNum(item.count)}件</Text>
                          <Tag color="blue">{fmtPct(item.onTimeRate)}</Tag>
                        </Space>
                      </List.Item>
                    )}
                  />
                </Card>
              </Col>
            </Row>

            <Card title="周趋势" style={{ marginTop: 16 }} loading={efficiencyLoading}>
              <Line
                data={weeklyTrend}
                xField="date"
                yField="处理数量"
                seriesField="type"
                height={280}
                smooth
                point={{ size: 3 }}
                color={['#5B8FF9', '#5AD8A6']}
              />
            </Card>

            <Card
              title="处理人明细"
              style={{ marginTop: 16 }}
              loading={efficiencyLoading}
            >
              <Table
                rowKey="handlerId"
                columns={handlerRankColumns}
                dataSource={handlerRanking}
                pagination={false}
                size="small"
              />
            </Card>
          </div>
        )}

        {activeTab === 'dashboard' && (
          <div>
            <Row gutter={16} style={{ marginBottom: 16 }}>
              <Col span={6}>
                <Card size="small">
                  <Statistic
                    title="供应商总数"
                    value={supplierData.length || 0}
                    prefix={<TeamOutlined style={{ color: '#1677ff' }} />}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card size="small">
                  <Statistic
                    title="今日入库量"
                    value={0}
                    prefix={<InboxOutlined style={{ color: '#52c41a' }} />}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card size="small">
                  <Statistic
                    title="待处理异常"
                    value={efficiencyData?.pendingCount || 0}
                    prefix={<WarningOutlined style={{ color: '#ff4d4f' }} />}
                    valueStyle={{ color: '#ff4d4f' }}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card size="small">
                  <Statistic
                    title="临期批次"
                    value={expiryData?.nearExpiryCount || 0}
                    prefix={<ClockCircleOutlined style={{ color: '#faad14' }} />}
                  />
                </Card>
              </Col>
            </Row>

            <Row gutter={16} style={{ marginBottom: 16 }}>
              <Col span={12}>
                <Card title="订单履约趋势">
                  <Line
                    data={trendChartData}
                    xField="date"
                    yField="value"
                    seriesField="type"
                    height={200}
                    smooth
                    color={['#5B8FF9', '#5AD8A6']}
                  />
                </Card>
              </Col>
              <Col span={12}>
                <Card title="履约等级分布">
                  <Pie
                    data={levelDistribution}
                    angleField="value"
                    colorField="type"
                    radius={0.8}
                    height={200}
                    legend={{ position: 'right' }}
                  />
                </Card>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={8}>
                <Card
                  title="快速入口"
                  hoverable
                  onClick={() => navigate('/suppliers')}
                  style={{ cursor: 'pointer' }}
                >
                  <Space align="center">
                    <div style={{
                      width: 48, height: 48, borderRadius: 12,
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <TeamOutlined style={{ color: '#fff', fontSize: 22 }} />
                    </div>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 600 }}>供应商管理</div>
                      <div style={{ fontSize: 12, color: '#8c8c8c' }}>查看和管理供应商</div>
                    </div>
                  </Space>
                </Card>
              </Col>
              <Col span={8}>
                <Card
                  title="快速入口"
                  hoverable
                  onClick={() => navigate('/inventory/near-expiry')}
                  style={{ cursor: 'pointer' }}
                >
                  <Space align="center">
                    <div style={{
                      width: 48, height: 48, borderRadius: 12,
                      background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <ClockCircleOutlined style={{ color: '#fff', fontSize: 22 }} />
                    </div>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 600 }}>效期预警</div>
                      <div style={{ fontSize: 12, color: '#8c8c8c' }}>临期商品处理</div>
                    </div>
                  </Space>
                </Card>
              </Col>
              <Col span={8}>
                <Card
                  title="快速入口"
                  hoverable
                  onClick={() => navigate('/exceptions')}
                  style={{ cursor: 'pointer' }}
                >
                  <Space align="center">
                    <div style={{
                      width: 48, height: 48, borderRadius: 12,
                      background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <WarningOutlined style={{ color: '#fff', fontSize: 22 }} />
                    </div>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 600 }}>异常处理</div>
                      <div style={{ fontSize: 12, color: '#8c8c8c' }}>工单管理跟进</div>
                    </div>
                  </Space>
                </Card>
              </Col>
            </Row>
          </div>
        )}
      </Card>

      <Drawer
        title={currentCause?.productName || '批次详情'}
        placement="right"
        width={520}
        onClose={() => setCauseDrawerOpen(false)}
        open={causeDrawerOpen}
      >
        {currentCause && (
          <div>
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
              <div>
                <div style={{ fontSize: 13, color: '#8c8c8c', marginBottom: 4 }}>批次号</div>
                <div style={{ fontSize: 16, fontWeight: 600 }}>{currentCause.batchNo}</div>
              </div>
              <div>
                <div style={{ fontSize: 13, color: '#8c8c8c', marginBottom: 4 }}>产品名称</div>
                <div>{currentCause.productName || '-'}</div>
              </div>
              <div>
                <div style={{ fontSize: 13, color: '#8c8c8c', marginBottom: 4 }}>数量</div>
                <div>{fmtNum(currentCause.quantity)} 件</div>
              </div>
              <div>
                <div style={{ fontSize: 13, color: '#8c8c8c', marginBottom: 4 }}>到期时间</div>
                <div>{fmtDateTime(currentCause.expiryDate)}</div>
              </div>
              <div>
                <div style={{ fontSize: 13, color: '#8c8c8c', marginBottom: 4 }}>剩余天数</div>
                <Tag color={currentCause.daysLeft <= 7 ? 'red' : 'orange'}>
                  {currentCause.daysLeft} 天
                </Tag>
              </div>
              <div>
                <div style={{ fontSize: 13, color: '#8c8c8c', marginBottom: 4 }}>责任人</div>
                <div>{currentCause.handlerName || '-'}</div>
              </div>
              <div>
                <div style={{ fontSize: 13, color: '#8c8c8c', marginBottom: 4 }}>处理人绩效</div>
                <List>
                  <List.Item>
                    <span>平均处理时效</span>
                    <span>{currentCause.avgHandleTime ? fmtDuration(currentCause.avgHandleTime * 3600 * 1000) : '-'}</span>
                  </List.Item>
                  <List.Item>
                    <span>本月处理数</span>
                    <span>{fmtNum(currentCause.monthCount || 0)} 件</span>
                  </List.Item>
                  <List.Item>
                    <span>按时完成率</span>
                    <Tag color="green">{fmtPct(currentCause.onTimeRate || 0)}</Tag>
                  </List.Item>
                </List>
              </div>
            </Space>
            <Divider />
            <Button type="primary" block>
              立即处理
            </Button>
          </div>
        )}
      </Drawer>
    </div>
  );
}
