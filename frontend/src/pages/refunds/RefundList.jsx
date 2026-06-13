import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Tag, Input, Select, Form, Card, Modal, message, Descriptions, Drawer } from 'antd';
import { SearchOutlined, ReloadOutlined, PlusOutlined, CheckOutlined, CloseOutlined, EyeOutlined } from '@ant-design/icons';
import request from '../../utils/request.js';
import useAuthStore from '../../store/authStore.js';
import dayjs from 'dayjs';

const { Option } = Select;
const { TextArea } = Input;

const RefundList = () => {
  const [refunds, setRefunds] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [filters, setFilters] = useState({});
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [detailDrawer, setDetailDrawer] = useState(false);
  const [detailData, setDetailData] = useState(null);
  const [createForm] = Form.useForm();
  const [approveForm] = Form.useForm();
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [approveType, setApproveType] = useState('approve');
  const [customerOptions, setCustomerOptions] = useState([]);
  const [billOptions, setBillOptions] = useState([]);
  const { user } = useAuthStore();

  const isCustomer = user?.role === 'CUSTOMER';
  const canApprove = ['FINANCE_MANAGER', 'ADMIN'].includes(user?.role);
  const canCreate = ['FINANCE_STAFF', 'FINANCE_MANAGER', 'ADMIN'].includes(user?.role);

  useEffect(() => {
    fetchRefunds();
  }, [page, pageSize, filters]);

  useEffect(() => {
    if (canCreate && !isCustomer) {
      fetchCustomerOptions();
    }
  }, [canCreate]);

  const fetchCustomerOptions = async () => {
    try {
      const res = await request.get('/customers/options/list');
      setCustomerOptions(res.list || []);
    } catch (error) {
      console.error('获取客户列表失败:', error);
    }
  };

  const fetchBillOptions = async (customerId) => {
    try {
      const res = await request.get('/bills/options/list', {
        params: { customerId, status: ['PAID', 'PARTIAL_PAID'] },
      });
      setBillOptions(res.list || []);
    } catch (error) {
      console.error('获取账单列表失败:', error);
    }
  };

  const fetchRefunds = async () => {
    setLoading(true);
    try {
      const res = await request.get('/refunds', {
        params: { page, pageSize, ...filters },
      });
      setRefunds(res.list || []);
      setTotal(res.total || 0);
    } catch (error) {
      console.error('获取退款列表失败:', error);
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
      const res = await request.get(`/refunds/${id}`);
      setDetailData(res.refund);
      setDetailDrawer(true);
    } catch (error) {
      console.error('获取详情失败:', error);
    }
  };

  const handleCreate = async (values) => {
    try {
      const payload = {
        ...values,
        customerId: isCustomer ? user?.customerId : parseInt(values.customerId),
        billId: values.billId ? parseInt(values.billId) : null,
        refundAmount: parseFloat(values.refundAmount),
      };
      await request.post('/refunds', payload);
      message.success('提交退款申请成功，已写入时间轴');
      setShowCreateModal(false);
      createForm.resetFields();
      setBillOptions([]);
      fetchRefunds();
    } catch (error) {
      console.error('创建退款失败:', error);
      message.error('创建退款申请失败');
    }
  };

  const handleApprove = (record, type) => {
    setDetailData(record);
    setApproveType(type);
    setShowApproveModal(true);
    approveForm.resetFields();
  };

  const handleConfirmApprove = async (values) => {
    try {
      const url = approveType === 'approve'
        ? `/refunds/${detailData.id}/approve`
        : `/refunds/${detailData.id}/reject`;
      await request.put(url, values);
      message.success(approveType === 'approve' ? '审批通过，已写入时间轴' : '已拒绝，已写入时间轴');
      setShowApproveModal(false);
      fetchRefunds();
    } catch (error) {
      console.error('操作失败:', error);
      message.error('操作失败');
    }
  };

  const getStatusTag = (status) => {
    const statusMap = {
      PENDING: { color: 'orange', text: '待审批' },
      APPROVED: { color: 'green', text: '已通过' },
      REJECTED: { color: 'red', text: '已拒绝' },
      PROCESSED: { color: 'blue', text: '已处理' },
      CANCELLED: { color: 'default', text: '已取消' },
    };
    const config = statusMap[status] || { color: 'default', text: status };
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  const columns = [
    {
      title: '退款单号',
      dataIndex: 'refundNo',
      key: 'refundNo',
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
      title: '退款金额',
      dataIndex: 'refundAmount',
      key: 'refundAmount',
      width: 120,
      render: (val) => <span style={{ color: '#ff4d4f', fontWeight: 500 }}>¥{Number(val).toLocaleString()}</span>,
    },
    {
      title: '退款类型',
      dataIndex: 'refundType',
      key: 'refundType',
      width: 100,
      render: (type) => {
        const typeMap = {
          FULL: '全额退款',
          PARTIAL: '部分退款',
          DISCOUNT: '优惠退款',
        };
        return typeMap[type] || type;
      },
    },
    {
      title: '退款原因',
      dataIndex: 'refundReason',
      key: 'refundReason',
      ellipsis: true,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: getStatusTag,
    },
    {
      title: '申请人',
      dataIndex: ['applyBy', 'name'],
      key: 'applyBy',
      width: 100,
    },
    {
      title: '申请时间',
      dataIndex: 'applyTime',
      key: 'applyTime',
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
          {record.status === 'PENDING' && canApprove && (
            <>
              <Button type="link" size="small" icon={<CheckOutlined />} onClick={() => handleApprove(record, 'approve')}>
                通过
              </Button>
              <Button type="link" size="small" danger icon={<CloseOutlined />} onClick={() => handleApprove(record, 'reject')}>
                拒绝
              </Button>
            </>
          )}
        </Space>
      ),
    },
  ].filter(col => !col.hidden);

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>{isCustomer ? '我的退款' : '退款管理'}</h2>
        <Space>
          {canCreate && (
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setShowCreateModal(true)}>
              申请退款
            </Button>
          )}
          <Button icon={<ReloadOutlined />} onClick={fetchRefunds}>
            刷新
          </Button>
        </Space>
      </div>

      <div className="filter-section">
        <Form layout="inline" onFinish={handleSearch}>
          <Form.Item name="status" label="状态">
            <Select placeholder="全部状态" style={{ width: 150 }} allowClear>
              <Option value="PENDING">待审批</Option>
              <Option value="APPROVED">已通过</Option>
              <Option value="REJECTED">已拒绝</Option>
              <Option value="PROCESSED">已处理</Option>
            </Select>
          </Form.Item>
          <Form.Item name="keyword" label="关键词">
            <Input placeholder="退款单号/客户名称" style={{ width: 200 }} allowClear />
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
          dataSource={refunds}
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
        title="申请退款"
        open={showCreateModal}
        onCancel={() => setShowCreateModal(false)}
        footer={null}
        width={500}
      >
        <Form form={createForm} layout="vertical" onFinish={handleCreate}>
          {!isCustomer && (
            <Form.Item name="customerId" label="客户" rules={[{ required: true, message: '请选择客户' }]}>
              <Select
                placeholder="请选择客户"
                showSearch
                optionFilterProp="children"
                onChange={(value) => {
                  createForm.setFieldsValue({ billId: undefined });
                  fetchBillOptions(value);
                }}
              >
                {customerOptions.map(c => (
                  <Option key={c.id} value={c.id}>
                    {c.customerNo} - {c.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          )}
          <Form.Item name="billId" label="关联账单">
            <Select
              placeholder="请选择账单（可选）"
              showSearch
              optionFilterProp="children"
              allowClear
              onChange={(value) => {
                const selected = billOptions.find(b => b.id === value);
                if (selected) {
                  const paid = parseFloat(selected.totalAmount) - parseFloat(selected.balanceAmount);
                  createForm.setFieldsValue({
                    refundAmount: paid > 0 ? paid : selected.totalAmount,
                    refundType: parseFloat(selected.balanceAmount) <= 0 ? 'FULL' : 'PARTIAL',
                  });
                }
              }}
            >
              {billOptions.map(b => (
                <Option key={b.id} value={b.id}>
                  {b.billNo} ({b.billPeriod}) - 总额 ¥{Number(b.totalAmount).toLocaleString()}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="refundAmount" label="退款金额" rules={[{ required: true, message: '请输入退款金额' }]}>
            <Input type="number" prefix="¥" step="0.01" min="0" />
          </Form.Item>
          <Form.Item name="refundType" label="退款类型" rules={[{ required: true, message: '请选择退款类型' }]} initialValue="PARTIAL">
            <Select>
              <Option value="FULL">全额退款</Option>
              <Option value="PARTIAL">部分退款</Option>
              <Option value="DISCOUNT">优惠退款</Option>
            </Select>
          </Form.Item>
          <Form.Item name="refundReason" label="退款原因" rules={[{ required: true, message: '请输入退款原因' }]}>
            <TextArea rows={3} placeholder="请详细说明退款原因..." />
          </Form.Item>
          <Form.Item name="remark" label="备注">
            <TextArea rows={2} />
          </Form.Item>
          <Form.Item style={{ textAlign: 'right', marginBottom: 0 }}>
            <Space>
              <Button onClick={() => setShowCreateModal(false)}>取消</Button>
              <Button type="primary" htmlType="submit">提交申请</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={approveType === 'approve' ? '审批通过' : '审批拒绝'}
        open={showApproveModal}
        onCancel={() => setShowApproveModal(false)}
        footer={null}
        width={450}
      >
        <Form form={approveForm} layout="vertical" onFinish={handleConfirmApprove}>
          <Form.Item name="approveRemark" label={approveType === 'approve' ? '审批意见' : '拒绝原因'} rules={approveType === 'reject' ? [{ required: true, message: '请输入拒绝原因' }] : []}>
            <TextArea rows={4} placeholder={approveType === 'approve' ? '请输入审批意见（可选）' : '请输入拒绝原因'} />
          </Form.Item>
          <Form.Item style={{ textAlign: 'right', marginBottom: 0 }}>
            <Space>
              <Button onClick={() => setShowApproveModal(false)}>取消</Button>
              <Button type={approveType === 'approve' ? 'primary' : 'default'} danger={approveType === 'reject'} htmlType="submit">
                {approveType === 'approve' ? '确认通过' : '确认拒绝'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Drawer
        title="退款详情"
        placement="right"
        width={480}
        open={detailDrawer}
        onClose={() => setDetailDrawer(false)}
      >
        {detailData && (
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label="退款单号">{detailData.refundNo}</Descriptions.Item>
            <Descriptions.Item label="状态">{getStatusTag(detailData.status)}</Descriptions.Item>
            <Descriptions.Item label="客户名称">{detailData.customer?.name}</Descriptions.Item>
            <Descriptions.Item label="关联账单">{detailData.bill?.billNo || '-'}</Descriptions.Item>
            <Descriptions.Item label="退款金额">
              <span style={{ color: '#ff4d4f', fontWeight: 600 }}>
                ¥{Number(detailData.refundAmount).toLocaleString()}
              </span>
            </Descriptions.Item>
            <Descriptions.Item label="退款类型">
              {detailData.refundType === 'FULL' ? '全额退款' : detailData.refundType === 'PARTIAL' ? '部分退款' : detailData.refundType}
            </Descriptions.Item>
            <Descriptions.Item label="退款原因">{detailData.refundReason}</Descriptions.Item>
            <Descriptions.Item label="申请人">{detailData.applyBy?.name}</Descriptions.Item>
            <Descriptions.Item label="申请时间">
              {dayjs(detailData.applyTime).format('YYYY-MM-DD HH:mm')}
            </Descriptions.Item>
            {detailData.approveBy && (
              <>
                <Descriptions.Item label="审批人">{detailData.approveBy?.name}</Descriptions.Item>
                <Descriptions.Item label="审批时间">
                  {detailData.approveTime ? dayjs(detailData.approveTime).format('YYYY-MM-DD HH:mm') : '-'}
                </Descriptions.Item>
                <Descriptions.Item label="审批意见">{detailData.approveRemark || '-'}</Descriptions.Item>
              </>
            )}
            <Descriptions.Item label="备注">{detailData.remark || '-'}</Descriptions.Item>
          </Descriptions>
        )}
      </Drawer>
    </div>
  );
};

export default RefundList;
