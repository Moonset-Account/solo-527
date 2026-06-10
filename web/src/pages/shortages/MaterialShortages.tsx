import React, { useState, useEffect, useCallback } from 'react';
import {
  Table,
  Button,
  Space,
  Tag,
  Modal,
  message,
  Form,
  Select,
  Input,
  DatePicker,
  Row,
  Col,
  Card,
  Statistic,
  InputNumber,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  ReloadOutlined,
  PlayCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import type {
  MaterialShortage,
  ShortageStatus,
  ImpactLevel,
  ShortageQueryParams,
  ShortageStatistics,
  Order,
  Material,
} from '@/types';
import { shortageStatusMap, impactLevelMap } from '@/types';
import {
  getShortages,
  getShortageStatistics,
  createShortage,
  updateShortage,
  deleteShortage,
  startProcessing,
  resolveShortage,
  closeShortage,
  getOrders,
  getMaterials,
} from '@/api';

const statusColorMap: Record<ShortageStatus, string> = {
  open: 'default',
  in_progress: 'processing',
  resolved: 'success',
  closed: 'default',
};

const impactColorMap: Record<ImpactLevel, string> = {
  low: 'green',
  medium: 'blue',
  high: 'orange',
  critical: 'red',
};

const { TextArea } = Input;

const MaterialShortagesPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<MaterialShortage[]>([]);
  const [total, setTotal] = useState(0);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10 });
  const [queryParams, setQueryParams] = useState<ShortageQueryParams>({});
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<MaterialShortage | null>(null);
  const [resolveModalOpen, setResolveModalOpen] = useState(false);
  const [resolvingRecord, setResolvingRecord] = useState<MaterialShortage | null>(null);
  const [statistics, setStatistics] = useState<ShortageStatistics | null>(null);
  const [orders, setOrders] = useState<{ label: string; value: string }[]>([]);
  const [materials, setMaterials] = useState<{ label: string; value: string; spec?: string; name?: string }[]>([]);
  const [searchForm] = Form.useForm();
  const [form] = Form.useForm();
  const [resolveForm] = Form.useForm();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getShortages({
        ...queryParams,
        page: pagination.current,
        pageSize: pagination.pageSize,
      });
      setData(res.list || []);
      setTotal(res.total || 0);
    } catch (error) {
      message.error('获取缺料列表失败');
    } finally {
      setLoading(false);
    }
  }, [queryParams, pagination.current, pagination.pageSize]);

  const fetchStatistics = useCallback(async () => {
    try {
      const res = await getShortageStatistics();
      setStatistics(res);
    } catch (error) {
      console.error('获取统计数据失败', error);
    }
  }, []);

  const fetchOrders = useCallback(async () => {
    try {
      const res = await getOrders({ page: 1, pageSize: 999 });
      setOrders(
        (res.list || []).map((o: Order) => ({ label: o.orderNo, value: o.id }))
      );
    } catch (error) {
      console.error('获取订单列表失败', error);
    }
  }, []);

  const fetchMaterials = useCallback(async () => {
    try {
      const res = await getMaterials({ page: 1, pageSize: 999 });
      setMaterials(
        (res.list || []).map((m: Material) => ({
          label: `${m.materialName} (${m.materialCode})`,
          value: m.id,
          spec: m.materialSpec,
          name: m.materialName,
        }))
      );
    } catch (error) {
      console.error('获取耗材列表失败', error);
    }
  }, []);

  useEffect(() => {
    fetchData();
    fetchStatistics();
  }, [fetchData, fetchStatistics]);

  useEffect(() => {
    fetchOrders();
    fetchMaterials();
  }, [fetchOrders, fetchMaterials]);

  const handleSearch = async (values: any) => {
    const params: ShortageQueryParams = { ...values };
    setQueryParams(params);
    setPagination({ ...pagination, current: 1 });
  };

  const handleReset = () => {
    searchForm.resetFields();
    setQueryParams({});
    setPagination({ ...pagination, current: 1 });
  };

  const handleTableChange = (newPagination: any) => {
    setPagination({
      current: newPagination.current,
      pageSize: newPagination.pageSize,
    });
  };

  const handleAdd = () => {
    setEditingRecord(null);
    form.resetFields();
    setFormModalOpen(true);
  };

  const handleEdit = (record: MaterialShortage) => {
    setEditingRecord(record);
    form.setFieldsValue({
      ...record,
      expectedResolutionTime: record.expectedResolutionTime ? dayjs(record.expectedResolutionTime) : undefined,
    });
    setFormModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteShortage(id);
      message.success('删除成功');
      fetchData();
      fetchStatistics();
    } catch (error) {
      message.error('删除失败');
    }
  };

  const handleStartProcessing = async (record: MaterialShortage) => {
    try {
      await startProcessing(record.id);
      message.success('已开始处理');
      fetchData();
      fetchStatistics();
    } catch (error) {
      message.error('操作失败');
    }
  };

  const handleResolveClick = (record: MaterialShortage) => {
    setResolvingRecord(record);
    resolveForm.resetFields();
    setResolveModalOpen(true);
  };

  const handleResolve = async () => {
    try {
      const values = await resolveForm.validateFields();
      if (resolvingRecord) {
        await resolveShortage(resolvingRecord.id, values);
        message.success('已标记解决');
        setResolveModalOpen(false);
        setResolvingRecord(null);
        fetchData();
        fetchStatistics();
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleClose = async (record: MaterialShortage) => {
    try {
      await closeShortage(record.id);
      message.success('已关闭');
      fetchData();
      fetchStatistics();
    } catch (error) {
      message.error('操作失败');
    }
  };

  const handleFormSubmit = async () => {
    try {
      const values = await form.validateFields();
      const submitData = {
        ...values,
        expectedResolutionTime: values.expectedResolutionTime
          ? values.expectedResolutionTime.toISOString()
          : undefined,
      };

      if (editingRecord) {
        await updateShortage(editingRecord.id, submitData);
        message.success('更新成功');
      } else {
        await createShortage(submitData);
        message.success('创建成功');
      }
      setFormModalOpen(false);
      setEditingRecord(null);
      fetchData();
      fetchStatistics();
    } catch (error) {
      console.error(error);
    }
  };

  const handleMaterialChange = (materialId: string) => {
    const material = materials.find((m) => m.value === materialId);
    if (material) {
      form.setFieldsValue({
        materialName: material.name,
        materialSpec: material.spec,
      });
    }
  };

  const handleQuantityChange = () => {
    const required = form.getFieldValue('requiredQuantity') || 0;
    const available = form.getFieldValue('availableQuantity') || 0;
    form.setFieldsValue({
      shortageQuantity: Math.max(0, Number(required) - Number(available)),
    });
  };

  const columns: ColumnsType<MaterialShortage> = [
    {
      title: '订单号',
      dataIndex: ['order', 'orderNo'],
      key: 'orderNo',
      width: 120,
      render: (val: string, record: MaterialShortage) => val || record.orderId || '-',
    },
    {
      title: '耗材名称',
      dataIndex: 'materialName',
      key: 'materialName',
      width: 140,
    },
    {
      title: '规格',
      dataIndex: 'materialSpec',
      key: 'materialSpec',
      width: 120,
      ellipsis: true,
    },
    {
      title: '需求数量',
      dataIndex: 'requiredQuantity',
      key: 'requiredQuantity',
      width: 90,
    },
    {
      title: '可用数量',
      dataIndex: 'availableQuantity',
      key: 'availableQuantity',
      width: 90,
    },
    {
      title: '短缺数量',
      dataIndex: 'shortageQuantity',
      key: 'shortageQuantity',
      width: 90,
      render: (val: number) => <span style={{ color: '#ff4d4f', fontWeight: 'bold' }}>{val}</span>,
    },
    {
      title: '影响级别',
      dataIndex: 'impactLevel',
      key: 'impactLevel',
      width: 90,
      render: (level: ImpactLevel) => (
        <Tag color={impactColorMap[level]}>{impactLevelMap[level]}</Tag>
      ),
    },
    {
      title: '影响范围',
      dataIndex: 'impactScope',
      key: 'impactScope',
      width: 150,
      ellipsis: true,
    },
    {
      title: '责任人',
      dataIndex: 'responsiblePerson',
      key: 'responsiblePerson',
      width: 90,
    },
    {
      title: '联系电话',
      dataIndex: 'responsiblePhone',
      key: 'responsiblePhone',
      width: 120,
    },
    {
      title: '解决路径',
      dataIndex: 'resolutionPath',
      key: 'resolutionPath',
      width: 150,
      ellipsis: true,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 90,
      render: (status: ShortageStatus) => (
        <Tag color={statusColorMap[status]}>{shortageStatusMap[status]}</Tag>
      ),
    },
    {
      title: '预计解决时间',
      dataIndex: 'expectedResolutionTime',
      key: 'expectedResolutionTime',
      width: 130,
      render: (val: string | Date | undefined) =>
        val ? dayjs(val).format('YYYY-MM-DD HH:mm') : '-',
    },
    {
      title: '实际解决时间',
      dataIndex: 'actualResolutionTime',
      key: 'actualResolutionTime',
      width: 130,
      render: (val: string | Date | undefined) =>
        val ? dayjs(val).format('YYYY-MM-DD HH:mm') : '-',
    },
    {
      title: '操作',
      key: 'action',
      width: 240,
      fixed: 'right',
      render: (_: any, record: MaterialShortage) => (
        <Space size="small" wrap>
          {record.status === 'open' && (
            <Button
              size="small"
              type="link"
              icon={<PlayCircleOutlined />}
              onClick={() => handleStartProcessing(record)}
            >
              开始处理
            </Button>
          )}
          {record.status === 'in_progress' && (
            <Button
              size="small"
              type="link"
              icon={<CheckCircleOutlined />}
              onClick={() => handleResolveClick(record)}
            >
              标记解决
            </Button>
          )}
          {record.status === 'resolved' && (
            <Button
              size="small"
              type="link"
              icon={<CloseCircleOutlined />}
              onClick={() => handleClose(record)}
            >
              关闭
            </Button>
          )}
          <Button
            size="small"
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Button
            size="small"
            type="link"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record.id)}
          >
            删除
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="待处理"
              value={statistics?.open || 0}
              valueStyle={{ color: '#8c8c8c' }}
              prefix={<WarningOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="处理中"
              value={statistics?.inProgress || 0}
              valueStyle={{ color: '#1890ff' }}
              prefix={<PlayCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="已解决"
              value={statistics?.resolved || 0}
              valueStyle={{ color: '#52c41a' }}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="紧急"
              value={(statistics?.byImpactLevel?.critical || 0) + (statistics?.byImpactLevel?.high || 0)}
              valueStyle={{ color: '#ff4d4f' }}
              prefix={<WarningOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <div style={{ marginBottom: 16, padding: 16, background: '#fff', borderRadius: 8 }}>
        <Form
          form={searchForm}
          layout="vertical"
          onFinish={handleSearch}
        >
          <Row gutter={16}>
            <Col xs={24} sm={12} md={8} lg={6}>
              <Form.Item name="status" label="状态">
                <Select
                  placeholder="请选择状态"
                  options={Object.entries(shortageStatusMap).map(([value, label]) => ({ value, label }))}
                  allowClear
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8} lg={6}>
              <Form.Item name="impactLevel" label="影响级别">
                <Select
                  placeholder="请选择影响级别"
                  options={Object.entries(impactLevelMap).map(([value, label]) => ({ value, label }))}
                  allowClear
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8} lg={6}>
              <Form.Item name="orderId" label="订单ID">
                <Select
                  placeholder="请选择订单"
                  options={orders}
                  allowClear
                  showSearch
                  optionFilterProp="label"
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8} lg={6}>
              <Form.Item name="keyword" label="关键词">
                <Input placeholder="耗材名称/责任人" allowClear />
              </Form.Item>
            </Col>
          </Row>
          <Row justify="end">
            <Col>
              <Space>
                <Button type="primary" htmlType="submit" icon={<SearchOutlined />}>查询</Button>
                <Button onClick={handleReset} icon={<ReloadOutlined />}>重置</Button>
              </Space>
            </Col>
          </Row>
        </Form>
      </div>

      <div style={{ marginBottom: 16 }}>
        <Space>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>新增缺料记录</Button>
        </Space>
      </div>

      <Table<MaterialShortage>
        rowKey="id"
        loading={loading}
        columns={columns}
        dataSource={data}
        pagination={{
          current: pagination.current,
          pageSize: pagination.pageSize,
          total,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (t: number) => `共 ${t} 条`,
        }}
        onChange={handleTableChange}
        scroll={{ x: 1800 }}
      />

      <Modal
        title={editingRecord ? '编辑缺料记录' : '新增缺料记录'}
        open={formModalOpen}
        onCancel={() => setFormModalOpen(false)}
        onOk={handleFormSubmit}
        width={800}
        destroyOnClose
        okText="确认"
        cancelText="取消"
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{ status: 'open' }}
        >
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="orderId"
                label="订单"
                rules={[{ required: true, message: '请选择订单' }]}
              >
                <Select
                  placeholder="请选择订单"
                  options={orders}
                  showSearch
                  optionFilterProp="label"
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="materialId"
                label="耗材"
                rules={[{ required: true, message: '请选择耗材' }]}
              >
                <Select
                  placeholder="请选择耗材"
                  options={materials}
                  showSearch
                  optionFilterProp="label"
                  onChange={handleMaterialChange}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="materialName"
                label="耗材名称"
                rules={[{ required: true, message: '请输入耗材名称' }]}
              >
                <Input placeholder="请输入耗材名称" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="materialSpec" label="规格">
                <Input placeholder="请输入规格" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={8}>
              <Form.Item
                name="requiredQuantity"
                label="需求数量"
                rules={[{ required: true, message: '请输入需求数量' }]}
              >
                <InputNumber
                  min={0}
                  style={{ width: '100%' }}
                  onChange={handleQuantityChange}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={8}>
              <Form.Item
                name="availableQuantity"
                label="可用数量"
                rules={[{ required: true, message: '请输入可用数量' }]}
              >
                <InputNumber
                  min={0}
                  style={{ width: '100%' }}
                  onChange={handleQuantityChange}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={8}>
              <Form.Item
                name="shortageQuantity"
                label="短缺数量"
              >
                <InputNumber min={0} style={{ width: '100%' }} readOnly />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="impactLevel"
                label="影响级别"
                rules={[{ required: true, message: '请选择影响级别' }]}
              >
                <Select
                  placeholder="请选择影响级别"
                  options={Object.entries(impactLevelMap).map(([value, label]) => ({ value, label }))}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="expectedResolutionTime"
                label="预计解决时间"
              >
                <DatePicker showTime style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="responsiblePerson"
                label="责任人"
                rules={[{ required: true, message: '请输入责任人' }]}
              >
                <Input placeholder="请输入责任人" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="responsiblePhone" label="联系电话">
                <Input placeholder="请输入联系电话" />
              </Form.Item>
            </Col>
            <Col xs={24}>
              <Form.Item
                name="impactScope"
                label="影响范围"
                rules={[{ required: true, message: '请输入影响范围' }]}
              >
                <TextArea rows={3} placeholder="请输入影响范围" />
              </Form.Item>
            </Col>
            <Col xs={24}>
              <Form.Item
                name="resolutionPath"
                label="解决路径"
                rules={[{ required: true, message: '请输入解决路径' }]}
              >
                <TextArea rows={3} placeholder="请输入解决路径" />
              </Form.Item>
            </Col>
            <Col xs={24}>
              <Form.Item name="remark" label="备注">
                <TextArea rows={2} placeholder="请输入备注" />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      <Modal
        title="标记解决"
        open={resolveModalOpen}
        onCancel={() => setResolveModalOpen(false)}
        onOk={handleResolve}
        destroyOnClose
        okText="确认"
        cancelText="取消"
      >
        <Form form={resolveForm} layout="vertical">
          <Form.Item
            name="resolutionResult"
            label="解决结果"
            rules={[{ required: true, message: '请输入解决结果' }]}
          >
            <TextArea rows={4} placeholder="请输入解决结果描述" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default MaterialShortagesPage;
