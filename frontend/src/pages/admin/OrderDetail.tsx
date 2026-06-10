import { useEffect } from 'react';
import { Card, Descriptions, Tag, Button, Space, Row, Col, Statistic, Progress } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { useOrderStore } from '@/store/orderStore';
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  ORDER_STATUS_LABELS,
  ORDER_STATUS_COLORS,
  CONVERSION_STAGE_LABELS,
} from '@/utils';

export default function OrderDetail() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { currentOrder, fetchOrder, isLoading } = useOrderStore();

  useEffect(() => {
    if (id) {
      fetchOrder(id);
    }
  }, [id, fetchOrder]);

  if (!currentOrder) {
    return <Card loading={isLoading} />;
  }

  const paidAmount = currentOrder.payments.reduce((sum, p) => sum + p.amount, 0);
  const unpaidAmount = currentOrder.total_amount - paidAmount;
  const paymentProgress = currentOrder.total_amount > 0 ? (paidAmount / currentOrder.total_amount) * 100 : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/admin/orders')}>
          返回订单列表
        </Button>
        <h1 className="text-2xl font-bold text-gray-800 m-0">
          订单详情 - {currentOrder.order_no}
        </h1>
        <Tag className={`${ORDER_STATUS_COLORS[currentOrder.status]} px-3 py-1`}>
          {ORDER_STATUS_LABELS[currentOrder.status]}
        </Tag>
        <Tag color="blue">{CONVERSION_STAGE_LABELS[currentOrder.conversion_stage]}</Tag>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="订单总额"
              value={currentOrder.total_amount}
              precision={2}
              prefix="¥"
              valueStyle={{ color: '#16a34a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="已收金额"
              value={paidAmount}
              precision={2}
              prefix="¥"
              valueStyle={{ color: '#16a34a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="待收金额"
              value={unpaidAmount}
              precision={2}
              prefix="¥"
              valueStyle={{ color: '#f59e0b' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="收款进度"
              value={paymentProgress}
              precision={1}
              suffix="%"
              valueStyle={{ color: '#16a34a' }}
            />
          </Card>
        </Col>
      </Row>

      <Card title="基本信息">
        <Progress percent={paymentProgress} status={paymentProgress === 100 ? 'success' : 'active'} />
        <Descriptions bordered column={2} className="mt-4">
          <Descriptions.Item label="订单号" span={2}>
            {currentOrder.order_no}
          </Descriptions.Item>
          <Descriptions.Item label="创建时间">{formatDateTime(currentOrder.created_at)}</Descriptions.Item>
          <Descriptions.Item label="更新时间">{formatDateTime(currentOrder.updated_at)}</Descriptions.Item>
          <Descriptions.Item label="订单状态">
            <Tag className={ORDER_STATUS_COLORS[currentOrder.status]}>
              {ORDER_STATUS_LABELS[currentOrder.status]}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="转化阶段">
            <Tag color="blue">{CONVERSION_STAGE_LABELS[currentOrder.conversion_stage]}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="入住人">{currentOrder.guest_name}</Descriptions.Item>
          <Descriptions.Item label="联系电话">{currentOrder.guest_phone}</Descriptions.Item>
          {currentOrder.guest_email && (
            <Descriptions.Item label="邮箱" span={2}>
              {currentOrder.guest_email}
            </Descriptions.Item>
          )}
          <Descriptions.Item label="入住日期" span={2}>
            <Space>
              {formatDate(currentOrder.check_in_date)} - {formatDate(currentOrder.check_out_date)}
              <Tag color="blue">{currentOrder.nights} 晚</Tag>
              <Tag color="green">成人 {currentOrder.adults} 人，儿童 {currentOrder.children} 人</Tag>
            </Space>
          </Descriptions.Item>
          <Descriptions.Item label="房型" span={2}>
            {currentOrder.room_name}
          </Descriptions.Item>
          {currentOrder.source && (
            <Descriptions.Item label="订单来源" span={2}>
              {currentOrder.source}
            </Descriptions.Item>
          )}
          {currentOrder.guest_remarks && (
            <Descriptions.Item label="特殊要求" span={2}>
              {currentOrder.guest_remarks}
            </Descriptions.Item>
          )}
        </Descriptions>
      </Card>

      <Card title="费用明细">
        <Descriptions bordered column={1}>
          <Descriptions.Item label="房费">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-500">
                  {currentOrder.room_name} × {currentOrder.nights} 晚
                </span>
                <span>{formatCurrency(currentOrder.total_amount)}</span>
              </div>
              <div className="flex justify-between pt-2 border-t font-bold text-lg">
                <span>总计</span>
                <span className="text-primary-600">{formatCurrency(currentOrder.total_amount)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">已收款</span>
                <span className="text-green-600">{formatCurrency(paidAmount)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">待收款</span>
                <span className="text-orange-600">{formatCurrency(unpaidAmount)}</span>
              </div>
            </div>
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <Card title="支付记录">
        {currentOrder.payments.length === 0 ? (
          <p className="text-gray-500 text-center py-8">暂无支付记录</p>
        ) : (
          <Space direction="vertical" className="w-full">
            {currentOrder.payments.map((payment) => (
              <Card key={payment.id} size="small" className="mb-2">
                <div className="flex justify-between items-center">
                  <div>
                    <span className="font-bold text-lg">{formatCurrency(payment.amount)}</span>
                    <span className="text-gray-500 ml-2">{payment.method_display || payment.method}</span>
                  </div>
                </div>
                {payment.transaction_no && (
                  <div className="text-sm text-gray-500 mt-1">交易号: {payment.transaction_no}</div>
                )}
                {payment.paid_at && (
                  <div className="text-sm text-gray-500">支付时间: {formatDateTime(payment.paid_at)}</div>
                )}
              </Card>
            ))}
          </Space>
        )}
      </Card>

      <Card title="订单动态">
        {currentOrder.timeline.length === 0 ? (
          <p className="text-gray-500 text-center py-8">暂无动态</p>
        ) : (
          <Space direction="vertical" className="w-full">
            {currentOrder.timeline.map((item) => (
              <div key={item.id} className="flex gap-4">
                <div className="flex-shrink-0 w-3 h-3 rounded-full bg-primary-500 mt-2"></div>
                <div className="flex-1 pb-4 border-b border-gray-100">
                  <div className="flex justify-between">
                    <span className="font-medium">{item.action}</span>
                    <span className="text-sm text-gray-400">{formatDateTime(item.created_at)}</span>
                  </div>
                  <p className="text-gray-600 text-sm mt-1">{item.description}</p>
                </div>
              </div>
            ))}
          </Space>
        )}
      </Card>

      <div className="flex justify-end gap-3">
        <Button onClick={() => navigate('/admin/orders')}>返回列表</Button>
        <Button type="primary">编辑订单</Button>
      </div>
    </div>
  );
}
