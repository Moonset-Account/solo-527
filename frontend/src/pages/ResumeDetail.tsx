import React, { useState, useEffect } from 'react';
import { Card, Descriptions, Tag, Button, Space, Tabs, Table, Typography, Divider, List, Progress } from 'antd';
import { useParams, useNavigate } from 'react-router-dom';
import { resumeApi } from '../api/resume';
import { assessmentApi } from '../api/assessment';
import { interviewApi } from '../api/interview';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

const ResumeDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [resume, setResume] = useState<any>(null);
  const [statusLogs, setStatusLogs] = useState<any[]>([]);
  const [processingRecords, setProcessingRecords] = useState<any[]>([]);
  const [assessments, setAssessments] = useState<any[]>([]);
  const [interviews, setInterviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (id) {
      loadData();
    }
  }, [id]);

  const loadData = async () => {
    setLoading(true);
    try {
      const resumeRes = await resumeApi.getResumeById(id!);
      if (resumeRes.success) {
        setResume(resumeRes.data);
      }

      const logsRes = await resumeApi.getStatusLogs(id!);
      if (logsRes.success) {
        setStatusLogs(logsRes.data);
      }

      const recordsRes = await resumeApi.getProcessingRecords(id!);
      if (recordsRes.success) {
        setProcessingRecords(recordsRes.data);
      }

      const assessmentRes = await assessmentApi.getAssessments({ resumeId: id! });
      if (assessmentRes.success) {
        setAssessments(assessmentRes.data.items);
      }

      const interviewRes = await interviewApi.getInterviews({ resumeId: id! });
      if (interviewRes.success) {
        setInterviews(interviewRes.data.items);
      }
    } catch (error) {
      console.error('Failed to load resume detail:', error);
    } finally {
      setLoading(false);
    }
  };

  const statusMap: Record<string, { label: string; color: string }> = {
    submitted: { label: '已提交', color: 'blue' },
    screening: { label: '筛选中', color: 'orange' },
    written_test: { label: '笔试中', color: 'purple' },
    interview: { label: '面试中', color: 'cyan' },
    offer: { label: '已发Offer', color: 'green' },
    rejected: { label: '已拒绝', color: 'red' },
    hired: { label: '已入职', color: 'success' },
  };

  const logColumns = [
    {
      title: '状态变更',
      key: 'status',
      render: (_: any, record: any) => (
        <Space>
          <Tag color={statusMap[record.fromStatus]?.color}>
            {statusMap[record.fromStatus]?.label}
          </Tag>
          <Text type="secondary">→</Text>
          <Tag color={statusMap[record.toStatus]?.color}>
            {statusMap[record.toStatus]?.label}
          </Tag>
        </Space>
      ),
    },
    {
      title: '操作人',
      dataIndex: 'operatorName',
      key: 'operatorName',
    },
    {
      title: '原因',
      dataIndex: 'reason',
      key: 'reason',
      render: (text: string) => text || '-',
    },
    {
      title: '时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => dayjs(date).format('YYYY-MM-DD HH:mm'),
    },
  ];

  const recordColumns = [
    {
      title: '操作类型',
      dataIndex: 'actionType',
      key: 'actionType',
      width: 120,
      render: (type: string) => <Tag color="blue">{type}</Tag>,
    },
    {
      title: '操作详情',
      dataIndex: 'actionDetail',
      key: 'actionDetail',
    },
    {
      title: '操作人',
      dataIndex: 'operatorName',
      key: 'operatorName',
      width: 100,
    },
    {
      title: '备注',
      dataIndex: 'remarks',
      key: 'remarks',
      render: (text: string) => text || '-',
    },
    {
      title: '时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
      render: (date: string) => dayjs(date).format('YYYY-MM-DD HH:mm'),
    },
  ];

  const assessmentColumns = [
    {
      title: '题库',
      dataIndex: 'questionBankName',
      key: 'questionBankName',
      render: (text: string) => text || '-',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => <Tag color="blue">{status}</Tag>,
    },
    {
      title: '得分',
      key: 'score',
      render: (_: any, record: any) => 
        record.earnedScore !== undefined && record.totalScore 
          ? `${record.earnedScore}/${record.totalScore}` 
          : '待评分',
    },
    {
      title: '是否有争议',
      dataIndex: 'hasDispute',
      key: 'hasDispute',
      render: (has: boolean) => has ? <Tag color="red">有争议</Tag> : <Tag color="green">无争议</Tag>,
    },
    {
      title: '提交时间',
      dataIndex: 'submittedAt',
      key: 'submittedAt',
      render: (date: string) => date ? dayjs(date).format('YYYY-MM-DD HH:mm') : '-',
    },
  ];

  const interviewColumns = [
    {
      title: '轮次',
      dataIndex: 'round',
      key: 'round',
      render: (round: number) => round ? `第${round}轮` : '-',
    },
    {
      title: '面试官',
      dataIndex: 'interviewerName',
      key: 'interviewerName',
    },
    {
      title: '时间',
      dataIndex: 'scheduledTime',
      key: 'scheduledTime',
      render: (date: string) => date ? dayjs(date).format('YYYY-MM-DD HH:mm') : '待安排',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => <Tag color="blue">{status}</Tag>,
    },
    {
      title: '评分',
      dataIndex: 'score',
      key: 'score',
      render: (score: number) => score || '待评分',
    },
  ];

  const tabItems = [
    {
      key: 'basic',
      label: '基本信息',
      children: resume ? (
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <Card title="个人信息" size="small">
            <Descriptions column={2} bordered size="small">
              <Descriptions.Item label="姓名">{resume.candidateName}</Descriptions.Item>
              <Descriptions.Item label="邮箱">{resume.email || '-'}</Descriptions.Item>
              <Descriptions.Item label="手机号">{resume.phone || '-'}</Descriptions.Item>
              <Descriptions.Item label="应聘岗位">{resume.positionApplied || '-'}</Descriptions.Item>
            </Descriptions>
          </Card>

          <Card title="教育背景" size="small">
            <Descriptions column={2} bordered size="small">
              <Descriptions.Item label="毕业院校">{resume.school || '-'}</Descriptions.Item>
              <Descriptions.Item label="专业">{resume.major || '-'}</Descriptions.Item>
              <Descriptions.Item label="学历">{resume.degree || '-'}</Descriptions.Item>
              <Descriptions.Item label="毕业年份">{resume.graduationYear || '-'}</Descriptions.Item>
            </Descriptions>
          </Card>

          <Card title="技能与经历" size="small">
            <Descriptions column={1} bordered size="small">
              <Descriptions.Item label="专业技能">{resume.skills || '-'}</Descriptions.Item>
              <Descriptions.Item label="实习/工作经历">{resume.experience || '-'}</Descriptions.Item>
              <Descriptions.Item label="项目经历">{resume.projects || '-'}</Descriptions.Item>
            </Descriptions>
          </Card>

          <Card title="能力画像" size="small">
            {resume.abilityProfile ? (
              <p>{resume.abilityProfile}</p>
            ) : (
              <Text type="secondary">暂无能力画像数据</Text>
            )}
          </Card>
        </Space>
      ) : null,
    },
    {
      key: 'logs',
      label: '状态变更记录',
      children: (
        <Table
          columns={logColumns}
          dataSource={statusLogs}
          rowKey="id"
          pagination={false}
          size="small"
        />
      ),
    },
    {
      key: 'records',
      label: '处理记录',
      children: (
        <Table
          columns={recordColumns}
          dataSource={processingRecords}
          rowKey="id"
          pagination={false}
          size="small"
        />
      ),
    },
    {
      key: 'assessments',
      label: '测评记录',
      children: (
        <Table
          columns={assessmentColumns}
          dataSource={assessments}
          rowKey="id"
          pagination={false}
          size="small"
        />
      ),
    },
    {
      key: 'interviews',
      label: '面试记录',
      children: (
        <Table
          columns={interviewColumns}
          dataSource={interviews}
          rowKey="id"
          pagination={false}
          size="small"
        />
      ),
    },
  ];

  return (
    <div className="page-container">
      <div className="page-header">
        <Space>
          <Button onClick={() => navigate(-1)}>返回</Button>
          <Title level={3} style={{ margin: 0 }}>简历详情</Title>
          {resume && (
            <Tag color={statusMap[resume.status]?.color}>
              {statusMap[resume.status]?.label}
            </Tag>
          )}
        </Space>
        <Space>
          <Button type="primary" onClick={() => navigate(`/ability-profile/${id}`)}>
            查看能力画像
          </Button>
        </Space>
      </div>

      <Card loading={loading}>
        {resume && (
          <>
            <Tabs defaultActiveKey="basic" items={tabItems} />
          </>
        )}
      </Card>
    </div>
  );
};

export default ResumeDetail;
