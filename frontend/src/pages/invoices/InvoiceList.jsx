import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Tag, Input, Select, Form, Card, message, Modal } from 'antd';
import { SearchOutlined, DownloadOutlined, ReloadOutlined, PlusOutlined } from '@ant-design/icons';
import request from '../../utils/request.js';
import useAuthStore from '../../store/authStore.js';
import dayjs from 'dayjs';

const { Option } = Select;

const InvoiceList = () => {
  const [invoices, setInvoices] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [filters, setFilters] = useState({});
  const { user } = useAuthStore();

  const isCustomer = user?.role === 'CUSTOMER';
  const canCreate = ['FINANCE_STAFF', 'FINANCE_MANAGER', 'ADMIN'].includes(user?.role);

  useEffect(() => {
    fetchInvoices();
  }, [page, pageSize, filters]);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const res = await request.get('/invoices', {
        params: { page, pageSize, ...filters },
      });
      setInvoices(res.list || []);
      setTotal(res.total || 0);
    } catch (error) {
      console.error('获取发票列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (values) => {
    setFilters(values);
    setPage(1);
  };

  const handleIssue = async (id) => {
    try {
      await request.put(`/invoices/${id}/issue`);
      message.success('开票成功');
      fetchInvoices();
    } catch (error) {
      console.error('开票失败:', error);
    }
  };

  const handleVoid = async (id) => {
    Modal.confirm({
      title: '确认作废',
      content: '确定要作废这张发票吗？',
      onOk: async () => {
        try {
          await request.put(`/invoices/${id}/void`, { reason: '作废' });
          message.success('作废成功');
          fetchInvoices();
        } catch (error) {
          console.error('作废失败:', error);
        }
      },
    });
  };

  const getStatusTag = (status) => {
    const statusMap = {
      DRAFT: { color: 'default', text: '草稿' },
      ISSUED: { color: 'green', text: '已开具' },
      VOIDED: { color: 'red', text: '已作废' },
      RED_FLUSHED: { color: 'orange', text: '已红冲' },
    };
    const config = statusMap[status] || { color: 'default', text: status };
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  const columns = [
    {
      title: '发票编号',
      dataIndex: 'invoiceNo',
      key: 'invoiceNo',
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
      title: '发票类型',
      dataIndex: 'invoiceType',
      key: 'invoiceType',
      width: 120,
      render: (type) => {
        const typeMap = {
          SPECIAL_VAT: '增值税专用发票',
          NORMAL_VAT: '增值税普通发票',
          E_INVOICE: '电子发票',
        };
        return typeMap[type] || type;
      },
    },
    {
      title: '开票金额',
      dataIndex: 'invoiceAmount',
      key: 'invoiceAmount',
      width: 120,
      render: (val) => `¥${Number(val).toLocaleString()}`,
    },
    {
      title: '税额',
      dataIndex: 'taxAmount',
      key: 'taxAmount',
      width: 100,
      render: (val) => `¥${Number(val).toLocaleString()}`,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: getStatusTag,
    },
    {
      title: '开票日期',
      dataIndex: 'issueDate',
      key: 'issueDate',
      width: 120,
      render: (val) => val ? dayjs(val).format('YYYY-MM-DD') : '-',
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          {record.status === 'DRAFT' && canCreate && (
            <Button type="link" size="small" onClick={() => handleIssue(record.id)}>
              开票
            </Button>
          )}
          {record.status === 'ISSUED' && ['FINANCE_MANAGER', 'ADMIN'].includes(user?.role) && (
            <Button type="link" size="small" danger onClick={() => handleVoid(record.id)}>
              作废
            </Button>
          )}
          <Button type="link" size="small">
            详情
          </Button>
        </Space>
      ),
    },
  ].filter(col => !col.hidden);

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>{isCustomer ? '我的发票' : '发票管理'}</h2>
        <Space>
          {canCreate && (
            <Button type="primary" icon={<PlusOutlined />}>
              新建发票
            </Button>
          )}
          <Button icon={<DownloadOutlined />}>
            导出
          </Button>
          <Button icon={<ReloadOutlined />} onClick={fetchInvoices}>
            刷新
          </Button>
        </Space>
      </div>

      <div className="filter-section">
        <Form layout="inline" onFinish={handleSearch}>
          <Form.Item name="status" label="状态">
            <Select placeholder="全部状态" style={{ width: 150 }} allowClear>
              <Option value="DRAFT">草稿</Option>
              <Option value="ISSUED">已开具</Option>
              <Option value="VOIDED">已作废</Option>
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
          dataSource={invoices}
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

export default InvoiceList;
