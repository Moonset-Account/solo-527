import { useState } from 'react';
import { Table, Input, Select, Tag, Space, Button, Card, Typography } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { useQuery } from 'react-query';
import { useNavigate } from 'react-router-dom';
import { requirementService } from '../../services/requirementService';
import { CustomerRequirement, RequirementStatus } from '../../types';
import dayjs from 'dayjs';

const { Title } = Typography;
const { Option } = Select;

const statusColors: Record<RequirementStatus, string> = {
  [RequirementStatus.DRAFT]: 'default',
  [RequirementStatus.SUBMITTED]: 'blue',
  [RequirementStatus.IN_PROGRESS]: 'processing',
  [RequirementStatus.QUOTED]: 'cyan',
  [RequirementStatus.CONFIRMED]: 'success',
  [RequirementStatus.CANCELLED]: 'error',
};

const statusText: Record<RequirementStatus, string> = {
  [RequirementStatus.DRAFT]: '草稿',
  [RequirementStatus.SUBMITTED]: '已提交',
  [RequirementStatus.IN_PROGRESS]: '处理中',
  [RequirementStatus.QUOTED]: '已报价',
  [RequirementStatus.CONFIRMED]: '已确认',
  [RequirementStatus.CANCELLED]: '已取消',
};

export default function RequirementList() {
  const [filters, setFilters] = useState({
    status: undefined as RequirementStatus | undefined,
    keyword: '',
    page: 1,
    limit: 20,
  });
  const navigate = useNavigate();

  const { data, isLoading } = useQuery(
    ['requirements', filters],
    () => requirementService.getAll(filters),
    { keepPreviousData: true }
  );

  const columns = [
    {
      title: '客户名称',
      dataIndex: 'customerName',
      key: 'customerName',
      width: 140,
      render: (text: string, record: CustomerRequirement) => (
        <a onClick={() => navigate(`/requirements/${record.id}`)}>{text}</a>
      ),
    },
    {
      title: '目的地',
      dataIndex: 'destination',
      key: 'destination',
      width: 120,
    },
    {
      title: '出行人数',
      key: 'travelers',
      width: 100,
      render: (_: any, record: CustomerRequirement) => (
        <span>{record.travelerCount}人（成人{record.adultCount}/儿童{record.childCount}）</span>
      ),
    },
    {
      title: '天数',
      dataIndex: 'durationDays',
      key: 'durationDays',
      width: 80,
      render: (days: number) => `${days}天`,
    },
    {
      title: '预算',
      key: 'budget',
      width: 140,
      render: (_: any, record: CustomerRequirement) =>
        record.budgetRangeMin && record.budgetRangeMax
          ? `¥${record.budgetRangeMin.toLocaleString()} - ¥${record.budgetRangeMax.toLocaleString()}`
          : '-',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: RequirementStatus) => (
        <Tag color={statusColors[status]}>{statusText[status]}</Tag>
      ),
    },
    {
      title: '负责人',
      key: 'assignedTo',
      width: 100,
      render: (_: any, record: CustomerRequirement) => record.assignedTo?.name || '-',
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
      render: (_: any, record: CustomerRequirement) => (
        <Space>
          <Button type="link" size="small" onClick={() => navigate(`/requirements/${record.id}`)}>
            查看
          </Button>
          {record.status === RequirementStatus.DRAFT && (
            <Button type="link" size="small" onClick={() => navigate(`/requirements/${record.id}/edit`)}>
              编辑
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
            客户需求列表
          </Title>
        </div>

        <Space style={{ marginBottom: 16 }}>
          <Input
            placeholder="搜索客户名称/电话/目的地"
            prefix={<SearchOutlined />}
            style={{ width: 280 }}
            value={filters.keyword}
            onChange={(e) => setFilters({ ...filters, keyword: e.target.value, page: 1 })}
            allowClear
          />
          <Select
            placeholder="状态筛选"
            style={{ width: 150 }}
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
          <Button onClick={() => setFilters({ status: undefined, keyword: '', page: 1, limit: 20 })}>
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
