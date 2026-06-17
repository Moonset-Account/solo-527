import { useState, useEffect } from 'react';
import {
  Table,
  Tag,
  Button,
  Space,
  Input,
  Select,
  DatePicker,
  Form,
  Modal,
  message,
  Popconfirm,
} from 'antd';
import { PlusOutlined, SearchOutlined, ReloadOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { alertApi, userApi, assetApi } from '../api';
import type { Alert, User, Asset } from '../types';
import { AlertStatus, AlertPriority, AlertType, UserRole } from '../types';
import {
  alertStatusText,
  alertStatusColor,
  alertPriorityText,
  alertPriorityColor,
  alertTypeText,
  formatDate,
} from '../utils';
import { useAuthStore } from '../store';

const { RangePicker } = DatePicker;

export default function AlertList() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<Alert[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState<AlertStatus | undefined>();
  const [priority, setPriority] = useState<AlertPriority | undefined>();
  const [type, setType] = useState<AlertType | undefined>();
  const [assignedToId, setAssignedToId] = useState<number | undefined>();
  const [assetId, setAssetId] = useState<number | undefined>();
  const [dateRange, setDateRange] = useState<any>();

  const [users, setUsers] = useState<User[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);

  const [batchModalVisible, setBatchModalVisible] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  useEffect(() => {
    loadData();
    loadUsers();
    loadAssets();
  }, [page, pageSize]);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await alertApi.getList({
        page,
        pageSize,
        status,
        priority,
        type,
        assignedToId,
        assetId,
        keyword: keyword || undefined,
        startDate: dateRange?.[0]?.toISOString(),
        endDate: dateRange?.[1]?.toISOString(),
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

  const loadUsers = async () => {
    try {
      const res = await userApi.getByRole(UserRole.StoreOperator);
      setUsers(res as unknown as User[]);
    } catch {
      // ignore
    }
  };

  const loadAssets = async () => {
    try {
      const res = await assetApi.getAll();
      setAssets(res.data || []);
    } catch {
      // ignore
    }
  };

  const handleSearch = () => {
    setPage(1);
    loadData();
  };

  const handleReset = () => {
    setKeyword('');
    setStatus(undefined);
    setPriority(undefined);
    setType(undefined);
    setAssignedToId(undefined);
    setAssetId(undefined);
    setDateRange(undefined);
    setPage(1);
    setTimeout(loadData, 0);
  };

  const handleBatchAssign = async (values: any) => {
    try {
      message.info('批量分派任务已创建，可在批量任务中查看进度');
      setBatchModalVisible(false);
      navigate('/batch-tasks');
    } catch {
      message.error('操作失败');
    }
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 60,
    },
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true,
      render: (text: string, record: Alert) => (
        <Space direction="vertical" size={0}>
          <a onClick={() => navigate(`/alerts/${record.id}`)}>{text}</a>
          {record.isOverdue && <Tag color="red" style={{ fontSize: 12 }}>已超期</Tag>}
        </Space>
      ),
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      render: (t: AlertType) => alertTypeText[t],
    },
    {
      title: '优先级',
      dataIndex: 'priority',
      key: 'priority',
      width: 80,
      render: (p: AlertPriority) => (
        <Tag color={alertPriorityColor[p]}>{alertPriorityText[p]}</Tag>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 90,
      render: (s: AlertStatus) => (
        <Tag color={alertStatusColor[s]}>{alertStatusText[s]}</Tag>
      ),
    },
    {
      title: '关联资产',
      dataIndex: 'assetName',
      key: 'assetName',
      width: 120,
      ellipsis: true,
    },
    {
      title: '处理人',
      dataIndex: 'assignedToName',
      key: 'assignedToName',
      width: 100,
      ellipsis: true,
    },
    {
      title: '截止时间',
      dataIndex: 'dueDate',
      key: 'dueDate',
      width: 160,
      render: (t: string) => formatDate(t),
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
      width: 120,
      render: (_: any, record: Alert) => (
        <Space>
          <Button type="link" size="small" onClick={() => navigate(`/alerts/${record.id}`)}>
            详情
          </Button>
        </Space>
      ),
    },
  ];

  const rowSelection = {
    selectedRowKeys,
    onChange: (keys: React.Key[]) => setSelectedRowKeys(keys),
  };

  return (
    <div>
      <div style={{ marginBottom: 16, padding: 16, background: '#fafafa', borderRadius: 8 }}>
        <Form layout="inline">
          <Form.Item label="关键字">
            <Input
              placeholder="搜索标题/描述"
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
              style={{ width: 120 }}
              allowClear
            >
              {Object.entries(alertStatusText).map(([key, value]) => (
                <Select.Option key={key} value={Number(key)}>
                  {value}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item label="优先级">
            <Select
              placeholder="全部优先级"
              value={priority}
              onChange={setPriority}
              style={{ width: 100 }}
              allowClear
            >
              {Object.entries(alertPriorityText).map(([key, value]) => (
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
              style={{ width: 130 }}
              allowClear
            >
              {Object.entries(alertTypeText).map(([key, value]) => (
                <Select.Option key={key} value={Number(key)}>
                  {value}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item label="处理人">
            <Select
              placeholder="全部"
              value={assignedToId}
              onChange={setAssignedToId}
              style={{ width: 130 }}
              allowClear
            >
              {users.map((u) => (
                <Select.Option key={u.id} value={u.id}>
                  {u.fullName}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item label="资产">
            <Select
              placeholder="全部资产"
              value={assetId}
              onChange={setAssetId}
              style={{ width: 150 }}
              allowClear
            >
              {assets.map((a) => (
                <Select.Option key={a.id} value={a.id}>
                  {a.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item label="创建时间">
            <RangePicker value={dateRange} onChange={setDateRange} />
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
        <Space>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/alerts/create')}>
            新建告警
          </Button>
          {user?.role === UserRole.Admin && (
            <Popconfirm
              title="确定批量分派选中的告警？"
              disabled={selectedRowKeys.length === 0}
              onConfirm={() => setBatchModalVisible(true)}
            >
              <Button disabled={selectedRowKeys.length === 0}>批量分派</Button>
            </Popconfirm>
          )}
          <span style={{ color: '#999' }}>已选 {selectedRowKeys.length} 项</span>
        </Space>
      </div>

      <Table
        rowKey="id"
        loading={loading}
        dataSource={data}
        columns={columns}
        rowSelection={rowSelection}
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

      <Modal
        title="批量分派告警"
        open={batchModalVisible}
        onCancel={() => setBatchModalVisible(false)}
        footer={null}
        destroyOnClose
      >
        <Form layout="vertical" onFinish={handleBatchAssign}>
          <Form.Item label="选择处理人" name="assignedToId" rules={[{ required: true, message: '请选择处理人' }]}>
            <Select placeholder="请选择处理人">
              {users.map((u) => (
                <Select.Option key={u.id} value={u.id}>
                  {u.fullName}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item label="优先级" name="priority" initialValue={AlertPriority.Medium}>
            <Select>
              {Object.entries(alertPriorityText).map(([key, value]) => (
                <Select.Option key={key} value={Number(key)}>
                  {value}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                确认分派
              </Button>
              <Button onClick={() => setBatchModalVisible(false)}>取消</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
