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
  Popconfirm,
  InputNumber,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import type {
  Customer,
  PriceList,
  PaginationParams,
  PriceListStatus,
} from '@/types';
import {
  getCustomers,
  getCustomerPriceLists,
  createPriceList,
  updatePriceList,
  deletePriceList,
} from '@/api';

const { TextArea } = Input;

const priceListStatusMap: Record<PriceListStatus, string> = {
  active: '生效中',
  inactive: '已失效',
};

const priceListStatusColorMap: Record<PriceListStatus, string> = {
  active: 'green',
  inactive: 'default',
};

const PriceListPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<PriceList[]>([]);
  const [total, setTotal] = useState(0);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10 });
  const [queryParams, setQueryParams] = useState<PaginationParams & { customerId?: string }>({});
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<PriceList | null>(null);
  const [customers, setCustomers] = useState<{ label: string; value: string }[]>([]);
  const [searchForm] = Form.useForm();
  const [form] = Form.useForm();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { customerId, ...rest } = queryParams;
      let res;
      if (customerId) {
        res = await getCustomerPriceLists(customerId, {
          ...rest,
          page: pagination.current,
          pageSize: pagination.pageSize,
        });
      } else {
        const allCustomers = await getCustomers({ page: 1, pageSize: 999 });
        const allPriceLists: PriceList[] = [];
        for (const c of allCustomers.list || []) {
          const plRes = await getCustomerPriceLists(c.id, { page: 1, pageSize: 999 });
          allPriceLists.push(...(plRes.list || []));
        }
        const start = (pagination.current - 1) * pagination.pageSize;
        const end = start + pagination.pageSize;
        res = {
          list: allPriceLists.slice(start, end),
          total: allPriceLists.length,
          page: pagination.current,
          pageSize: pagination.pageSize,
          totalPages: Math.ceil(allPriceLists.length / pagination.pageSize),
        };
      }
      setData(res.list || []);
      setTotal(res.total || 0);
    } catch (error) {
      message.error('获取价目表失败');
    } finally {
      setLoading(false);
    }
  }, [queryParams, pagination.current, pagination.pageSize]);

  const fetchCustomers = useCallback(async () => {
    try {
      const res = await getCustomers({ page: 1, pageSize: 999 });
      setCustomers(
        (res.list || []).map((c: Customer) => ({ label: c.name, value: c.id }))
      );
    } catch (error) {
      console.error('获取客户列表失败', error);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const handleSearch = async (values: any) => {
    const params: PaginationParams & { customerId?: string } = { ...values };
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
    form.setFieldsValue({
      status: 'active',
    });
    setFormModalOpen(true);
  };

  const handleEdit = (record: PriceList) => {
    setEditingRecord(record);
    const extraFields = record.extraFields as any || {};
    form.setFieldsValue({
      ...record,
      unit: record.priceUnit,
      effectiveDate: extraFields.effectiveDate ? dayjs(extraFields.effectiveDate) : undefined,
      expiryDate: extraFields.expiryDate ? dayjs(extraFields.expiryDate) : undefined,
    });
    setFormModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await deletePriceList(id);
      message.success('删除成功');
      fetchData();
    } catch (error) {
      message.error('删除失败');
    }
  };

  const handleFormSubmit = async () => {
    try {
      const values = await form.validateFields();
      const { unit, effectiveDate, expiryDate, ...restValues } = values;
      const extraFields = {
        ...(editingRecord?.extraFields || {}),
        effectiveDate: effectiveDate ? effectiveDate.toISOString() : undefined,
        expiryDate: expiryDate ? expiryDate.toISOString() : undefined,
      };
      const submitData = {
        ...restValues,
        priceUnit: unit,
        extraFields,
      };

      if (editingRecord) {
        await updatePriceList(editingRecord.id, submitData);
        message.success('更新成功');
      } else {
        await createPriceList(submitData);
        message.success('创建成功');
      }
      setFormModalOpen(false);
      setEditingRecord(null);
      fetchData();
    } catch (error) {
      console.error(error);
    }
  };

  const getCustomerName = (customerId: string) => {
    const customer = customers.find((c) => c.value === customerId);
    return customer?.label || customerId;
  };

  const columns: ColumnsType<PriceList> = [
    {
      title: '客户名称',
      dataIndex: 'customerId',
      key: 'customerName',
      width: 160,
      render: (val: string) => getCustomerName(val),
    },
    {
      title: '产品名称',
      dataIndex: 'productName',
      key: 'productName',
      width: 160,
    },
    {
      title: '产品规格',
      dataIndex: 'productSpec',
      key: 'productSpec',
      width: 160,
      render: (val: string | undefined) => val || '-',
    },
    {
      title: '单价',
      dataIndex: 'unitPrice',
      key: 'unitPrice',
      width: 120,
      render: (val: number) => (
        <span style={{ color: '#cf1322', fontWeight: 'bold' }}>¥{Number(val).toFixed(2)}</span>
      ),
    },
    {
      title: '计价单位',
      dataIndex: 'priceUnit',
      key: 'priceUnit',
      width: 100,
    },
    {
      title: '生效日期',
      key: 'effectiveDate',
      width: 120,
      render: (_: any, record: PriceList) => {
        const date = (record.extraFields as any)?.effectiveDate;
        return date ? dayjs(date).format('YYYY-MM-DD') : '-';
      },
    },
    {
      title: '失效日期',
      key: 'expiryDate',
      width: 120,
      render: (_: any, record: PriceList) => {
        const date = (record.extraFields as any)?.expiryDate;
        return date ? dayjs(date).format('YYYY-MM-DD') : '-';
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: PriceListStatus) => (
        <Tag color={priceListStatusColorMap[status]}>{priceListStatusMap[status]}</Tag>
      ),
    },
    {
      title: '备注',
      dataIndex: 'remark',
      key: 'remark',
      width: 200,
      ellipsis: true,
      render: (val: string | undefined) => val || '-',
    },
    {
      title: '操作',
      key: 'action',
      width: 160,
      fixed: 'right',
      render: (_: any, record: PriceList) => (
        <Space size="small">
          <Button
            size="small"
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确认删除该价目表？"
            description="删除后无法恢复"
            onConfirm={() => handleDelete(record.id)}
            okText="确认"
            cancelText="取消"
          >
            <Button size="small" type="link" danger icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16, padding: 16, background: '#fff', borderRadius: 8 }}>
        <Form
          form={searchForm}
          layout="vertical"
          onFinish={handleSearch}
        >
          <Row gutter={16}>
            <Col xs={24} sm={12} md={8} lg={6}>
              <Form.Item name="customerId" label="客户">
                <Select
                  placeholder="请选择客户"
                  options={customers}
                  allowClear
                  showSearch
                  optionFilterProp="label"
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8} lg={6}>
              <Form.Item name="keyword" label="关键词">
                <Input placeholder="产品名称/规格" allowClear />
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
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>新增价目表</Button>
        </Space>
      </div>

      <Table<PriceList>
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
        scroll={{ x: 1400 }}
      />

      <Modal
        title={editingRecord ? '编辑价目表' : '新增价目表'}
        open={formModalOpen}
        onCancel={() => setFormModalOpen(false)}
        onOk={handleFormSubmit}
        width={720}
        destroyOnClose
        okText="确认"
        cancelText="取消"
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col xs={24}>
              <Form.Item
                name="customerId"
                label="客户"
                rules={[{ required: true, message: '请选择客户' }]}
              >
                <Select
                  placeholder="请选择客户"
                  options={customers}
                  showSearch
                  optionFilterProp="label"
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="productName"
                label="产品名称"
                rules={[{ required: true, message: '请输入产品名称' }]}
              >
                <Input placeholder="请输入产品名称" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="productSpec"
                label="产品规格"
              >
                <Input placeholder="请输入产品规格" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="unitPrice"
                label="单价"
                rules={[{ required: true, message: '请输入单价' }]}
              >
                <InputNumber
                  min={0}
                  step={0.01}
                  precision={2}
                  style={{ width: '100%' }}
                  prefix="¥"
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="unit"
                label="计价单位"
                rules={[{ required: true, message: '请输入计价单位' }]}
              >
                <Input placeholder="例如：个、张、本、套" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="effectiveDate"
                label="生效日期"
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="expiryDate"
                label="失效日期"
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="minQuantity"
                label="最小起订量"
              >
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="status"
                label="状态"
                rules={[{ required: true, message: '请选择状态' }]}
              >
                <Select
                  placeholder="请选择状态"
                  options={Object.entries(priceListStatusMap).map(([value, label]) => ({ value, label }))}
                />
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
    </div>
  );
};

export default PriceListPage;
