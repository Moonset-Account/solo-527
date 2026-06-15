import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Card,
  Row,
  Col,
  Tag,
  Badge,
  Button,
  Input,
  Select,
  Modal,
  Form,
  InputNumber,
  Switch,
  Space,
  message,
  Popconfirm,
  Empty,
  Spin,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
  PauseCircleOutlined,
} from '@ant-design/icons';
import { MEMBERSHIP } from '../api/endpoints';
import { request } from '../api/client';
import {
  PACKAGE_STATUS_OPTIONS,
  DURATION_UNIT_OPTIONS,
  BENEFIT_TYPE_OPTIONS,
  getColorByValue,
  getLabelByValue,
} from '../utils/constants';
import { formatMoney } from '../utils/format';

const PackagePage = () => {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPkg, setEditingPkg] = useState(null);
  const [statusFilter, setStatusFilter] = useState(undefined);
  const [nameSearch, setNameSearch] = useState('');
  const [form] = Form.useForm();

  const { data: packagesData, isLoading: packagesLoading } = useQuery({
    queryKey: ['packages', statusFilter, nameSearch],
    queryFn: () =>
      request.get(MEMBERSHIP.PACKAGES, {
        status: statusFilter,
        search: nameSearch || undefined,
      }),
  });

  const { data: benefitsData } = useQuery({
    queryKey: ['benefits-for-package'],
    queryFn: () => request.get(MEMBERSHIP.BENEFITS, { page_size: 200 }),
  });

  const packages = packagesData?.results || packagesData || [];
  const benefits = benefitsData?.results || benefitsData || [];

  const benefitOptions = benefits.map((b) => ({
    value: b.id,
    label: b.name,
  }));

  const benefitMap = {};
  benefits.forEach((b) => {
    benefitMap[b.id] = b;
  });

  const createMutation = useMutation({
    mutationFn: (values) => request.post(MEMBERSHIP.PACKAGES, values),
    onSuccess: () => {
      message.success('创建成功');
      queryClient.invalidateQueries({ queryKey: ['packages'] });
      closeModal();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...values }) =>
      request.put(MEMBERSHIP.PACKAGE_DETAIL(id), values),
    onSuccess: () => {
      message.success('更新成功');
      queryClient.invalidateQueries({ queryKey: ['packages'] });
      closeModal();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => request.delete(MEMBERSHIP.PACKAGE_DETAIL(id)),
    onSuccess: () => {
      message.success('删除成功');
      queryClient.invalidateQueries({ queryKey: ['packages'] });
    },
  });

  const activateMutation = useMutation({
    mutationFn: (id) =>
      request.post(`${MEMBERSHIP.PACKAGE_DETAIL(id)}activate/`),
    onSuccess: () => {
      message.success('上架成功');
      queryClient.invalidateQueries({ queryKey: ['packages'] });
    },
  });

  const deactivateMutation = useMutation({
    mutationFn: (id) =>
      request.post(`${MEMBERSHIP.PACKAGE_DETAIL(id)}deactivate/`),
    onSuccess: () => {
      message.success('下架成功');
      queryClient.invalidateQueries({ queryKey: ['packages'] });
    },
  });

  const openCreateModal = () => {
    setEditingPkg(null);
    form.resetFields();
    setModalOpen(true);
  };

  const openEditModal = (pkg) => {
    setEditingPkg(pkg);
    form.setFieldsValue({
      name: pkg.name,
      description: pkg.description,
      short_description: pkg.short_description,
      price: pkg.price,
      original_price: pkg.original_price,
      duration_value: pkg.duration_value,
      duration_unit: pkg.duration_unit,
      service_count: pkg.service_count,
      status: pkg.status,
      is_popular: pkg.is_popular,
      benefits: (pkg.benefits || []).map((b) =>
        typeof b === 'object' ? b.id : b
      ),
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingPkg(null);
    form.resetFields();
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (editingPkg) {
        updateMutation.mutate({ id: editingPkg.id, ...values });
      } else {
        createMutation.mutate(values);
      }
    } catch {}
  };

  const getStatusTag = (status) => {
    const color = getColorByValue(PACKAGE_STATUS_OPTIONS, status);
    const label = getLabelByValue(PACKAGE_STATUS_OPTIONS, status);
    return <Tag color={color}>{label}</Tag>;
  };

  const getDurationLabel = (value, unit) => {
    const unitLabel = getLabelByValue(DURATION_UNIT_OPTIONS, unit);
    return `${value}${unitLabel}`;
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-title">套餐配置</div>
        <div className="page-description">管理会员套餐方案</div>
      </div>

      <Card style={{ marginBottom: 16 }}>
        <Space wrap>
          <Select
            placeholder="状态筛选"
            allowClear
            style={{ width: 160 }}
            value={statusFilter}
            onChange={setStatusFilter}
            options={PACKAGE_STATUS_OPTIONS}
          />
          <Input.Search
            placeholder="搜索套餐名称"
            allowClear
            style={{ width: 240 }}
            onSearch={setNameSearch}
            onChange={(e) => {
              if (!e.target.value) setNameSearch('');
            }}
          />
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreateModal}>
            新建套餐
          </Button>
        </Space>
      </Card>

      <Spin spinning={packagesLoading}>
        {packages.length === 0 && !packagesLoading ? (
          <Empty description="暂无套餐数据" />
        ) : (
          <Row gutter={[16, 16]}>
            {packages.map((pkg) => (
              <Col key={pkg.id} span={8}>
                <Badge.Ribbon
                  text="热门"
                  color="red"
                  visible={pkg.is_popular}
                >
                  <Card
                    title={
                      <Space>
                        <span>{pkg.name}</span>
                        {getStatusTag(pkg.status)}
                      </Space>
                    }
                    extra={
                      <Space>
                        <Button
                          type="text"
                          size="small"
                          icon={<EditOutlined />}
                          onClick={() => openEditModal(pkg)}
                        />
                        {pkg.status === 'active' ? (
                          <Button
                            type="text"
                            size="small"
                            icon={<PauseCircleOutlined />}
                            onClick={() => deactivateMutation.mutate(pkg.id)}
                          />
                        ) : (
                          <Button
                            type="text"
                            size="small"
                            icon={<CheckCircleOutlined />}
                            onClick={() => activateMutation.mutate(pkg.id)}
                          />
                        )}
                        <Popconfirm
                          title="确认删除该套餐？"
                          onConfirm={() => deleteMutation.mutate(pkg.id)}
                          okText="确认"
                          cancelText="取消"
                        >
                          <Button
                            type="text"
                            size="small"
                            danger
                            icon={<DeleteOutlined />}
                          />
                        </Popconfirm>
                      </Space>
                    }
                  >
                    <Space direction="vertical" size={4} style={{ width: '100%' }}>
                      <div>
                        <span style={{ fontSize: 20, fontWeight: 600, color: '#1677ff' }}>
                          {formatMoney(pkg.price)}
                        </span>
                        {pkg.original_price && pkg.original_price > pkg.price && (
                          <span
                            style={{
                              marginLeft: 8,
                              textDecoration: 'line-through',
                              color: '#999',
                            }}
                          >
                            {formatMoney(pkg.original_price)}
                          </span>
                        )}
                      </div>
                      <div style={{ color: '#666' }}>
                        有效期：{getDurationLabel(pkg.duration_value, pkg.duration_unit)}
                      </div>
                      <div style={{ color: '#666' }}>
                        服务次数：{pkg.service_count ?? '-'}次
                      </div>
                      {pkg.short_description && (
                        <div style={{ color: '#999', fontSize: 12 }}>
                          {pkg.short_description}
                        </div>
                      )}
                      {(pkg.benefits || []).length > 0 && (
                        <div style={{ marginTop: 4 }}>
                          {(pkg.benefits || []).map((b) => {
                            const benefitId = typeof b === 'object' ? b.id : b;
                            const benefit = benefitMap[benefitId];
                            const benefitName = benefit
                              ? benefit.name
                              : getLabelByValue(
                                  BENEFIT_TYPE_OPTIONS,
                                  benefitId
                                );
                            const benefitType = benefit
                              ? benefit.benefit_type
                              : null;
                            const tagColor = benefitType
                              ? getColorByValue(BENEFIT_TYPE_OPTIONS, benefitType)
                              : 'default';
                            return (
                              <Tag
                                key={benefitId}
                                color={tagColor}
                                style={{ marginBottom: 4 }}
                              >
                                {benefitName}
                              </Tag>
                            );
                          })}
                        </div>
                      )}
                    </Space>
                  </Card>
                </Badge.Ribbon>
              </Col>
            ))}
          </Row>
        )}
      </Spin>

      <Modal
        title={editingPkg ? '编辑套餐' : '新建套餐'}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={closeModal}
        confirmLoading={
          createMutation.isPending || updateMutation.isPending
        }
        width={600}
        destroyOnClose
      >
        <Form form={form} layout="vertical" preserve={false}>
          <Form.Item
            name="name"
            label="套餐名称"
            rules={[{ required: true, message: '请输入套餐名称' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item name="short_description" label="简短描述">
            <Input />
          </Form.Item>
          <Form.Item name="description" label="详细描述">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="price"
                label="售价"
                rules={[{ required: true, message: '请输入售价' }]}
              >
                <InputNumber
                  min={0}
                  precision={2}
                  style={{ width: '100%' }}
                  addonAfter="元"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="original_price" label="原价">
                <InputNumber
                  min={0}
                  precision={2}
                  style={{ width: '100%' }}
                  addonAfter="元"
                />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="duration_value"
                label="有效期数值"
                rules={[{ required: true, message: '请输入有效期数值' }]}
              >
                <InputNumber min={1} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="duration_unit"
                label="有效期单位"
                rules={[{ required: true, message: '请选择有效期单位' }]}
              >
                <Select options={DURATION_UNIT_OPTIONS} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="service_count" label="服务次数">
            <InputNumber min={0} style={{ width: '100%' }} addonAfter="次" />
          </Form.Item>
          <Form.Item
            name="status"
            label="状态"
            rules={[{ required: true, message: '请选择状态' }]}
          >
            <Select options={PACKAGE_STATUS_OPTIONS} />
          </Form.Item>
          <Form.Item name="is_popular" label="是否热门" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item name="benefits" label="包含权益">
            <Select
              mode="multiple"
              placeholder="请选择权益"
              options={benefitOptions}
              loading={!benefitsData}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default PackagePage;
