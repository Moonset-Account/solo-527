import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Tag, Input, Select, Form, Card, Modal, message, Drawer, Descriptions } from 'antd';
import { SearchOutlined, ReloadOutlined, PlusOutlined, CheckOutlined, CloseOutlined, EyeOutlined } from '@ant-design/icons';
import request from '../../utils/request.js';
import dayjs from 'dayjs';

const { Option } = Select;
const { TextArea } = Input;

const WriteOffList = () => {
  const [writeOffs, setWriteOffs] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [filters, setFilters] = useState({});
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [detailDrawer, setDetailDrawer] = useState(false);
  const [detailData, setDetailData] = useState(null);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [approveType, setApproveType] = useState('approve');
  const [createForm] = Form.useForm();
  const [approveForm] = Form.useForm();
  const [customerOptions, setCustomerOptions] = useState([]);
  const [billOptions, setBillOptions] = useState([]);

  useEffect(() => {
    fetchWriteOffs();
    fetchCustomerOptions();
  }, [page, pageSize, filters]);

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
        params: { customerId, status: 'UNPAID,PARTIAL_PAID,OVERDUE' },
      });
      setBillOptions(res.list || []);
    } catch (error) {
      console.error('获取账单列表失败:', error);
    }
  };

  const fetchWriteOffs = async () => {
    setLoading(true);
    try {
      const res = await request.get('/writeoffs', {
        params: { page, pageSize, ...filters },
      });
      setWriteOffs(res.list || []);
      setTotal(res.total || 0);
    } catch (error) {
      console.error('获取冲销列表失败:', error);
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
      const res = await request.get(`/writeoffs/${id}`);
      setDetailData(res.writeOff);
      setDetailDrawer(true);
    } catch (error) {
      console.error('获取详情失败:', error);
    }
  };

  const handleCreate = async (values) => {
    try {
      const payload = {
        ...values,
        customerId: parseInt(values.customerId),
        billId: parseInt(values.billId),
        writeOffAmount: parseFloat(values.writeOffAmount),
      };
      await request.post('/writeoffs', payload);
      message.success('提交冲销申请成功，已写入时间轴');
      setShowCreateModal(false);
      createForm.resetFields();
      setBillOptions([]);
      fetchWriteOffs();
    } catch (error) {
      console.error('创建冲销失败:', error);
      message.error('创建冲销申请失败');
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
        ? `/writeoffs/${detailData.id}/approve`
        : `/writeoffs/${detailData.id}/reject`;
      await request.put(url, values);
      message.success(approveType === 'approve' ? '审批通过，已写入时间轴' : '已拒绝，已写入时间轴');
      setShowApproveModal(false);
      fetchWriteOffs();
    } catch (error) {
      console.error('操作失败:', error);
      message.error('操作失败');
    }
  };

  const handleProcess = async (record) => {
    Modal.confirm({
      title: '确认执行冲销',
      content: `确定要执行冲销吗？冲销金额：¥${Number(record.writeOffAmount).toLocaleString()}`,
      onOk: async () => {
        try {
          await request.put(`/writeoffs/${record.id}/process`);
          message.success('冲销执行成功，账单余额已更新，已写入时间轴');
          fetchWriteOffs();
        } catch (error) {
          console.error('执行冲销失败:', error);
          message.error('执行冲销失败');
        }
      },
    });
  };

  const getStatusTag = (status) => {
    const statusMap = {
      PENDING: { color: 'orange', text: '待审批' },
      APPROVED: { color: 'blue', text: '已通过' },
      REJECTED: { color: 'red', text: '已拒绝' },
      PROCESSED: { color: 'green', text: '已执行' },
    };
    const config = statusMap[status] || { color: 'default', text: status };
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  const columns = [
    {
      title: '冲销单号',
      dataIndex: 'writeOffNo',
      key: 'writeOffNo',
      width: 180,
    },
    {
      title: '客户名称',
      dataIndex: ['customer', 'name'],
      key: 'customerName',
    },
    {
      title: '关联账单',
      dataIndex: ['bill', 'billNo'],
      key: 'billNo',
    },
    {
      title: '冲销金额',
      dataIndex: 'writeOffAmount',
      key: 'writeOffAmount',
      width: 120,
      render: (val) => <span style={{ color: '#ff4d4f', fontWeight: 500 }}>¥{Number(val).toLocaleString()}</span>,
    },
    {
      title: '冲销原因',
      dataIndex: 'reason',
      key: 'reason',
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
      width: 200,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleViewDetail(record.id)}>
            详情
          </Button>
          {record.status === 'PENDING' && (
            <>
              <Button type="link" size="small" icon={<CheckOutlined />} onClick={() => handleApprove(record, 'approve')}>
                审批
              </Button>
              <Button type="link" size="small" danger icon={<CloseOutlined />} onClick={() => handleApprove(record, 'reject')}>
                拒绝
              </Button>
            </>
          )}
          {record.status === 'APPROVED' && (
            <Button type="link" size="small" onClick={() => handleProcess(record)}>
              执行冲销
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>冲销审批</h2>
        <Space>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setShowCreateModal(true)}>
            申请冲销
          </Button>
          <Button icon={<ReloadOutlined />} onClick={fetchWriteOffs}>
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
              <Option value="PROCESSED">已执行</Option>
            </Select>
          </Form.Item>
          <Form.Item name="keyword" label="关键词">
            <Input placeholder="冲销单号/客户名称" style={{ width: 200 }} allowClear />
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
          dataSource={writeOffs}
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
        title="申请冲销"
        open={showCreateModal}
        onCancel={() => setShowCreateModal(false)}
        footer={null}
        width={500}
      >
        <Form form={createForm} layout="vertical" onFinish={handleCreate}>
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
          <Form.Item name="billId" label="关联账单" rules={[{ required: true, message: '请选择账单' }]}>
            <Select
              placeholder="请选择账单"
              showSearch
              optionFilterProp="children"
              onChange={(value) => {
                const selected = billOptions.find(b => b.id === value);
                if (selected) {
                  createForm.setFieldsValue({
                    writeOffAmount: selected.balanceAmount,
                  });
                }
              }}
            >
              {billOptions.map(b => (
                <Option key={b.id} value={b.id}>
                  {b.billNo} ({b.billPeriod}) - 待收 ¥{Number(b.balanceAmount).toLocaleString()}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="writeOffAmount" label="冲销金额" rules={[{ required: true, message: '请输入冲销金额' }]}>
            <Input type="number" prefix="¥" step="0.01" min="0" />
          </Form.Item>
          <Form.Item name="reason" label="冲销原因" rules={[{ required: true, message: '请输入冲销原因' }]}>
            <TextArea rows={4} placeholder="请详细说明冲销原因..." />
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
          <Form.Item
            name="approveRemark"
            label={approveType === 'approve' ? '审批意见' : '拒绝原因'}
            rules={approveType === 'reject' ? [{ required: true, message: '请输入拒绝原因' }] : []}
          >
            <TextArea rows={4} placeholder={approveType === 'approve' ? '请输入审批意见（可选）' : '请输入拒绝原因'} />
          </Form.Item>
          <Form.Item style={{ textAlign: 'right', marginBottom: 0 }}>
            <Space>
              <Button onClick={() => setShowApproveModal(false)}>取消</Button>
              <Button
                type={approveType === 'approve' ? 'primary' : 'default'}
                danger={approveType === 'reject'}
                htmlType="submit"
              >
                {approveType === 'approve' ? '确认通过' : '确认拒绝'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Drawer
        title="冲销详情"
        placement="right"
        width={480}
        open={detailDrawer}
        onClose={() => setDetailDrawer(false)}
      >
        {detailData && (
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label="冲销单号">{detailData.writeOffNo}</Descriptions.Item>
            <Descriptions.Item label="状态">{getStatusTag(detailData.status)}</Descriptions.Item>
            <Descriptions.Item label="客户名称">{detailData.customer?.name}</Descriptions.Item>
            <Descriptions.Item label="关联账单">{detailData.bill?.billNo || '-'}</Descriptions.Item>
            <Descriptions.Item label="冲销金额">
              <span style={{ color: '#ff4d4f', fontWeight: 600 }}>
                ¥{Number(detailData.writeOffAmount).toLocaleString()}
              </span>
            </Descriptions.Item>
            <Descriptions.Item label="冲销原因">{detailData.reason}</Descriptions.Item>
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

export default WriteOffList;
