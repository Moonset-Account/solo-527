import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Tag, Input, Select, DatePicker, Form, Card, Modal, message } from 'antd';
import { SearchOutlined, PlusOutlined, DownloadOutlined, ReloadOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import request from '../../utils/request.js';
import useAuthStore from '../../store/authStore.js';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;
const { Option } = Select;

const BillList = () => {
  const [bills, setBills] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [filters, setFilters] = useState({});
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const isCustomer = user?.role === 'CUSTOMER';
  const canCreate = ['FINANCE_STAFF', 'FINANCE_MANAGER', 'ADMIN'].includes(user?.role);

  useEffect(() => {
    fetchBills();
  }, [page, pageSize, filters]);

  const fetchBills = async () => {
    setLoading(true);
    try {
      const params = {
        page,
        pageSize,
        ...filters,
      };
      const res = await request.get('/bills', { params });
      setBills(res.list || []);
      setTotal(res.total || 0);
    } catch (error) {
      console.error('获取账单列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (values) => {
    setFilters(values);
    setPage(1);
  };

  const handleReset = () => {
    setFilters({});
    setPage(1);
  };

  const handleExport = async () => {
    try {
      const params = new URLSearchParams(filters).toString();
      window.open(`/api/statistics/export/bills?${params}`, '_blank');
    } catch (error) {
      console.error('导出失败:', error);
    }
  };

  const handleCreate = async (values) => {
    try {
      await request.post('/bills', {
        ...values,
        billDate: values.billDate?.format('YYYY-MM-DD'),
        dueDate: values.dueDate?.format('YYYY-MM-DD'),
      });
      message.success('创建账单成功');
      setShowCreateModal(false);
      form.resetFields();
      fetchBills();
    } catch (error) {
      console.error('创建账单失败:', error);
    }
  };

  const getStatusTag = (status) => {
    const statusMap = {
      UNPAID: { color: 'orange', text: '待付款' },
      PARTIAL_PAID: { color: 'blue', text: '部分付款' },
      PAID: { color: 'green', text: '已付款' },
      OVERDUE: { color: 'red', text: '已逾期' },
      DRAFT: { color: 'default', text: '草稿' },
      WRITTEN_OFF: { color: 'purple', text: '已冲销' },
      CANCELLED: { color: 'default', text: '已取消' },
    };
    const config = statusMap[status] || { color: 'default', text: status };
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  const isOverdue = (dueDate, status) => {
    return dayjs(dueDate).isBefore(dayjs()) && status !== 'PAID' && status !== 'WRITTEN_OFF';
  };

  const columns = [
    {
      title: '账单编号',
      dataIndex: 'billNo',
      key: 'billNo',
      width: 160,
    },
    {
      title: '客户名称',
      dataIndex: ['customer', 'name'],
      key: 'customerName',
      hidden: isCustomer,
    },
    {
      title: '账期',
      dataIndex: 'billPeriod',
      key: 'billPeriod',
      width: 100,
    },
    {
      title: '账单金额',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      width: 120,
      render: (val) => `¥${Number(val).toLocaleString()}`,
    },
    {
      title: '已付金额',
      dataIndex: 'paidAmount',
      key: 'paidAmount',
      width: 120,
      render: (val) => `¥${Number(val).toLocaleString()}`,
    },
    {
      title: '待收金额',
      dataIndex: 'balanceAmount',
      key: 'balanceAmount',
      width: 120,
      render: (val) => <span style={{ color: '#ff4d4f', fontWeight: 500 }}>¥{Number(val).toLocaleString()}</span>,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status, record) => {
        if (isOverdue(record.dueDate, status) && status !== 'OVERDUE') {
          return <Tag color="red">已逾期</Tag>;
        }
        return getStatusTag(status);
      },
    },
    {
      title: '到期日期',
      dataIndex: 'dueDate',
      key: 'dueDate',
      width: 120,
      render: (val) => dayjs(val).format('YYYY-MM-DD'),
    },
    {
      title: '最近处理人',
      dataIndex: 'lastHandler',
      key: 'lastHandler',
      width: 100,
      render: (val) => val || '-',
    },
    {
      title: '最近处理时间',
      dataIndex: 'lastHandleTime',
      key: 'lastHandleTime',
      width: 160,
      render: (val) => val ? dayjs(val).format('YYYY-MM-DD HH:mm') : '-',
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <Button type="link" size="small" onClick={() => navigate(`/bills/${record.id}`)}>
            详情
          </Button>
          {!isCustomer && (
            <Button type="link" size="small" onClick={() => navigate(`/payment-entry?billId=${record.id}`)}>
              收款
            </Button>
          )}
          {isCustomer && record.status !== 'PAID' && record.status !== 'WRITTEN_OFF' && (
            <Button type="link" size="small" onClick={() => navigate(`/payment-entry?billId=${record.id}`)}>
              付款
            </Button>
          )}
        </Space>
      ),
    },
  ].filter(col => !col.hidden);

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>{isCustomer ? '我的账单' : '应收账单'}</h2>
        <Space>
          {canCreate && (
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setShowCreateModal(true)}>
              新建账单
            </Button>
          )}
          <Button icon={<DownloadOutlined />} onClick={handleExport}>
            导出
          </Button>
          <Button icon={<ReloadOutlined />} onClick={fetchBills}>
            刷新
          </Button>
        </Space>
      </div>

      <div className="filter-section">
        <Form layout="inline" onFinish={handleSearch}>
          <Form.Item name="keyword" label="关键词">
            <Input placeholder="账单编号/客户名称" style={{ width: 200 }} allowClear />
          </Form.Item>
          <Form.Item name="status" label="状态">
            <Select placeholder="全部状态" style={{ width: 150 }} allowClear>
              <Option value="UNPAID">待付款</Option>
              <Option value="PARTIAL_PAID">部分付款</Option>
              <Option value="PAID">已付款</Option>
              <Option value="OVERDUE">已逾期</Option>
              <Option value="WRITTEN_OFF">已冲销</Option>
            </Select>
          </Form.Item>
          <Form.Item name="billPeriod" label="账期">
            <Input placeholder="如 2025-01" style={{ width: 150 }} allowClear />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" icon={<SearchOutlined />}>
                查询
              </Button>
              <Button onClick={handleReset}>重置</Button>
            </Space>
          </Form.Item>
        </Form>
      </div>

      <div className="table-section">
        <Table
          dataSource={bills}
          columns={columns}
          rowKey="id"
          loading={loading}
          scroll={{ x: 1200 }}
          pagination={{
            current: page,
            pageSize,
            total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`,
            onChange: (page, pageSize) => {
              setPage(page);
              setPageSize(pageSize);
            },
          }}
        />
      </div>

      <Modal
        title="新建账单"
        open={showCreateModal}
        onCancel={() => setShowCreateModal(false)}
        footer={null}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleCreate}>
          <Form.Item name="customerId" label="客户" rules={[{ required: true, message: '请选择客户' }]}>
            <Select placeholder="请选择客户">
              {/* 实际项目中应该从接口获取客户列表 */}
            </Select>
          </Form.Item>
          <Form.Item name="billPeriod" label="账期" rules={[{ required: true, message: '请输入账期' }]}>
            <Input placeholder="如 2025-01" />
          </Form.Item>
          <Form.Item name="billDate" label="账单日期" rules={[{ required: true, message: '请选择账单日期' }]}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="dueDate" label="到期日期" rules={[{ required: true, message: '请选择到期日期' }]}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="totalAmount" label="账单金额" rules={[{ required: true, message: '请输入账单金额' }]}>
            <Input type="number" prefix="¥" />
          </Form.Item>
          <Form.Item name="remark" label="备注">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item style={{ textAlign: 'right', marginBottom: 0 }}>
            <Space>
              <Button onClick={() => setShowCreateModal(false)}>取消</Button>
              <Button type="primary" htmlType="submit">创建</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default BillList;
