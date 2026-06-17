import { useEffect, useState } from 'react';
import {
  Table,
  Card,
  Button,
  Tag,
  Space,
  Spin,
  Empty,
  message,
  ColumnsType,
} from 'antd';
import { ReloadOutlined, RetweetOutlined, CheckCircleOutlined, CloseCircleOutlined, InfoCircleOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { operationApi } from '@/api';
import {
  BatchOperation,
  BatchOperationItem,
  OperationStatus,
  Guid,
} from '@/types';
import {
  OPERATION_STATUS_COLORS,
  OPERATION_STATUS_NAMES,
} from '@/constants/mappings';

const columns: ColumnsType<BatchOperation> = [
  { title: '操作类型', dataIndex: 'operationType', key: 'operationType', width: 160, render: (v) => v || '-' },
  {
    title: '总数/成功/失败',
    key: 'count',
    width: 180,
    render: (_, record) => {
      const total = record.items?.length || 0;
      const success = record.items?.filter((i) => i.success).length || 0;
      const failed = total - success;
      return (
        <Space>
          <span>总数:<strong>{total}</strong></span>
          <span style={{ color: '#52c41a' }}>成功:<strong>{success}</strong></span>
          <span style={{ color: '#ff4d4f' }}>失败:<strong>{failed}</strong></span>
        </Space>
      );
    },
  },
  {
    title: '状态',
    dataIndex: 'status',
    key: 'status',
    width: 120,
    render: (v: OperationStatus) => <Tag color={OPERATION_STATUS_COLORS[v]}>{OPERATION_STATUS_NAMES[v]}</Tag>,
  },
  { title: '摘要', dataIndex: 'summary', key: 'summary', ellipsis: true },
  { title: '操作人', key: 'operator', width: 140, render: () => '系统操作' },
  {
    title: '操作时间',
    dataIndex: 'operatedAt',
    key: 'operatedAt',
    width: 180,
    render: (v) => dayjs(v).format('YYYY-MM-DD HH:mm:ss'),
  },
];

const itemColumns: ColumnsType<BatchOperationItem> = [
  { title: '实体类型', dataIndex: 'entityType', key: 'entityType', width: 140 },
  { title: '实体ID', dataIndex: 'entityId', key: 'entityId', ellipsis: true },
  {
    title: '结果',
    key: 'result',
    width: 100,
    render: (_, record) =>
      record.success ? (
        <Tag icon={<CheckCircleOutlined />} color="success">成功</Tag>
      ) : (
        <Tag icon={<CloseCircleOutlined />} color="error">失败</Tag>
      ),
  },
  { title: '错误信息', dataIndex: 'errorMessage', key: 'errorMessage', ellipsis: true },
  { title: '重试次数', dataIndex: 'retryCount', key: 'retryCount', width: 90 },
  {
    title: '操作',
    key: 'action',
    width: 100,
    render: (_, record, index) => {
      if (record.success) return null;
      const opId = (record as any)._opId;
      return (
        <Button
          size="small"
          type="primary"
          icon={<RetweetOutlined />}
          onClick={(e) => { e.stopPropagation(); handleRetryItem(opId); }}
        >
          重试
        </Button>
      );
    },
  },
];

let handleRetryItem: (id: Guid) => void;

function Operations() {
  const [loading, setLoading] = useState(false);
  const [operations, setOperations] = useState<BatchOperation[]>([]);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await operationApi.getRecent(20);
      setOperations(Array.isArray(data) ? data : []);
    } catch {
      message.error('加载操作历史失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRetry = async (id: Guid) => {
    try {
      const result = await operationApi.retry(id);
      message.success(`重试完成: 成功 ${result.successCount}, 失败 ${result.failedCount}`);
      loadData();
    } catch {
      message.error('重试失败');
    }
  };

  handleRetryItem = handleRetry;

  const expandedRowRender = (record: BatchOperation) => {
    const items = (record.items || []).map((item) => ({ ...item, _opId: record.id }));
    return items.length === 0 ? (
      <Empty description="无详细记录" image={Empty.PRESENTED_IMAGE_SIMPLE} />
    ) : (
      <Table
        rowKey="id"
        columns={itemColumns}
        dataSource={items}
        pagination={false}
        size="small"
      />
    );
  };

  return (
    <Spin spinning={loading}>
      <Card
        title={
          <Space>
            <span>批量操作历史（最近20条）</span>
            <InfoCircleOutlined style={{ color: '#888' }} />
            <span style={{ color: '#888', fontSize: 12 }}>点击行展开查看详情</span>
          </Space>
        }
        extra={<Button icon={<ReloadOutlined />} onClick={loadData}>刷新</Button>}
      >
        {operations.length === 0 ? (
          <Empty description="暂无操作记录" />
        ) : (
          <Table
            rowKey="id"
            columns={columns}
            dataSource={operations}
            expandable={{
              expandedRowRender,
              defaultExpandAllRows: false,
              rowExpandable: () => true,
            }}
            pagination={{ pageSize: 10, showTotal: (t) => `共 ${t} 条` }}
          />
        )}
      </Card>
    </Spin>
  );
}

export default Operations;
