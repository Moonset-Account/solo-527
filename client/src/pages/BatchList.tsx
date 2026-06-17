import { Button, Card, Input, Space, Table, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { PlusOutlined, SearchOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import type { HarvestBatch, BatchStatus } from '../types';

const statusMap: Record<BatchStatus, { color: string; text: string }> = {
  Pending: { color: 'default', text: '待开始' },
  Harvesting: { color: 'processing', text: '采收中' },
  Completed: { color: 'success', text: '已完成' },
  Cancelled: { color: 'error', text: '已取消' },
};

const mockData: HarvestBatch[] = [];

const BatchList: React.FC = () => {
  const navigate = useNavigate();

  const columns: ColumnsType<HarvestBatch> = [
    {
      title: '批次编号',
      dataIndex: 'batchNumber',
      key: 'batchNumber',
    },
    {
      title: '地块',
      dataIndex: ['plot', 'name'],
      key: 'plotName',
    },
    {
      title: '品种',
      dataIndex: ['variety', 'name'],
      key: 'varietyName',
    },
    {
      title: '种植日期',
      dataIndex: 'plantingDate',
      key: 'plantingDate',
    },
    {
      title: '预计采收',
      dataIndex: 'expectedHarvestDate',
      key: 'expectedHarvestDate',
    },
    {
      title: '产量(kg)',
      dataIndex: 'yield',
      key: 'yield',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: BatchStatus) => {
        const s = statusMap[status];
        return <Tag color={s.color}>{s.text}</Tag>;
      },
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <a onClick={() => navigate(`/batches/${record.id}`)}>详情</a>
      ),
    },
  ];

  return (
    <Card
      title="采收批次管理"
      extra={
        <Button type="primary" icon={<PlusOutlined />}>
          新建批次
        </Button>
      }
    >
      <Space style={{ marginBottom: 16 }}>
        <Input
          placeholder="搜索批次号"
          prefix={<SearchOutlined />}
          style={{ width: 240 }}
        />
        <Button type="primary">搜索</Button>
      </Space>
      <Table<HarvestBatch>
        columns={columns}
        dataSource={mockData}
        rowKey="id"
        pagination={{ pageSize: 10 }}
      />
    </Card>
  );
};

export default BatchList;
