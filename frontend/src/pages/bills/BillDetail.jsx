import React, { useState, useEffect } from 'react';
import { Card, Descriptions, Table, Tag, Button, Space, Timeline, Row, Col, Statistic, Divider, Modal, Form, Input, Select, message } from 'antd';
import { ArrowLeftOutlined, PlusOutlined, ClockCircleOutlined, DollarOutlined } from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import request from '../../utils/request.js';
import useAuthStore from '../../store/authStore.js';
import dayjs from 'dayjs';

const { Option } = Select;

const BillDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [bill, setBill] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showCollectionModal, setShowCollectionModal] = useState(false);
  const [paymentForm] = Form.useForm();
  const [collectionForm] = Form.useForm();
  const { user } = useAuthStore();

  const isCustomer = user?.role === 'CUSTOMER';
  const canEdit = ['FINANCE_STAFF', 'FINANCE_MANAGER', 'ADMIN'].includes(user?.role);

  useEffect(() => {
    fetchBillDetail();
    fetchTimeline();
  }, [id]);

  const fetchBillDetail = async () => {
    setLoading(true);
    try {
      const res = await request.get(`/bills/${id}`);
      setBill(res.bill);
    } catch (error) {
      console.error('获取账单详情失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTimeline = async () => {
    try {
      const res = await request.get(`/bills/${id}/timeline`);
      setTimeline(res.timeline || []);
    } catch (error) {
      console.error('获取时间轴失败:', error);
    }
  };

  const handlePayment = async (values) => {
    try {
      await request.post('/payments', {
        ...values,
        billId: id,
        customerId: bill.customerId,
        paymentDate: values.paymentDate?.format('YYYY-MM-DD'),
      });
      message.success('登记付款成功');
      setShowPaymentModal(false);
      paymentForm.resetFields();
      fetchBillDetail();
      fetchTimeline();
    } catch (error) {
      console.error('登记付款失败:', error);
    }
  };

  const handleCreateCollection = async (values) => {
    try {
      await request.post('/collections', {
        ...values,
        billId: id,
        customerId: bill.customerId,
        dueDate: values.dueDate?.format('YYYY-MM-DD'),
        amount: bill.balanceAmount,
      });
      message.success('创建催收单成功');
      setShowCollectionModal(false);
      collectionForm.resetFields();
      fetchTimeline();
    } catch (error) {
      console.error('创建催收单失败:', error);
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

  const getTimelineIcon = (eventType) => {
    const iconMap = {
      BILL_CREATED: '📝',
      BILL_STATUS_CHANGED: '🔄',
      PAYMENT_RECEIVED: '💰',
      INVOICE_ISSUED: '🧾',
      COLLECTION_CREATED: '📣',
      COLLECTION_RECORD: '📞',
      REFUND_APPLIED: '↩️',
      REFUND_APPROVED: '✅',
      REFUND_REJECTED: '❌',
      REFUND_PROCESSED: '💸',
      WRITEOFF_APPLIED: '📋',
      WRITEOFF_PROCESSED: '✅',
      BILL_OVERDUE: '⚠️',
    };
    return iconMap[eventType] || '📌';
  };

  const billItemColumns = [
    {
      title: '产品名称',
      dataIndex: 'productName',
      key: 'productName',
    },
    {
      title: '数量',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 100,
    },
    {
      title: '单价',
      dataIndex: 'unitPrice',
      key: 'unitPrice',
      width: 120,
      render: (val) => `¥${Number(val).toLocaleString()}`,
    },
    {
      title: '金额',
      dataIndex: 'amount',
      key: 'amount',
      width: 120,
      render: (val) => `¥${Number(val).toLocaleString()}`,
    },
    {
      title: '备注',
      dataIndex: 'remark',
      key: 'remark',
      render: (val) => val || '-',
    },
  ];

  if (!bill) {
    return <div>加载中...</div>;
  }

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>
          返回列表
        </Button>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <Card
            title="账单详情"
            extra={getStatusTag(bill.status)}
            style={{ marginBottom: 16 }}
          >
            <Descriptions column={2} bordered size="small">
              <Descriptions.Item label="账单编号">{bill.billNo}</Descriptions.Item>
              <Descriptions.Item label="账期">{bill.billPeriod}</Descriptions.Item>
              <Descriptions.Item label="客户名称">{bill.customer?.name}</Descriptions.Item>
              <Descriptions.Item label="客户编号">{bill.customer?.customerNo}</Descriptions.Item>
              <Descriptions.Item label="账单日期">{dayjs(bill.billDate).format('YYYY-MM-DD')}</Descriptions.Item>
              <Descriptions.Item label="到期日期">{dayjs(bill.dueDate).format('YYYY-MM-DD')}</Descriptions.Item>
              <Descriptions.Item label="账单金额">
                <span style={{ fontWeight: 600 }}>¥{Number(bill.totalAmount).toLocaleString()}</span>
              </Descriptions.Item>
              <Descriptions.Item label="已付金额">
                <span style={{ color: '#52c41a' }}>¥{Number(bill.paidAmount).toLocaleString()}</span>
              </Descriptions.Item>
              <Descriptions.Item label="待收金额">
                <span style={{ color: '#ff4d4f', fontWeight: 600 }}>¥{Number(bill.balanceAmount).toLocaleString()}</span>
              </Descriptions.Item>
              <Descriptions.Item label="创建人">{bill.createdBy?.name}</Descriptions.Item>
              <Descriptions.Item label="最近处理人">{bill.lastHandler || '-'}</Descriptions.Item>
              <Descriptions.Item label="最近处理时间">
                {bill.lastHandleTime ? dayjs(bill.lastHandleTime).format('YYYY-MM-DD HH:mm') : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="备注" span={2}>{bill.remark || '-'}</Descriptions.Item>
            </Descriptions>
          </Card>

          <Card title="账单明细" style={{ marginBottom: 16 }}>
            <Table
              dataSource={bill.billItems || []}
              columns={billItemColumns}
              rowKey="id"
              size="small"
              pagination={false}
            />
          </Card>

          {canEdit && (
            <Card 
              title="操作"
              extra={
                <Space>
                  {bill.status !== 'PAID' && bill.status !== 'WRITTEN_OFF' && (
                    <>
                      <Button type="primary" icon={<DollarOutlined />} onClick={() => setShowPaymentModal(true)}>
                        登记收款
                      </Button>
                      <Button onClick={() => setShowCollectionModal(true)}>
                        创建催收
                      </Button>
                    </>
                  )}
                </Space>
              }
            >
              <p style={{ color: '#999' }}>可在此处进行收款登记、催收创建等操作</p>
            </Card>
          )}
        </Col>

        <Col xs={24} lg={8}>
          <Card
            title={
              <Space>
                <ClockCircleOutlined />
                时间轴
              </Space>
            }
            style={{ position: 'sticky', top: 24 }}
          >
            <Timeline
              style={{ maxHeight: 600, overflowY: 'auto', paddingRight: 8 }}
              items={timeline.map((item) => ({
                color: item.eventType.includes('REFUND') ? 'red' 
                  : item.eventType.includes('COLLECTION') ? 'orange'
                  : item.eventType.includes('PAYMENT') ? 'green'
                  : 'blue',
                dot: <span style={{ fontSize: 16 }}>{getTimelineIcon(item.eventType)}</span>,
                children: (
                  <div style={{ paddingBottom: 12 }}>
                    <div style={{ fontWeight: 500, marginBottom: 4 }}>{item.eventName}</div>
                    <div style={{ color: '#666', fontSize: 13, marginBottom: 4 }}>{item.description}</div>
                    <div style={{ color: '#999', fontSize: 12 }}>
                      {dayjs(item.eventTime).format('YYYY-MM-DD HH:mm')} · {item.operatorName || '系统'}
                    </div>
                  </div>
                ),
              }))}
            />
            {timeline.length === 0 && (
              <div style={{ textAlign: 'center', color: '#999', padding: '40px 0' }}>
                暂无时间轴记录
              </div>
            )}
          </Card>
        </Col>
      </Row>

      <Modal
        title="登记收款"
        open={showPaymentModal}
        onCancel={() => setShowPaymentModal(false)}
        footer={null}
      >
        <Form form={paymentForm} layout="vertical" onFinish={handlePayment}>
          <Form.Item name="amount" label="收款金额" rules={[{ required: true, message: '请输入收款金额' }]}>
            <Input type="number" prefix="¥" />
          </Form.Item>
          <Form.Item name="paymentMethod" label="付款方式" rules={[{ required: true, message: '请选择付款方式' }]}>
            <Select placeholder="请选择付款方式">
              <Option value="BANK_TRANSFER">银行转账</Option>
              <Option value="ALIPAY">支付宝</Option>
              <Option value="WECHAT">微信支付</Option>
              <Option value="CASH">现金</Option>
              <Option value="OTHER">其他</Option>
            </Select>
          </Form.Item>
          <Form.Item name="paymentDate" label="付款日期" rules={[{ required: true, message: '请选择付款日期' }]}>
            {/* 这里用普通Input代替，因为没有引入DatePicker */}
            <Input type="date" />
          </Form.Item>
          <Form.Item name="remark" label="备注">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item style={{ textAlign: 'right', marginBottom: 0 }}>
            <Space>
              <Button onClick={() => setShowPaymentModal(false)}>取消</Button>
              <Button type="primary" htmlType="submit">确认</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="创建催收单"
        open={showCollectionModal}
        onCancel={() => setShowCollectionModal(false)}
        footer={null}
      >
        <Form form={collectionForm} layout="vertical" onFinish={handleCreateCollection}>
          <Form.Item name="priority" label="优先级" initialValue="NORMAL">
            <Select>
              <Option value="LOW">低</Option>
              <Option value="NORMAL">普通</Option>
              <Option value="HIGH">高</Option>
              <Option value="URGENT">紧急</Option>
            </Select>
          </Form.Item>
          <Form.Item name="dueDate" label="计划完成日期" rules={[{ required: true, message: '请选择日期' }]}>
            <Input type="date" />
          </Form.Item>
          <Form.Item name="remark" label="备注">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item style={{ textAlign: 'right', marginBottom: 0 }}>
            <Space>
              <Button onClick={() => setShowCollectionModal(false)}>取消</Button>
              <Button type="primary" htmlType="submit">创建</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default BillDetail;
