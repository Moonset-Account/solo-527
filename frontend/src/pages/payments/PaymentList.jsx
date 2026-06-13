import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Tag, Card, Input, Select, Form, message } from 'antd';
import { SearchOutlined, ReloadOutlined } from '@ant-design/icons';
import request from '../../utils/request.js';
import useAuthStore from '../../store/authStore.js';
import dayjs from 'dayjs';

const { Option } = Select;

const PaymentList = () => {
  const [payments, setPayments] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [filters, setFilters] = useState({});
  const { user } = useAuthStore();

  const isCustomer = user?.role === 'CUSTOMER';

  useEffect(() => {
    fetchPayments();
  }, [page, pageSize, filters]);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const res = await request.get('/payments', {
        params: { page, pageSize, ...filters },
      });
      setPayments(res.list || []);
      setTotal(res.total || 0);
    } catch (error) {
      console.error('获取付款列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (values) => {
    setFilters(values);
    setPage(1);
  };

  const getStatusTag = (status) => {
    const statusMap = {
      PENDING: { color: 'default', text: '处理中' },
      SUCCESS: { color: 'green', text: '成功' },
      FAILED: { color: 'red', text: '失败' },
      REFUNDED: { color: 'orange', text: '已退款' },
      PARTIAL_REFUNDED: { color: 'blue', text: '部分退款' },
    };
    const config = statusMap[status] || { color: 'default', text: status };
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  const columns = [
    {
      title: '付款单号',
      dataIndex: 'paymentNo',
      key: 'paymentNo',
      width: 180,
    },
    {
      title: '客户名称',
      dataIndex: ['customer', 'name'],
      key: 'customerName',
      hidden: isCustomer,
    },
    {
      title: '关联账单',
      dataIndex: ['bill', 'billNo'],
      key: 'billNo',
      render: (val) => val || '-',
    },
    {
      title: '付款金额',
      dataIndex: 'amount',
      key: 'amount',
      width: 120,
      render: (val) => <span style={{ fontWeight: 500 }}>¥{Number(val).toLocaleString()}</span>,
    },
    {
      title: '付款方式',
      dataIndex: 'paymentMethod',
      key: 'paymentMethod',
      width: 120,
      render: (method) => {
        const methodMap = {
          BANK_TRANSFER: '银行转账',
          ALIPAY: '支付宝',
          WECHAT: '微信支付',
          CASH: '现金',
          OTHER: '其他',
        };
        return methodMap[method] || method;
      },
    },
    {
      title: '付款日期',
      dataIndex: 'paymentDate',
      key: 'paymentDate',
      width: 120,
      render: (val) => dayjs(val).format('YYYY-MM-DD'),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: getStatusTag,
    },
    {
      title: '备注',
      dataIndex: 'remark',
      key: 'remark',
      render: (val) => val || '-',
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      render: (_, record) => (
        <Button type="link" size="small">详情</Button>
      ),
    },
  ].filter(col => !col.hidden);

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>{isCustomer ? '我的付款' : '付款记录'}</h2>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={fetchPayments}>
            刷新
          </Button>
        </Space>
      </div>

      <div className="filter-section">
        <Form layout="inline" onFinish={handleSearch}>
          <Form.Item name="status" label="状态">
            <Select placeholder="全部状态" style={{ width: 150 }} allowClear>
              <Option value="SUCCESS">成功</Option>
              <Option value="PENDING">处理中</Option>
              <Option value="FAILED">失败</Option>
              <Option value="REFUNDED">已退款</Option>
            </Select>
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" icon={<SearchOutlined />}>
                查询
              </Button>
              <Button onClick={() => { setFilters({}); setPage(1); }}>重置</Button>
            </Space>
          </Form.Item>
        </Form>
      </div>

      <div className="table-section">
        <Table
          dataSource={payments}
          columns={columns}
          rowKey="id"
          loading={loading}
          scroll={{ x: 1000 }}
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
    </div>
  );
};

export default PaymentList;
