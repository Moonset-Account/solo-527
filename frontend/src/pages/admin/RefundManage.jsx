import { useEffect, useState } from 'react';
import {
  Table,
  Card,
  Tag,
  Button,
  Space,
  Input,
  Select,
  Modal,
  Form,
  message,
  Drawer,
  Descriptions,
} from 'antd';
import { SearchOutlined, CheckOutlined, CloseOutlined, EyeOutlined, DollarOutlined } from '@ant-design/icons';
import { refundsApi } from '../../api';

const { Option } = Select;

const statusMap = {
  pending: { text: '待处理', color: 'orange' },
  approved: { text: '已批准', color: 'blue' },
  rejected: { text: '已拒绝', color: 'red' },
  completed: { text: '已完成', color: 'green' },
};

const reasonMap = {
  client_cancel: '客户取消',
  counselor_cancel: '咨询师取消',
  no_show: '爽约退款',
  service_issue: '服务问题',
  other: '其他',
};

function RefundManage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [filters, setFilters] = useState({});
  const [detailVisible, setDetailVisible] = useState(false);
  const [currentRecord, setCurrentRecord] = useState(null);
  const [rejectVisible, setRejectVisible] = useState(false);
  const [completeVisible, setCompleteVisible] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    loadData();
  }, [pagination.current, pagination.pageSize, filters]);

  const loadData = async () => {
    setLoading(true);
    try {
      const result = await refundsApi.getList({
        page: pagination.current,
        pageSize: pagination.pageSize,
        ...filters,
      });
      setData(result.items);
      setPagination(prev => ({ ...prev, total: result.total }));
    } catch (error) {
      console.error('加载退款记录失败', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (values) => {
    setFilters(prev => ({ ...prev, ...values }));
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  const handleReset = () => {
    setFilters({});
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  const handleViewDetail = async (record) => {
    try {
      const detail = await refundsApi.getDetail(record.id);
      setCurrentRecord(detail);
      setDetailVisible(true);
    } catch (error) {
      message.error('加载详情失败');
    }
  };

  const handleApprove = (record) => {
    Modal.confirm({
      title: '批准退款',
      content: '确定批准该退款申请吗？批准后将进入退款流程。',
      okText: '批准',
      onOk: async () => {
        try {
          await refundsApi.approve(record.id, { approvedBy: 'dispatcher' });
          message.success('已批准退款');
          loadData();
        } catch (error) {
          message.error('操作失败');
        }
      },
    });
  };

  const handleReject = (record) => {
    setCurrentRecord(record);
    form.resetFields();
    setRejectVisible(true);
  };

  const handleRejectSubmit = async () => {
    try {
      const values = await form.validateFields();
      await refundsApi.reject(currentRecord.id, { rejectReason: values.rejectReason });
      message.success('已拒绝退款');
      setRejectVisible(false);
      loadData();
    } catch (error) {
      if (error.errorFields) return;
      message.error('操作失败');
    }
  };

  const handleComplete = (record) => {
    setCurrentRecord(record);
    form.resetFields();
    setCompleteVisible(true);
  };

  const handleCompleteSubmit = async () => {
    try {
      const values = await form.validateFields();
      await refundsApi.complete(currentRecord.id, values.refundMethod, values.transactionId);
      message.success('退款已完成');
      setCompleteVisible(false);
      loadData();
    } catch (error) {
      if (error.errorFields) return;
      message.error('操作失败');
    }
  };

  const columns = [
    {
      title: '客户',
      dataIndex: ['client', 'name'],
      key: 'client',
      width: 100,
    },
    {
      title: '联系电话',
      dataIndex: ['client', 'phone'],
      key: 'phone',
      width: 120,
    },
    {
      title: '关联预约',
      dataIndex: ['appointment', 'appointmentDate'],
      key: 'appointment',
      width: 120,
      render: (date, record) => date || record.appointmentId?.slice(0, 8),
    },
    {
      title: '原金额',
      dataIndex: 'originalAmount',
      key: 'originalAmount',
      width: 100,
      render: (amount) => <span>¥{amount}</span>,
    },
    {
      title: '退款金额',
      dataIndex: 'refundAmount',
      key: 'refundAmount',
      width: 100,
      render: (amount) => <span style={{ color: '#ff4d4f', fontWeight: 600 }}>¥{amount}</span>,
    },
    {
      title: '退款原因',
      dataIndex: 'reason',
      key: 'reason',
      width: 100,
      render: (reason) => reasonMap[reason] || reason,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => {
        const info = statusMap[status] || { text: status, color: 'default' };
        return <Tag color={info.color}>{info.text}</Tag>;
      },
    },
    {
      title: '申请时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
      render: (date) => new Date(date).toLocaleString('zh-CN'),
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      render: (_, record) => (
        <Space size="small">
          <Button size="small" icon={<EyeOutlined />} onClick={() => handleViewDetail(record)}>
            详情
          </Button>
          {record.status === 'pending' && (
            <>
              <Button size="small" type="primary" icon={<CheckOutlined />} onClick={() => handleApprove(record)}>
                批准
              </Button>
              <Button size="small" danger icon={<CloseOutlined />} onClick={() => handleReject(record)}>
                拒绝
              </Button>
            </>
          )}
          {record.status === 'approved' && (
            <Button size="small" type="primary" icon={<DollarOutlined />} onClick={() => handleComplete(record)}>
              完成退款
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Card title="退款处理">
        <div style={{ marginBottom: 16 }}>
          <Space wrap>
            <Input
              placeholder="搜索客户"
              prefix={<SearchOutlined />}
              style={{ width: 200 }}
              allowClear
            />
            <Select
              placeholder="状态"
              allowClear
              style={{ width: 140 }}
              onChange={(value) => handleSearch({ status: value })}
            >
              {Object.entries(statusMap).map(([key, value]) => (
                <Option key={key} value={key}>{value.text}</Option>
              ))}
            </Select>
            <Select
              placeholder="退款原因"
              allowClear
              style={{ width: 140 }}
              onChange={(value) => handleSearch({ reason: value })}
            >
              {Object.entries(reasonMap).map(([key, value]) => (
                <Option key={key} value={key}>{value}</Option>
              ))}
            </Select>
            <Button onClick={handleReset}>重置</Button>
          </Space>
        </div>

        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          loading={loading}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条`,
            onChange: (page, pageSize) => setPagination(prev => ({ ...prev, current: page, pageSize })),
          }}
        />
      </Card>

      <Drawer
        title="退款详情"
        placement="right"
        width={500}
        open={detailVisible}
        onClose={() => setDetailVisible(false)}
      >
        {currentRecord && (
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label="状态">
              <Tag color={statusMap[currentRecord.status]?.color}>
                {statusMap[currentRecord.status]?.text}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="客户姓名">{currentRecord.client?.name}</Descriptions.Item>
            <Descriptions.Item label="联系电话">{currentRecord.client?.phone}</Descriptions.Item>
            <Descriptions.Item label="关联预约">{currentRecord.appointmentId}</Descriptions.Item>
            <Descriptions.Item label="原金额">¥{currentRecord.originalAmount}</Descriptions.Item>
            <Descriptions.Item label="退款金额">
              <span style={{ color: '#ff4d4f', fontWeight: 600 }}>¥{currentRecord.refundAmount}</span>
            </Descriptions.Item>
            <Descriptions.Item label="退款原因">{reasonMap[currentRecord.reason] || currentRecord.reason}</Descriptions.Item>
            <Descriptions.Item label="详细说明">{currentRecord.description || '-'}</Descriptions.Item>
            <Descriptions.Item label="拒绝原因">{currentRecord.rejectReason || '-'}</Descriptions.Item>
            <Descriptions.Item label="处理人">{currentRecord.processedBy || '-'}</Descriptions.Item>
            <Descriptions.Item label="处理时间">
              {currentRecord.processedAt ? new Date(currentRecord.processedAt).toLocaleString('zh-CN') : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="退款方式">{currentRecord.refundMethod || '-'}</Descriptions.Item>
            <Descriptions.Item label="交易单号">{currentRecord.transactionId || '-'}</Descriptions.Item>
            <Descriptions.Item label="申请时间">
              {new Date(currentRecord.createdAt).toLocaleString('zh-CN')}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Drawer>

      <Modal
        title="拒绝退款"
        open={rejectVisible}
        onCancel={() => setRejectVisible(false)}
        onOk={handleRejectSubmit}
        okText="确认拒绝"
        okButtonProps={{ danger: true }}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label="拒绝原因"
            name="rejectReason"
            rules={[{ required: true, message: '请输入拒绝原因' }]}
          >
            <Input.TextArea rows={4} placeholder="请说明拒绝退款的原因" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="完成退款"
        open={completeVisible}
        onCancel={() => setCompleteVisible(false)}
        onOk={handleCompleteSubmit}
        okText="确认完成"
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label="退款方式"
            name="refundMethod"
            rules={[{ required: true, message: '请选择退款方式' }]}
          >
            <Select placeholder="请选择退款方式">
              <Option value="原路返回">原路返回</Option>
              <Option value="支付宝">支付宝</Option>
              <Option value="微信">微信</Option>
              <Option value="银行转账">银行转账</Option>
              <Option value="现金">现金</Option>
            </Select>
          </Form.Item>
          <Form.Item label="交易单号" name="transactionId">
            <Input placeholder="请输入交易单号（选填）" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default RefundManage;
