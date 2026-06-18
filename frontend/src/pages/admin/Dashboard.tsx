import { useEffect, useState } from 'react';
import { Card, Statistic, Row, Col, Table, Tag } from 'antd';
import {
  TeamOutlined, ScheduleOutlined, WarningOutlined, FileTextOutlined,
  ClockCircleOutlined, CheckCircleOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { api } from '../../api';
import { HoursWarningDto, ScheduleDto, HomeSchoolFeedbackDto, ScheduleStatusMap, FeedbackTypeMap } from '../../types';

export default function AdminDashboard() {
  const [warnings, setWarnings] = useState<HoursWarningDto[]>([]);
  const [schedules, setSchedules] = useState<ScheduleDto[]>([]);
  const [feedbacks, setFeedbacks] = useState<HomeSchoolFeedbackDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ classes: 0, todaySchedules: 0, warnings: 0, pendingLeaves: 0 });

  useEffect(() => {
    const todayStart = dayjs().startOf('day').toISOString();
    const todayEnd = dayjs().endOf('day').toISOString();

    Promise.all([
      api.classes.list(),
      api.schedules.list({ startDate: todayStart, endDate: todayEnd }),
      api.hoursWarnings.list(true),
      api.leaves.list({ status: 'Pending' }),
      api.feedbacks.homeSchoolList({ pendingRemindersOnly: true })
    ]).then(([classes, schedulesRes, warningsRes, leaves, feedbacksRes]) => {
      setStats({
        classes: (classes as any[]).length,
        todaySchedules: (schedulesRes as any[]).length,
        warnings: (warningsRes as any[]).length,
        pendingLeaves: (leaves as any[]).length
      });
      setSchedules(schedulesRes as ScheduleDto[]);
      setWarnings(warningsRes as HoursWarningDto[]);
      setFeedbacks(feedbacksRes as HomeSchoolFeedbackDto[]);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const scheduleColumns = [
    { title: '时间', key: 'time', render: (_: any, r: ScheduleDto) =>
      `${dayjs(r.startTime).format('HH:mm')}-${dayjs(r.endTime).format('HH:mm')}` },
    { title: '班级', dataIndex: 'className', key: 'className' },
    { title: '老师', dataIndex: 'teacherName', key: 'teacherName' },
    { title: '教室', dataIndex: 'classroom', key: 'classroom' },
    { title: '状态', dataIndex: 'status', key: 'status', render: (s: string) => {
        const map: Record<string, string> = { Scheduled: 'blue', Completed: 'green', Cancelled: 'red', Rescheduled: 'orange' };
        return <Tag color={map[s]}>{ScheduleStatusMap[s as keyof typeof ScheduleStatusMap]}</Tag>;
    }}
  ];

  const warningColumns = [
    { title: '学生', dataIndex: 'studentName', key: 'studentName' },
    { title: '剩余课时', dataIndex: 'remainingHours', key: 'remainingHours', render: (v: number) =>
      <span style={{ color: v <= 2 ? '#ff4d4f' : '#fa8c16', fontWeight: 600 }}>{v}课时</span>
    },
    { title: '通知顾问', dataIndex: 'notifiedAdvisor', key: 'notified', render: (v: boolean) =>
      v ? <Tag color="green">已通知</Tag> : <Tag color="orange">未通知</Tag>
    }
  ];

  return (
    <div>
      <div className="page-title">数据总览</div>
      <Row gutter={16}>
        <Col span={6}>
          <Card className="stat-card" loading={loading}>
            <Statistic title="班级总数" value={stats.classes} prefix={<TeamOutlined />} />
          </Card>
        </Col>
        <Col span={6}>
          <Card className="stat-card" loading={loading}>
            <Statistic title="今日课表" value={stats.todaySchedules} prefix={<ScheduleOutlined />} valueStyle={{ color: '#1677ff' }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card className="stat-card" loading={loading}>
            <Statistic title="课时不足预警" value={stats.warnings} prefix={<WarningOutlined />} valueStyle={{ color: '#ff4d4f' }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card className="stat-card" loading={loading}>
            <Statistic title="待审批请假" value={stats.pendingLeaves} prefix={<ClockCircleOutlined />} valueStyle={{ color: '#fa8c16' }} />
          </Card>
        </Col>
      </Row>

      <Row gutter={16} style={{ marginTop: 16 }}>
        <Col span={14}>
          <Card className="card-shadow" title={`今日课表（${dayjs().format('YYYY-MM-DD ddd')}）`} loading={loading}>
            <Table rowKey="id" columns={scheduleColumns} dataSource={schedules} pagination={false} size="small" />
          </Card>
        </Col>
        <Col span={10}>
          <Card className="card-shadow" title="课时不足预警" loading={loading} extra={<Tag color="red">需关注</Tag>}>
            <Table rowKey="id" columns={warningColumns} dataSource={warnings} pagination={false} size="small" />
          </Card>
        </Col>
      </Row>

      <Card className="card-shadow" title="待处理家校反馈提醒" style={{ marginTop: 16 }} loading={loading}>
        {feedbacks.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 20, color: '#8c8c8c' }}>暂无待处理的提醒</div>
        ) : (
          <Table
            rowKey="id"
            dataSource={feedbacks}
            pagination={false}
            size="small"
            columns={[
              { title: '学生', dataIndex: 'studentName', key: 'studentName' },
              { title: '类型', dataIndex: 'type', key: 'type', render: (t: string) => FeedbackTypeMap[t as keyof typeof FeedbackTypeMap] },
              { title: '创建人', dataIndex: 'createdByName', key: 'createdByName' },
              { title: '内容', dataIndex: 'content', key: 'content', ellipsis: true },
              { title: '家长已读', dataIndex: 'parentRead', key: 'read', render: (v: boolean) =>
                v ? <Tag color="green"><CheckCircleOutlined /> 已读</Tag> : <Tag color="orange">未读</Tag>
              }
            ]}
          />
        )}
      </Card>
    </div>
  );
}
