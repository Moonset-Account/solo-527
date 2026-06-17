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
  Popconfirm,
  Descriptions,
  Drawer,
} from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  ReloadOutlined,
  SyncOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import { assetApi, userApi } from '../api';
import type { Asset, User } from '../types';
import { AssetType, AssetStatus, UserRole } from '../types';
import {
  assetTypeText,
  assetStatusText,
  assetStatusColor,
  formatDate,
} from '../utils';
import { useAuthStore } from '../store';

export default function AssetList() {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<Asset[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const [keyword, setKeyword] = useState('');
  const [type, setType] = useState<AssetType | undefined>();
  const [status, setStatus] = useState<AssetStatus | undefined>();
  const [syncRequired, setSyncRequired] = useState<boolean | undefined>();

  const [modalVisible, setModalVisible] = useState(false);
  const [detailVisible, setDetailVisible] = useState(false);
  const [syncModalVisible, setSyncModalVisible] = useState(false);
  const [currentAsset, setCurrentAsset] = useState<Asset | null>(null);
  const [modalType, setModalType] = useState<'create' | 'edit'>('create');
  const [form] = Form.useForm();
  const [syncForm] = Form.useForm();

  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    loadData();
    loadUsers();
  }, [page, pageSize]);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await assetApi.getList({
        page,
        pageSize,
        keyword: keyword || undefined,
        type,
        status,
        syncRequired,
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

  const handleSearch = () => {
    setPage(1);
    loadData();
  };

  const handleReset = () => {
    setKeyword('');
    setType(undefined);
    setStatus(undefined);
    setSyncRequired(undefined);
    setPage(1);
    setTimeout(loadData, 0);
  };

  const handleCreate = () => {
    setModalType('create');
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (record: Asset) => {
    setModalType('edit');
    setCurrentAsset(record);
    form.setFieldsValue({
      ...record,
    });
    setModalVisible(true);
  };

  const handleView = (record: Asset) => {
    setCurrentAsset(record);
    setDetailVisible(true);
  };

  const handleDelete = async (id: number) => {
    try {
      const res = await assetApi.delete(id);
      if (res.success) {
        message.success('删除成功');
        loadData();
      } else {
        message.error(res.message || '删除失败');
      }
    } catch {
      message.error('删除失败');
    }
  };

  const handleSubmit = async (values: any) => {
    try {
      if (modalType === 'create') {
        const res = await assetApi.create(values);
        if (res.success) {
          message.success('创建成功');
          setModalVisible(false);
          loadData();
        } else {
          message.error(res.message || '创建失败');
        }
      } else {
        const res = await assetApi.update(currentAsset!.id, values);
        if (res.success) {
          message.success('更新成功');
          setModalVisible(false);
          loadData();
        } else {
          message.error(res.message || '更新失败');
        }
      }
    } catch {
      message.error('操作失败');
    }
  };

  const handleSyncConfirm = async (values: any) => {
    try {
      const res = await assetApi.confirmSync(currentAsset!.id, {
        configuration: values.configuration,
        remark: values.remark,
      });
      if (res.success) {
        message.success('同步确认成功');
        setSyncModalVisible(false);
        loadData();
      } else {
        message.error(res.message || '操作失败');
      }
    } catch {
      message.error('操作失败');
    }
  };

  const openSyncModal = (record: Asset) => {
    setCurrentAsset(record);
    syncForm.setFieldsValue({
      configuration: record.configuration || '',
    });
    setSyncModalVisible(true);
  };

  const columns = [
    {
      title: '资产编号',
      dataIndex: 'assetCode',
      key: 'assetCode',
      width: 120,
    },
    {
      title: '资产名称',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: Asset) => (
        <a onClick={() => handleView(record)}>{text}</a>
      ),
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      render: (t: AssetType) => assetTypeText[t],
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 90,
      render: (s: AssetStatus) => (
        <Tag color={assetStatusColor[s]}>{assetStatusText[s]}</Tag>
      ),
    },
    {
      title: 'IP地址',
      dataIndex: 'ipAddress',
      key: 'ipAddress',
      width: 130,
    },
    {
      title: '位置',
      dataIndex: 'location',
      key: 'location',
      width: 150,
      ellipsis: true,
    },
    {
      title: '负责人',
      dataIndex: 'responsibleName',
      key: 'responsibleName',
      width: 100,
    },
    {
      title: '同步状态',
      dataIndex: 'syncRequired',
      key: 'syncRequired',
      width: 100,
      render: (sync: boolean) =>
        sync ? <Tag color="warning">待同步</Tag> : <Tag color="success">已同步</Tag>,
    },
    {
      title: '最后同步',
      dataIndex: 'lastSyncAt',
      key: 'lastSyncAt',
      width: 160,
      render: (t: string) => formatDate(t),
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      render: (_: any, record: Asset) => (
        <Space>
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleView(record)}>
            查看
          </Button>
          {user?.role === UserRole.Admin && (
            <>
              <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
                编辑
              </Button>
              <Popconfirm title="确定删除该资产？" onConfirm={() => handleDelete(record.id)}>
                <Button type="link" size="small" danger icon={<DeleteOutlined />}>
                  删除
                </Button>
              </Popconfirm>
            </>
          )}
          {record.syncRequired && (
            <Button type="link" size="small" icon={<SyncOutlined />} onClick={() => openSyncModal(record)}>
              确认同步
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16, padding: 16, background: '#fafafa', borderRadius: 8 }}>
        <Form layout="inline">
          <Form.Item label="关键字">
            <Input
              placeholder="搜索名称/编号/IP"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              style={{ width: 200 }}
              allowClear
            />
          </Form.Item>
          <Form.Item label="类型">
            <Select
              placeholder="全部类型"
              value={type}
              onChange={setType}
              style={{ width: 120 }}
              allowClear
            >
              {Object.entries(assetTypeText).map(([key, value]) => (
                <Select.Option key={key} value={Number(key)}>
                  {value}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item label="状态">
            <Select
              placeholder="全部状态"
              value={status}
              onChange={setStatus}
              style={{ width: 120 }}
              allowClear
            >
              {Object.entries(assetStatusText).map(([key, value]) => (
                <Select.Option key={key} value={Number(key)}>
                  {value}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item label="同步状态">
            <Select
              placeholder="全部"
              value={syncRequired}
              onChange={setSyncRequired}
              style={{ width: 120 }}
              allowClear
            >
              <Select.Option value={true}>待同步</Select.Option>
              <Select.Option value={false}>已同步</Select.Option>
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
        {user?.role === UserRole.Admin && (
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
            新建资产
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

      <Modal
        title={modalType === 'create' ? '新建资产' : '编辑资产'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        destroyOnClose
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <div style={{ display: 'flex', gap: 16 }}>
            <Form.Item
              name="assetCode"
              label="资产编号"
              rules={[{ required: true, message: '请输入资产编号' }]}
              style={{ flex: 1 }}
            >
              <Input placeholder="请输入资产编号" />
            </Form.Item>
            <Form.Item
              name="name"
              label="资产名称"
              rules={[{ required: true, message: '请输入资产名称' }]}
              style={{ flex: 1 }}
            >
              <Input placeholder="请输入资产名称" />
            </Form.Item>
          </div>
          <div style={{ display: 'flex', gap: 16 }}>
            <Form.Item
              name="type"
              label="资产类型"
              rules={[{ required: true, message: '请选择类型' }]}
              style={{ flex: 1 }}
            >
              <Select placeholder="请选择类型">
                {Object.entries(assetTypeText).map(([key, value]) => (
                  <Select.Option key={key} value={Number(key)}>
                    {value}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item
              name="status"
              label="状态"
              rules={[{ required: true, message: '请选择状态' }]}
              style={{ flex: 1 }}
            >
              <Select placeholder="请选择状态">
                {Object.entries(assetStatusText).map(([key, value]) => (
                  <Select.Option key={key} value={Number(key)}>
                    {value}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          </div>
          <div style={{ display: 'flex', gap: 16 }}>
            <Form.Item name="ipAddress" label="IP地址" style={{ flex: 1 }}>
              <Input placeholder="请输入IP地址" />
            </Form.Item>
            <Form.Item name="responsibleId" label="负责人" style={{ flex: 1 }}>
              <Select placeholder="请选择负责人" allowClear>
                {users.map((u) => (
                  <Select.Option key={u.id} value={u.id}>
                    {u.fullName}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          </div>
          <Form.Item name="location" label="位置">
            <Input placeholder="请输入位置" />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <Input.TextArea rows={3} placeholder="请输入描述" />
          </Form.Item>
          <Form.Item name="configuration" label="配置信息">
            <Input.TextArea rows={4} placeholder="请输入配置信息，如CPU、内存、磁盘等" />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                提交
              </Button>
              <Button onClick={() => setModalVisible(false)}>取消</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Drawer
        title="资产详情"
        width={500}
        open={detailVisible}
        onClose={() => setDetailVisible(false)}
      >
        {currentAsset && (
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label="资产编号">{currentAsset.assetCode}</Descriptions.Item>
            <Descriptions.Item label="资产名称">{currentAsset.name}</Descriptions.Item>
            <Descriptions.Item label="类型">{assetTypeText[currentAsset.type]}</Descriptions.Item>
            <Descriptions.Item label="状态">
              <Tag color={assetStatusColor[currentAsset.status]}>
                {assetStatusText[currentAsset.status]}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="IP地址">{currentAsset.ipAddress}</Descriptions.Item>
            <Descriptions.Item label="位置">{currentAsset.location || '-'}</Descriptions.Item>
            <Descriptions.Item label="负责人">{currentAsset.responsibleName || '-'}</Descriptions.Item>
            <Descriptions.Item label="创建时间">{formatDate(currentAsset.createdAt)}</Descriptions.Item>
            <Descriptions.Item label="最后同步">{formatDate(currentAsset.lastSyncAt)}</Descriptions.Item>
            <Descriptions.Item label="同步状态">
              {currentAsset.syncRequired ? <Tag color="warning">待同步</Tag> : <Tag color="success">已同步</Tag>}
            </Descriptions.Item>
            <Descriptions.Item label="描述">{currentAsset.description || '-'}</Descriptions.Item>
            <Descriptions.Item label="配置信息">
              <pre style={{ whiteSpace: 'pre-wrap', margin: 0 }}>
                {currentAsset.configuration || '-'}
              </pre>
            </Descriptions.Item>
          </Descriptions>
        )}
      </Drawer>

      <Modal
        title="资产同步确认"
        open={syncModalVisible}
        onCancel={() => setSyncModalVisible(false)}
        footer={null}
        destroyOnClose
        width={600}
      >
        <Form form={syncForm} layout="vertical" onFinish={handleSyncConfirm}>
          <Form.Item
            name="configuration"
            label="最新配置信息"
            rules={[{ required: true, message: '请输入配置信息' }]}
          >
            <Input.TextArea rows={6} placeholder="请确认并输入最新的配置信息..." />
          </Form.Item>
          <Form.Item name="remark" label="确认说明">
            <Input.TextArea rows={2} placeholder="请输入确认说明..." />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                确认同步
              </Button>
              <Button onClick={() => setSyncModalVisible(false)}>取消</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
