import { Button, Card, Input, Space, Table, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { PlusOutlined, SearchOutlined } from '@ant-design/icons';
import type { Plot } from '../types';

const mockData: Plot[] = [];

const Plots: React.FC = () => {
  const columns: ColumnsType<Plot> = [
    {
      title: '地块编号',
      dataIndex: 'plotCode',
      key: 'plotCode',
    },
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '面积(亩)',
      dataIndex: 'area',
      key: 'area',
    },
    {
      title: '位置',
      dataIndex: 'location',
      key: 'location',
    },
    {
      title: '所属大棚',
      dataIndex: 'greenhouseName',
      key: 'greenhouseName',
    },
    {
      title: '状态',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (active: boolean) => (
        <Tag color={active ? 'success' : 'default'}>
          {active ? '启用' : '停用'}
        </Tag>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
    },
    {
      title: '操作',
      key: 'action',
      render: () => (
        <Space>
          <a>编辑</a>
          <a style={{ color: '#ff4d4f' }}>删除</a>
        </Space>
      ),
    },
  ];

  return (
    <Card
      title="地块管理"
      extra={
        <Button type="primary" icon={<PlusOutlined />}>
          新建地块
        </Button>
      }
    >
      <Space style={{ marginBottom: 16 }}>
        <Input
          placeholder="搜索地块名称"
          prefix={<SearchOutlined />}
          style={{ width: 240 }}
        />
        <Button type="primary">搜索</Button>
      </Space>
      <Table<Plot>
        columns={columns}
        dataSource={mockData}
        rowKey="id"
        pagination={{ pageSize: 10 }}
      />
    </Card>
  );
};

export default Plots;
