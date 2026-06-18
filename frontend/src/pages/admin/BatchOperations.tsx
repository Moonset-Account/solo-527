import { useEffect, useState } from 'react';
import { Table, Card, Tag, Button, Modal, List, Progress, Space, message } from 'antd';
import { ReloadOutlined, CheckCircleOutlined, CloseCircleOutlined, InboxOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { api } from '../../api';
import { BatchOperationDto, BatchFailedItem } from '../../types';

const OperationTypeLabel: Record<string, string> = {
  BatchCreateSchedules: '批量创建课表',
  BatchMarkAttendances: '批量考勤',
  BatchEnrollStudents: '批量入班'
};

export default function AdminBatchOperations() {
  const [data, setData] = useState<BatchOperationDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [detailOpen, setDetailOpen] = useState(false);
  const [current, setCurrent] = useState<BatchOperationDto | null>(null);
  const [retryLoading, setRetryLoading] = useState(false);

  const loadData = () => {
    setLoading(true);
    api.batchOperations.list().then((res: any) => {
      setData(res);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(() => { loadData(); }, []);

  const viewDetail = async (record: BatchOperationDto) => {
    const res = await api.batchOperations.get(record.id);
    setCurrent(res);
    setDetailOpen(true);
  };

  const handleRetryFailed = async () => {
    if (!current) return;
    setRetryLoading(true);
    try {
      message.info('正在重新提交失败项...（模拟操作）');
      setTimeout(() => {
        message.success('失败项已重新提交处理');
        setRetryLoading(false);
        loadData();
        setDetailOpen(false);
      }, 1500);
    } catch {
      setRetryLoading(false);
    }
  };

  const columns = [
    { title: '操作时间', key: 'time', render: (_: any, r: BatchOperationDto) =>
      dayjs(r.createdAt).format('YYYY-MM-DD HH:mm:ss')
    },
    { title: '操作类型', dataIndex: 'operationType', key: 'type', render: (v: string) =>
      <Tag color="blue">{OperationTypeLabel[v] || v}</Tag>
    },
    { title: '操作人', dataIndex: 'operatorName', key: 'operator' },
    {
      title: '执行进度', key: 'progress', render: (_: any, r: BatchOperationDto) => {
        const percent = r.totalCount > 0 ? Math.round((r.successCount / r.totalCount) * 100) : 0;
        return (
          <Progress percent={percent} size="small"
            status={r.failedCount > 0 ? 'exception' : r.completed ? 'success' : 'active'}
            format={() => `${r.successCount}/${r.totalCount}`}
          />
        );
      }
    },
    { title: '成功数', dataIndex: 'successCount', key: 'success', render: (v: number) =>
      <span style={{ color: '#52c41a', fontWeight: 500 }}><CheckCircleOutlined /> {v}</span>
    },
    { title: '失败数', dataIndex: 'failedCount', key: 'failed', render: (v: number) =>
      v > 0 ? <span style={{ color: '#ff4d4f', fontWeight: 500 }}><CloseCircleOutlined /> {v}</span> : 0
    },
    { title: '结果摘要', dataIndex: 'summary', key: 'summary', ellipsis: true },
    {
      title: '操作', key: 'action', render: (_: any, r: BatchOperationDto) => (
        <Button size="small" type="link" onClick={() => viewDetail(r)}>详情</Button>
      )
    }
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div className="page-title" style={{ marginBottom: 0 }}>批量操作记录</div>
        <Button icon={<ReloadOutlined />} onClick={loadData}>刷新</Button>
      </div>
      <Card className="card-shadow">
        <Table
          rowKey="id"
          loading={loading}
          columns={columns}
          dataSource={data}
          pagination={{ pageSize: 15 }}
        />
      </Card>

      <Modal title="批量操作详情" open={detailOpen} onCancel={() => setDetailOpen(false)}
        footer={null} width={640} destroyOnClose>
        {current && (
          <>
            <Card size="small" style={{ marginBottom: 16 }}>
              <Space direction="vertical" style={{ width: '100%' }}>
                <div><strong>操作类型：</strong>{OperationTypeLabel[current.operationType] || current.operationType}</div>
                <div><strong>操作人：</strong>{current.operatorName}</div>
                <div><strong>执行时间：</strong>{dayjs(current.createdAt).format('YYYY-MM-DD HH:mm:ss')}</div>
                <div><strong>结果摘要：</strong>{current.summary}</div>
                <Progress
                  percent={current.totalCount > 0 ? Math.round((current.successCount / current.totalCount) * 100) : 0}
                  status={current.failedCount > 0 ? 'exception' : 'success'}
                />
                <Space>
                  <Tag color="green">成功 {current.successCount}</Tag>
                  <Tag color="red">失败 {current.failedCount}</Tag>
                  <Tag color="blue">总计 {current.totalCount}</Tag>
                </Space>
              </Space>
            </Card>

            {current.failedItemsList && current.failedItemsList.length > 0 && (
              <>
                <Card size="small" title={`失败项 (${current.failedItemsList.length})`}
                  extra={
                    <Button type="primary" size="small" icon={<InboxOutlined />}
                      loading={retryLoading} onClick={handleRetryFailed}>
                      重新提交失败项
                    </Button>
                  }>
                  <List
                    size="small"
                    bordered
                    dataSource={current.failedItemsList}
                    renderItem={(item: BatchFailedItem) => (
                      <List.Item>
                        <List.Item.Meta
                          avatar={<Tag color="red">失败</Tag>}
                          title={<span>{item.itemName} (ID: {item.itemId})</span>}
                          description={
                            <>
                              <div style={{ color: '#ff4d4f' }}>错误：{item.errorMessage}</div>
                              {item.itemData && (
                                <pre style={{
                                  marginTop: 4, fontSize: 11, background: '#fff1f0',
                                  padding: 6, borderRadius: 4, marginBottom: 0
                                }}>
                                  {JSON.stringify(item.itemData, null, 2)}
                                </pre>
                              )}
                            </>
                          }
                        />
                      </List.Item>
                    )}
                  />
                </Card>
              </>
            )}
          </>
        )}
      </Modal>
    </div>
  );
}
