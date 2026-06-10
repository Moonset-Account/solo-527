import React, { useState, useEffect, useCallback } from 'react';
import {
  Table,
  Button,
  Space,
  Tag,
  Modal,
  message,
  Popconfirm,
  Dropdown,
  Form,
  Select,
  Input,
  DatePicker,
  Row,
  Col,
} from 'antd';
import {
  PlusOutlined,
  ExportOutlined,
  EditOutlined,
  EyeOutlined,
  DeleteOutlined,
  SearchOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import type { Order, OrderStatus, OrderQueryParams, Customer, User } from '@/types';
import { statusMap, urgentLevelMap } from '@/types';
import {
  getOrders,
  deleteOrder,
  getStatusTransitionActions,
  executeStatusTransition,
  exportOrders,
  getCustomers,
  userApi,
} from '@/api';
import OrderForm from './OrderForm';

const statusColorMap: Record<OrderStatus, string> = {
  pending: 'default',
  confirmed: 'processing',
  in_production: 'blue',
  quality_check: 'cyan',
  completed: 'success',
  cancelled: 'error',
};

const { RangePicker } = DatePicker;

const OrderList: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<Order[]>([]);
  const [total, setTotal] = useState(0);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10 });
  const [queryParams, setQueryParams] = useState<OrderQueryParams>({});
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [customers, setCustomers] = useState<{ label: string; value: string }[]>([]);
  const [salespeople, setSalespeople] = useState<{ label: string; value: string }[]>([]);
  const [searchForm] = Form.useForm();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getOrders({
        ...queryParams,
        page: pagination.current,
        pageSize: pagination.pageSize,
      });
      setData(res.list || []);
      setTotal(res.total || 0);
    } catch (error) {
      message.error('获取订单列表失败');
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

  const fetchSalespeople = useCallback(async () => {
    try {
      const res = await userApi.findByRole('sales', { page: 1, pageSize: 999 });
      setSalespeople(
        (res.list || []).map((u: User) => ({ label: u.name, value: u.id }))
      );
    } catch (error) {
      console.error('获取业务员列表失败', error);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    fetchCustomers();
    fetchSalespeople();
  }, [fetchCustomers, fetchSalespeople]);

  const handleSearch = async (values: any) => {
    const params: OrderQueryParams = { ...values };
    if (values.orderDate && values.orderDate.length === 2) {
      params.startDate = values.orderDate[0]?.format('YYYY-MM-DD');
      params.endDate = values.orderDate[1]?.format('YYYY-MM-DD');
      delete (params as any).orderDate;
    }
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
    setEditingOrder(null);
    setFormModalOpen(true);
  };

  const handleEdit = (record: Order) => {
    setEditingOrder(record);
    setFormModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteOrder(id);
      message.success('删除成功');
      fetchData();
    } catch (error) {
      message.error('删除失败');
    }
  };

  const handleExport = async () => {
    try {
      const filterCriteria: Record<string, any> = { ...queryParams };
      if (selectedRowKeys.length > 0) {
        filterCriteria.ids = selectedRowKeys.map(String);
      }
      await exportOrders(filterCriteria, '管理员', 'admin');
      message.success('导出成功，正在下载文件...');
    } catch (error) {
      message.error('导出失败');
    }
  };

  const handleStatusTransition = async (record: Order, action: string) => {
    try {
      await executeStatusTransition(record.id, action);
      message.success('状态更新成功');
      fetchData();
    } catch (error) {
      message.error('状态更新失败');
    }
  };

  const handleFormSuccess = () => {
    setFormModalOpen(false);
    setEditingOrder(null);
    fetchData();
  };

  const renderStatusActions = (record: Order) => {
    const actions = getStatusTransitionActions(record.status);
    if (actions.length === 0) return null;
    if (actions.length === 1) {
      const action: { key: string; label: string; danger?: boolean } = actions[0];
      return (
        <Button
          size="small"
          danger={action.danger}
          type="link"
          onClick={() => handleStatusTransition(record, action.key)}
        >
          {action.label}
        </Button>
      );
    }
    return (
      <Dropdown
        menu={{
          items: actions.map((action: { key: string; label: string; danger?: boolean }) => ({
            key: action.key,
            label: action.label,
            danger: action.danger,
            onClick: () => handleStatusTransition(record, action.key),
          })),
        }}
      >
        <Button size="small" type="link">状态流转</Button>
      </Dropdown>
    );
  };

  const columns: ColumnsType<Order> = [
    {
      title: '订单号',
      dataIndex: 'orderNo',
      key: 'orderNo',
      width: 140,
      fixed: 'left',
    },
    {
      title: '客户名称',
      dataIndex: ['customer', 'name'],
      key: 'customerName',
      width: 120,
      render: (val: string, record: Order) => val || record.customerId || '-',
    },
    {
      title: '产品名称',
      dataIndex: 'productName',
      key: 'productName',
      width: 140,
    },
    {
      title: '规格',
      dataIndex: 'productSpec',
      key: 'productSpec',
      width: 140,
      ellipsis: true,
    },
    {
      title: '数量',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 80,
      render: (val: number, record: Order) => `${val}${record.unit || ''}`,
    },
    {
      title: '金额',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      width: 100,
      render: (val: number | string | undefined) =>
        val != null ? `¥${Number(val).toFixed(2)}` : '-',
    },
    {
      title: '下单日期',
      dataIndex: 'orderDate',
      key: 'orderDate',
      width: 110,
      render: (val: string | Date) => dayjs(val).format('YYYY-MM-DD'),
    },
    {
      title: '交货日期',
      dataIndex: 'deliveryDate',
      key: 'deliveryDate',
      width: 110,
      render: (val: string | Date) => dayjs(val).format('YYYY-MM-DD'),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 90,
      render: (status: OrderStatus) => (
        <Tag color={statusColorMap[status]}>{statusMap[status]}</Tag>
      ),
    },
    {
      title: '紧急程度',
      dataIndex: 'urgentLevel',
      key: 'urgentLevel',
      width: 90,
      render: (level: number) => {
        const colorMap: Record<number, string> = {
          0: 'default',
          1: 'warning',
          2: 'orange',
          3: 'error',
        };
        return (
          <Tag color={colorMap[level] || 'default'}>
            {urgentLevelMap[level] || '普通'}
          </Tag>
        );
      },
    },
    {
      title: '业务员',
      dataIndex: ['salesperson', 'name'],
      key: 'salespersonName',
      width: 90,
      render: (val: string) => val || '-',
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      fixed: 'right',
      render: (_: any, record: Order) => (
        <Space size="small" wrap>
          <Button
            size="small"
            type="link"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/orders/${record.id}`)}
          >
            查看
          </Button>
          <Button
            size="small"
            type="link"
            icon={<EditOutlined />}
            disabled={record.status === 'completed' || record.status === 'cancelled'}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          {renderStatusActions(record)}
          <Popconfirm
            title="确认删除该订单？"
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
            <Col xs={24} sm={12} md={8} lg={6} xl={4}>
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
            <Col xs={24} sm={12} md={8} lg={6} xl={4}>
              <Form.Item name="status" label="状态">
                <Select
                  placeholder="请选择状态"
                  options={Object.entries(statusMap).map(([value, label]) => ({ value, label }))}
                  allowClear
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8} lg={6} xl={4}>
              <Form.Item name="urgentLevel" label="紧急程度">
                <Select
                  placeholder="请选择紧急程度"
                  options={Object.entries(urgentLevelMap).map(([value, label]) => ({
                    value: Number(value), label,
                  }))}
                  allowClear
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8} lg={6} xl={4}>
              <Form.Item name="orderDate" label="下单日期">
                <RangePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8} lg={6} xl={4}>
              <Form.Item name="salespersonId" label="业务员">
                <Select
                  placeholder="请选择业务员"
                  options={salespeople}
                  allowClear
                  showSearch
                  optionFilterProp="label"
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8} lg={6} xl={4}>
              <Form.Item name="keyword" label="关键词">
                <Input placeholder="订单号/产品名称" allowClear />
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

      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
        <Space>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>新增订单</Button>
          <Button
            icon={<ExportOutlined />}
            onClick={handleExport}
            disabled={selectedRowKeys.length === 0 && Object.keys(queryParams).length === 0}
          >
            导出
          </Button>
        </Space>
        <div style={{ color: '#999' }}>
          {selectedRowKeys.length > 0 ? `已选择 ${selectedRowKeys.length} 项` : ''}
        </div>
      </div>

      <Table<Order>
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
        rowSelection={{
          selectedRowKeys,
          onChange: setSelectedRowKeys,
        }}
        scroll={{ x: 1500 }}
      />

      <Modal
        title={editingOrder ? '编辑订单' : '新增订单'}
        open={formModalOpen}
        onCancel={() => setFormModalOpen(false)}
        width={1000}
        destroyOnClose
        footer={null}
      >
        <OrderForm
          initialData={editingOrder}
          onSuccess={handleFormSuccess}
          onCancel={() => setFormModalOpen(false)}
        />
      </Modal>
    </div>
  );
};

export default OrderList;
