import { useState } from 'react';
import {
  Card,
  Row,
  Col,
  Statistic,
  Table,
  Select,
  Space,
  Button,
  Typography,
  Tag,
  DatePicker,
  Progress,
} from 'antd';
import {
  DollarOutlined,
  RiseOutlined,
  FileDoneOutlined,
  TeamOutlined,
  DownloadOutlined,
} from '@ant-design/icons';
import { useQuery } from 'react-query';
import { profitService } from '../../services/profitService';
import { ProfitWarningLevel } from '../../types';
import dayjs from 'dayjs';

const { Title } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

export default function ProfitDashboard() {
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);
  const [status, setStatus] = useState<string | undefined>();

  const { data: stats, isLoading: statsLoading } = useQuery(
    ['profitStats', dateRange],
    () =>
      profitService.getDashboardStats({
        startDate: dateRange?.[0]?.toISOString(),
        endDate: dateRange?.[1]?.toISOString(),
      }),
    { keepPreviousData: true }
  );

  const { data: quotesData, isLoading: quotesLoading } = useQuery(
    ['profitQuotes', dateRange, status],
    () =>
      profitService.getQuotesProfitList({
        startDate: dateRange?.[0]?.toISOString(),
        endDate: dateRange?.[1]?.toISOString(),
        status,
        page: 1,
        limit: 50,
      }),
    { keepPreviousData: true }
  );

  const { data: salespersonData } = useQuery(
    ['profitBySalesperson', dateRange],
    () =>
      profitService.getBySalesperson({
        startDate: dateRange?.[0]?.toISOString(),
        endDate: dateRange?.[1]?.toISOString(),
      }),
    { keepPreviousData: true }
  );

  const getProfitColor = (margin: number) => {
    if (margin < 5) return '#ff4d4f';
    if (margin < 10) return '#fa8c16';
    return '#52c41a';
  };

  const getProfitWarningLevel = (margin: number) => {
    if (margin < 5) return ProfitWarningLevel.CRITICAL;
    if (margin < 10) return ProfitWarningLevel.WARNING;
    return ProfitWarningLevel.NORMAL;
  };

  const profitWarningColors: Record<ProfitWarningLevel, string> = {
    [ProfitWarningLevel.NORMAL]: 'success',
    [ProfitWarningLevel.WARNING]: 'orange',
    [ProfitWarningLevel.CRITICAL]: 'red',
  };

  const columns = [
    {
      title: '行程名称',
      dataIndex: 'itineraryName',
      key: 'itineraryName',
      width: 200,
    },
    {
      title: '客户名称',
      key: 'customerName',
      width: 120,
      render: (_: any, record: any) => record.requirement?.customerName || '-',
    },
    {
      title: '总成本',
      dataIndex: 'totalCost',
      key: 'totalCost',
      width: 120,
      render: (cost: number) => `¥${cost.toLocaleString()}`,
    },
    {
      title: '服务费',
      dataIndex: 'serviceFee',
      key: 'serviceFee',
      width: 100,
      render: (fee: number) => `¥${fee.toLocaleString()}`,
    },
    {
      title: '总价',
      dataIndex: 'totalPrice',
      key: 'totalPrice',
      width: 120,
      render: (price: number) => `¥${price.toLocaleString()}`,
    },
    {
      title: '利润',
      dataIndex: 'profit',
      key: 'profit',
      width: 120,
      render: (profit: number) => (
        <span style={{ color: profit >= 0 ? '#52c41a' : '#ff4d4f' }}>
          ¥{profit.toLocaleString()}
        </span>
      ),
    },
    {
      title: '毛利率',
      key: 'profitMargin',
      width: 150,
      render: (_: any, record: any) => (
        <Space>
          <Progress
            percent={record.profitMargin}
            size="small"
            strokeColor={getProfitColor(record.profitMargin)}
            showInfo={false}
            style={{ width: 60 }}
          />
          <Tag color={profitWarningColors[getProfitWarningLevel(record.profitMargin)]}>
            {record.profitMargin.toFixed(1)}%
          </Tag>
        </Space>
      ),
    },
    {
      title: '创建人',
      key: 'createdBy',
      width: 100,
      render: (_: any, record: any) => record.createdByInfo?.name || '-',
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
      render: (date: string) => dayjs(date).format('YYYY-MM-DD'),
    },
  ];

  const handleExport = () => {
    profitService.exportReport({
      startDate: dateRange?.[0]?.toISOString(),
      endDate: dateRange?.[1]?.toISOString(),
      format: 'excel',
    });
  };

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
        <Title level={4} style={{ margin: 0 }}>
          利润统计
        </Title>
        <Space>
          <RangePicker
            value={dateRange}
            onChange={(dates) => setDateRange(dates as [dayjs.Dayjs, dayjs.Dayjs] | null)}
          />
          <Button icon={<DownloadOutlined />} onClick={handleExport}>
            导出报表
          </Button>
        </Space>
      </div>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card loading={statsLoading}>
            <Statistic
              title="总收入"
              value={stats?.data?.totalRevenue || 0}
              prefix={<DollarOutlined />}
              precision={2}
              formatter={(value) => `¥${(value as number).toLocaleString()}`}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card loading={statsLoading}>
            <Statistic
              title="总利润"
              value={stats?.data?.totalProfit || 0}
              prefix={<RiseOutlined />}
              precision={2}
              formatter={(value) => `¥${(value as number).toLocaleString()}`}
              valueStyle={{
                color: (stats?.data?.totalProfit || 0) >= 0 ? '#3f8600' : '#cf1322',
              }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card loading={statsLoading}>
            <Statistic
              title="平均毛利率"
              value={stats?.data?.avgProfitMargin || 0}
              suffix="%"
              precision={1}
              valueStyle={{
                color: getProfitColor(stats?.data?.avgProfitMargin || 0),
              }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card loading={statsLoading}>
            <Statistic
              title="已成交报价"
              value={stats?.data?.acceptedQuotes || 0}
              prefix={<FileDoneOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={24}>
          <Card title="销售业绩排行" loading={statsLoading}>
            <Row gutter={16}>
              {(salespersonData?.data || []).map((item: any, index: number) => (
                <Col span={8} key={index}>
                  <Card size="small" type="inner">
                    <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                      <Space>
                        <TeamOutlined />
                        <span style={{ fontWeight: 500 }}>{item.name}</span>
                      </Space>
                      <span>
                        {item.count} 单 / <span style={{ color: '#52c41a' }}>¥{item.profit.toLocaleString()}</span>
                      </span>
                    </Space>
                  </Card>
                </Col>
              ))}
            </Row>
          </Card>
        </Col>
      </Row>

      <Card title="报价单利润明细">
        <Space style={{ marginBottom: 16 }}>
          <Select
            placeholder="状态筛选"
            style={{ width: 150 }}
            value={status}
            onChange={setStatus}
            allowClear
          >
            <Option value="approved">已通过</Option>
            <Option value="sent_to_customer">已发送</Option>
            <Option value="accepted">已接受</Option>
          </Select>
          <Button
            onClick={() => {
              setStatus(undefined);
              setDateRange(null);
            }}
          >
            重置
          </Button>
        </Space>

        <Table
          columns={columns}
          dataSource={quotesData?.data?.data}
          rowKey="id"
          loading={quotesLoading}
          pagination={{
            pageSize: 20,
            showSizeChanger: true,
          }}
        />
      </Card>
    </div>
  );
}
