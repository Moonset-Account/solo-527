import React, { useEffect, useState } from 'react';
import {
  Row,
  Col,
  Card,
  Statistic,
  Table,
  Button,
  Space,
  Form,
  Select,
  DatePicker,
  Tag,
  message,
  Typography,
  Tabs,
  Progress,
  List,
  Tooltip,
  Modal,
  Descriptions,
  Divider,
} from 'antd';
import {
  ThunderboltOutlined,
  SearchOutlined,
  ReloadOutlined,
  WarningOutlined,
  ArrowUpOutlined,
  DownOutlined,
  ClockCircleOutlined,
  UserOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { revenueApi, metersApi } from '@/api';
import type { RevenueRecord, MeterZone } from '../../shared/types';
import { DurationText } from '@/components/DurationText';

const { RangePicker } = DatePicker;
const { Option } = Select;
const { Title, Text } = Typography;
const { TabPane } = Tabs;

const RevenuePage: React.FC = () => {
  const [form] = Form.useForm();
  const [summary, setSummary] = useState<{
    totalChargeEnergy: number;
    totalDischargeEnergy: number;
    totalRevenue: number;
    totalSubsidy: number;
    gapCount: number;
    totalRecords: number;
  } | null>(null);
  const [details, setDetails] = useState<RevenueRecord[]>([]);
  const [gaps, setGaps] = useState<{
    totalGaps: number;
    totalGapDuration: number;
    averageGapDuration: number;
    reasonStats: Record<string, number>;
    personStats: Record<string, number>;
    details: RevenueRecord[];
  } | null>(null);
  const [zones, setZones] = useState<MeterZone[]>([]);
  const [loading, setLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [gapModal, setGapModal] = useState<{
    visible: boolean;
    record: RevenueRecord | null;
  }>({ visible: false, record: null });

  useEffect(() => {
    loadSummary();
    loadZones();
  }, []);

  useEffect(() => {
    loadDetails();
  }, [page, pageSize]);

  const loadSummary = async () => {
    try {
      const [summaryData, gapsData] = await Promise.all([
        revenueApi.getSummary(),
        revenueApi.getGaps(),
      ]);
      setSummary(summaryData);
      setGaps(gapsData);
    } catch (error) {
      message.error('加载统计数据失败');
    }
  };

  const loadZones = async () => {
    try {
      const data = await metersApi.getZones();
      setZones(data);
    } catch (error) {
      message.error('加载分区数据失败');
    }
  };

  const loadDetails = async () => {
    setDetailLoading(true);
    try {
      const values = form.getFieldsValue();
      const params: any = {
        page,
        pageSize,
        zoneId: values.zoneId,
        hasGap: values.hasGap,
      };
      if (values.dateRange && values.dateRange.length === 2) {
        params.startDate = values.dateRange[0].format('YYYY-MM-DD');
        params.endDate = values.dateRange[1].format('YYYY-MM-DD');
      }

      const result = await revenueApi.getDetails(params);
      setDetails(result.data);
      setTotal(result.total);
    } catch (error) {
      message.error('加载明细数据失败');
    } finally {
      setDetailLoading(false);
    }
  };

  const handleSearch = () => {
    setPage(1);
    loadDetails();
  };

  const handleReset = () => {
    form.resetFields();
    setPage(1);
    loadDetails();
  };

  const viewGapDetail = (record: RevenueRecord) => {
    setGapModal({ visible: true, record });
  };

  const revenueTrendOption = {
    tooltip: { trigger: 'axis' },
    legend: { data: ['充电量', '放电量'], bottom: 0 },
    grid: { left: '3%', right: '4%', bottom: '12%', containLabel: true },
    xAxis: {
      type: 'category',
      data: details.slice(0, 7).map((d) => d.date),
    },
    yAxis: { type: 'value', name: 'kWh' },
    series: [
      {
        name: '充电量',
        type: 'bar',
        stack: 'total',
        data: details.slice(0, 7).map((d) => d.chargeEnergy),
        itemStyle: { color: '#1890ff' },
      },
      {
        name: '放电量',
        type: 'bar',
        stack: 'total',
        data: details.slice(0, 7).map((d) => d.dischargeEnergy),
        itemStyle: { color: '#52c41a' },
      },
    ],
  };

  const gapReasonOption = gaps
    ? {
        tooltip: { trigger: 'item', formatter: '{b}: {c}次 ({d}%)' },
        legend: { orient: 'vertical', left: 'left' },
        series: [
          {
            type: 'pie',
            radius: ['40%', '70%'],
            avoidLabelOverlap: false,
            itemStyle: {
              borderRadius: 10,
              borderColor: '#fff',
              borderWidth: 2,
            },
            label: { show: false, position: 'center' },
            emphasis: {
              label: { show: true, fontSize: 16, fontWeight: 'bold' },
            },
            data: Object.entries(gaps.reasonStats).map(([name, value]) => ({
              name,
              value,
            })),
          },
        ],
      }
    : {};

  const columns: ColumnsType<RevenueRecord> = [
    {
      title: '日期',
      dataIndex: 'date',
      key: 'date',
      width: 120,
      fixed: 'left',
    },
    {
      title: '分区',
      dataIndex: 'zoneName',
      key: 'zoneName',
      width: 150,
    },
    {
      title: '充电量 (kWh)',
      dataIndex: 'chargeEnergy',
      key: 'chargeEnergy',
      width: 130,
      render: (v) => v.toFixed(2),
      sorter: (a, b) => a.chargeEnergy - b.chargeEnergy,
    },
    {
      title: '放电量 (kWh)',
      dataIndex: 'dischargeEnergy',
      key: 'dischargeEnergy',
      width: 130,
      render: (v) => v.toFixed(2),
      sorter: (a, b) => a.dischargeEnergy - b.dischargeEnergy,
    },
    {
      title: '收益 (元)',
      dataIndex: 'revenue',
      key: 'revenue',
      width: 120,
      render: (v) => `¥${v.toFixed(2)}`,
      sorter: (a, b) => a.revenue - b.revenue,
    },
    {
      title: '补贴 (元)',
      dataIndex: 'subsidy',
      key: 'subsidy',
      width: 120,
      render: (v) => `¥${v.toFixed(2)}`,
    },
    {
      title: '数据缺口',
      dataIndex: 'hasGap',
      key: 'hasGap',
      width: 100,
      render: (hasGap, record) =>
        hasGap ? (
          <Tooltip title="点击查看详情">
            <Tag
              color="red"
              style={{ cursor: 'pointer' }}
              onClick={() => viewGapDetail(record)}
            >
              <ExclamationCircleOutlined /> 有缺口
            </Tag>
          </Tooltip>
        ) : (
          <Tag color="green">正常</Tag>
        ),
    },
    {
      title: '缺口原因',
      dataIndex: 'gapReason',
      key: 'gapReason',
      width: 140,
      render: (v) => v || '-',
    },
    {
      title: '缺口时长',
      dataIndex: 'gapDurationSeconds',
      key: 'gapDurationSeconds',
      width: 110,
      render: (v) => <DurationText seconds={v} />,
    },
    {
      title: '责任人',
      dataIndex: 'responsiblePerson',
      key: 'responsiblePerson',
      width: 100,
      render: (v) => v || '-',
    },
  ];

  const summaryCards = summary
    ? [
        {
          title: '总充电量',
          value: `${summary.totalChargeEnergy.toFixed(2)} kWh`,
          icon: <ArrowUpOutlined style={{ color: '#1890ff', fontSize: 24 }} />,
          color: '#e6f7ff',
        },
        {
          title: '总放电量',
          value: `${summary.totalDischargeEnergy.toFixed(2)} kWh`,
          icon: <DownOutlined style={{ color: '#52c41a', fontSize: 24 }} />,
          color: '#f6ffed',
        },
        {
          title: '累计收益',
          value: `¥${summary.totalRevenue.toLocaleString()}`,
          icon: <ThunderboltOutlined style={{ color: '#faad14', fontSize: 24 }} />,
          color: '#fffbe6',
        },
        {
          title: '累计补贴',
          value: `¥${summary.totalSubsidy.toLocaleString()}`,
          icon: <ThunderboltOutlined style={{ color: '#722ed1', fontSize: 24 }} />,
          color: '#f9f0ff',
        },
      ]
    : [];

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0 }}>
          <Space>
            <ThunderboltOutlined style={{ color: '#1890ff' }} />
            储能收益分析
          </Space>
        </Title>
        <Text type="secondary">分析储能系统的充放电数据和收益情况</Text>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        {summaryCards.map((card, index) => (
          <Col xs={24} sm={12} md={6} key={index}>
            <Card
              style={{ background: card.color, borderRadius: 8, height: '100%' }}
              bodyStyle={{ padding: '16px' }}
            >
              <Space align="center" size={12}>
                <div>{card.icon}</div>
                <div>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {card.title}
                  </Text>
                  <div
                    style={{ fontSize: 20, fontWeight: 'bold', color: '#262626', marginTop: 4 }}
                  >
                    {card.value}
                  </div>
                </div>
              </Space>
            </Card>
          </Col>
        ))}
      </Row>

      <Tabs defaultActiveKey="1">
        <TabPane tab="收益总览" key="1">
          <Row gutter={[16, 16]}>
            <Col xs={24} lg={14}>
              <Card
                title={
                  <Space>
                    <ThunderboltOutlined />
                    充放电趋势
                  </Space>
                }
                loading={!summary}
              >
                <ReactECharts option={revenueTrendOption} style={{ height: 350 }} />
              </Card>
            </Col>
            <Col xs={24} lg={10}>
              <Card
                title={
                  <Space>
                    <WarningOutlined style={{ color: '#f5222d' }} />
                    数据缺口分析
                  </Space>
                }
                loading={!gaps}
                extra={
                  <Tag color={gaps && gaps.totalGaps > 0 ? 'red' : 'green'}>
                    共 {gaps?.totalGaps || 0} 处缺口
                  </Tag>
                }
              >
                {gaps && (
                  <div>
                    <div style={{ marginBottom: 16 }}>
                      <Space size="large" wrap>
                        <div>
                          <Text type="secondary">平均缺口时长</Text>
                          <div style={{ fontSize: 18, fontWeight: 'bold' }}>
                            <DurationText seconds={Math.round(gaps.averageGapDuration)} />
                          </div>
                        </div>
                        <div>
                          <Text type="secondary">数据完整率</Text>
                          <div style={{ fontSize: 18, fontWeight: 'bold', color: '#52c41a' }}>
                            {summary
                              ? (((summary.totalRecords - gaps.totalGaps) / summary.totalRecords) * 100).toFixed(1)
                              : 0}
                            %
                          </div>
                        </div>
                      </Space>
                    </div>
                    <Progress
                      percent={
                        summary
                          ? Math.round(
                              ((summary.totalRecords - gaps.totalGaps) / summary.totalRecords) * 100
                            )
                          : 0
                      }
                      status="active"
                      strokeColor={{ '0%': '#108ee9', '100%': '#87d068' }}
                    />
                    <Divider />
                    <ReactECharts option={gapReasonOption} style={{ height: 250 }} />
                  </div>
                )}
              </Card>
            </Col>
          </Row>

          {gaps && gaps.details && gaps.details.length > 0 && (
            <Card
              title={
                <Space>
                  <ClockCircleOutlined style={{ color: '#faad14' }} />
                  待处理缺口
                </Space>
              }
              style={{ marginTop: 16 }}
            >
              <List
                grid={{ gutter: 16, xs: 1, sm: 2, md: 3, lg: 3 }}
                dataSource={gaps.details.slice(0, 6)}
                renderItem={(item) => (
                  <List.Item>
                    <Card
                      size="small"
                      style={{
                        borderLeft: '3px solid #f5222d',
                        cursor: 'pointer',
                      }}
                      onClick={() => viewGapDetail(item)}
                    >
                      <Space direction="vertical" size={4} style={{ width: '100%' }}>
                        <Space>
                          <Tag color="red">{item.date}</Tag>
                          <Text type="secondary">{item.zoneName}</Text>
                        </Space>
                        <Text strong>{item.gapReason}</Text>
                        <Space size={16}>
                          <span style={{ fontSize: 12 }}>
                            <ClockCircleOutlined /> <DurationText seconds={item.gapDurationSeconds} />
                          </span>
                          <span style={{ fontSize: 12 }}>
                            <UserOutlined /> {item.responsiblePerson}
                          </span>
                        </Space>
                      </Space>
                    </Card>
                  </List.Item>
                )}
              />
            </Card>
          )}
        </TabPane>

        <TabPane tab="收益明细" key="2">
          <Card style={{ marginBottom: 16 }}>
            <Form form={form} layout="inline">
              <Form.Item name="zoneId" label="分区">
                <Select placeholder="全部分区" allowClear style={{ width: 180 }}>
                  {zones.map((zone) => (
                    <Option key={zone.id} value={zone.id}>
                      {zone.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
              <Form.Item name="hasGap" label="数据缺口">
                <Select placeholder="全部" allowClear style={{ width: 120 }}>
                  <Option value={true}>有缺口</Option>
                  <Option value={false}>正常</Option>
                </Select>
              </Form.Item>
              <Form.Item name="dateRange" label="时间范围">
                <RangePicker />
              </Form.Item>
              <Form.Item>
                <Space>
                  <Button icon={<ReloadOutlined />} onClick={handleReset}>
                    重置
                  </Button>
                  <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
                    查询
                  </Button>
                </Space>
              </Form.Item>
            </Form>
          </Card>

          <Card>
            <Table
              columns={columns}
              dataSource={details}
              rowKey="id"
              loading={detailLoading}
              pagination={{
                current: page,
                pageSize,
                total,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (t) => `共 ${t} 条记录`,
                onChange: (p, ps) => {
                  setPage(p);
                  setPageSize(ps);
                },
              }}
              scroll={{ x: 1200 }}
            />
          </Card>
        </TabPane>
      </Tabs>

      <Modal
        title="数据缺口详情"
        open={gapModal.visible}
        onCancel={() => setGapModal({ visible: false, record: null })}
        footer={[
          <Button key="close" onClick={() => setGapModal({ visible: false, record: null })}>
            关闭
          </Button>,
        ]}
        width={600}
      >
        {gapModal.record && (
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label="日期">{gapModal.record.date}</Descriptions.Item>
            <Descriptions.Item label="分区">{gapModal.record.zoneName}</Descriptions.Item>
            <Descriptions.Item label="设备">
              {gapModal.record.deviceName || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="缺口原因">
              <Tag color="red">{gapModal.record.gapReason}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="缺口时长">
              <DurationText seconds={gapModal.record.gapDurationSeconds} />
            </Descriptions.Item>
            <Descriptions.Item label="责任人">
              <Space>
                <UserOutlined />
                {gapModal.record.responsiblePerson}
              </Space>
            </Descriptions.Item>
            <Descriptions.Item label="充电量">
              {gapModal.record.chargeEnergy.toFixed(2)} kWh
            </Descriptions.Item>
            <Descriptions.Item label="放电量">
              {gapModal.record.dischargeEnergy.toFixed(2)} kWh
            </Descriptions.Item>
            <Descriptions.Item label="收益">
              ¥{gapModal.record.revenue.toFixed(2)}
            </Descriptions.Item>
            <Descriptions.Item label="补贴">
              ¥{gapModal.record.subsidy.toFixed(2)}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  );
};

export default RevenuePage;
