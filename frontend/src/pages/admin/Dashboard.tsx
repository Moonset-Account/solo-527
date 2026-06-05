import { useState, useEffect } from 'react';
import { Row, Col, Card, Statistic } from 'antd';
import { TeamOutlined, UserSwitchOutlined, PayCircleOutlined, AlertOutlined } from '@ant-design/icons';
import { getChildren } from '@/api/children';
import { getPayments, getLeaves } from '@/api/finance';
import client from '@/api/client';

export default function AdminDashboard() {
  const [childCount, setChildCount] = useState(0);
  const [staffCount, setStaffCount] = useState(0);
  const [monthIncome, setMonthIncome] = useState('0');
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const childrenRes = await getChildren({ is_active: true });
        setChildCount(childrenRes.count);
      } catch {}

      try {
        const res = await client.get('/accounts/users/', { params: { role: 'admin,teacher', is_active: 'true' } });
        setStaffCount(res.data.count || 0);
      } catch {}

      try {
        const paymentsRes = await getPayments({ status: 'paid' });
        const total = paymentsRes.results.reduce((sum, p) => sum + parseFloat(p.paid_amount || '0'), 0);
        setMonthIncome(total.toFixed(2));
      } catch {}

      try {
        const leavesRes = await getLeaves({ status: 'pending' });
        setPendingCount(leavesRes.count);
      } catch {}
    };
    fetchStats();
  }, []);

  return (
    <div>
      <h2 style={{ marginBottom: 24 }}>管理员仪表盘</h2>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic title="在园儿童数" value={childCount} prefix={<UserSwitchOutlined />} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic title="教职工数" value={staffCount} prefix={<TeamOutlined />} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic title="本月收入" value={monthIncome} prefix={<PayCircleOutlined />} suffix="元" />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic title="待处理事项" value={pendingCount} prefix={<AlertOutlined />} />
          </Card>
        </Col>
      </Row>
    </div>
  );
}
