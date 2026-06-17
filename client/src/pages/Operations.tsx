import { Button, Card, Space, Table, Tag, Timeline } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { BatchOperation, OperationStatus } from '../types';

const statusMap: Record<OperationStatus, { color: string; text: string }> = {
  Success: { color: 'success', text: '全部成功' },
  PartialSuccess: { color: 'warning', text: '部分成功' },
  Failed: { color: 'error', text: '全部失败' },
};

const mockData: BatchOperation[] = [];

const Operations: React.FC = () => {
  const columns: ColumnsType<BatchOperation> = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: '操作类型',
      dataIndex: 'operationType',
      key: 'operationType',
    },
    {
      title: '总数',
      dataIndex: 'totalCount',
      key: 'totalCount',
      width: 80,
    },
    {
      title: '成功',
      dataIndex: 'successCount',
      key: 'successCount',
      width: 80,
      render: (v: number) => <span style={{ color: '#52c41a' }}>{v}</span>,
    },
    {
      title: '失败',
      dataIndex: 'failedCount',
      key: 'failedCount',
      width: 80,
      render: (v: number) => <span style={{ color: '#ff4d4f' }}>{v}</span>,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: OperationStatus) => {
        const s = statusMap[status];
        return <Tag color={s.color}>{s.text}</Tag>;
      },
    },
    {
      title: '摘要',
      dataIndex: 'summary',
      key: 'summary',
      ellipsis: true,
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space>
          <a>详情</a>
          {record.failedCount > 0 && <a>重试失败项</a>}
        </Space>
      ),
    },
  ];

  return (
    <Card title="批量操作记录">
      <Table<BatchOperation>
        columns={columns}
        dataSource={mockData}
        rowKey="id"
        pagination={{ pageSize: 10 }}
        expandedRowRender={(record) => (
          <Timeline
            items={
              record.items?.length
                ? record.items.map((item) => ({
                    color: item.succeeded ? 'green' : 'red',
                    children: (
                      <Space>
                        <span>
                          {item.entityType} #{item.entityId}
                        </span>
                        <Tag color={item.succeeded ? 'success' : 'error'}>
                          {item.succeeded ? '成功' : '失败'}
                        </Tag>
                        {item.errorMessage && (
                          <span style={{ color: '#999' }}>{item.errorMessage}</span>
                        )}
                        {!item.succeeded && (
                          <Button size="small" type="link">
                            重试
                          </Button>
                        )}
                      </Space>
                    ),
                  }))
                : [{ children: '无明细数据' }]
            }
          />
        )}
      />
    </Card>
  );
};

export default Operations;
