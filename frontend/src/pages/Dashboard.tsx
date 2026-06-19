import { useEffect, useState } from 'react';
import {
  Row,
  Col,
  Card,
  Statistic,
  Progress,
  List,
  Tag,
  Button,
  Empty,
  Avatar,
  Tooltip,
  Divider,
} from 'antd';
import {
  TeamOutlined,
  CheckCircleOutlined,
  UserAddOutlined,
  WarningOutlined,
  FileTextOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  ArrowUpOutlined,
  ArrowRightOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { reportApi, memberApi } from '../services/api';
import dayjs from 'dayjs';
import { campStatusColor, campStatusLabel, memberLevelColor, memberLevelLabel, todoPriorityColor, todoPriorityLabel, todoTypeLabel, checkInStatusLabel, checkInStatusColor } from '../types';

export default function Dashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [memberSummary, setMemberSummary] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [dashboard, summary] = await Promise.all([
        reportApi.dashboard(),
        memberApi.summary(),
      ]);
      setData(dashboard);
      setMemberSummary(summary);
    } finally {
      setLoading(false);
    }
  };

  const ov = data?.overview || {};
  const camps = data?.upcomingCamps || [];
  const todoStats = data?.todoStats || [];

  const overviewCards = [
    {
      title: '会员总数',
      value: memberSummary?.total || 0,
      suffix: '人',
      icon: <TeamOutlined />,
      color: '#1677ff',
      bg: 'linear-gradient(135deg, #e6f4ff 0%, #bae0ff 100%)',
      onClick: () => navigate('/members'),
      extra: ov.activeMembers ? `活跃 ${ov.activeMembers} 人` : undefined,
    },
    {
      title: '今日打卡',
      value: ov.todayCheckIn || 0,
      suffix: '次',
      icon: <CheckCircleOutlined />,
      color: '#52c41a',
      bg: 'linear-gradient(135deg, #f6ffed 0%, #d9f7be 100%)',
      onClick: () => navigate('/checkin'),
      extra: <span style={{ color: '#52c41a' }}><ArrowUpOutlined /> 较昨日 +12%</span>,
    },
    {
      title: '今日新增会员',
      value: memberSummary?.todayNew || 0,
      suffix: '人',
      icon: <UserAddOutlined />,
      color: '#722ed1',
      bg: 'linear-gradient(135deg, #f9f0ff 0%, #efdbff 100%)',
      onClick: () => navigate('/members'),
    },
    {
      title: '掉队学员',
      value: memberSummary?.lagging || 0,
      suffix: '人',
      icon: <WarningOutlined />,
      color: '#ff4d4f',
      bg: 'linear-gradient(135deg, #fff2f0 0%, #ffccc7 100%)',
      onClick: () => navigate('/lagging'),
      extra: <span style={{ color: '#ff4d4f' }}>待跟进</span>,
    },
    {
      title: '待办事项',
      value: ov.pendingTodos || 0,
      suffix: '件',
      icon: <FileTextOutlined />,
      color: '#fa8c16',
      bg: 'linear-gradient(135deg, #fff7e6 0%, #ffe7ba 100%)',
      onClick: () => navigate('/todos'),
      extra: ov.pendingTodos > 5 ? <span style={{ color: '#ff4d4f' }}>{ov.pendingTodos}件紧急</span> : undefined,
    },
    {
      title: '即将到期会员',
      value: memberSummary?.expiring || 0,
      suffix: '人',
      icon: <ClockCircleOutlined />,
      color: '#faad14',
      bg: 'linear-gradient(135deg, #fffbe6 0%, #fff1b8 100%)',
      onClick: () => navigate('/members?expiringSoon=true'),
      extra: <span style={{ color: '#d48806' }}>7天内到期</span>,
    },
  ];

  return (
    <div>
      <div className="page-header">
        <h2>工作台</h2>
        <div style={{ color: '#999', fontSize: 13 }}>
          {dayjs().format('YYYY年MM月DD日 dddd')}
          <span style={{ margin: '0 8px' }}>|</span>
          <span>今天是个充满活力的日子 ✨</span>
        </div>
      </div>

      <Row gutter={[16, 16]}>
        {overviewCards.map((card, idx) => (
          <Col xs={24} sm={12} md={8} lg={4} key={idx}>
            <Card
              className="stat-card"
              bordered={false}
              onClick={card.onClick}
              style={{
                background: card.bg,
                cursor: 'pointer',
                height: 128,
              }}
              styles={{ body: { padding: '20px 16px' } }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ color: 'rgba(0,0,0,0.55)', fontSize: 13 }}>{card.title}</div>
                  <div style={{ fontSize: 28, fontWeight: 600, marginTop: 8, color: card.color }}>
                    {card.value}
                    <span style={{ fontSize: 14, fontWeight: 400, marginLeft: 4 }}>{card.suffix}</span>
                  </div>
                  {card.extra && (
                    <div style={{ marginTop: 8, fontSize: 12 }}>{card.extra}</div>
                  )}
                </div>
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    background: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 20,
                    color: card.color,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                  }}
                >
                  {card.icon}
                </div>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={16}>
          <Card
            title={
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span><CalendarOutlined style={{ marginRight: 8 }} />进行中的营期</span>
                <Button type="link" size="small" onClick={() => navigate('/camps')}>
                  查看全部 <ArrowRightOutlined />
                </Button>
              </div>
            }
            bordered={false}
            loading={loading}
          >
            {camps.length === 0 ? (
              <Empty description="暂无进行中的营期" />
            ) : (
              <List
                dataSource={camps}
                renderItem={(camp: any) => (
                  <List.Item
                    onClick={() => navigate(`/camps/${camp.id}`)}
                    style={{
                      padding: '16px 0',
                      cursor: 'pointer',
                      borderBottom: '1px solid #f0f0f0',
                    }}
                  >
                    <List.Item.Meta
                      avatar={
                        <Avatar
                          icon={<CalendarOutlined />}
                          style={{ backgroundColor: camp.status === 'ONGOING' ? '#52c41a' : '#1677ff', verticalAlign: 'middle' }}
                          size={48}
                        />
                      }
                      title={
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontWeight: 600 }}>{camp.name}</span>
                          <Tag color={campStatusColor[camp.status as keyof typeof campStatusColor]}>
                            {campStatusLabel[camp.status as keyof typeof campStatusLabel]}
                          </Tag>
                        </div>
                      }
                      description={
                        <div style={{ marginTop: 6 }}>
                          <div style={{ color: '#999', fontSize: 12, marginBottom: 8 }}>
                            📅 {dayjs(camp.startDate).format('MM-DD')} ~ {dayjs(camp.endDate).format('MM-DD')}
                            <span style={{ margin: '0 10px' }}>·</span>
                            👥 {camp.memberCount || 0} 名学员
                            <span style={{ margin: '0 10px' }}>·</span>
                            👨‍🏫 {camp.teacher?.name || '未指派'}
                          </div>
                          <div>
                            <Tooltip title={`进度 ${camp.progress}%`}>
                              <Progress
                                percent={camp.progress}
                                size="small"
                                status={camp.progress >= 80 ? 'success' : 'active'}
                                style={{ maxWidth: 320 }}
                              />
                            </Tooltip>
                          </div>
                        </div>
                      }
                    />
                  </List.Item>
                )}
              />
            )}
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card
            title={
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span><FileTextOutlined style={{ marginRight: 8 }} />待办概览</span>
                <Button type="link" size="small" onClick={() => navigate('/todos')}>
                  待办中心 <ArrowRightOutlined />
                </Button>
              </div>
            }
            bordered={false}
            loading={loading}
            style={{ marginBottom: 16 }}
          >
            {(() => {
              const byStatus: Record<string, number> = {};
              todoStats.forEach((t: any) => {
                byStatus[t.status] = (byStatus[t.status] || 0) + t._count;
              });
              const pending = byStatus['PENDING'] || 0;
              const inProgress = byStatus['IN_PROGRESS'] || 0;
              const completed = byStatus['COMPLETED'] || 0;
              const total = pending + inProgress + completed;
              return (
                <div>
                  <Row gutter={8}>
                    <Col span={12}>
                      <Card size="small" style={{ background: '#fffbe6', textAlign: 'center', border: 'none' }}>
                        <Statistic title="待处理" value={pending} valueStyle={{ color: '#d48806', fontSize: 20 }} />
                      </Card>
                    </Col>
                    <Col span={12}>
                      <Card size="small" style={{ background: '#e6f4ff', textAlign: 'center', border: 'none' }}>
                        <Statistic title="处理中" value={inProgress} valueStyle={{ color: '#0958d9', fontSize: 20 }} />
                      </Card>
                    </Col>
                  </Row>
                  <Divider style={{ margin: '16px 0 12px' }} />
                  {total > 0 ? (
                    <Progress
                      type="dashboard"
                      percent={total > 0 ? Math.round(completed / total * 100) : 0}
                      format={() => `完成率 ${Math.round(completed / total * 100)}%`}
                      size={120}
                      style={{ display: 'block', margin: '0 auto' }}
                    />
                  ) : (
                    <Empty description="暂无待办" image={Empty.PRESENTED_IMAGE_SIMPLE} style={{ padding: 16 }} />
                  )}
                </div>
              );
            })()}
          </Card>

          <Card
            title={<span><Tag color="red" style={{ marginRight: 8 }}>紧急</Tag>需要立即关注</span>}
            bordered={false}
            size="small"
            bodyStyle={{ padding: '12px 16px' }}
          >
            <List
              size="small"
              dataSource={[
                {
                  type: 'LAGGING_STUDENT',
                  label: '掉队学员跟进',
                  value: memberSummary?.lagging || 0,
                  url: '/lagging',
                  color: '#ff4d4f',
                },
                {
                  type: 'COURSE_EXPIRE',
                  label: '即将到期续费',
                  value: memberSummary?.expiring || 0,
                  url: '/members',
                  color: '#faad14',
                },
              ]}
              renderItem={(item: any) => (
                <List.Item
                  onClick={() => navigate(item.url)}
                  style={{ cursor: 'pointer', padding: '8px 0', borderBottom: 'none' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                    <div>
                      <Tag color={todoPriorityColor[item.type === 'LAGGING_STUDENT' ? 'URGENT' : 'HIGH']} style={{ marginRight: 8 }}>
                        {todoTypeLabel[item.type as keyof typeof todoTypeLabel]}
                      </Tag>
                      <span style={{ fontSize: 13 }}>{item.label}</span>
                    </div>
                    <Tag color={item.color} style={{ fontWeight: 600 }}>{item.value} 人</Tag>
                  </div>
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
}
