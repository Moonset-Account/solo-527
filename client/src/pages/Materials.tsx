import { Button, Card, Input, Space, Table, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { SearchOutlined } from '@ant-design/icons';
import type { ApplicationMaterial, MaterialStatus } from '../types';

const statusMap: Record<MaterialStatus, { color: string; text: string }> = {
  Missing: { color: 'warning', text: '待补充' },
  Submitted: { color: 'processing', text: '已提交' },
  Approved: { color: 'success', text: '已通过' },
  Rejected: { color: 'error', text: '已驳回' },
};

const mockData: ApplicationMaterial[] = [];

const Materials: React.FC = () => {
  const columns: ColumnsType<ApplicationMaterial> = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: '关联批次',
      dataIndex: ['batch', 'batchNumber'],
      key: 'batchNumber',
    },
    {
      title: '材料类型',
      dataIndex: 'materialType',
      key: 'materialType',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: MaterialStatus) => {
        const s = statusMap[status];
        return <Tag color={s.color}>{s.text}</Tag>;
      },
    },
    {
      title: '提交时间',
      dataIndex: 'submittedAt',
      key: 'submittedAt',
    },
    {
      title: '处理时间',
      dataIndex: 'processedAt',
      key: 'processedAt',
    },
    {
      title: '备注',
      dataIndex: 'remark',
      key: 'remark',
      ellipsis: true,
    },
    {
      title: '操作',
      key: 'action',
      render: () => (
        <Space>
          <a>查看</a>
          <a>处理</a>
        </Space>
      ),
    },
  ];

  return (
    <Card title="申报材料管理">
      <Space style={{ marginBottom: 16 }}>
        <Input
          placeholder="搜索批次号"
          prefix={<SearchOutlined />}
          style={{ width: 240 }}
        />
        <Button type="primary">搜索</Button>
      </Space>
      <Table<ApplicationMaterial>
        columns={columns}
        dataSource={mockData}
        rowKey="id"
        pagination={{ pageSize: 10 }}
        rowSelection={{}}
      />
    </Card>
  );
};

export default Materials;
