import { useState } from 'react';
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
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { MEMBERSHIP } from '../api/endpoints';
import { request } from '../api/client';
import {
  BENEFIT_TYPE_OPTIONS,
  getColorByValue,
  getLabelByValue,
} from '../utils/constants';

const BenefitPage = () => {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBenefit, setEditingBenefit] = useState(null);
  const [typeFilter, setTypeFilter] = useState(undefined);
  const [activeFilter, setActiveFilter] = useState(undefined);
  const [form] = Form.useForm();

  const { data: benefitsData, isLoading } = useQuery({
    queryKey: ['benefits', typeFilter, activeFilter],
    queryFn: () =>
      request.get(MEMBERSHIP.BENEFITS, {
        benefit_type: typeFilter,
        is_active: activeFilter,
      }),
  });

  const benefits = benefitsData?.results || benefitsData || [];

  const createMutation = useMutation({
    mutationFn: (values) => request.post(MEMBERSHIP.BENEFITS, values),
    onSuccess: () => {
      message.success('创建成功');
      queryClient.invalidateQueries({ queryKey: ['benefits'] });
      closeModal();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...values }) =>
      request.put(MEMBERSHIP.BENEFIT_DETAIL(id), values),
    onSuccess: () => {
      message.success('更新成功');
      queryClient.invalidateQueries({ queryKey: ['benefits'] });
      closeModal();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => request.delete(MEMBERSHIP.BENEFIT_DETAIL(id)),
    onSuccess: () => {
      message.success('删除成功');
      queryClient.invalidateQueries({ queryKey: ['benefits'] });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, is_active }) =>
      request.patch(MEMBERSHIP.BENEFIT_DETAIL(id), { is_active }),
    onSuccess: () => {
      message.success('状态已更新');
      queryClient.invalidateQueries({ queryKey: ['benefits'] });
    },
  });

  const openCreateModal = () => {
    setEditingBenefit(null);
    form.resetFields();
    setModalOpen(true);
  };

  const openEditModal = (record) => {
    setEditingBenefit(record);
    form.setFieldsValue({
      name: record.name,
      description: record.description,
      benefit_type: record.benefit_type,
      value: record.value,
      unit: record.unit,
      is_active: record.is_active,
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingBenefit(null);
    form.resetFields();
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (editingBenefit) {
        updateMutation.mutate({ id: editingBenefit.id, ...values });
      } else {
        createMutation.mutate(values);
      }
    } catch {}
  };

  const columns = [
    {
      title: '权益名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '权益类型',
      dataIndex: 'benefit_type',
      key: 'benefit_type',
      render: (type) => {
        const color = getColorByValue(BENEFIT_TYPE_OPTIONS, type);
        const label = getLabelByValue(BENEFIT_TYPE_OPTIONS, type);
        return <Tag color={color}>{label}</Tag>;
      },
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: '数值',
      dataIndex: 'value',
      key: 'value',
    },
    {
      title: '单位',
      dataIndex: 'unit',
      key: 'unit',
    },
    {
      title: '启用状态',
      dataIndex: 'is_active',
      key: 'is_active',
      render: (active, record) => (
        <Switch
          checked={active}
          onChange={(checked) =>
            toggleMutation.mutate({ id: record.id, is_active: checked })
          }
        />
      ),
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
            title="确认删除该权益？"
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
        <div className="page-title">权益管理</div>
        <div className="page-description">管理会员权益项目</div>
      </div>

      <Card style={{ marginBottom: 16 }}>
        <Space wrap>
          <Select
            placeholder="权益类型"
            allowClear
            style={{ width: 160 }}
            value={typeFilter}
            onChange={setTypeFilter}
            options={BENEFIT_TYPE_OPTIONS}
          />
          <Select
            placeholder="启用状态"
            allowClear
            style={{ width: 120 }}
            value={activeFilter}
            onChange={setActiveFilter}
            options={[
              { value: true, label: '已启用' },
              { value: false, label: '已禁用' },
            ]}
          />
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreateModal}>
            新建权益
          </Button>
        </Space>
      </Card>

      <Card>
        <Table
          rowKey="id"
          columns={columns}
          dataSource={benefits}
          loading={isLoading}
          pagination={{ showSizeChanger: true, showTotal: (t) => `共 ${t} 条` }}
        />
      </Card>

      <Modal
        title={editingBenefit ? '编辑权益' : '新建权益'}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={closeModal}
        confirmLoading={
          createMutation.isPending || updateMutation.isPending
        }
        destroyOnClose
      >
        <Form form={form} layout="vertical" preserve={false}>
          <Form.Item
            name="name"
            label="权益名称"
            rules={[{ required: true, message: '请输入权益名称' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item
            name="benefit_type"
            label="权益类型"
            rules={[{ required: true, message: '请选择权益类型' }]}
          >
            <Select options={BENEFIT_TYPE_OPTIONS} />
          </Form.Item>
          <Form.Item name="value" label="数值">
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="unit" label="单位">
            <Input />
          </Form.Item>
          <Form.Item
            name="is_active"
            label="启用状态"
            valuePropName="checked"
            initialValue={true}
          >
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default BenefitPage;
