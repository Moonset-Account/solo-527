import { useEffect, useState } from 'react';
import {
  Card,
  Row,
  Col,
  Statistic,
  Progress,
  Table,
  Select,
  DatePicker,
  Button,
  Space,
  Tag,
} from 'antd';
import {
  ArrowUpOutlined,
  ArrowDownOutlined,
  UserOutlined,
  DollarOutlined,
  FilterOutlined,
  ExportOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { useOrderStore } from '@/store/orderStore';
import {
  formatCurrency,
  CONVERSION_STAGE_LABELS,
  ORDER_STATUS_LABELS,
  ORDER_STATUS_COLORS,
} from '@/utils';
import type { ConversionStage, Order } from '@/types';

const { RangePicker } = DatePicker;
const { Option } = Select;

export default function ConversionFunnel() {
  const navigate = useNavigate();
  const { orders, conversionFunnel, fetchOrders, fetchConversionFunnel, isLoading } = useOrderStore();
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);
  const [stageFilter, setStageFilter] = useState<ConversionStage | undefined>();

  useEffect(() => {
    loadData();
  }, [dateRange, stageFilter]);

  const loadData = () => {
    const params: Record<string, unknown> = {};
    if (dateRange) {
      params.start_date = dateRange[0].format('YYYY-MM-DD');
      params.end_date = dateRange[1].format('YYYY-MM-DD');
    }
    if (stageFilter) {
      params.conversion_stage = stageFilter;
    }
    fetchConversionFunnel(params);
    fetchOrders(params);
  };

  const totalOrders = conversionFunnel.reduce((sum, s) => sum + s.count, 0);
  const totalAmount = conversionFunnel.reduce((sum, s) => sum + s.amount, 0);
  const completedRate = totalOrders > 0
    ? (conversionFunnel.find((s) => s.stage === 'completed')?.count || 0) /
      (conversionFunnel.find((s) => s.stage === 'inquiry')?.count || 1) * 100
    : 0;
  const lostRate = totalOrders > 0
    ? (conversionFunnel.find((s) => s.stage === 'lost')?.count || 0) /
      (conversionFunnel.find((s) => s.stage === 'inquiry')?.count || 1) * 100
    : 0;

  const columns = [
    {
      title: '订单号',
      dataIndex: 'order_number',
      key: 'order_number',
      render: (text: string, record: Order) => (
        <span
          className="text-primary-600 cursor-pointer hover:underline"
          onClick={() => navigate(`/admin/orders/${record.id}`)}
        >
          {text}
        </span>
      ),
    },
    {
      title: '入住人',
      dataIndex: 'guest_name',
      key: 'guest_name',
    },
    {
      title: '房型',
      dataIndex: 'room_name',
      key: 'room_name',
    },
    {
      title: '金额',
      dataIndex: 'total_amount',
      key: 'total_amount',
      render: (value: number) => <span className="font-medium">{formatCurrency(value)}</span>,
    },
    {
      title: '订单状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag className={ORDER_STATUS_COLORS[status]}>{ORDER_STATUS_LABELS[status]}</Tag>
      ),
    },
    {
      title: '转化阶段',
      dataIndex: 'conversion_stage',
      key: 'conversion_stage',
      render: (stage: string) => (
        <Tag color="blue">{CONVERSION_STAGE_LABELS[stage]}</Tag>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800 m-0">入住转化漏斗</h1>
        <Space>
          <Button icon={<ExportOutlined />}>导出数据</Button>
          <Button type="primary" onClick={() => navigate('/admin/orders')}>
            返回订单列表
          </Button>
        </Space>
      </div>

      <Card>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={12} md={8}>
            <RangePicker
              className="w-full"
              value={dateRange}
              onChange={(dates) => setDateRange(dates as [dayjs.Dayjs, dayjs.Dayjs] | null)}
            />
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Select
              placeholder="筛选转化阶段"
              className="w-full"
              allowClear
              value={stageFilter}
              onChange={(value) => setStageFilter(value)}
            >
              {Object.entries(CONVERSION_STAGE_LABELS).map(([value, label]) => (
                <Option key={value} value={value}>
                  {label}
                </Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Button icon={<FilterOutlined />} onClick={loadData} type="primary">
              筛选
            </Button>
          </Col>
        </Row>
      </Card>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="总咨询量"
              value={conversionFunnel.find((s) => s.stage === 'inquiry')?.count || 0}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#3b82f6' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="总成交金额"
              value={totalAmount}
              precision={2}
              prefix="¥"
              valueStyle={{ color: '#16a34a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="成交率"
              value={completedRate}
              precision={1}
              suffix="%"
              prefix={<ArrowUpOutlined className="text-green-500" />}
              valueStyle={{ color: '#16a34a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="流失率"
              value={lostRate}
              precision={1}
              suffix="%"
              prefix={<ArrowDownOutlined className="text-red-500" />}
              valueStyle={{ color: '#ef4444' }}
            />
          </Card>
        </Col>
      </Row>

      <Card title="转化漏斗分析">
        <div className="relative">
          <Row gutter={[16, 16]} className="items-stretch">
            {conversionFunnel.map((stage, index) => {
              const maxCount = Math.max(...conversionFunnel.map((s) => s.count));
              const widthPercent = (stage.count / maxCount) * 100;

              return (
                <Col key={stage.stage} xs={24} sm={12} lg={4} className="flex flex-col">
                  <div
                    className="flex-1 p-4 rounded-lg text-center transition-all hover:shadow-lg cursor-pointer"
                    style={{
                      background: `linear-gradient(135deg, #dcfce7 ${100 - widthPercent}%, #16a34a ${100 - widthPercent}%)`,
                    }}
                    onClick={() => setStageFilter(stage.stage)}
                  >
                    <div className="text-3xl font-bold text-white mb-1">{stage.count}</div>
                    <div className="text-white font-medium mb-2">{stage.stage_name}</div>
                    <div className="text-white/90 text-sm mb-3">
                      <DollarOutlined className="mr-1" />
                      {formatCurrency(stage.amount)}
                    </div>
                    <Progress
                      type="dashboard"
                      percent={Math.round(stage.conversion_rate * 100)}
                      size={80}
                      strokeColor="#fff"
                      trailColor="rgba(255,255,255,0.3)"
                      format={(percent) => `${percent}%`}
                    />
                    <div className="text-xs text-white/80 mt-2">转化率</div>
                  </div>
                  {index < conversionFunnel.length - 1 && (
                    <div className="absolute right-[-8px] top-1/2 transform -translate-y-1/2 text-gray-300 text-3xl z-10 hidden lg:block">
                      →
                    </div>
                  )}
                </Col>
              );
            })}
          </Row>
        </div>
      </Card>

      <Card title="阶段详情">
        <Row gutter={[16, 16]}>
          {conversionFunnel.map((stage) => (
            <Col key={stage.stage} xs={24} sm={12} lg={4}>
              <Card
                size="small"
                className={`cursor-pointer transition-all ${
                  stageFilter === stage.stage ? 'ring-2 ring-primary-500' : ''
                }`}
                onClick={() => setStageFilter(stageFilter === stage.stage ? undefined : stage.stage)}
              >
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium">{stage.stage_name}</span>
                  <Tag color="blue">{stage.count}</Tag>
                </div>
                <div className="text-lg font-bold text-primary-600">
                  {formatCurrency(stage.amount)}
                </div>
                <div className="text-sm text-gray-500">
                  转化率 {(stage.conversion_rate * 100).toFixed(1)}%
                </div>
                <Progress
                  percent={Math.round(stage.conversion_rate * 100)}
                  size="small"
                  showInfo={false}
                  strokeColor="#16a34a"
                  className="mt-2"
                />
              </Card>
            </Col>
          ))}
        </Row>
      </Card>

      <Card
        title={
          <Space>
            订单列表
            {stageFilter && (
              <Tag color="blue" closable onClose={() => setStageFilter(undefined)}>
                {CONVERSION_STAGE_LABELS[stageFilter]}
              </Tag>
            )}
          </Space>
        }
      >
        <Table
          columns={columns}
          dataSource={orders}
          rowKey="id"
          loading={isLoading}
          pagination={{
            pageSize: 20,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条`,
          }}
        />
      </Card>
    </div>
  );
}
