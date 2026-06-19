import { useState, useEffect } from 'react';
import { Row, Col, Card, Statistic, List, Tag, Avatar, Space, Button } from 'antd';
import {
  CalendarOutlined,
  HomeOutlined,
  FileTextOutlined,
  DollarOutlined,
  ShoppingOutlined,
  ExceptionOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import { Link } from 'react-router-dom';
import dayjs from 'dayjs';
import { appointmentApi, spaceApi, contractApi, orderApi } from '../../services/api';
import { appointmentStatusLabels, appointmentStatusColors, orderStatusLabels, orderStatusColors } from '../../utils/enums';
import type { Appointment, Order } from '../../types';

function Dashboard() {
  const [stats, setStats] = useState({
    appointments: 0,
    spaces: 0,
    contracts: 0,
    orders: 0,
  });
  const [recentAppointments, setRecentAppointments] = useState<Appointment[]>([]);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);

  const fetchData = async () => {
    try {
      const [aRes, sRes, cRes, oRes] = await Promise.all([
        appointmentApi.list({ page: 1, pageSize: 5 }),
        spaceApi.list({ page: 1, pageSize: 1 }),
        contractApi.list({ page: 1, pageSize: 1 }),
        orderApi.list({ page: 1, pageSize: 5 }),
      ]);
      setStats({
        appointments: aRes.data?.totalCount || 0,
        spaces: sRes.data?.totalCount || 0,
        contracts: cRes.data?.totalCount || 0,
        orders: oRes.data?.totalCount || 0,
      });
      setRecentAppointments(aRes.data?.items || []);
      setRecentOrders(oRes.data?.items || []);
    } catch (e) {
      // ignore
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div>
      <h2 style={{ marginTop: 0 }}>工作台</h2>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col xs={12} md={6}>
          <Link to="/admin/appointments">
            <Card hoverable>
              <Statistic
                title="看房预约"
                value={stats.appointments}
                prefix={<CalendarOutlined style={{ color: '#1677ff' }} />}
                valueStyle={{ color: '#1677ff' }}
              />
            </Card>
          </Link>
        </Col>
        <Col xs={12} md={6}>
          <Link to="/admin/spaces">
            <Card hoverable>
              <Statistic
                title="房源数量"
                value={stats.spaces}
                prefix={<HomeOutlined style={{ color: '#52c41a' }} />}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Link>
        </Col>
        <Col xs={12} md={6}>
          <Link to="/admin/contracts">
            <Card hoverable>
              <Statistic
                title="租约合同"
                value={stats.contracts}
                prefix={<FileTextOutlined style={{ color: '#fa8c16' }} />}
                valueStyle={{ color: '#fa8c16' }}
              />
            </Card>
          </Link>
        </Col>
        <Col xs={12} md={6}>
          <Link to="/admin/orders">
            <Card hoverable>
              <Statistic
                title="订单履约"
                value={stats.orders}
                prefix={<ShoppingOutlined style={{ color: '#722ed1' }} />}
                valueStyle={{ color: '#722ed1' }}
              />
            </Card>
          </Link>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col xs={24} md={12}>
          <Card
            title={<Space><CalendarOutlined /> 最近看房预约</Space>}
            extra={<Link to="/admin/appointments">查看全部</Link>}
          >
            <List
              dataSource={recentAppointments}
              locale={{ emptyText: '暂无预约' }}
              renderItem={(item) => (
                <List.Item
                  actions={[
                    <Link key="detail" to={`/admin/appointments/${item.id}`}>
                      <Button type="link" size="small" icon={<EyeOutlined />}>处理</Button>
                    </Link>,
                  ]}
                >
                  <List.Item.Meta
                    avatar={<Avatar icon={<CalendarOutlined />} />}
                    title={
                      <Space>
                        <span>{item.customerName}</span>
                        <Tag color={appointmentStatusColors[item.status]}>
                          {appointmentStatusLabels[item.status]}
                        </Tag>
                      </Space>
                    }
                    description={
                      <div>
                        <div>{item.spaceName}</div>
                        <div style={{ color: '#999', fontSize: 12 }}>
                          {dayjs(item.viewingDate).format('YYYY-MM-DD')} ·
                          {item.startTime.substring(0, 5)}-{item.endTime.substring(0, 5)} ·
                          顾问：{item.consultantName || '未分配'}
                        </div>
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>

        <Col xs={24} md={12}>
          <Card
            title={<Space><ShoppingOutlined /> 最近订单</Space>}
            extra={<Link to="/admin/orders">查看全部</Link>}
          >
            <List
              dataSource={recentOrders}
              locale={{ emptyText: '暂无订单' }}
              renderItem={(item) => (
                <List.Item
                  actions={[
                    <Link key="detail" to={`/admin/orders/${item.id}`}>
                      <Button type="link" size="small" icon={<EyeOutlined />}>查看</Button>
                    </Link>,
                  ]}
                >
                  <List.Item.Meta
                    avatar={<Avatar icon={<ShoppingOutlined />} />}
                    title={
                      <Space>
                        <span>{item.orderNo}</span>
                        <Tag color={orderStatusColors[item.status]}>
                          {orderStatusLabels[item.status]}
                        </Tag>
                      </Space>
                    }
                    description={
                      <div>
                        <div>{item.customerName} · ¥{item.totalAmount.toLocaleString()}</div>
                        <div style={{ color: '#999', fontSize: 12 }}>
                          {item.orderType} · {dayjs(item.createdAt).format('YYYY-MM-DD HH:mm')}
                        </div>
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
}

export default Dashboard;
