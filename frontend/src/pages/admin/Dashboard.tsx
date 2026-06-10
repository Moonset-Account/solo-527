import { useEffect, useState } from 'react';
import { Row, Col, Card, List, Tag, Space, Progress, Button } from 'antd';
import {
  HomeOutlined,
  CalendarOutlined,
  ShoppingOutlined,
  MoneyCollectOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  BellOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { useAppStore } from '@/store/appStore';
import { useOrderStore } from '@/store/orderStore';
import { useReminderStore } from '@/store/reminderStore';
import {
  formatCurrency,
  formatDate,
  ORDER_STATUS_LABELS,
  ORDER_STATUS_COLORS,
  REMINDER_LEVEL_COLORS,
  REMINDER_LEVEL_NAMES,
} from '@/utils';

export default function Dashboard() {
  const navigate = useNavigate();
  const { properties, rooms, fetchProperties, fetchRooms } = useAppStore();
  const { orders, conversionFunnel, fetchOrders, fetchConversionFunnel } = useOrderStore();
  const { reminders, unreadCount, overdueCount, fetchReminders, fetchUnreadCount } = useReminderStore();

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      await Promise.all([
        fetchProperties(),
        fetchRooms(),
        fetchOrders({ page_size: 5 }),
        fetchConversionFunnel(),
        fetchReminders({ status: 'pending', page_size: 5 }),
        fetchUnreadCount(),
      ]);
      setLoading(false);
    };
    loadData();
  }, [fetchProperties, fetchRooms, fetchOrders, fetchConversionFunnel, fetchReminders, fetchUnreadCount]);

  const todayOrders = orders.filter(
    (o) => dayjs(o.created_at).format('YYYY-MM-DD') === dayjs().format('YYYY-MM-DD')
  );

  const todayRevenue = todayOrders.reduce((sum, o) => sum + o.total_amount, 0);

  const stats = [
    {
      title: '民宿数量',
      value: properties.length,
      icon: <HomeOutlined className="text-2xl text-blue-500" />,
      color: 'bg-blue-50',
    },
    {
      title: '房型数量',
      value: rooms.length,
      icon: <CalendarOutlined className="text-2xl text-green-500" />,
      color: 'bg-green-50',
    },
    {
      title: '今日订单',
      value: todayOrders.length,
      icon: <ShoppingOutlined className="text-2xl text-orange-500" />,
      color: 'bg-orange-50',
      trend: '+12%',
      trendUp: true,
    },
    {
      title: '今日营收',
      value: formatCurrency(todayRevenue),
      icon: <MoneyCollectOutlined className="text-2xl text-purple-500" />,
      color: 'bg-purple-50',
      trend: '+8%',
      trendUp: true,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 m-0">运营仪表盘</h1>
          <p className="text-gray-500 mt-1">{formatDate(new Date(), 'YYYY年MM月DD日')}</p>
        </div>
        <Space>
          {unreadCount > 0 && (
            <Button
              type="primary"
              onClick={() => navigate('/admin/reminders')}
            >
              <BellOutlined />
              待处理提醒 ({unreadCount})
              {overdueCount > 0 && <span className="ml-2 text-red-200">逾期 {overdueCount}</span>}
            </Button>
          )}
        </Space>
      </div>

      <Row gutter={[16, 16]}>
        {stats.map((stat, index) => (
          <Col key={index} xs={12} lg={6}>
            <Card className="h-full" loading={loading}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-gray-500 text-sm mb-1">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-800">{stat.value}</p>
                  {stat.trend && (
                    <p className={`text-sm mt-1 ${stat.trendUp ? 'text-green-500' : 'text-red-500'}`}>
                      {stat.trendUp ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
                      {stat.trend}
                      <span className="text-gray-400 ml-1">较昨日</span>
                    </p>
                  )}
                </div>
                <div className={`w-12 h-12 rounded-lg ${stat.color} flex items-center justify-center`}>
                  {stat.icon}
                </div>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <Card
            title="最新订单"
            extra={<Button type="link" onClick={() => navigate('/admin/orders')}>查看全部</Button>}
            loading={loading}
          >
            <List
              dataSource={orders.slice(0, 5)}
              renderItem={(order) => (
                <List.Item
                  key={order.id}
                  className="cursor-pointer hover:bg-gray-50 -mx-4 px-4 py-3"
                  onClick={() => navigate(`/admin/orders/${order.id}`)}
                >
                  <List.Item.Meta
                    title={
                      <div className="flex items-center justify-between w-full">
                        <span className="font-medium">{order.order_no}</span>
                        <Tag className={ORDER_STATUS_COLORS[order.status]}>
                          {ORDER_STATUS_LABELS[order.status]}
                        </Tag>
                      </div>
                    }
                    description={
                      <div className="text-sm text-gray-500">
                        <p>{order.guest_name} · {order.room_name}</p>
                        <p>{formatDate(order.check_in_date)} - {formatDate(order.check_out_date)} · {order.nights}晚</p>
                      </div>
                    }
                  />
                  <div className="text-right">
                    <p className="text-lg font-bold text-primary-600">{formatCurrency(order.total_amount)}</p>
                    <p className="text-xs text-gray-400">{formatDate(order.created_at, 'HH:mm')}</p>
                  </div>
                </List.Item>
              )}
              locale={{ emptyText: '暂无订单' }}
            />
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card
            title="待处理提醒"
            extra={<Button type="link" onClick={() => navigate('/admin/reminders')}>查看全部</Button>}
            loading={loading}
          >
            <List
              dataSource={reminders.slice(0, 5)}
              renderItem={(reminder) => (
                <List.Item
                  key={reminder.id}
                  className={`cursor-pointer hover:bg-gray-50 -mx-4 px-4 py-3 ${reminder.is_overdue ? 'bg-red-50 reminder-overdue' : ''}`}
                  onClick={() => navigate('/admin/reminders')}
                >
                  <List.Item.Meta
                    avatar={
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                        style={{ backgroundColor: REMINDER_LEVEL_COLORS[reminder.level] }}
                      >
                        <ExclamationCircleOutlined />
                      </div>
                    }
                    title={
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{reminder.title}</span>
                        <Tag
                          color={reminder.level === 1 ? 'red' : reminder.level === 2 ? 'orange' : reminder.level === 3 ? 'gold' : 'green'}
                        >
                          {REMINDER_LEVEL_NAMES[reminder.level]}
                        </Tag>
                        {reminder.is_overdue && <Tag color="red">已逾期</Tag>}
                      </div>
                    }
                    description={
                      <div className="text-sm text-gray-500">
                        <p>{reminder.message}</p>
                      </div>
                    }
                  />
                </List.Item>
              )}
              locale={{ emptyText: '暂无待处理提醒' }}
            />
          </Card>
        </Col>
      </Row>

      <Card title="入住转化漏斗" loading={loading}>
        <Row gutter={[24, 16]}>
          {conversionFunnel.map((stage, index) => (
            <Col key={stage.stage} xs={12} md={8} lg={4}>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-3xl font-bold text-primary-600 mb-1">{stage.count}</div>
                <div className="text-gray-600 mb-2">{stage.stage_display}</div>
                <div className="text-sm text-gray-500 mb-3">{formatCurrency(stage.amount)}</div>
                <Progress
                  percent={Math.round(stage.conversion_rate * 100)}
                  size="small"
                  showInfo={false}
                  strokeColor="#16a34a"
                />
                <div className="text-xs text-gray-400 mt-1">
                  转化率 {(stage.conversion_rate * 100).toFixed(1)}%
                </div>
                {index < conversionFunnel.length - 1 && (
                  <div className="absolute right-[-12px] top-1/2 transform -translate-y-1/2 text-gray-300 text-2xl z-10">
                    →
                  </div>
                )}
              </div>
            </Col>
          ))}
        </Row>
      </Card>
    </div>
  );
}
