import { useState } from 'react';
import { Table, Input, Select, Tag, Space, Button, Card, Typography, Tooltip } from 'antd';
import { SearchOutlined, WarningOutlined } from '@ant-design/icons';
import { useQuery } from 'react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { quoteService } from '../../services/quoteService';
import { Quote, QuoteStatus, ProfitWarningLevel } from '../../types';
import dayjs from 'dayjs';

const { Title } = Typography;
const { Option } = Select;

const statusColors: Record<QuoteStatus, string> = {
  [QuoteStatus.DRAFT]: 'default',
  [QuoteStatus.PENDING_APPROVAL]: 'orange',
  [QuoteStatus.APPROVED]: 'success',
  [QuoteStatus.REJECTED]: 'error',
  [QuoteStatus.SENT_TO_CUSTOMER]: 'cyan',
  [QuoteStatus.ACCEPTED]: 'green',
  [QuoteStatus.DECLINED]: 'red',
  [QuoteStatus.OBSOLETE]: 'default',
};

const statusText: Record<QuoteStatus, string> = {
  [QuoteStatus.DRAFT]: '草稿',
  [QuoteStatus.PENDING_APPROVAL]: '待审批',
  [QuoteStatus.APPROVED]: '已通过',
  [QuoteStatus.REJECTED]: '已拒绝',
  [QuoteStatus.SENT_TO_CUSTOMER]: '已发送',
  [QuoteStatus.ACCEPTED]: '已接受',
  [QuoteStatus.DECLINED]: '已拒绝',
  [QuoteStatus.OBSOLETE]: '已废弃',
};

const profitWarningColors: Record<ProfitWarningLevel, string> = {
  [ProfitWarningLevel.NORMAL]: 'success',
  [ProfitWarningLevel.WARNING]: 'orange',
  [ProfitWarningLevel.CRITICAL]: 'red',
};

export default function QuoteList() {
  const [searchParams] = useSearchParams();
  const requirementId = searchParams.get('requirementId') || undefined;

  const [filters, setFilters] = useState({
    status: undefined as QuoteStatus | undefined,
    profitWarning: undefined as ProfitWarningLevel | undefined,
    requirementId,
    page: 1,
    limit: 20,
  });
  const navigate = useNavigate();

  const { data, isLoading } = useQuery(
    ['quotes', filters],
    () => quoteService.getAll(filters),
    { keepPreviousData: true }
  );

  const columns = [
    {
      title: '行程名称',
      dataIndex: 'itineraryName',
      key: 'itineraryName',
      width: 200,
      render: (text: string, record: Quote) => (
        <Space>
          <a onClick={() => navigate(`/quotes/${record.id}`)}>{text}</a>
          {record.profitWarning !== ProfitWarningLevel.NORMAL && (
            <Tooltip title={`毛利率${record.profitMargin.toFixed(1)}%，低于阈值`}>
              <WarningOutlined style={{ color: record.profitWarning === ProfitWarningLevel.CRITICAL ? '#ff4d4f' : '#fa8c16' }} />
            </Tooltip>
          )}
        </Space>
      ),
    },
    {
      title: '版本',
      dataIndex: 'version',
      key: 'version',
      width: 80,
      render: (v: number) => `v${v}`,
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
      width: 120,
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
      title: '毛利率',
      key: 'profitMargin',
      width: 100,
      render: (_: any, record: Quote) => (
        <Tag color={profitWarningColors[record.profitWarning]}>
          {record.profitMargin.toFixed(1)}%
        </Tag>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: QuoteStatus) => (
        <Tag color={statusColors[status]}>{statusText[status]}</Tag>
      ),
    },
    {
      title: '审批人',
      key: 'approvedBy',
      width: 100,
      render: (_: any, record: Quote) => record.approvedBy?.name || '-',
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
      render: (date: string) => dayjs(date).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '操作',
      key: 'actions',
      width: 180,
      render: (_: any, record: Quote) => (
        <Space>
          <Button type="link" size="small" onClick={() => navigate(`/quotes/${record.id}`)}>
            查看
          </Button>
          {[QuoteStatus.DRAFT, QuoteStatus.REJECTED].includes(record.status) && (
            <Button type="link" size="small" onClick={() => navigate(`/quotes/${record.id}/edit`)}>
              编辑
            </Button>
          )}
          {record.version > 1 && (
            <Button type="link" size="small" onClick={() => navigate(`/quotes/${record.id}/compare`)}>
              版本对比
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Card>
        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
          <Title level={4} style={{ margin: 0 }}>
            报价单列表
          </Title>
        </div>

        <Space style={{ marginBottom: 16 }}>
          <Input
            placeholder="搜索行程名称"
            prefix={<SearchOutlined />}
            style={{ width: 200 }}
            allowClear
          />
          <Select
            placeholder="状态筛选"
            style={{ width: 130 }}
            value={filters.status}
            onChange={(value) => setFilters({ ...filters, status: value, page: 1 })}
            allowClear
          >
            {Object.entries(statusText).map(([key, value]) => (
              <Option key={key} value={key}>
                {value}
              </Option>
            ))}
          </Select>
          <Select
            placeholder="毛利预警"
            style={{ width: 130 }}
            value={filters.profitWarning}
            onChange={(value) => setFilters({ ...filters, profitWarning: value, page: 1 })}
            allowClear
          >
            <Option value={ProfitWarningLevel.WARNING}>低毛利</Option>
            <Option value={ProfitWarningLevel.CRITICAL}>极低毛利</Option>
          </Select>
          <Button onClick={() => setFilters({ status: undefined, profitWarning: undefined, requirementId, page: 1, limit: 20 })}>
            重置
          </Button>
        </Space>

        <Table
          columns={columns}
          dataSource={data?.data.data}
          rowKey="id"
          loading={isLoading}
          pagination={{
            current: filters.page,
            pageSize: filters.limit,
            total: data?.data.total,
            showSizeChanger: true,
            onChange: (page, pageSize) => setFilters({ ...filters, page, limit: pageSize }),
          }}
        />
      </Card>
    </div>
  );
}
