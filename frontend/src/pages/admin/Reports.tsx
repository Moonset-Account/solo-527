import { useEffect, useState } from 'react';
import {
  Card, Statistic, Row, Col, Table, Select, Button, Space, Modal,
  List, Tag, Descriptions, message, Progress
} from 'antd';
import {
  BookOutlined, CheckCircleOutlined, CloseCircleOutlined, FileTextOutlined,
  ReloadOutlined, ExportOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { api } from '../../api';
import { MonthlyReportDto, FeedbackTypeMap } from '../../types';

export default function AdminReports() {
  const [data, setData] = useState<MonthlyReportDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detail, setDetail] = useState<MonthlyReportDto | null>(null);
  const now = dayjs();
  const [year, setYear] = useState(now.year());
  const [month, setMonth] = useState(now.month() + 1);

  const loadData = () => {
    setLoading(true);
    api.reports.monthly(year, month).then((res: any) => {
      setData(res);
      setLoading(false);
    }).catch(async () => {
      try {
        const res = await api.reports.generateMonthly(year, month);
        setData([res]);
      } catch {}
      setLoading(false);
    });
  };

  useEffect(() => { loadData(); }, [year, month]);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const res = await api.reports.generateMonthly(year, month);
      setData([res]);
      message.success('报告已生成');
    } catch (err: any) {
      message.error(err.message || '生成失败');
    }
    setLoading(false);
  };

  const viewDetail = async (record: MonthlyReportDto) => {
    if (!record.studentId) return;
    const res = await api.reports.studentMonthly(year, month, record.studentId);
    setDetail(res);
    setDetailOpen(true);
  };

  const totalStats = {
    totalHours: data.reduce((s, r) => s + r.totalHoursUsed, 0),
    avgAttendance: data.length > 0 ? (data.reduce((s, r) => s + (r.totalClasses > 0 ? r.attendedClasses / r.totalClasses : 0), 0) / data.length * 100).toFixed(1) : '0',
    avgScore: data.length > 0 ? (data.reduce((s, r) => s + r.averageScore, 0) / data.length).toFixed(1) : '0',
    totalFeedbacks: data.reduce((s, r) => s + r.feedbackCount, 0)
  };

  const columns = [
    { title: '学生', dataIndex: 'studentName', key: 'studentName' },
    { title: '出勤课次', dataIndex: 'attendedClasses', key: 'attended', render: (v: number) => <span style={{ color: '#52c41a', fontWeight: 500 }}>{v}</span> },
    { title: '缺勤课次', dataIndex: 'absentClasses', key: 'absent', render: (v: number) => <span style={{ color: '#ff4d4f', fontWeight: 500 }}>{v}</span> },
    { title: '请假课次', dataIndex: 'leaveClasses', key: 'leave', render: (v: number) => <span style={{ color: '#fa8c16', fontWeight: 500 }}>{v}</span> },
    { title: '消耗课时', dataIndex: 'totalHoursUsed', key: 'hours', render: (v: number) => <strong>{v}</strong> },
    {
      title: '出勤率', key: 'rate', render: (_: any, r: MonthlyReportDto) => {
        const rate = r.totalClasses > 0 ? (r.attendedClasses / r.totalClasses) * 100 : 0;
        return <Progress percent={Math.round(rate)} size="small" />;
      }
    },
    { title: '作品平均分', dataIndex: 'averageScore', key: 'score', render: (v: number) =>
      <Tag color={v >= 80 ? 'green' : v >= 60 ? 'blue' : 'orange'}>{v}</Tag>
    },
    { title: '反馈数', dataIndex: 'feedbackCount', key: 'fbcount' },
    {
      title: '操作', key: 'action', render: (_: any, r: MonthlyReportDto) => (
        <Button size="small" type="link" onClick={() => viewDetail(r)}>查看详情</Button>
      )
    }
  ];

  const years = Array.from({ length: 3 }, (_, i) => now.year() - 1 + i);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div className="page-title" style={{ marginBottom: 0 }}>月度复盘报表</div>
        <Space>
          <Select value={year} onChange={setYear} style={{ width: 100 }}>
            {years.map(y => <Select.Option key={y} value={y}>{y}年</Select.Option>)}
          </Select>
          <Select value={month} onChange={setMonth} style={{ width: 80 }}>
            {months.map(m => <Select.Option key={m} value={m}>{m}月</Select.Option>)}
          </Select>
          <Button icon={<ReloadOutlined />} onClick={handleGenerate} loading={loading}>
            生成/刷新报告
          </Button>
          <Button icon={<ExportOutlined />}>导出</Button>
        </Space>
      </div>

      <Row gutter={16}>
        <Col span={6}>
          <Card className="stat-card" loading={loading}>
            <Statistic title="本月总消耗课时" value={totalStats.totalHours} suffix="课时" prefix={<BookOutlined />} />
          </Card>
        </Col>
        <Col span={6}>
          <Card className="stat-card" loading={loading}>
            <Statistic title="整体出勤率" value={totalStats.avgAttendance} suffix="%" />
          </Card>
        </Col>
        <Col span={6}>
          <Card className="stat-card" loading={loading}>
            <Statistic title="作品平均得分" value={totalStats.avgScore} prefix={<FileTextOutlined />} valueStyle={{ color: '#1677ff' }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card className="stat-card" loading={loading}>
            <Statistic title="家校反馈总数" value={totalStats.totalFeedbacks} />
          </Card>
        </Col>
      </Row>

      <Card className="card-shadow" style={{ marginTop: 16 }} title={`${year}年${month}月 学生报告明细`} loading={loading}>
        <Table rowKey="id" columns={columns} dataSource={data} pagination={{ pageSize: 10 }} />
      </Card>

      <Modal title={`${detail?.studentName} - ${year}年${month}月报告详情`}
        open={detailOpen} onCancel={() => setDetailOpen(false)} footer={null} width={700} destroyOnClose>
        {detail && (
          <>
            <Row gutter={12}>
              <Col span={8}>
                <Card className="stat-card"><Statistic title="总出勤" value={detail.attendedClasses} prefix={<CheckCircleOutlined />} valueStyle={{ color: '#52c41a' }} /></Card>
              </Col>
              <Col span={8}>
                <Card className="stat-card"><Statistic title="缺勤" value={detail.absentClasses} prefix={<CloseCircleOutlined />} valueStyle={{ color: '#ff4d4f' }} /></Card>
              </Col>
              <Col span={8}>
                <Card className="stat-card"><Statistic title="请假" value={detail.leaveClasses} valueStyle={{ color: '#fa8c16' }} /></Card>
              </Col>
            </Row>
            <Descriptions column={2} style={{ marginTop: 16 }} size="small" bordered>
              <Descriptions.Item label="消耗课时">{detail.totalHoursUsed} 课时</Descriptions.Item>
              <Descriptions.Item label="作品平均分">{detail.averageScore}</Descriptions.Item>
              <Descriptions.Item label="出勤率">
                {detail.totalClasses > 0 ? ((detail.attendedClasses / detail.totalClasses) * 100).toFixed(1) : 0}%
              </Descriptions.Item>
              <Descriptions.Item label="反馈数量">{detail.feedbackCount}</Descriptions.Item>
            </Descriptions>
            {detail.feedbacks && detail.feedbacks.length > 0 && (
              <Card style={{ marginTop: 16 }} size="small" title="家校反馈明细">
                <List
                  size="small"
                  dataSource={detail.feedbacks}
                  renderItem={(item) => (
                    <List.Item>
                      <List.Item.Meta
                        avatar={<Tag color="blue">{FeedbackTypeMap[item.type]}</Tag>}
                        title={<span>{item.createdByName} · {dayjs(item.createdAt).format('MM-DD')}</span>}
                        description={item.content}
                      />
                    </List.Item>
                  )}
                />
              </Card>
            )}
            {detail.notes && (
              <Card style={{ marginTop: 16 }} size="small" title="备注">
                {detail.notes}
              </Card>
            )}
          </>
        )}
      </Modal>
    </div>
  );
}
