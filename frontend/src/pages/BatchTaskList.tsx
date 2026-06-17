import { useState, useEffect } from 'react';
import {
  Table,
  Tag,
  Button,
  Space,
  Input,
  Select,
  Form,
  Modal,
  message,
  Progress,
  Descriptions,
  Drawer,
  List,
  Popconfirm,
} from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  ReloadOutlined,
  EyeOutlined,
  StopOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import { batchTaskApi, alertApi } from '../api';
import type { BatchTask, BatchTaskDetail } from '../types';
import { BatchTaskStatus, BatchTaskType, AlertStatus } from '../types';
import {
  batchTaskStatusText,
  batchTaskStatusColor,
  batchTaskTypeText,
  formatDate,
} from '../utils';
import { useAuthStore } from '../store';
import { useNavigate } from 'react-router-dom';

export default function BatchTaskList() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<BatchTask[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [status, setStatus] = useState<BatchTaskStatus | undefined>();
  const [type, setType] = useState<BatchTaskType | undefined>();
  const [keyword, setKeyword] = useState('');

  const [detailVisible, setDetailVisible] = useState(false);
  const [detail, setDetail] = useState<BatchTaskDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    loadData();
  }, [page, pageSize]);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await batchTaskApi.getList({
        page,
        pageSize,
        status,
        type,
      });
      if (res.success) {
        setData(res.data?.items || []);
        setTotal(res.data?.totalCount || 0);
      }
    } catch {
      message.error('加载失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPage(1);
    loadData();
  };

  const handleReset = () => {
    setStatus(undefined);
    setType(undefined);
    setKeyword('');
    setPage(1);
    setTimeout(loadData, 0);
  };

  const handleView = async (id: number) => {
    setDetailLoading(true);
    try {
      const res = await batchTaskApi.getById(id);
      if (res.success && res.data) {
        setDetail(res.data);
        setDetailVisible(true);
      }
    } catch {
      message.error('加载详情失败');
    } finally {
      setDetailLoading(false);
    }
  };

  const handleCancel = async (id: number) => {
    try {
      const res = await batchTaskApi.cancel(id);
      if (res.success) {
        message.success('取消成功');
        loadData();
      } else {
        message.error(res.message || '取消失败');
      }
    } catch {
      message.error('取消失败');
    }
  };

  const handleCreateSubmit = async (values: any) => {
    try {
      const res = await batchTaskApi.create({
        taskName: values.taskName,
        taskType: values.taskType,
        itemIds: values.itemIds || [],
        parameters: values.parameters,
      });
      if (res.success) {
        message.success('批量任务已创建');
        setCreateModalVisible(false);
        loadData();
      } else {
        message.error(res.message || '创建失败');
      }
    } catch {
      message.error('创建失败');
    }
  };

  const columns = [
    {
      title: '任务名称',
      dataIndex: 'taskName',
      key: 'taskName',
      render: (text: string, record: BatchTask) => (
        <a onClick={() => handleView(record.id)}>{text}</a>
      ),
    },
    {
      title: '任务类型',
      dataIndex: 'taskType',
      key: 'taskType',
      width: 130,
      render: (t: BatchTaskType) => batchTaskTypeText[t],
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (s: BatchTaskStatus) => (
        <Tag color={batchTaskStatusColor[s]}>{batchTaskStatusText[s]}</Tag>
      ),
    },
    {
      title: '进度',
      dataIndex: 'progress',
      key: 'progress',
      width: 200,
      render: (_: any, record: BatchTask) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Progress
            percent={Math.round(record.progressPercent)}
            size="small"
            style={{ flex: 1 }}
          />
          <span style={{ fontSize: 12, color: '#999', whiteSpace: 'nowrap' }}>
            {record.currentIndex}/{record.totalCount}
          </span>
        </div>
      ),
    },
    {
      title: '成功/失败',
      dataIndex: 'result',
      key: 'result',
      width: 120,
      render: (_: any, record: BatchTask) => (
        <Space size="middle">
          <span style={{ color: '#52c41a' }}>成功 {record.successCount}</span>
          <span style={{ color: '#ff4d4f' }}>失败 {record.failedCount}</span>
        </Space>
      ),
    },
    {
      title: '创建人',
      dataIndex: 'creatorName',
      key: 'creatorName',
      width: 100,
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
      render: (t: string) => formatDate(t),
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_: any, record: BatchTask) => (
        <Space>
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleView(record.id)}>
            详情
          </Button>
          {(record.status === BatchTaskStatus.Running || record.status === BatchTaskStatus.Pending) &&
            user?.role === 2 && (
              <Popconfirm title="确定取消该任务？" onConfirm={() => handleCancel(record.id)}>
                <Button type="link" size="small" danger icon={<StopOutlined />}>
                  取消
                </Button>
              </Popconfirm>
            )}
        </Space>
      ),
    },
  ];

  const itemStatusRender = (item: any) => {
    if (!item.completedAt) {
      return <Tag icon={<ClockCircleOutlined />} color="default">处理中</Tag>;
    }
    return item.success ? (
      <Tag icon={<CheckCircleOutlined />} color="success">成功</Tag>
    ) : (
      <Tag icon={<CloseCircleOutlined />} color="error">失败</Tag>
    );
  };

  return (
    <div>
      <div style={{ marginBottom: 16, padding: 16, background: '#fafafa', borderRadius: 8 }}>
        <Form layout="inline">
          <Form.Item label="关键字">
            <Input
              placeholder="搜索任务名称"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              style={{ width: 200 }}
              allowClear
            />
          </Form.Item>
          <Form.Item label="状态">
            <Select
              placeholder="全部状态"
              value={status}
              onChange={setStatus}
              style={{ width: 130 }}
              allowClear
            >
              {Object.entries(batchTaskStatusText).map(([key, value]) => (
                <Select.Option key={key} value={Number(key)}>
                  {value}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item label="类型">
            <Select
              placeholder="全部类型"
              value={type}
              onChange={setType}
              style={{ width: 150 }}
              allowClear
            >
              {Object.entries(batchTaskTypeText).map(([key, value]) => (
                <Select.Option key={key} value={Number(key)}>
                  {value}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
                搜索
              </Button>
              <Button icon={<ReloadOutlined />} onClick={handleReset}>
                重置
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </div>

      <div style={{ marginBottom: 16 }}>
        {user?.role === 2 && (
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateModalVisible(true)}>
            新建批量任务
          </Button>
        )}
      </div>

      <Table
        rowKey="id"
        loading={loading}
        dataSource={data}
        columns={columns}
        pagination={{
          current: page,
          pageSize,
          total,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (t) => `共 ${t} 条`,
          onChange: (p, ps) => {
            setPage(p);
            setPageSize(ps);
          },
        }}
      />

      <Drawer
        title="批量任务详情"
        width={600}
        open={detailVisible}
        onClose={() => setDetailVisible(false)}
        loading={detailLoading}
      >
        {detail && (
          <div>
            <Descriptions column={1} bordered size="small" style={{ marginBottom: 16 }}>
              <Descriptions.Item label="任务名称">{detail.taskName}</Descriptions.Item>
              <Descriptions.Item label="任务类型">{batchTaskTypeText[detail.taskType]}</Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag color={batchTaskStatusColor[detail.status]}>
                  {batchTaskStatusText[detail.status]}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="创建人">{detail.creatorName}</Descriptions.Item>
              <Descriptions.Item label="创建时间">{formatDate(detail.createdAt)}</Descriptions.Item>
              <Descriptions.Item label="开始时间">{formatDate(detail.startedAt)}</Descriptions.Item>
              <Descriptions.Item label="完成时间">{formatDate(detail.completedAt)}</Descriptions.Item>
              <Descriptions.Item label="处理进度">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Progress percent={Math.round(detail.progressPercent)} style={{ flex: 1 }} />
                  <span>{detail.currentIndex}/{detail.totalCount}</span>
                </div>
              </Descriptions.Item>
              <Descriptions.Item label="成功/失败">
                <Space size="large">
                  <span style={{ color: '#52c41a' }}>成功 {detail.successCount}</span>
                  <span style={{ color: '#ff4d4f' }}>失败 {detail.failedCount}</span>
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="结果摘要">{detail.resultSummary || '-'}</Descriptions.Item>
            </Descriptions>

            <h4 style={{ marginBottom: 12 }}>任务明细</h4>
            <List
              size="small"
              bordered
              dataSource={detail.items}
              renderItem={(item) => (
                <List.Item>
                  <List.Item.Meta
                    title={
                      <Space>
                        <span>第 {item.itemIndex} 项 - {item.itemKey}</span>
                        {itemStatusRender(item)}
                      </Space>
                    }
                    description={
                      item.errorMessage ? (
                        <div style={{ color: '#ff4d4f' }}>失败原因：{item.errorMessage}</div>
                      ) : item.resultData ? (
                        <div style={{ color: '#52c41a' }}>{item.resultData}</div>
                      ) : null
                    }
                  />
                </List.Item>
              )}
            />
          </div>
        )}
      </Drawer>

      <Modal
        title="新建批量任务"
        open={createModalVisible}
        onCancel={() => setCreateModalVisible(false)}
        footer={null}
        destroyOnClose
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleCreateSubmit}>
          <Form.Item name="taskName" label="任务名称" rules={[{ required: true, message: '请输入任务名称' }]}>
            <Input placeholder="请输入任务名称" />
          </Form.Item>
          <Form.Item name="taskType" label="任务类型" rules={[{ required: true, message: '请选择任务类型' }]}>
            <Select placeholder="请选择任务类型">
              {Object.entries(batchTaskTypeText).map(([key, value]) => (
                <Select.Option key={key} value={Number(key)}>
                  {value}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="parameters" label="任务参数">
            <Input.TextArea rows={3} placeholder="请输入任务参数（JSON格式）" />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                创建任务
              </Button>
              <Button onClick={() => setCreateModalVisible(false)}>取消</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
