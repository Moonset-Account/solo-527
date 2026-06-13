import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Tag, Input, Select, Form, Card, Modal, message, Drawer, Descriptions, Row, Col } from 'antd';
import { SearchOutlined, ReloadOutlined, PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons';
import request from '../../utils/request.js';
import dayjs from 'dayjs';

const { Option } = Select;

const CustomerList = () => {
  const [customers, setCustomers] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [filters, setFilters] = useState({});
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [detailDrawer, setDetailDrawer] = useState(false);
  const [detailData, setDetailData] = useState(null);
  const [createForm] = Form.useForm();
  const [editForm] = Form.useForm();

  useEffect(() => {
    fetchCustomers();
  }, [page, pageSize, filters]);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const res = await request.get('/customers', {
        params: { page, pageSize, ...filters },
      });
      setCustomers(res.list || []);
      setTotal(res.total || 0);
    } catch (error) {
      console.error('获取客户列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (values) => {
    setFilters(values);
    setPage(1);
  };

  const handleViewDetail = async (id) => {
    try {
      const res = await request.get(`/customers/${id}`);
      setDetailData(res.customer);
      setDetailDrawer(true);
    } catch (error) {
      console.error('获取客户详情失败:', error);
    }
  };

  const handleCreate = async (values) => {
    try {
      await request.post('/customers', values);
      message.success('创建客户成功');
      setShowCreateModal(false);
      createForm.resetFields();
      fetchCustomers();
    } catch (error) {
      console.error('创建客户失败:', error);
    }
  };

  const handleEdit = (record) => {
    setDetailData(record);
    editForm.setFieldsValue(record);
    setShowEditModal(true);
  };

  const handleEditSubmit = async (values) => {
    try {
      await request.put(`/customers/${detailData.id}`, values);
      message.success('更新客户成功');
      setShowEditModal(false);
      editForm.resetFields();
      fetchCustomers();
    } catch (error) {
      console.error('更新客户失败:', error);
    }
  };

  const handleDelete = (id) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这个客户吗？',
      okText: '确认',
      cancelText: '取消',
      onOk: async () => {
        try {
          await request.delete(`/customers/${id}`);
          message.success('删除成功');
          fetchCustomers();
        } catch (error) {
          console.error('删除失败:', error);
        }
      },
    });
  };

  const columns = [
    {
      title: '客户编号',
      dataIndex: 'customerNo',
      key: 'customerNo',
      width: 120,
    },
    {
      title: '客户名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '联系人',
      dataIndex: 'contactName',
      key: 'contactName',
      width: 100,
      render: (val) => val || '-',
    },
    {
      title: '联系电话',
      dataIndex: 'phone',
      key: 'phone',
      width: 130,
      render: (val) => val || '-',
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      key: 'email',
      render: (val) => val || '-',
    },
    {
      title: '地址',
      dataIndex: 'address',
      key: 'address',
      ellipsis: true,
      render: (val) => val || '-',
    },
    {
      title: '信用额度',
      dataIndex: 'creditLimit',
      key: 'creditLimit',
      width: 120,
      render: (val) => val ? `¥${Number(val).toLocaleString()}` : '-',
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
      render: (val) => dayjs(val).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleViewDetail(record.id)}>
            详情
          </Button>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            编辑
          </Button>
          <Button type="link" size="small" danger icon={<DeleteOutlined />} onClick={() => handleDelete(record.id)}>
            删除
          </Button>
        </Space>
      ),
    },
  ];

  const CustomerForm = ({ form, onFinish, onCancel }) => (
    <Form form={form} layout="vertical" onFinish={onFinish}>
      <Form.Item name="customerNo" label="客户编号" rules={[{ required: true, message: '请输入客户编号' }]}>
        <Input placeholder="请输入客户编号" />
      </Form.Item>
      <Form.Item name="name" label="客户名称" rules={[{ required: true, message: '请输入客户名称' }]}>
        <Input placeholder="请输入客户名称" />
      </Form.Item>
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item name="contactName" label="联系人">
            <Input placeholder="请输入联系人" />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item name="phone" label="联系电话">
            <Input placeholder="请输入联系电话" />
          </Form.Item>
        </Col>
      </Row>
      <Form.Item name="email" label="邮箱">
        <Input placeholder="请输入邮箱" />
      </Form.Item>
      <Form.Item name="address" label="地址">
        <Input.TextArea rows={2} placeholder="请输入地址" />
      </Form.Item>
      <Form.Item name="creditLimit" label="信用额度">
        <Input type="number" prefix="¥" placeholder="请输入信用额度" />
      </Form.Item>
      <Form.Item style={{ textAlign: 'right', marginBottom: 0 }}>
        <Space>
          <Button onClick={onCancel}>取消</Button>
          <Button type="primary" htmlType="submit">保存</Button>
        </Space>
      </Form.Item>
    </Form>
  );

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>客户管理</h2>
        <Space>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setShowCreateModal(true)}>
            新建客户
          </Button>
          <Button icon={<ReloadOutlined />} onClick={fetchCustomers}>
            刷新
          </Button>
        </Space>
      </div>

      <div className="filter-section">
        <Form layout="inline" onFinish={handleSearch}>
          <Form.Item name="keyword" label="关键词">
            <Input placeholder="客户编号/名称/联系人" style={{ width: 250 }} allowClear />
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
          dataSource={customers}
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
        title="新建客户"
        open={showCreateModal}
        onCancel={() => setShowCreateModal(false)}
        footer={null}
        width={600}
      >
        <CustomerForm
          form={createForm}
          onFinish={handleCreate}
          onCancel={() => setShowCreateModal(false)}
        />
      </Modal>

      <Modal
        title="编辑客户"
        open={showEditModal}
        onCancel={() => setShowEditModal(false)}
        footer={null}
        width={600}
      >
        <CustomerForm
          form={editForm}
          onFinish={handleEditSubmit}
          onCancel={() => setShowEditModal(false)}
        />
      </Modal>

      <Drawer
        title="客户详情"
        placement="right"
        width={480}
        open={detailDrawer}
        onClose={() => setDetailDrawer(false)}
      >
        {detailData && (
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label="客户编号">{detailData.customerNo}</Descriptions.Item>
            <Descriptions.Item label="客户名称">{detailData.name}</Descriptions.Item>
            <Descriptions.Item label="联系人">{detailData.contactName || '-'}</Descriptions.Item>
            <Descriptions.Item label="联系电话">{detailData.phone || '-'}</Descriptions.Item>
            <Descriptions.Item label="邮箱">{detailData.email || '-'}</Descriptions.Item>
            <Descriptions.Item label="地址">{detailData.address || '-'}</Descriptions.Item>
            <Descriptions.Item label="信用额度">
              {detailData.creditLimit ? `¥${Number(detailData.creditLimit).toLocaleString()}` : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="创建时间">
              {dayjs(detailData.createdAt).format('YYYY-MM-DD HH:mm')}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Drawer>
    </div>
  );
};

export default CustomerList;
