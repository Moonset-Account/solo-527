import { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Tag,
  Space,
  Button,
  Modal,
  Form,
  Input,
  Select,
  InputNumber,
  message,
  Row,
  Col,
  Statistic,
  DatePicker,
} from 'antd';
import {
  CheckOutlined,
  CloseOutlined,
  ExclamationCircleOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { refundApi } from '../services/api';
import type { RefundRecordDto, RefundStatus } from '../types';

const { RangePicker } = DatePicker;
const { TextArea } = Input;

const statusMap: Record<RefundStatus, { text: string; color: string }> = {
  0: { text: '待处理', color: 'orange' },
  1: { text: '已通过', color: 'blue' },
  2: { text: '已拒绝', color: 'red' },
  3: { text: '已完成', color: 'green' },
};

function RefundPage() {
  const [list, setList] = useState<RefundRecordDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<RefundStatus | undefined>();
  const [processModalVisible, setProcessModalVisible] = useState(false);
  const [completeModalVisible, setCompleteModalVisible] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<RefundRecordDto | null>(null);
  const [processType, setProcessType] = useState<'approve' | 'reject'>('approve');
  const [processForm] = Form.useForm();
  const [completeForm] = Form.useForm();
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    completed: 0,
    amount: 0,
  });

  useEffect(() => {
    loadList();
  }, [status]);

  const loadList = async () => {
    setLoading(true);
    try {
      const res = await refundApi.getList(status);
      if (res.success && res.data) {
        setList(res.data);
        setStats({
          total: res.data.length,
          pending: res.data.filter((r) => r.status === 0).length,
          completed: res.data.filter((r) => r.status === 3).length,
          amount: res.data.filter((r) => r.status === 3).reduce((sum, r) => sum + r.amount, 0),
        });
      }
    } catch (e: any) {
      message.error(e.message || '加载失败');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = (record: RefundRecordDto) => {
    setSelectedRecord(record);
    setProcessType('approve');
    processForm.resetFields();
    setProcessModalVisible(true);
  };

  const handleReject = (record: RefundRecordDto) => {
    setSelectedRecord(record);
    setProcessType('reject');
    processForm.resetFields();
    setProcessModalVisible(true);
  };

  const handleProcessSubmit = async () => {
    if (!selectedRecord) return;
    try {
      const values = await processForm.validateFields();
      const res = await refundApi.process(selectedRecord.id, {
        isApproved: processType === 'approve',
        comment: values.comment,
      });
      if (res.success) {
        message.success(processType === 'approve' ? '已通过退款申请' : '已拒绝退款申请');
        setProcessModalVisible(false);
        loadList();
      }
    } catch (e: any) {
      message.error(e.message || '操作失败');
    }
  };

  const handleComplete = (record: RefundRecordDto) => {
    setSelectedRecord(record);
    completeForm.resetFields();
    setCompleteModalVisible(true);
  };

  const handleCompleteSubmit = async () => {
    if (!selectedRecord) return;
    try {
      const values = await completeForm.validateFields();
      const res = await refundApi.complete(selectedRecord.id, values.transactionId);
      if (res.success) {
        message.success('退款已完成');
        setCompleteModalVisible(false);
        loadList();
      }
    } catch (e: any) {
      message.error(e.message || '操作失败');
    }
  };

  const columns: ColumnsType<RefundRecordDto> = [
    {
      title: '退款单号',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: '预约号',
      dataIndex: 'appointmentNo',
      key: 'appointmentNo',
      width: 160,
    },
    {
      title: '来访者',
      dataIndex: 'clientName',
      key: 'clientName',
      width: 100,
    },
    {
      title: '退款金额',
      dataIndex: 'amount',
      key: 'amount',
      width: 100,
      render: (v) => <span style={{ color: '#fa8c16', fontWeight: 600 }}>¥{v}</span>,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (s: RefundStatus) => (
        <Tag color={statusMap[s].color}>{statusMap[s].text}</Tag>
      ),
    },
    {
      title: '退款原因',
      dataIndex: 'reason',
      key: 'reason',
      ellipsis: true,
    },
    {
      title: '申请时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 170,
      render: (v) => dayjs(v).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          {record.status === 0 && (
            <>
              <Button
                type="link"
                size="small"
                icon={<CheckOutlined />}
                onClick={() => handleApprove(record)}
              >
                通过
              </Button>
              <Button
                type="link"
                size="small"
                danger
                icon={<CloseOutlined />}
                onClick={() => handleReject(record)}
              >
                拒绝
              </Button>
            </>
          )}
          {record.status === 1 && (
            <Button
              type="link"
              size="small"
              icon={<CheckCircleOutlined />}
              onClick={() => handleComplete(record)}
            >
              完成退款
            </Button>
          )}
          <Button type="link" size="small">
            详情
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="page-container">
      <h2 className="page-title">退款管理</h2>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic title="退款申请总数" value={stats.total} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="待处理"
              value={stats.pending}
              valueStyle={{ color: '#fa8c16' }}
              prefix={<ExclamationCircleOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="已完成退款"
              value={stats.completed}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="累计退款金额"
              value={stats.amount}
              precision={2}
              prefix="¥"
              valueStyle={{ color: '#f5222d' }}
            />
          </Card>
        </Col>
      </Row>

      <Card
        title="退款记录"
        extra={
          <Space>
            <Select
              placeholder="全部状态"
              style={{ width: 140 }}
              allowClear
              value={status}
              onChange={setStatus}
              options={[
                { value: 0, label: '待处理' },
                { value: 1, label: '已通过' },
                { value: 2, label: '已拒绝' },
                { value: 3, label: '已完成' },
              ]}
            />
            <RangePicker />
          </Space>
        }
      >
        <Table columns={columns} dataSource={list} rowKey="id" loading={loading} scroll={{ x: 1000 }} />
      </Card>

      <Modal
        title={processType === 'approve' ? '通过退款申请' : '拒绝退款申请'}
        open={processModalVisible}
        onOk={handleProcessSubmit}
        onCancel={() => setProcessModalVisible(false)}
        okText={processType === 'approve' ? '确认通过' : '确认拒绝'}
        okButtonProps={{ danger: processType === 'reject' }}
        cancelText="取消"
      >
        <p style={{ marginBottom: 16 }}>
          退款单号：<strong>{selectedRecord?.id}</strong>
          <br />
          退款金额：<strong style={{ color: '#fa8c16' }}>¥{selectedRecord?.amount}</strong>
          <br />
          退款原因：{selectedRecord?.reason}
        </p>
        <Form form={processForm}>
          <Form.Item
            name="comment"
            label={processType === 'approve' ? '备注' : '拒绝原因'}
            rules={processType === 'reject' ? [{ required: true, message: '请填写拒绝原因' }] : []}
          >
            <TextArea
              rows={3}
              placeholder={processType === 'approve' ? '可选填备注信息' : '请填写拒绝原因'}
            />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="完成退款"
        open={completeModalVisible}
        onOk={handleCompleteSubmit}
        onCancel={() => setCompleteModalVisible(false)}
        okText="确认完成"
        cancelText="取消"
      >
        <p style={{ marginBottom: 16 }}>
          退款金额：<strong style={{ color: '#fa8c16' }}>¥{selectedRecord?.amount}</strong>
        </p>
        <Form form={completeForm}>
          <Form.Item
            name="transactionId"
            label="交易流水号"
            rules={[{ required: true, message: '请填写交易流水号' }]}
          >
            <Input placeholder="请输入退款交易流水号，用于财务对账" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default RefundPage;
