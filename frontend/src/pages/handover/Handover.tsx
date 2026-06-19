import { useEffect, useState } from 'react';
import {
  Card, Row, Col, Statistic, Tag, List, Button, Avatar, Progress,
  Space, Badge, Tooltip, Drawer, Descriptions, Timeline, Modal, Form,
  Input, message, Divider, Tabs, Empty, Alert, Popconfirm
} from 'antd';
import {
  WarningOutlined, ClockCircleOutlined, FileTextOutlined,
  CheckCircleOutlined, UserOutlined, PhoneOutlined, GiftOutlined,
  CalendarOutlined, PlayCircleOutlined, EditOutlined, PlusOutlined,
  EyeOutlined, RightOutlined, TeamOutlined, ArrowUpOutlined,
  HistoryOutlined, MessageOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { reportApi, todoApi, memberApi } from '../../services/api';
import dayjs from 'dayjs';
import {
  memberLevelColor, memberLevelLabel, memberStatusColor, memberStatusLabel,
  todoPriorityColor, todoPriorityLabel, todoStatusColor, todoStatusLabel,
  todoTypeLabel, checkInStatusColor, checkInStatusLabel, campStatusColor, campStatusLabel,
  courseTypeLabel
} from '../../types';
import type { CheckInStatus, TodoPriority, TodoStatus } from '../../types';

export default function Handover() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [memberDetail, setMemberDetail] = useState<any>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [todoOpen, setTodoOpen] = useState(false);
  const [todoForm] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [activeMember, setActiveMember] = useState<any>(null);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [res, todoStats, memberStats] = await Promise.all([
        reportApi.handover(),
        todoApi.boardStats(),
        memberApi.summary()
      ]);
      setData(res);
      setStats({ todo: todoStats, member: memberStats });
    } finally { setLoading(false); }
  };

  const openMember = async (member: any) => {
    setActiveMember(member);
    try {
      setDetailLoading(true);
      setDetailOpen(true);
      const res = await memberApi.detail(member.id || member.memberId);
      setMemberDetail(res);
    } finally { setDetailLoading(false); }
  };

  const completeTodo = async (todoId: number) => {
    try {
      await todoApi.update(todoId, { status: 'COMPLETED' });
      message.success('已完成');
      loadData();
    } catch {}
  };

  const submitTodo = async (values: any) => {
    try {
      setSubmitting(true);
      await todoApi.create({
        ...values,
        memberId: activeMember?.id || activeMember?.memberId,
        dueDate: values.dueDate?.toDate()
      });
      message.success('待办已创建');
      setTodoOpen(false);
      todoForm.resetFields();
      loadData();
    } finally { setSubmitting(false); }
  };

  const QuickStat = ({ icon, label, value, suffix, color, bg, onClick, sub }: any) => (
    <Card hoverable size="small" bordered={false}
      style={{ background: bg, cursor: onClick ? 'pointer' : undefined }}
      onClick={onClick}
      styles={{ body: { padding: 14 } }}
    >
      <Row align="middle" gutter={12}>
        <Col span={6}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, color }}>{icon}</div>
        </Col>
        <Col span={18}>
          <div style={{ color: '#666', fontSize: 12 }}>{label}</div>
          <div style={{ fontSize: 26, fontWeight: 600, color, lineHeight: 1.2, marginTop: 2 }}>
            {value}<span style={{ fontSize: 13, fontWeight: 400, color: '#999', marginLeft: 4 }}>{suffix}</span>
          </div>
          {sub && <div style={{ fontSize: 11, color: '#999', marginTop: 2 }}>{sub}</div>}
        </Col>
      </Row>
    </Card>
  );

  const MemberCard = ({ member, type }: any) => {
    const mid = member.id || member.memberId;
    const mname = member.name || member.member?.name;
    const mphone = member.phone || member.member?.phone;
    const mlevel = member.level || member.member?.level;
    const mstatus = member.status || member.member?.status;
    const childName = member.childName || member.member?.childName;
    return (
      <Card size="small" hoverable bordered={false} style={{ background: '#fafafa', marginBottom: 8 }}
        onClick={() => openMember(member)}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ display: 'flex', gap: 10, flex: 1, minWidth: 0 }}>
            <Avatar style={{ backgroundColor: type === 'lagging' ? '#ff4d4f' : type === 'expiring' ? '#faad14' : '#1677ff', flexShrink: 0 }}>
              <UserOutlined />
            </Avatar>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                <span style={{ fontWeight: 500 }}>{mname}</span>
                <Tag color={memberLevelColor[mlevel as keyof typeof memberLevelColor]} style={{ margin: 0, fontSize: 11 }}>
                  {memberLevelLabel[mlevel as keyof typeof memberLevelLabel]}
                </Tag>
                <Tag color={memberStatusColor[mstatus as keyof typeof memberStatusColor]} style={{ margin: 0, fontSize: 11 }}>
                  {memberStatusLabel[mstatus as keyof typeof memberStatusLabel]}
                </Tag>
                {type === 'lagging' && (
                  <span className="tag-lagging">掉队{member.lagDays || member.laggingDays || 0}天</span>
                )}
                {type === 'expiring' && member.daysLeft !== undefined && (
                  <span className="tag-expiring">{member.daysLeft}天到期</span>
                )}
              </div>
              <div style={{ fontSize: 12, color: '#999', marginBottom: 2 }}>
                <PhoneOutlined /> {mphone}
                {childName && <span style={{ marginLeft: 10 }}>👶 {childName}</span>}
              </div>
              {type === 'lagging' && (
                <div style={{ fontSize: 12, color: '#ff4d4f', marginTop: 2 }}>
                  <WarningOutlined /> {member.reason || `最近未打卡，上次：${member.lastCheckInAt ? dayjs(member.lastCheckInAt).fromNow() : '未打卡'}`}
                </div>
              )}
              {type === 'expiring' && member.conversionSource && (
                <div style={{ fontSize: 12, color: '#666', marginTop: 2 }}>
                  来源：{member.conversionSource.name}
                </div>
              )}
            </div>
          </div>
          <Button type="text" size="small" icon={<EyeOutlined />} onClick={(e) => { e.stopPropagation(); navigate(`/members/${mid}`); }}>
            完整档案
          </Button>
        </div>
      </Card>
    );
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 style={{ margin: 0 }}>
            交接班视图
            <Tag color="processing" style={{ marginLeft: 12, fontSize: 12 }}>
              {dayjs().format('YYYY年MM月DD日 HH:mm')}
            </Tag>
          </h2>
          <div style={{ color: '#999', fontSize: 13, marginTop: 4 }}>
            快速了解待办、掉队、到期情况，重要信息无需跳转即可处理
          </div>
        </div>
        <Space>
          <Alert type="info" showIcon message={
            <Space>
              <span>今日已完成：{data?.todayStats?.completedTodos || 0} 个待办</span>
              <Divider type="vertical" style={{ margin: 0 }} />
              <span>跟进次数：{data?.todayStats?.followUpCount || 0}</span>
            </Space>
          } />
          <Button type="primary" icon={<RightOutlined />} onClick={() => navigate('/todos')}>
            进入待办中心
          </Button>
        </Space>
      </div>

      <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
        <Col xs={12} sm={8} md={4}>
          <QuickStat icon={<FileTextOutlined />} label="待处理待办" value={data?.todayStats?.pendingCount || 0} suffix="件"
            color="#fa8c16" bg="linear-gradient(135deg, #fff7e6, #ffe7ba)" onClick={() => navigate('/todos')} />
        </Col>
        <Col xs={12} sm={8} md={4}>
          <QuickStat icon={<WarningOutlined />} label="掉队学员" value={data?.todayStats?.laggingCount || 0} suffix="人"
            color="#ff4d4f" bg="linear-gradient(135deg, #fff2f0, #ffccc7)" onClick={() => navigate('/lagging')} />
        </Col>
        <Col xs={12} sm={8} md={4}>
          <QuickStat icon={<ClockCircleOutlined />} label="即将到期" value={data?.todayStats?.expiringCount || 0} suffix="人"
            color="#faad14" bg="linear-gradient(135deg, #fffbe6, #fff1b8)" onClick={() => { }} />
        </Col>
        <Col xs={12} sm={8} md={4}>
          <QuickStat icon={<CheckCircleOutlined />} label="累计会员" value={stats?.member?.total || 0} suffix="人"
            color="#52c41a" bg="linear-gradient(135deg, #f6ffed, #d9f7be)" onClick={() => navigate('/members')} />
        </Col>
        <Col xs={12} sm={8} md={4}>
          <QuickStat icon={<ArrowUpOutlined />} label="今日新增" value={stats?.member?.todayNew || 0} suffix="人"
            color="#722ed1" bg="linear-gradient(135deg, #f9f0ff, #efdbff)" />
        </Col>
        <Col xs={12} sm={8} md={4}>
          <QuickStat icon={<CalendarOutlined />} label="今日打卡" value={stats?.member?.todayCheckIn || 0} suffix="次"
            color="#1677ff" bg="linear-gradient(135deg, #e6f4ff, #bae0ff)" onClick={() => navigate('/checkin')} />
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={10}>
          <div className="handover-panel">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                <FileTextOutlined style={{ color: '#fa8c16' }} /> 紧急 & 高优先级待办
                <Badge count={data?.pendingTodos?.length || 0} size="small" style={{ backgroundColor: '#fa8c16' }} />
              </h3>
              <Space>
                <Tag color="error">紧急</Tag>
                <Tag color="orange">高</Tag>
                <Button type="link" size="small" icon={<PlusOutlined />} onClick={() => { setActiveMember(null); todoForm.resetFields(); setTodoOpen(true); }}>
                  新建
                </Button>
              </Space>
            </div>

            {!data?.pendingTodos?.length ? (
              <Empty description="太棒了！没有紧急待办" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            ) : (
              <List
                size="small"
                dataSource={data.pendingTodos.slice(0, 12)}
                renderItem={(t: any) => (
                  <List.Item
                    actions={[
                      <Popconfirm key="done" title="标记完成？" onConfirm={() => completeTodo(t.id)}>
                        <Button type="link" size="small" icon={<CheckCircleOutlined />} style={{ color: '#52c41a' }}>完成</Button>
                      </Popconfirm>,
                      <Button key="detail" type="link" size="small" icon={<EyeOutlined />} onClick={() => navigate('/todos')}>详情</Button>
                    ]}
                    className={`${t.priority === 'URGENT' ? 'urgent-todo' : t.priority === 'HIGH' ? 'high-todo' : t.priority === 'MEDIUM' ? 'medium-todo' : 'low-todo'}`}
                    style={{ padding: '10px 12px', marginBottom: 6, borderRadius: 6, background: '#fff', border: '1px solid #f0f0f0' }}
                  >
                    <List.Item.Meta
                      style={{ display: 'flex', alignItems: 'flex-start', minWidth: 0 }}
                      avatar={t.member ? (
                        <Avatar size={32} style={{ backgroundColor: '#1677ff', cursor: 'pointer' }} onClick={() => openMember(t.member)}>
                          {t.member.name.charAt(0)}
                        </Avatar>
                      ) : (
                        <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#e6f4ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1677ff' }}>
                          <FileTextOutlined />
                        </div>
                      )}
                      title={
                        <div style={{ minWidth: 0 }}>
                          <Space size={6} wrap style={{ marginBottom: 4 }}>
                            <Tag color={todoPriorityColor[t.priority as TodoPriority]} style={{ margin: 0, fontSize: 11 }}>
                              {todoPriorityLabel[t.priority as TodoPriority]}
                            </Tag>
                            <Tag color={todoStatusColor[t.status as TodoStatus]} style={{ margin: 0, fontSize: 11 }}>
                              {todoStatusLabel[t.status as TodoStatus]}
                            </Tag>
                            <Tag color="geekblue" style={{ margin: 0, fontSize: 11 }}>
                              {todoTypeLabel[t.type as keyof typeof todoTypeLabel]}
                            </Tag>
                            <span style={{ fontWeight: 500, fontSize: 13 }}>{t.title}</span>
                          </Space>
                        </div>
                      }
                      description={
                        <div style={{ fontSize: 12, color: '#666', display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                          {t.assignee && <span>👤 {t.assignee.name}</span>}
                          {t.dueDate && (
                            <span style={{ color: t.isOverdue ? '#ff4d4f' : '#999' }}>
                              ⏰ {t.isOverdue ? '已过期 ' : ''}{dayjs(t.dueDate).format('MM-DD HH:mm')}
                            </span>
                          )}
                          {t.member && (
                            <a onClick={(e) => { e.stopPropagation(); openMember(t.member); }} style={{ color: '#1677ff' }}>
                              <UserOutlined /> {t.member.name}
                            </a>
                          )}
                        </div>
                      }
                    />
                  </List.Item>
                )}
              />
            )}
          </div>
        </Col>

        <Col xs={24} lg={7}>
          <div className="handover-panel">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                <WarningOutlined style={{ color: '#ff4d4f' }} /> 掉队学员
                <Badge count={data?.laggingStudents?.length || 0} size="small" />
              </h3>
              <Button type="link" size="small" onClick={() => navigate('/lagging')}>
                掉队管理 <RightOutlined />
              </Button>
            </div>

            {!data?.laggingStudents?.length ? (
              <Empty description="暂无掉队学员，运营得很好！" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            ) : (
              data.laggingStudents.slice(0, 10).map((m: any, i: number) => (
                <MemberCard key={i} member={m} type="lagging" />
              ))
            )}
          </div>
        </Col>

        <Col xs={24} lg={7}>
          <div className="handover-panel">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                <ClockCircleOutlined style={{ color: '#faad14' }} /> 即将到期会员
                <Badge count={data?.expiringMembers?.length || 0} size="small" style={{ backgroundColor: '#faad14' }} />
              </h3>
              <Button type="link" size="small" onClick={() => navigate('/members')}>
                会员列表 <RightOutlined />
              </Button>
            </div>

            {!data?.expiringMembers?.length ? (
              <Empty description="近期没有到期的会员" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            ) : (
              data.expiringMembers.slice(0, 10).map((m: any, i: number) => (
                <MemberCard key={i} member={m} type="expiring" />
              ))
            )}
          </div>
        </Col>
      </Row>

      <Drawer
        title={
          <Space>
            <Avatar style={{ backgroundColor: '#1677ff' }}>{activeMember?.name?.charAt(0) || '?'}</Avatar>
            <div>
              <div style={{ fontWeight: 600 }}>{activeMember?.name || activeMember?.member?.name}</div>
              <div style={{ fontSize: 12, color: '#999' }}>快速处理视图 · 少跳转，信息全</div>
            </div>
          </Space>
        }
        open={detailOpen}
        onClose={() => { setDetailOpen(false); setMemberDetail(null); }}
        width={820}
        extra={
          <Space>
            <Button icon={<MessageOutlined />} onClick={() => { setActiveMember(memberDetail); todoForm.resetFields(); setTodoOpen(true); }}>
              建待办
            </Button>
            <Button type="primary" icon={<EyeOutlined />} onClick={() => navigate(`/members/${memberDetail?.id}`)}>
              完整档案
            </Button>
          </Space>
        }
      >
        {detailLoading ? (
          <Empty description="加载中..." />
        ) : !memberDetail ? (
          <Empty description="暂无数据" />
        ) : (
          <div>
            <Alert
              message={memberDetail.isLagging
                ? `⚠ 掉队 ${memberDetail.laggingDays} 天，需立即跟进`
                : memberDetail.isExpiringSoon
                  ? `⏰ ${memberDetail.daysUntilExpire} 天后到期，请准备续费沟通`
                  : memberDetail.status === 'EXPIRED'
                    ? '❌ 会员已过期，请跟进续费或流失原因'
                    : '✅ 会员状态正常，保持关注'
              }
              type={memberDetail.isLagging || memberDetail.status === 'EXPIRED' ? 'error' : memberDetail.isExpiringSoon ? 'warning' : 'success'}
              showIcon
              style={{ marginBottom: 16 }}
            />

            <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
              <Col span={6}>
                <Statistic title="累计打卡" value={memberDetail.totalCheckInDays} suffix="天"
                  valueStyle={{ fontSize: 20, color: '#52c41a' }} />
              </Col>
              <Col span={6}>
                <Statistic title="连续打卡" value={memberDetail.continuousDays} suffix="天"
                  valueStyle={{ fontSize: 20, color: memberDetail.continuousDays >= 7 ? '#52c41a' : '#faad14' }} />
              </Col>
              <Col span={6}>
                <Statistic title="参加营期" value={memberDetail.memberCamps?.length || 0} suffix="个"
                  valueStyle={{ fontSize: 20, color: '#1677ff' }} />
              </Col>
              <Col span={6}>
                <Statistic title="有效期剩余" value={memberDetail.daysUntilExpire ?? '—'} suffix={memberDetail.daysUntilExpire !== null ? '天' : ''}
                  valueStyle={{ fontSize: 20, color: memberDetail.daysUntilExpire !== null && memberDetail.daysUntilExpire <= 7 ? '#ff4d4f' : '#722ed1' }} />
              </Col>
            </Row>

            <Tabs
              size="small"
              defaultActiveKey="overview"
              items={[
                {
                  key: 'overview',
                  label: '📋 基础信息 + 权益',
                  children: (
                    <Row gutter={[16, 0]}>
                      <Col span={14}>
                        <Descriptions column={1} size="small" bordered>
                          <Descriptions.Item label="孩子">{memberDetail.childName || '未填'} {memberDetail.childAge && `（${memberDetail.childAge}岁）`}</Descriptions.Item>
                          <Descriptions.Item label="手机号"><a href={`tel:${memberDetail.phone}`}><PhoneOutlined /> {memberDetail.phone}</a></Descriptions.Item>
                          <Descriptions.Item label="等级">
                            <Tag color={memberLevelColor[memberDetail.level as keyof typeof memberLevelColor]}>
                              {memberLevelLabel[memberDetail.level as keyof typeof memberLevelLabel]}
                            </Tag>
                            <Tag color={memberStatusColor[memberDetail.status as keyof typeof memberStatusColor]} style={{ marginLeft: 6 }}>
                              {memberStatusLabel[memberDetail.status as keyof typeof memberStatusLabel]}
                            </Tag>
                          </Descriptions.Item>
                          <Descriptions.Item label="来源">
                            {memberDetail.conversionSource?.name || '未记录'}
                            {memberDetail.sourceDetail && <span style={{ color: '#999', marginLeft: 8 }}>· {memberDetail.sourceDetail}</span>}
                          </Descriptions.Item>
                          <Descriptions.Item label="有效期">
                            {memberDetail.subscribedAt ? dayjs(memberDetail.subscribedAt).format('YYYY-MM-DD') : '—'}
                            <span style={{ margin: '0 6px' }}>~</span>
                            <span style={{ color: memberDetail.isExpiringSoon ? '#faad14' : undefined }}>
                              {memberDetail.expiresAt ? dayjs(memberDetail.expiresAt).format('YYYY-MM-DD') : '—'}
                            </span>
                          </Descriptions.Item>
                          <Descriptions.Item label="标签">{memberDetail.tags || '—'}</Descriptions.Item>
                          <Descriptions.Item label="备注">{memberDetail.remark || '暂无'}</Descriptions.Item>
                        </Descriptions>
                      </Col>
                      <Col span={10}>
                        <Card size="small" title={<span><GiftOutlined /> 会员权益</span>} bordered={false} styles={{ body: { padding: 8 } }}>
                          <List size="small" dataSource={memberDetail.benefits || []}
                            locale={{ emptyText: '暂无权益' }}
                            renderItem={(b: any) => (
                              <List.Item style={{ padding: '6px 0' }}>
                                <List.Item.Meta
                                  avatar={<GiftOutlined style={{ color: '#1677ff' }} />}
                                  title={<span style={{ fontSize: 12, fontWeight: 500 }}>{b.name}</span>}
                                  description={
                                    <div style={{ fontSize: 11, color: '#999' }}>
                                      <Tag color="blue" style={{ fontSize: 10 }}>{b.benefitType}</Tag>
                                      {b.totalCount !== null && <span style={{ marginLeft: 4 }}>{b.usedCount}/{b.totalCount}</span>}
                                    </div>
                                  }
                                />
                              </List.Item>
                            )}
                          />
                        </Card>
                      </Col>
                    </Row>
                  )
                },
                {
                  key: 'checkins',
                  label: '✅ 打卡情况',
                  children: (
                    <div>
                      {memberDetail.memberCamps?.map((mc: any, idx: number) => {
                        const campCheckIns = memberDetail.checkIns?.filter((c: any) => c.campId === mc.campId) || [];
                        return (
                          <Card key={idx} size="small" bordered={false} style={{ background: '#fafafa', marginBottom: 12 }}
                            title={<Space>
                              {mc.camp.name}
                              <Tag color={campStatusColor[mc.camp.status as keyof typeof campStatusColor]}>
                                {campStatusLabel[mc.camp.status as keyof typeof campStatusLabel]}
                              </Tag>
                              <span style={{ color: '#999', fontSize: 12 }}>完成 {mc.completedDays || 0}/{mc.camp.totalDays} 天 · 完成率 {mc.completionRate || 0}%</span>
                            </Space>}
                          >
                            <div className="checkin-grid" style={{ marginBottom: 8 }}>
                              {Array.from({ length: mc.camp.totalDays }).map((_, i) => {
                                const day = i + 1;
                                const ci = campCheckIns.find((x: any) => x.dayIndex === day);
                                const future = mc.camp.status !== 'COMPLETED' && day > mc.pastDays;
                                const cls = ci ? ci.status.toLowerCase() : future ? 'future' : 'pending';
                                return (
                                  <Tooltip key={i} title={ci ? `D${day} ${checkInStatusLabel[ci.status as CheckInStatus]}${ci.score ? ' 评分' + ci.score : ''}` : `D${day}`}>
                                    <div className={`checkin-cell ${cls}`}>
                                      <div style={{ fontWeight: 600 }}>{day}</div>
                                    </div>
                                  </Tooltip>
                                );
                              })}
                            </div>
                            <Progress percent={mc.progress || 0} size="small" status={mc.progress >= 80 ? 'success' : 'active'} />
                          </Card>
                        );
                      })}
                      {!memberDetail.memberCamps?.length && <Empty description="还未参加任何营期" />}
                    </div>
                  )
                },
                {
                  key: 'trial',
                  label: '▶ 试看片段',
                  children: (
                    !memberDetail.trialCourses?.length ? (
                      <Empty description="当前没有可试看的课程片段" />
                    ) : (
                      <Row gutter={[12, 12]}>
                        {memberDetail.trialCourses.map((c: any, i: number) => (
                          <Col xs={12} md={8} key={i}>
                            <Card size="small" hoverable bordered
                              cover={<div style={{ height: 100, background: `linear-gradient(135deg, ${['#667eea', '#f093fb', '#4facfe', '#43e97b', '#fa709a'][c.id % 5]} 0%, ${['#764ba2', '#f5576c', '#00f2fe', '#38f9d7', '#30cfd0'][c.id % 5]} 100%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 32 }}>
                                <PlayCircleOutlined />
                              </div>}
                            >
                              <div style={{ fontSize: 11, marginBottom: 4 }}>
                                <Tag color="blue" style={{ fontSize: 10 }}>D{c.dayIndex}</Tag>
                                <Tag color="geekblue" style={{ fontSize: 10 }}>{c.campName}</Tag>
                              </div>
                              <div style={{ fontSize: 13, fontWeight: 500, lineHeight: 1.3 }}>{c.title}</div>
                              <div style={{ fontSize: 11, color: '#666', marginTop: 4 }}>
                                {courseTypeLabel[c.type as keyof typeof courseTypeLabel]}
                                {c.trialDuration && ` · ${Math.floor(c.trialDuration / 60)}分钟`}
                              </div>
                            </Card>
                          </Col>
                        ))}
                      </Row>
                    )
                  )
                },
                {
                  key: 'todos',
                  label: '📝 待办跟进',
                  children: (
                    !memberDetail.todos?.length && !memberDetail.laggingRecords?.length ? (
                      <Empty description="暂无待办或跟进记录" />
                    ) : (
                      <div>
                        {memberDetail.todos?.length > 0 && (
                          <div style={{ marginBottom: 16 }}>
                            <Divider orientation="left" style={{ margin: '8px 0' }} plain>未完成待办</Divider>
                            <List size="small" dataSource={memberDetail.todos}
                              renderItem={(t: any) => (
                                <List.Item
                                  actions={[
                                    <Popconfirm key="done" title="完成？" onConfirm={() => completeTodo(t.id)}>
                                      <Button type="link" size="small" icon={<CheckCircleOutlined />} />
                                    </Popconfirm>
                                  ]}
                                  className={`${t.priority === 'URGENT' ? 'urgent-todo' : t.priority === 'HIGH' ? 'high-todo' : 'medium-todo'}`}
                                  style={{ padding: '8px 12px', borderRadius: 6, marginBottom: 6, background: '#fafafa' }}
                                >
                                  <List.Item.Meta
                                    title={<Space size={6}>
                                      <Tag color={todoPriorityColor[t.priority as TodoPriority]} style={{ margin: 0, fontSize: 11 }}>
                                        {todoPriorityLabel[t.priority as TodoPriority]}
                                      </Tag>
                                      <span style={{ fontWeight: 500, fontSize: 13 }}>{t.title}</span>
                                    </Space>}
                                    description={<div style={{ fontSize: 11, color: '#999' }}>
                                      <Tag color="default" style={{ fontSize: 10 }}>{todoTypeLabel[t.type as keyof typeof todoTypeLabel]}</Tag>
                                      {t.assignee && <span style={{ margin: '0 6px' }}>指派：{t.assignee.name}</span>}
                                    </div>}
                                  />
                                </List.Item>
                              )}
                            />
                          </div>
                        )}
                        {memberDetail.laggingRecords?.length > 0 && (
                          <div>
                            <Divider orientation="left" style={{ margin: '8px 0' }} plain>掉队跟进记录</Divider>
                            <Timeline
                              items={memberDetail.laggingRecords.map((lr: any) => ({
                                color: lr.followUpStatus === 'RESOLVED' ? 'green' : lr.followUpStatus === 'FOLLOWING' ? 'blue' : 'red',
                                children: (
                                  <Card size="small" bordered={false}
                                    style={{ background: lr.followUpStatus === 'RESOLVED' ? '#f6ffed' : '#fff2f0', padding: 8 }}>
                                    <Space style={{ marginBottom: 4 }}>
                                      <Tag color={lr.followUpStatus === 'RESOLVED' ? 'success' : lr.followUpStatus === 'FOLLOWING' ? 'processing' : 'warning'} style={{ fontSize: 11 }}>
                                        {lr.followUpStatus === 'RESOLVED' ? '已恢复' : lr.followUpStatus === 'FOLLOWING' ? '跟进中' : '待处理'}
                                      </Tag>
                                      <Tag color="red" style={{ fontSize: 11 }}>连续 {lr.lagDays} 天</Tag>
                                      <span style={{ fontSize: 11, color: '#999' }}>{dayjs(lr.detectedAt).format('MM-DD HH:mm')}</span>
                                    </Space>
                                    <div style={{ fontSize: 12 }}>{lr.reason || '未填写原因'}</div>
                                    {lr.followUpRemark && <div style={{ fontSize: 11, color: '#666', marginTop: 4, padding: 6, background: '#fff', borderRadius: 4 }}>💬 {lr.followUpRemark}</div>}
                                  </Card>
                                )
                              }))}
                            />
                          </div>
                        )}
                      </div>
                    )
                  )
                },
                {
                  key: 'logs',
                  label: <span><HistoryOutlined /> 操作历史</span>,
                  children: (
                    <Timeline
                      items={memberDetail.operationLogs?.slice(0, 20).map((log: any) => ({
                        color: log.action === 'CHECK_IN' ? 'green' : log.action === 'DELETE' ? 'gray' : 'blue',
                        label: <span style={{ fontSize: 11, color: '#999' }}>{dayjs(log.createdAt).format('MM-DD HH:mm')}</span>,
                        children: (
                          <div style={{ fontSize: 12 }}>
                            <Space size={4}>
                              <Tag color="geekblue" style={{ fontSize: 10 }}>{log.operator?.name}</Tag>
                              <Tag color="purple" style={{ fontSize: 10 }}>{log.action}</Tag>
                              <span>{log.targetName}</span>
                            </Space>
                            {log.detail && <div style={{ color: '#666', marginTop: 2 }}>{log.detail}</div>}
                          </div>
                        )
                      }))}
                    />
                  )
                }
              ]}
            />
          </div>
        )}
      </Drawer>

      <Modal title="新建待办" open={todoOpen}
        onCancel={() => setTodoOpen(false)} onOk={() => todoForm.submit()} confirmLoading={submitting}>
        <Form form={todoForm} layout="vertical" onFinish={submitTodo}
          initialValues={{ type: activeMember ? (activeMember.laggingDays ? 'LAGGING_STUDENT' : activeMember.daysLeft ? 'COURSE_EXPIRE' : 'FOLLOW_UP') : 'CUSTOM', priority: 'MEDIUM' }}>
          <Form.Item name="title" label="待办标题" rules={[{ required: true }]}><Input /></Form.Item>
          <Row gutter={12}>
            <Col span={8}>
              <Form.Item name="type" label="类型">
                <Select options={[
                  { label: '跟进回访', value: 'FOLLOW_UP' },
                  { label: '课程过期', value: 'COURSE_EXPIRE' },
                  { label: '掉队学员', value: 'LAGGING_STUDENT' },
                  { label: '自定义', value: 'CUSTOM' }
                ]} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="priority" label="优先级" rules={[{ required: true }]}>
                <Select options={[
                  { label: '低', value: 'LOW' }, { label: '中', value: 'MEDIUM' },
                  { label: '高', value: 'HIGH' }, { label: '紧急', value: 'URGENT' }
                ]} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="dueDate" label="截止"><DatePicker showTime style={{ width: '100%' }} /></Form.Item>
            </Col>
          </Row>
          <Form.Item name="description" label="描述"><Input.TextArea rows={3} /></Form.Item>
          {activeMember && (
            <Alert type="info" showIcon message={`关联会员：${activeMember.name || activeMember.member?.name}`} />
          )}
        </Form>
      </Modal>
    </div>
  );
}

import { Select, DatePicker } from 'antd';
