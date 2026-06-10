import { Card, Button, Result, Descriptions, Tag, Space } from 'antd';
import { HomeOutlined, CalendarOutlined, PrinterOutlined } from '@ant-design/icons';
import { useLocation, useNavigate } from 'react-router-dom';
import { formatCurrency, formatDate, ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from '@/utils';
import type { Order } from '@/types';

export default function BookingConfirm() {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as { order: Order; total_price: number } | null;

  if (!state?.order) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
        <Card className="w-full max-w-lg text-center">
          <Result
            status="warning"
            title="未找到预订信息"
            extra={
              <Button type="primary" onClick={() => navigate('/booking')}>
                重新预订
              </Button>
            }
          />
        </Card>
      </div>
    );
  }

  const { order, total_price } = state;

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <Result
          status="success"
          title="预订成功！"
          subTitle={`订单号：${order.order_number}，我们会尽快与您联系确认订单详情`}
          extra={[
            <Button type="primary" key="home" onClick={() => navigate('/')}>
              <HomeOutlined />
              返回首页
            </Button>,
            <Button key="booking" onClick={() => navigate('/booking')}>
              继续预订
            </Button>,
            <Button key="print" icon={<PrinterOutlined />}>
              打印订单
            </Button>,
          ]}
        />

        <Card className="mt-8 shadow-lg">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-800">订单详情</h2>
            <Tag className={`${ORDER_STATUS_COLORS[order.status]} px-3 py-1 text-sm`}>
              {ORDER_STATUS_LABELS[order.status]}
            </Tag>
          </div>

          <Descriptions bordered column={1} size="middle">
            <Descriptions.Item label="订单编号">{order.order_number}</Descriptions.Item>
            <Descriptions.Item label="预订时间">{formatDate(order.created_at, 'YYYY-MM-DD HH:mm:ss')}</Descriptions.Item>
            <Descriptions.Item label="入住人">{order.guest_name}</Descriptions.Item>
            <Descriptions.Item label="联系电话">{order.guest_phone}</Descriptions.Item>
            {order.guest_email && (
              <Descriptions.Item label="电子邮箱">{order.guest_email}</Descriptions.Item>
            )}
            <Descriptions.Item label="入住日期">
              <Space>
                <CalendarOutlined />
                {formatDate(order.check_in_date)} - {formatDate(order.check_out_date)}
                <Tag color="blue">{order.total_nights} 晚</Tag>
              </Space>
            </Descriptions.Item>
            <Descriptions.Item label="入住人数">{order.guest_count} 人</Descriptions.Item>
            <Descriptions.Item label="房型">{order.room_name}</Descriptions.Item>
            {order.special_requests && (
              <Descriptions.Item label="特殊要求">{order.special_requests}</Descriptions.Item>
            )}
            <Descriptions.Item label="订单金额">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-500">房费</span>
                  <span>{formatCurrency(total_price)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">需支付定金（30%）</span>
                  <span>{formatCurrency(order.deposit_amount)}</span>
                </div>
                <div className="flex justify-between pt-2 border-t text-lg font-bold">
                  <span>应付总计</span>
                  <span className="text-primary-600">{formatCurrency(order.deposit_amount)}</span>
                </div>
              </div>
            </Descriptions.Item>
          </Descriptions>

          <div className="mt-8 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-semibold text-blue-800 mb-2">温馨提示</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• 请在30分钟内完成支付，逾期订单将自动取消</li>
              <li>• 入住时间：14:00 以后，退房时间：12:00 以前</li>
              <li>• 如需取消或修改订单，请提前联系客服</li>
              <li>• 入住时请携带有效身份证件</li>
            </ul>
          </div>

          <div className="mt-6 flex justify-center gap-4">
            <Button type="primary" size="large" className="h-12 px-8">
              立即支付定金
            </Button>
            <Button size="large" className="h-12 px-8">
              稍后支付
            </Button>
          </div>
        </Card>

        <div className="mt-8 text-center text-gray-500 text-sm">
          <p>如有任何疑问，请联系客服热线：400-888-8888</p>
          <p>感谢您选择青禾民宿，祝您旅途愉快！</p>
        </div>
      </div>
    </div>
  );
}
