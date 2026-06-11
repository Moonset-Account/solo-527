import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Progress, List, Tag, Space, Typography, Descriptions, Button } from 'antd';
import { StarOutlined, ThunderboltOutlined, BulbOutlined, TeamOutlined } from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import { resumeApi } from '../api/resume';
import { assessmentApi } from '../api/assessment';
import { interviewApi } from '../api/interview';
import ReactECharts from 'echarts-for-react';

const { Title, Text } = Typography;

const AbilityProfile: React.FC = () => {
  const { resumeId } = useParams<{ resumeId: string }>();
  const navigate = useNavigate();
  const [resume, setResume] = useState<any>(null);
  const [assessments, setAssessments] = useState<any[]>([]);
  const [interviews, setInterviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (resumeId) {
      loadData();
    }
  }, [resumeId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const resumeRes = await resumeApi.getResumeById(resumeId!);
      if (resumeRes.success) {
        setResume(resumeRes.data);
      }

      const assessmentRes = await assessmentApi.getAssessments({ resumeId });
      if (assessmentRes.success) {
        setAssessments(assessmentRes.data.items);
      }

      const interviewRes = await interviewApi.getInterviews({ resumeId, pageSize: 100 });
      if (interviewRes.success) {
        setInterviews(interviewRes.data.items.filter(i => i.status === 'completed'));
      }
    } catch (error) {
      console.error('Failed to load ability profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const abilityDimensions = [
    { name: '技术能力', score: 85, maxScore: 100, icon: <ThunderboltOutlined />, color: '#1677ff' },
    { name: '问题解决', score: 78, maxScore: 100, icon: <BulbOutlined />, color: '#722ed1' },
    { name: '沟通表达', score: 82, maxScore: 100, icon: <TeamOutlined />, color: '#13c2c2' },
    { name: '团队协作', score: 90, maxScore: 100, icon: <StarOutlined />, color: '#faad14' },
    { name: '学习能力', score: 88, maxScore: 100, icon: <StarOutlined />, color: '#52c41a' },
    { name: '发展潜力', score: 85, maxScore: 100, icon: <StarOutlined />, color: '#eb2f96' },
  ];

  const radarOption = {
    radar: {
      indicator: abilityDimensions.map(d => ({ name: d.name, max: d.maxScore })),
      shape: 'polygon',
      splitNumber: 5,
      axisName: {
        color: '#333',
      },
    },
    series: [
      {
        type: 'radar',
        data: [
          {
            value: abilityDimensions.map(d => d.score),
            name: '能力评估',
            areaStyle: {
              color: 'rgba(22, 119, 255, 0.3)',
            },
            lineStyle: {
              color: '#1677ff',
            },
            itemStyle: {
              color: '#1677ff',
            },
          },
        ],
      },
    ],
  };

  const getScoreLevel = (score: number) => {
    if (score >= 90) return { label: '优秀', color: '#52c41a' };
    if (score >= 80) return { label: '良好', color: '#1677ff' };
    if (score >= 70) return { label: '中等', color: '#faad14' };
    if (score >= 60) return { label: '及格', color: '#fa8c16' };
    return { label: '待提升', color: '#ff4d4f' };
  };

  const overallScore = resume?.overallScore || 0;
  const scoreLevel = getScoreLevel(overallScore);

  return (
    <div className="page-container">
      <div className="page-header">
        <Space>
          <Button onClick={() => navigate(-1)}>返回</Button>
          <Title level={3} style={{ margin: 0 }}>能力画像</Title>
          {resume && <Tag color="blue">{resume.candidateName}</Tag>}
        </Space>
      </div>

      <Row gutter={16}>
        <Col span={8}>
          <Card title="综合评估">
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <Progress
                type="dashboard"
                percent={overallScore}
                strokeColor={{
                  '0%': '#108ee9',
                  '100%': '#87d068',
                }}
                width={180}
                format={(p) => (
                  <span style={{ fontSize: 36, fontWeight: 'bold' }}>
                    {overallScore}
                  </span>
                )}
              />
              <Tag color={scoreLevel.color} style={{ fontSize: 16, padding: '4px 16px', marginTop: 16 }}>
                {scoreLevel.label}
              </Tag>
              <p style={{ marginTop: 16, color: '#666' }}>综合能力评分</p>
            </div>
          </Card>

          <Card title="基本信息" style={{ marginTop: 16 }}>
            {resume && (
              <Descriptions column={1} size="small" bordered>
                <Descriptions.Item label="姓名">{resume.candidateName}</Descriptions.Item>
                <Descriptions.Item label="学校">{resume.school || '-'}</Descriptions.Item>
                <Descriptions.Item label="专业">{resume.major || '-'}</Descriptions.Item>
                <Descriptions.Item label="学历">{resume.degree || '-'}</Descriptions.Item>
                <Descriptions.Item label="应聘岗位">{resume.positionApplied || '-'}</Descriptions.Item>
                <Descriptions.Item label="当前状态">
                  <Tag color="blue">{resume.status}</Tag>
                </Descriptions.Item>
              </Descriptions>
            )}
          </Card>
        </Col>

        <Col span={16}>
          <Card title="能力雷达图">
            <ReactECharts option={radarOption} style={{ height: 350 }} />
          </Card>

          <Card title="能力维度详情" style={{ marginTop: 16 }}>
            <Row gutter={[16, 16]}>
              {abilityDimensions.map((dim, index) => (
                <Col span={12} key={index}>
                  <Card size="small">
                    <Space style={{ marginBottom: 8 }}>
                      <span style={{ color: dim.color, fontSize: 18 }}>{dim.icon}</span>
                      <Text strong>{dim.name}</Text>
                      <Tag color={getScoreLevel(dim.score).color} style={{ marginLeft: 'auto' }}>
                        {dim.score}分
                      </Tag>
                    </Space>
                    <Progress
                      percent={(dim.score / dim.maxScore) * 100}
                      strokeColor={dim.color}
                      showInfo={false}
                      size="small"
                    />
                    <p style={{ marginTop: 8, color: '#999', fontSize: 12 }}>
                      该维度评估得分 {dim.score}/{dim.maxScore}
                    </p>
                  </Card>
                </Col>
              ))}
            </Row>
          </Card>

          <Card title="测评记录" style={{ marginTop: 16 }}>
            {assessments.length === 0 ? (
              <Text type="secondary">暂无测评记录</Text>
            ) : (
              <List
                dataSource={assessments}
                renderItem={(item) => (
                  <List.Item key={item.id}>
                    <List.Item.Meta
                      title={
                        <Space>
                          {item.questionBankName || '测评'}
                          {item.hasDispute && <Tag color="red">有争议</Tag>}
                        </Space>
                      }
                      description={
                        <Space>
                          <Text type="secondary">
                            得分：{item.earnedScore !== undefined ? `${item.earnedScore}/${item.totalScore}` : '待评分'}
                          </Text>
                          <Text type="secondary">
                            状态：{item.status}
                          </Text>
                        </Space>
                      }
                    />
                    <Tag color="blue">{item.status}</Tag>
                  </List.Item>
                )}
              />
            )}
          </Card>

          <Card title="面试记录" style={{ marginTop: 16 }}>
            {interviews.length === 0 ? (
              <Text type="secondary">暂无面试记录</Text>
            ) : (
              <List
                dataSource={interviews}
                renderItem={(item) => (
                  <List.Item key={item.id}>
                    <List.Item.Meta
                      title={
                        <Space>
                          第{item.round}轮面试
                          <Tag color="blue">{item.interviewType || '技术面'}</Tag>
                        </Space>
                      }
                      description={
                        <Space direction="vertical" size={0}>
                          <Text type="secondary">面试官：{item.interviewerName || '-'}</Text>
                          <Text type="secondary">评价：{item.feedback || '暂无评价'}</Text>
                        </Space>
                      }
                    />
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 20, fontWeight: 'bold', color: '#1677ff' }}>
                        {item.score !== undefined && item.score !== null ? item.score : '-'}
                      </div>
                      <div style={{ fontSize: 12, color: '#999' }}>评分</div>
                    </div>
                  </List.Item>
                )}
              />
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default AbilityProfile;
