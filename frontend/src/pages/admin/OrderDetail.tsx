import { useState, useEffect } from 'react';
import {
  Descriptions, Tag, Card, Row, Col, Button, Space, Modal,
  Form, Select, Input, message, Spin, Result, Timeline, Avatar,
} from 'antd';
import {
  ArrowLeftOutlined, ShoppingOutlined, UserOutlined,
  CheckOutlined, EditOutlined,
} from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { orderApi } from '../../services/api';
import {
  orderStatusLabels, orderStatusColors,
  fulfillmentStatusLabels, fulfillmentStatusColors, paymentMethodLabels,
} from '../../utils/enums';
import { useAuthStore } from '../../store/auth';
import { UserRole, OrderStatus, FulfillmentStatus } from '../../types';
import type { Order, Fulfillment } from '../../types';

function OrderDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<Order | null>(null);
  const [fulfillModal, setFulfillModal] = useState(false);
  const [current, setCurrent] = useState<Fulfillment | null>(null);
  const [form] = Form.useForm();

  const canUpdate = user && (
    user.role === UserRole.SuperAdmin ||
    user.role === UserRole.Consultant ||
    user.role === UserRole.ConsultantManager
  );

  useEffect(() => { fetchDetail(); }, [id]);

  const fetchDetail = async () => {
    setLoading(true);
    try {
      const res = await orderApi.detail(id!);
      if (res.success && res.data) setDetail(res.data);
    } finally {
      setLoading(false);
    }
  };

  const handleFulfill = async (values: any) => {
    if (!current) return;
    try {
      const res = await orderApi.updateFulfillment(detail!.id, current.id, values);
      if (res.success) {
        message.success('履约状态已更新');
        setFulfillModal(false);
        form.resetFields();
        fetchDetail();
      }
    } catch { }
  };

  if (loading) return <div style={{ textAlign: 'center', padding: 100 }}><Spin size="large" /></div>;
  if (!detail) return <Result status="404" title="订单不存在" extra={<Button type="primary" onClick={() => navigate('/admin/orders')}>返回列表</Button>} />;

  return (
    <div>
      <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/admin/orders')} style={{ marginBottom: 16 }}>
        返回列表
      </Button>

      <Row gutter={24}>
        <Col xs={24} md={16}>
          <Card title={<Space><ShoppingOutlined /> 订单信息</Space>} style={{ marginBottom: 16 }}>
            <Descriptions column={2} bordered size="small">
              <Descriptions.Item label="订单编号" span={2}>
                {detail.orderNo}
                <Tag color={orderStatusColors[detail.status]} style={{ marginLeft: 12 }}>
                  {orderStatusLabels[detail.status]}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="订单类型">{detail.orderType}</Descriptions.Item>
              <Descriptions.Item label="关联合同">{detail.contractNo || '-'}</Descriptions.Item>
              <Descriptions.Item label="客户姓名">{detail.customerName}</Descriptions.Item>
              <Descriptions.Item label="联系电话">{detail.customerPhone}</Descriptions.Item>
              <Descriptions.Item label="订单金额">¥{detail.totalAmount.toLocaleString()}</Descriptions.Item>
              <Descriptions.Item label="已付金额">¥{detail.paidAmount.toLocaleString()}</Descriptions.Item>
              <Descriptions.Item label="收款方式">{detail.paymentMethod ? paymentMethodLabels[detail.paymentMethod] : '-'}</Descriptions.Item>
              <Descriptions.Item label="支付时间">{detail.paidAt ? dayjs(detail.paidAt).format('YYYY-MM-DD HH:mm') : '-'}</Descriptions.Item>
              <Descriptions.Item label="创建时间">{dayjs(detail.createdAt).format('YYYY-MM-DD HH:mm')}</Descriptions.Item>
              <Descriptions.Item label="备注" span={2}>{detail.remarks || '-'}</Descriptions.Item>
            </Descriptions>
          </Card>

          <Card title={<Space>📦 订单履约 ({detail.fulfillments.length}项)</Space>}>
            {detail.fulfillments.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>暂无履约记录</div>
            ) : (
              <Timeline
                items={detail.fulfillments.map((f: Fulfillment) => ({
                  color: f.status === FulfillmentStatus.Received ? 'green' : f.status === FulfillmentStatus.Exception ? 'red' : 'blue',
                  children: (
                    <Card size="small" style={{ marginBottom: 8 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Space>
                          <Tag color={fulfillmentStatusColors[f.status]}>{fulfillmentStatusLabels[f.status]}</Tag>
                          <strong>{f.itemName}</strong>
                          <span style={{ color: '#888' }}>×{f.quantity}</span>
                          <span style={{ fontWeight: 'bold', color: '#f5222d' }}>¥{f.amount.toLocaleString()}</span>
                        </Space>
                        <Space>
                          {f.handler && <span style={{ color: '#888' }}>处理人：{f.handler}</span>}
                          {canUpdate && (
                            <Button type="link" size="small" icon={<EditOutlined />} onClick={() => { setCurrent(f); setFulfillModal(true); }}>
                              更新状态
                            </Button>
                          )}
                        </Space>
                      </div>
                      {f.remarks && <div style={{ marginTop: 8 }}>📝 {f.remarks}</div>}
                      {f.exceptionReason && <div style={{ marginTop: 4, color: '#f5222d' }}>⚠️ 异常：{f.exceptionReason}</div>}
                      {f.deliveredAt && <div style={{ marginTop: 4, color: '#888', fontSize: 12 }}>交付时间：{dayjs(f.deliveredAt).format('YYYY-MM-DD HH:mm')}</div>}
                      {f.receivedAt && <div style={{ marginTop: 4, color: '#888', fontSize: 12 }}>确认时间：{dayjs(f.receivedAt).format('YYYY-MM-DD HH:mm')}</div>}
                    </Card>
                  ),
                }))}
              />
            )}
          </Card>
        </Col>
      </Row>

      <Modal title="更新履约状态" open={fulfillModal} onCancel={() => { setFulfillModal(false); form.resetFields(); }} footer={null}>
        {current && (
          <div style={{ marginBottom: 16, padding: 12, background: '#f0f5ff', borderRadius: 4 }}>
            <strong>{current.itemName}</strong> · 当前状态：
            <Tag color={fulfillmentStatusColors[current.status]}>{fulfillmentStatusLabels[current.status]}</Tag>
          </div>
        )}
        <Form form={form} layout="vertical" onFinish={handleFulfill}>
          <Form.Item name="status" label="履约状态" rules={[{ required: true }]}>
            <Select options={Object.entries(fulfillmentStatusLabels).map(([k, v]) => ({ value: Number(k), label: v }))} />
          </Form.Item>
          <Form.Item name="handler" label="处理人"><Input /></Form.Item>
          <Form.Item name="remarks" label="处理说明"><Input.TextArea rows={2} /></Form.Item>
          <Form.Item name="exceptionReason" label="异常原因（如有）"><Input.TextArea rows={2} /></Form.Item>
          <Form.Item style={{ textAlign: 'right', marginBottom: 0 }}>
            <Space>
              <Button onClick={() => setFulfillModal(false)}>取消</Button>
              <Button type="primary" htmlType="submit">确认</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default OrderDetail;
