import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Card,
  Table,
  Tag,
  Button,
  Select,
  Modal,
  Form,
  Input,
  InputNumber,
  Switch,
  Space,
  message,
  Popconfirm,
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons';
import { request } from '../api/client';
import { SERVICES } from '../api/endpoints';
import {
  SERVICE_TYPE_OPTIONS,
  getColorByValue,
  getLabelByValue,
} from '../utils/constants';
import { formatMoney } from '../utils/format';
import useAuthStore from '../store/authStore';

const ServicePage = () => {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [batchViewOpen, setBatchViewOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [categoryFilter, setCategoryFilter] = useState(undefined);
  const [serviceTypeFilter, setServiceTypeFilter] = useState(undefined);
  const [availableFilter, setAvailableFilter] = useState(undefined);
  const [nameSearch, setNameSearch] = useState('');
  const [batchIds, setBatchIds] = useState('');
  const [form] = Form.useForm();

  const { user } = useAuthStore();
  const isAdminOrManager = user?.role === 'admin' || user?.role === 'manager';

  const { data: servicesData, isLoading } = useQuery({
    queryKey: ['service-items', categoryFilter, serviceTypeFilter, availableFilter, nameSearch],
    queryFn: () => {
      const params = {};
      if (categoryFilter) params.category = categoryFilter;
      if (serviceTypeFilter) params.service_type = serviceTypeFilter;
      if (availableFilter !== undefined) params.is_available = availableFilter;
      if (nameSearch) params.search = nameSearch;
      return request.get(SERVICES.ITEMS, params);
    },
  });

  const { data: categoriesData } = useQuery({
    queryKey: ['service-categories'],
    queryFn: () => request.get(SERVICES.CATEGORIES),
  });

  const services = servicesData?.results || servicesData || [];
  const categories = categoriesData?.results || categoriesData || [];

  const categoryOptions = categories.map((c) => ({
    value: c.id,
    label: c.name,
  }));

  const createMutation = useMutation({
    mutationFn: (values) => request.post(SERVICES.ITEMS, values),
    onSuccess: () => {
      message.success('创建成功');
      queryClient.invalidateQueries({ queryKey: ['service-items'] });
      closeModal();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...values }) =>
      request.patch(SERVICES.ITEM_DETAIL(id), values),
    onSuccess: () => {
      message.success('更新成功');
      queryClient.invalidateQueries({ queryKey: ['service-items'] });
      closeModal();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => request.delete(SERVICES.ITEM_DETAIL(id)),
    onSuccess: () => {
      message.success('删除成功');
      queryClient.invalidateQueries({ queryKey: ['service-items'] });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, is_available }) =>
      request.patch(SERVICES.ITEM_DETAIL(id), { is_available }),
    onSuccess: () => {
      message.success('状态已更新');
      queryClient.invalidateQueries({ queryKey: ['service-items'] });
    },
  });

  const batchToggleMutation = useMutation({
    mutationFn: ({ ids, is_available }) =>
      Promise.all(ids.map((id) => request.patch(SERVICES.ITEM_DETAIL(id), { is_available }))),
    onSuccess: () => {
      message.success('批量更新成功');
      queryClient.invalidateQueries({ queryKey: ['service-items'] });
      setSelectedRowKeys([]);
    },
  });

  const openCreateModal = () => {
    setEditingItem(null);
    form.resetFields();
    setModalOpen(true);
  };

  const openEditModal = (record) => {
    setEditingItem(record);
    form.setFieldsValue({
      name: record.name,
      description: record.description,
      short_description: record.short_description,
      category_id: record.category_id || record.category,
      service_type: record.service_type,
      price: record.price,
      member_price: record.member_price,
      duration_minutes: record.duration_minutes,
      is_available: record.is_available,
      sort_order: record.sort_order,
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingItem(null);
    form.resetFields();
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (editingItem) {
        updateMutation.mutate({ id: editingItem.id, ...values });
      } else {
        createMutation.mutate(values);
      }
    } catch {}
  };

  const handleBatchToggle = (is_available) => {
    if (selectedRowKeys.length === 0) {
      message.warning('请先选择服务项目');
      return;
    }
    batchToggleMutation.mutate({ ids: selectedRowKeys, is_available });
  };

  const batchViewServices = useMemo(() => {
    if (!batchIds.trim()) return [];
    const ids = batchIds
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .map(Number)
      .filter((n) => !isNaN(n));
    return services.filter((s) => ids.includes(s.id));
  }, [batchIds, services]);

  const columns = [
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '分类',
      dataIndex: 'category_name',
      key: 'category_name',
      render: (v) => v || '-',
    },
    {
      title: '服务类型',
      dataIndex: 'service_type',
      key: 'service_type',
      render: (v) => (
        <Tag color={getColorByValue(SERVICE_TYPE_OPTIONS, v)}>
          {getLabelByValue(SERVICE_TYPE_OPTIONS, v)}
        </Tag>
      ),
    },
    {
      title: '价格',
      dataIndex: 'price',
      key: 'price',
      render: (v) => formatMoney(v),
    },
    {
      title: '会员价',
      dataIndex: 'member_price',
      key: 'member_price',
      render: (v) => formatMoney(v),
    },
    {
      title: '时长(分钟)',
      dataIndex: 'duration_minutes',
      key: 'duration_minutes',
    },
    {
      title: '可用',
      dataIndex: 'is_available',
      key: 'is_available',
      render: (checked, record) => (
        <Switch
          checked={checked}
          onChange={(val) => toggleMutation.mutate({ id: record.id, is_available: val })}
        />
      ),
    },
    {
      title: '排序',
      dataIndex: 'sort_order',
      key: 'sort_order',
    },
    {
      title: '操作',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button
            type="text"
            size="small"
            icon={<EditOutlined />}
            onClick={() => openEditModal(record)}
          />
          <Popconfirm
            title="确认删除该服务项目？"
            onConfirm={() => deleteMutation.mutate(record.id)}
            okText="确认"
            cancelText="取消"
          >
            <Button type="text" size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div className="page-header">
        <div className="page-title">服务项目</div>
        <div className="page-description">管理门店服务项目</div>
      </div>

      <Card style={{ marginBottom: 16 }}>
        <Space wrap>
          <Select
            placeholder="分类"
            allowClear
            style={{ width: 150 }}
            value={categoryFilter}
            onChange={setCategoryFilter}
            options={categoryOptions}
          />
          <Select
            placeholder="服务类型"
            allowClear
            style={{ width: 150 }}
            value={serviceTypeFilter}
            onChange={setServiceTypeFilter}
            options={SERVICE_TYPE_OPTIONS}
          />
          <Select
            placeholder="可用状态"
            allowClear
            style={{ width: 120 }}
            value={availableFilter}
            onChange={setAvailableFilter}
            options={[
              { value: true, label: '可用' },
              { value: false, label: '不可用' },
            ]}
          />
          <Input.Search
            placeholder="搜索服务名称"
            allowClear
            style={{ width: 200 }}
            onSearch={setNameSearch}
            onChange={(e) => {
              if (!e.target.value) setNameSearch('');
            }}
          />
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreateModal}>
            新建服务
          </Button>
          {isAdminOrManager && (
            <Button icon={<EyeOutlined />} onClick={() => setBatchViewOpen(true)}>
              批量查看
            </Button>
          )}
        </Space>
      </Card>

      {selectedRowKeys.length > 0 && (
        <Card style={{ marginBottom: 16 }}>
          <Space>
            <span>已选择 {selectedRowKeys.length} 项</span>
            <Button
              size="small"
              type="primary"
              onClick={() => handleBatchToggle(true)}
              loading={batchToggleMutation.isPending}
            >
              批量启用
            </Button>
            <Button
              size="small"
              danger
              onClick={() => handleBatchToggle(false)}
              loading={batchToggleMutation.isPending}
            >
              批量禁用
            </Button>
            <Button size="small" onClick={() => setSelectedRowKeys([])}>
              取消选择
            </Button>
          </Space>
        </Card>
      )}

      <Card>
        <Table
          rowKey="id"
          columns={columns}
          dataSource={services}
          loading={isLoading}
          rowSelection={{
            selectedRowKeys,
            onChange: setSelectedRowKeys,
          }}
          pagination={{
            showSizeChanger: true,
            showTotal: (t) => `共 ${t} 条`,
          }}
        />
      </Card>

      <Modal
        title={editingItem ? '编辑服务' : '新建服务'}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={closeModal}
        confirmLoading={createMutation.isPending || updateMutation.isPending}
        destroyOnClose
        width={600}
      >
        <Form form={form} layout="vertical" preserve={false}>
          <Form.Item
            name="name"
            label="服务名称"
            rules={[{ required: true, message: '请输入服务名称' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item name="short_description" label="简短描述">
            <Input />
          </Form.Item>
          <Form.Item name="description" label="详细描述">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item
            name="category_id"
            label="分类"
            rules={[{ required: true, message: '请选择分类' }]}
          >
            <Select placeholder="请选择分类" options={categoryOptions} />
          </Form.Item>
          <Form.Item
            name="service_type"
            label="服务类型"
            rules={[{ required: true, message: '请选择服务类型' }]}
          >
            <Select options={SERVICE_TYPE_OPTIONS} />
          </Form.Item>
          <Form.Item
            name="price"
            label="价格"
            rules={[{ required: true, message: '请输入价格' }]}
          >
            <InputNumber min={0} precision={2} style={{ width: '100%' }} addonAfter="元" />
          </Form.Item>
          <Form.Item name="member_price" label="会员价">
            <InputNumber min={0} precision={2} style={{ width: '100%' }} addonAfter="元" />
          </Form.Item>
          <Form.Item name="duration_minutes" label="时长(分钟)">
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="is_available" label="可用" valuePropName="checked" initialValue={true}>
            <Switch />
          </Form.Item>
          <Form.Item name="sort_order" label="排序" initialValue={0}>
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="批量查看"
        open={batchViewOpen}
        onCancel={() => {
          setBatchViewOpen(false);
          setBatchIds('');
        }}
        footer={null}
        width={900}
      >
        <Input.TextArea
          placeholder="输入服务ID，多个用逗号分隔，如：1,2,3"
          value={batchIds}
          onChange={(e) => setBatchIds(e.target.value)}
          rows={2}
          style={{ marginBottom: 16 }}
        />
        <Table
          rowKey="id"
          columns={columns.filter((c) => c.key !== 'actions')}
          dataSource={batchViewServices}
          pagination={false}
          size="small"
        />
      </Modal>
    </div>
  );
};

export default ServicePage;
