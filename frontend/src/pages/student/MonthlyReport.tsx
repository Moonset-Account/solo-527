import { useEffect, useState } from 'react';
import { Card, Statistic, Row, Col, Descriptions, List, Tag, Button, Space, message } from 'antd';
import { BookOutlined, CheckCircleOutlined, CloseCircleOutlined, FileTextOutlined, ReloadOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { api } from '../../api';
import { MonthlyReportDto, FeedbackTypeMap } from '../../types';

export default function StudentMonthlyReport() {
  const [data, setData] = useState<MonthlyReportDto | null>(null);
  const [loading, setLoading] = useState(true);
  const now = dayjs();

  const loadData = () => {
    setLoading(true);
    api.reports.myMonthly(now.year(), now.month() + 1).then((res: any) => {
      setData(res);
      setLoading(false);
    }).catch(() => {
      api.reports.generateMonthly(now.year(), now.month() + 1).then((res: any) => {
        setData(res);
        setLoading(false);
      }).catch(() => setLoading(false));
    });
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleGenerate = () => {
    setLoading(true);
    api.reports.generateMonthly(now.year(), now.month() + 1).then((res: any) => {
      setData(res);
      setLoading(false);
      message.success('报告已生成');
    }).catch(() => setLoading(false));
  };

  const attendanceRate = data && data.totalClasses > 0
    ? ((data.attendedClasses / data.totalClasses) * 100).toFixed(1)
    : '0';

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div className="page-title" style={{ marginBottom: 0 }}>
          月度报告 · {now.format('YYYY年M月')}
        </div>
        <Button type="primary" icon={<ReloadOutlined />} onClick={handleGenerate}>
          刷新报告
        </Button>
      </div>

      <Row gutter={16}>
        <Col span={6}>
          <Card className="stat-card" loading={loading}>
            <Statistic title="总课时" value={data?.totalHoursUsed || 0} suffix="课时" prefix={<BookOutlined />} />
          </Card>
        </Col>
        <Col span={6}>
          <Card className="stat-card" loading={loading}>
            <Statistic title="出勤课次" value={data?.attendedClasses || 0} prefix={<CheckCircleOutlined />} valueStyle={{ color: '#52c41a' }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card className="stat-card" loading={loading}>
            <Statistic title="出勤率" value={attendanceRate} suffix="%" />
          </Card>
        </Col>
        <Col span={6}>
          <Card className="stat-card" loading={loading}>
            <Statistic title="作品平均分" value={data?.averageScore || 0} prefix={<FileTextOutlined />} valueStyle={{ color: '#1677ff' }} />
          </Card>
        </Col>
      </Row>

      <Row gutter={16} style={{ marginTop: 16 }}>
        <Col span={6}>
          <Card className="stat-card" loading={loading}>
            <Statistic title="缺勤" value={data?.absentClasses || 0} valueStyle={{ color: '#ff4d4f' }} prefix={<CloseCircleOutlined />} />
          </Card>
        </Col>
        <Col span={6}>
          <Card className="stat-card" loading={loading}>
            <Statistic title="请假" value={data?.leaveClasses || 0} valueStyle={{ color: '#fa8c16' }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card className="stat-card" loading={loading}>
            <Statistic title="反馈数" value={data?.feedbackCount || 0} />
          </Card>
        </Col>
      </Row>

      {data?.feedbacks && data.feedbacks.length > 0 && (
        <Card className="card-shadow" style={{ marginTop: 16 }} title="家校反馈详情">
          <List
            dataSource={data.feedbacks}
            renderItem={(item) => (
              <List.Item key={item.id}>
                <List.Item.Meta
                  title={
                    <Space>
                      <Tag color="blue">{FeedbackTypeMap[item.type]}</Tag>
                      <span style={{ color: '#8c8c8c', fontSize: 13 }}>
                        {item.createdByName} · {dayjs(item.createdAt).format('YYYY-MM-DD')}
                      </span>
                    </Space>
                  }
                  description={item.content}
                />
              </List.Item>
            )}
          />
        </Card>
      )}
    </div>
  );
}
