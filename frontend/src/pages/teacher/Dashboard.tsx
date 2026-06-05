import { useState, useEffect } from 'react';
import { Row, Col, Card, Statistic, Button, message } from 'antd';
import { UserSwitchOutlined, EditOutlined, SafetyCertificateOutlined, FileProtectOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { getChildren } from '@/api/children';
import { getTodayStats } from '@/api/pickup';
import { getLeaves } from '@/api/finance';
import { getDailyRecords } from '@/api/records';

export default function TeacherDashboard() {
  const navigate = useNavigate();
  const [childCount, setChildCount] = useState(0);
  const [recordedToday, setRecordedToday] = useState(0);
  const [pendingVerify, setPendingVerify] = useState(0);
  const [pendingLeave, setPendingLeave] = useState(0);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const childrenRes = await getChildren({ is_active: true });
        setChildCount(childrenRes.count);
      } catch {}

      try {
        const today = new Date().toISOString().slice(0, 10);
        const recordsRes = await getDailyRecords({ date: today });
        setRecordedToday(recordsRes.count);
      } catch {}

      try {
        const statsRes = await getTodayStats();
        setPendingVerify(statsRes.pending);
      } catch {}

      try {
        const leavesRes = await getLeaves({ status: 'pending' });
        setPendingLeave(leavesRes.count);
      } catch {}
    };
    fetchStats();
  }, []);

  return (
    <div>
      <h2 style={{ marginBottom: 24 }}>教师仪表盘</h2>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic title="班级儿童数" value={childCount} prefix={<UserSwitchOutlined />} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic title="今日已记录" value={recordedToday} prefix={<EditOutlined />} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic title="待核验接送" value={pendingVerify} prefix={<SafetyCertificateOutlined />} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic title="待审批请假" value={pendingLeave} prefix={<FileProtectOutlined />} />
          </Card>
        </Col>
      </Row>
      <div style={{ marginTop: 24 }}>
        <h3 style={{ marginBottom: 16 }}>快捷入口</h3>
        <Row gutter={[12, 12]}>
          <Col>
            <Button type="primary" icon={<EditOutlined />} onClick={() => navigate('/teacher/daily-record')}>
              填写每日记录
            </Button>
          </Col>
          <Col>
            <Button icon={<SafetyCertificateOutlined />} onClick={() => navigate('/teacher/pickup-verify')}>
              接送核验
            </Button>
          </Col>
          <Col>
            <Button icon={<FileProtectOutlined />} onClick={() => navigate('/teacher/leave-manage')}>
              请假审批
            </Button>
          </Col>
        </Row>
      </div>
    </div>
  );
}
