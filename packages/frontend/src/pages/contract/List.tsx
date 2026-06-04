import { useState } from 'react';
import { Table, Input, Select, Tag, Space, Button, Card, Typography } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { useQuery } from 'react-query';
import { useNavigate } from 'react-router-dom';
import { contractService } from '../../services/contractService';
import { Contract, ContractStatus } from '../../types';
import dayjs from 'dayjs';

const { Title } = Typography;
const { Option } = Select;

const statusColors: Record<ContractStatus, string> = {
  [ContractStatus.DRAFT]: 'default',
  [ContractStatus.PENDING_APPROVAL]: 'orange',
  [ContractStatus.APPROVED]: 'success',
  [ContractStatus.REJECTED]: 'error',
  [ContractStatus.SIGNED]: 'green',
  [ContractStatus.CANCELLED]: 'default',
};

const statusText: Record<ContractStatus, string> = {
  [ContractStatus.DRAFT]: '草稿',
  [ContractStatus.PENDING_APPROVAL]: '待审批',
  [ContractStatus.APPROVED]: '已通过',
  [ContractStatus.REJECTED]: '已拒绝',
  [ContractStatus.SIGNED]: '已签署',
  [ContractStatus.CANCELLED]: '已取消',
};

export default function ContractList() {
  const [filters, setFilters] = useState({
    status: undefined as ContractStatus | undefined,
    customerName: undefined as string | undefined,
    page: 1,
    limit: 20,
  });
  const navigate = useNavigate();

  const { data, isLoading } = useQuery(
    ['contracts', filters],
    () => contractService.getAll(filters),
    { keepPreviousData: true }
  );

  const columns = [
    {
      title: '合同编号',
      dataIndex: 'contractNumber',
      key: 'contractNumber',
      width: 180,
      render: (text: string, record: Contract) => (
        <a onClick={() => navigate(`/contracts/${record.id}`)}>{text}</a>
      ),
    },
    {
      title: '客户名称',
      dataIndex: 'customerName',
      key: 'customerName',
      width: 150,
    },
    {
      title: '关联报价',
      key: 'quote',
      width: 200,
      render: (_: any, record: Contract) => (
        <a onClick={() => navigate(`/quotes/${record.quoteId}`)}>
          {record.quote?.itineraryName || '查看报价'}
        </a>
      ),
    },
    {
      title: '合同金额',
      key: 'totalPrice',
      width: 120,
      render: (_: any, record: Contract) =>
        record.quote ? `¥${record.quote.totalPrice.toLocaleString()}` : '-',
    },
    {
      title: '付款节点',
      key: 'paymentTerms',
      width: 100,
      render: (_: any, record: Contract) =>
        record.paymentTerms?.length || 0 + ' 期',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: ContractStatus) => (
        <Tag color={statusColors[status]}>{statusText[status]}</Tag>
      ),
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
      width: 150,
      render: (_: any, record: Contract) => (
        <Space>
          <Button type="link" size="small" onClick={() => navigate(`/contracts/${record.id}`)}>
            查看
          </Button>
          {[ContractStatus.DRAFT, ContractStatus.REJECTED].includes(record.status) && (
            <Button type="link" size="small">编辑</Button>
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
            合同管理
          </Title>
        </div>

        <Space style={{ marginBottom: 16 }}>
          <Input
            placeholder="搜索客户名称"
            prefix={<SearchOutlined />}
            style={{ width: 200 }}
            allowClear
            value={filters.customerName}
            onChange={(e) => setFilters({ ...filters, customerName: e.target.value, page: 1 })}
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
          <Button
            onClick={() =>
              setFilters({ status: undefined, customerName: undefined, page: 1, limit: 20 })
            }
          >
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
