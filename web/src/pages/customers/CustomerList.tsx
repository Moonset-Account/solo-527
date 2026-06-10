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
  Row,
  Col,
  Popconfirm,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  ReloadOutlined,
  UnorderedListOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type {
  Customer,
  PriceList,
  PaginationParams,
  PriceListStatus,
} from '@/types';
import {
  getCustomers,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  getCustomerPriceLists,
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

const CustomerListPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<Customer[]>([]);
  const [total, setTotal] = useState(0);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10 });
  const [queryParams, setQueryParams] = useState<PaginationParams>({});
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<Customer | null>(null);
  const [priceListModalOpen, setPriceListModalOpen] = useState(false);
  const [currentCustomer, setCurrentCustomer] = useState<Customer | null>(null);
  const [priceListData, setPriceListData] = useState<PriceList[]>([]);
  const [priceListLoading, setPriceListLoading] = useState(false);
  const [searchForm] = Form.useForm();
  const [form] = Form.useForm();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getCustomers({
        ...queryParams,
        page: pagination.current,
        pageSize: pagination.pageSize,
      });
      setData(res.list || []);
      setTotal(res.total || 0);
    } catch (error) {
      message.error('获取客户列表失败');
    } finally {
      setLoading(false);
    }
  }, [queryParams, pagination.current, pagination.pageSize]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSearch = async (values: any) => {
    const params: PaginationParams = { ...values };
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

  const handleEdit = (record: Customer) => {
    setEditingRecord(record);
    form.setFieldsValue({
      ...record,
      bankName: (record.extraFields as any)?.bankName,
      bankAccount: (record.extraFields as any)?.bankAccount,
    });
    setFormModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteCustomer(id);
      message.success('删除成功');
      fetchData();
    } catch (error) {
      message.error('删除失败');
    }
  };

  const handleFormSubmit = async () => {
    try {
      const values = await form.validateFields();
      const { bankName, bankAccount, ...restValues } = values;
      const extraFields = {
        ...(editingRecord?.extraFields || {}),
        bankName,
        bankAccount,
      };
      const submitData = {
        ...restValues,
        extraFields,
      };

      if (editingRecord) {
        await updateCustomer(editingRecord.id, submitData);
        message.success('更新成功');
      } else {
        await createCustomer(submitData);
        message.success('创建成功');
      }
      setFormModalOpen(false);
      setEditingRecord(null);
      fetchData();
    } catch (error) {
      console.error(error);
    }
  };

  const handleViewPriceList = async (record: Customer) => {
    setCurrentCustomer(record);
    setPriceListModalOpen(true);
    setPriceListLoading(true);
    try {
      const res = await getCustomerPriceLists(record.id, { page: 1, pageSize: 999 });
      setPriceListData(res.list || []);
    } catch (error) {
      message.error('获取价目表失败');
    } finally {
      setPriceListLoading(false);
    }
  };

  const priceListColumns: ColumnsType<PriceList> = [
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
      render: (val: number) => <span style={{ color: '#cf1322', fontWeight: 'bold' }}>¥{Number(val).toFixed(2)}</span>,
    },
    {
      title: '计价单位',
      dataIndex: 'priceUnit',
      key: 'priceUnit',
      width: 100,
    },
    {
      title: '最小起订量',
      dataIndex: 'minQuantity',
      key: 'minQuantity',
      width: 100,
      render: (val: number | undefined) => val || '-',
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
  ];

  const columns: ColumnsType<Customer> = [
    {
      title: '客户名称',
      dataIndex: 'name',
      key: 'name',
      width: 160,
      fixed: 'left',
      render: (val: string) => <strong>{val}</strong>,
    },
    {
      title: '联系人',
      dataIndex: 'contactPerson',
      key: 'contactPerson',
      width: 100,
      render: (val: string | undefined) => val || '-',
    },
    {
      title: '联系电话',
      dataIndex: 'phone',
      key: 'phone',
      width: 130,
      render: (val: string | undefined) => val || '-',
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      key: 'email',
      width: 180,
      render: (val: string | undefined) => val || '-',
    },
    {
      title: '地址',
      dataIndex: 'address',
      key: 'address',
      width: 200,
      ellipsis: true,
      render: (val: string | undefined) => val || '-',
    },
    {
      title: '开户银行',
      key: 'bankName',
      width: 150,
      render: (_: any, record: Customer) => (record.extraFields as any)?.bankName || '-',
    },
    {
      title: '银行账号',
      key: 'bankAccount',
      width: 180,
      render: (_: any, record: Customer) => (record.extraFields as any)?.bankAccount || '-',
    },
    {
      title: '税号',
      dataIndex: 'taxNumber',
      key: 'taxNumber',
      width: 180,
      render: (val: string | undefined) => val || '-',
    },
    {
      title: '备注',
      dataIndex: 'remark',
      key: 'remark',
      width: 150,
      ellipsis: true,
      render: (val: string | undefined) => val || '-',
    },
    {
      title: '操作',
      key: 'action',
      width: 220,
      fixed: 'right',
      render: (_: any, record: Customer) => (
        <Space size="small" wrap>
          <Button
            size="small"
            type="link"
            icon={<UnorderedListOutlined />}
            onClick={() => handleViewPriceList(record)}
          >
            价目表
          </Button>
          <Button
            size="small"
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确认删除该客户？"
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
              <Form.Item name="keyword" label="关键词">
                <Input placeholder="客户名称/关键词" allowClear />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8} lg={6}>
              <Form.Item name="contactPerson" label="联系人">
                <Input placeholder="请输入联系人" allowClear />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8} lg={6}>
              <Form.Item name="phone" label="电话">
                <Input placeholder="请输入电话" allowClear />
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
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>新增客户</Button>
        </Space>
      </div>

      <Table<Customer>
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
        scroll={{ x: 1500 }}
      />

      <Modal
        title={editingRecord ? '编辑客户' : '新增客户'}
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
            <Col xs={24} sm={12}>
              <Form.Item
                name="name"
                label="客户名称"
                rules={[{ required: true, message: '请输入客户名称' }]}
              >
                <Input placeholder="请输入客户名称" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="contactPerson"
                label="联系人"
              >
                <Input placeholder="请输入联系人" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="phone"
                label="联系电话"
              >
                <Input placeholder="请输入联系电话" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="email"
                label="邮箱"
              >
                <Input placeholder="请输入邮箱" />
              </Form.Item>
            </Col>
            <Col xs={24}>
              <Form.Item
                name="address"
                label="地址"
              >
                <TextArea rows={2} placeholder="请输入地址" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="bankName"
                label="开户银行"
              >
                <Input placeholder="请输入开户银行" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="bankAccount"
                label="银行账号"
              >
                <Input placeholder="请输入银行账号" />
              </Form.Item>
            </Col>
            <Col xs={24}>
              <Form.Item
                name="taxNumber"
                label="税号"
              >
                <Input placeholder="请输入税号" />
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
        title={currentCustomer ? `${currentCustomer.name} - 价目表` : '价目表'}
        open={priceListModalOpen}
        onCancel={() => setPriceListModalOpen(false)}
        footer={[
          <Button key="close" onClick={() => setPriceListModalOpen(false)}>
            关闭
          </Button>,
        ]}
        width={900}
        destroyOnClose
      >
        <Table<PriceList>
          rowKey="id"
          loading={priceListLoading}
          columns={priceListColumns}
          dataSource={priceListData}
          pagination={false}
          scroll={{ x: 900 }}
        />
      </Modal>
    </div>
  );
};

export default CustomerListPage;
