import { useEffect, useState } from 'react';
import {
  Card, Descriptions, Tag, Button, Row, Col, Statistic, Tabs, Table, Progress, Tooltip,
  Divider, List, Avatar, Space, Badge, Modal, Form, Input, message, Popconfirm,
  Empty, Alert, Timeline, DatePicker, Select, InputNumber, Switch
} from 'antd';
import {
  ArrowLeftOutlined, EditOutlined, CheckCircleOutlined, ClockCircleOutlined,
  CalendarOutlined, FileTextOutlined, VideoCameraOutlined, PlayCircleOutlined,
  DownloadOutlined, PhoneOutlined, TeamOutlined, PlusOutlined, GiftOutlined,
  WarningOutlined, RiseOutlined, HistoryOutlined, EyeOutlined
} from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { memberApi, logApi, todoApi } from '../../services/api';
import dayjs from 'dayjs';
import {
  memberLevelColor, memberLevelLabel, memberStatusColor, memberStatusLabel,
  checkInStatusColor, checkInStatusLabel, campStatusColor, campStatusLabel,
  todoPriorityColor, todoPriorityLabel, todoStatusColor, todoStatusLabel,
  todoTypeLabel, courseTypeLabel
} from '../../types';
import type { CheckInStatus, TodoPriority, TodoStatus } from '../../types';

export default function MemberDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [benefitOpen, setBenefitOpen] = useState(false);
  const [editBenefit, setEditBenefit] = useState<any>(null);
  const [todoOpen, setTodoOpen] = useState(false);
  const [form] = Form.useForm();
  const [todoForm] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => { if (id) loadData(); }, [id]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [res, logRes] = await Promise.all([
        memberApi.detail(Number(id)),
        logApi.byMember(Number(id))
      ]);
      setDetail(res);
      setLogs(logRes);
    } finally { setLoading(false); }
  };

  const submitBenefit = async (values: any) => {
    try {
      setSubmitting(true);
      const data = {
        ...values,
        validFrom: values.validFrom?.toDate(),
        validUntil: values.validUntil?.toDate()
      };
      if (editBenefit) {
        await memberApi.updateBenefit(Number(id), editBenefit.id, data);
      } else {
        await memberApi.addBenefit(Number(id), data);
      }
      message.success('保存成功');
      setBenefitOpen(false);
      form.resetFields();
      setEditBenefit(null);
      loadData();
    } finally { setSubmitting(false); }
  };

  const submitTodo = async (values: any) => {
    try {
      setSubmitting(true);
      await todoApi.create({
        ...values,
        memberId: Number(id),
        dueDate: values.dueDate?.toDate()
      });
      message.success('待办已创建');
      setTodoOpen(false);
      todoForm.resetFields();
      loadData();
    } finally { setSubmitting(false); }
  };

  const completeTodo = async (todoId: number) => {
    await todoApi.update(todoId, { status: 'COMPLETED' });
    message.success('已完成');
    loadData();
  };

  const warnings: any[] = [];
  if (detail) {
    if (detail.status === 'EXPIRED') warnings.push({ type: 'error', msg: `会员已于 ${dayjs(detail.expiresAt).format('MM-DD')} 过期，请跟进续费` });
    else if (detail.isExpiringSoon) warnings.push({ type: 'warning', msg: `${detail.daysUntilExpire}天后到期（${dayjs(detail.expiresAt).format('MM-DD')}）` });
    if (detail.isLagging) warnings.push({ type: 'error', msg: `已掉队 ${detail.laggingDays} 天，需跟进` });
  }

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => navigate('/members')}>返回</Button>
          <h2 style={{ margin: 0 }}>
            <Badge dot status={detail?.status === 'ACTIVE' ? (detail?.isLagging ? 'error' : 'success') : 'default'} offset={[0, 2]}>
              <span style={{ marginRight: 6 }}>{detail?.name || '会员详情'}</span>
            </Badge>
            {detail && (
              <Space size={6} style={{ fontWeight: 400, fontSize: 14 }}>
                <Tag color={memberLevelColor[detail.level as keyof typeof memberLevelColor]}>
                  {memberLevelLabel[detail.level as keyof typeof memberLevelLabel]}
                </Tag>
                <Tag color={memberStatusColor[detail.status as keyof typeof memberStatusColor]}>
                  {memberStatusLabel[detail.status as keyof typeof memberStatusLabel]}
                </Tag>
                {detail.isLagging && <span className="tag-lagging">掉队{detail.laggingDays}天</span>}
                {detail.isExpiringSoon && <span className="tag-expiring">{detail.daysUntilExpire}天到期</span>}
              </Space>
            )}
          </h2>
        </div>
        <Space>
          <Button icon={<EyeOutlined />} onClick={() => navigate('/checkin')}>打卡台</Button>
          <Button icon={<PlusOutlined />} onClick={() => { todoForm.resetFields(); setTodoOpen(true); }}>新建待办</Button>
          <Button type="primary" icon={<EditOutlined />}>编辑资料</Button>
        </Space>
      </div>

      {warnings.length > 0 && (
        <Space direction="vertical" style={{ width: '100%', marginBottom: 16 }}>
          {warnings.map((w, i) => (
            <Alert key={i} type={w.type as any} showIcon message={w.msg}
              action={
                <Space>
                  {detail?.isLagging && <Button size="small" type="primary" ghost onClick={() => setTodoOpen(true)}>建跟进待办</Button>}
                  {(detail?.status === 'EXPIRED' || detail?.isExpiringSoon) && <Button size="small" type="primary" ghost>发续费提醒</Button>}
                </Space>
              }
            />
          ))}
        </Space>
      )}

      <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={12} md={6}>
          <Card size="small" bordered={false} style={{ background: 'linear-gradient(135deg, #f6ffed, #d9f7be)' }}>
            <Row align="middle" gutter={12}>
              <Col span={6}><div style={{ width: 40, height: 40, borderRadius: 10, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#52c41a', fontSize: 18 }}><CheckCircleOutlined /></div></Col>
              <Col span={18}>
                <div style={{ color: '#666', fontSize: 12 }}>累计打卡</div>
                <div style={{ fontSize: 22, fontWeight: 600, color: '#52c41a' }}>{detail?.totalCheckInDays || 0} 天</div>
              </Col>
            </Row>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card size="small" bordered={false} style={{ background: detail?.continuousDays >= 7 ? 'linear-gradient(135deg, #f6ffed, #b7eb8f)' : 'linear-gradient(135deg, #fffbe6, #fff1b8)' }}>
            <Row align="middle" gutter={12}>
              <Col span={6}><div style={{ width: 40, height: 40, borderRadius: 10, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: detail?.continuousDays >= 7 ? '#52c41a' : '#faad14', fontSize: 18 }}><CalendarOutlined /></div></Col>
              <Col span={18}>
                <div style={{ color: '#666', fontSize: 12 }}>连续打卡</div>
                <div style={{ fontSize: 22, fontWeight: 600, color: detail?.continuousDays >= 7 ? '#52c41a' : '#faad14' }}>{detail?.continuousDays || 0} 天</div>
                <div style={{ fontSize: 11, color: '#999' }}>上次：{detail?.lastCheckInAt ? dayjs(detail.lastCheckInAt).fromNow() : '未打卡'}</div>
              </Col>
            </Row>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card size="small" bordered={false} style={{ background: 'linear-gradient(135deg, #e6f4ff, #bae0ff)' }}>
            <Row align="middle" gutter={12}>
              <Col span={6}><div style={{ width: 40, height: 40, borderRadius: 10, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1677ff', fontSize: 18 }}><TeamOutlined /></div></Col>
              <Col span={18}>
                <div style={{ color: '#666', fontSize: 12 }}>参加营期</div>
                <div style={{ fontSize: 22, fontWeight: 600, color: '#1677ff' }}>{detail?.memberCamps?.length || 0} 个</div>
                <div style={{ fontSize: 11, color: '#999' }}>进行中：{detail?.memberCamps?.filter((c: any) => c.camp.status === 'ONGOING').length || 0}</div>
              </Col>
            </Row>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card size="small" bordered={false} style={{ background: detail?.daysUntilExpire !== null && detail.daysUntilExpire <= 7 ? 'linear-gradient(135deg, #fff2f0, #ffccc7)' : detail?.status === 'EXPIRED' ? 'linear-gradient(135deg, #fff2f0, #ffccc7)' : 'linear-gradient(135deg, #f9f0ff, #efdbff)' }}>
            <Row align="middle" gutter={12}>
              <Col span={6}><div style={{ width: 40, height: 40, borderRadius: 10, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: detail?.daysUntilExpire !== null && detail.daysUntilExpire <= 7 ? '#ff4d4f' : '#722ed1', fontSize: 18 }}><ClockCircleOutlined /></div></Col>
              <Col span={18}>
                <div style={{ color: '#666', fontSize: 12 }}>有效期</div>
                <div style={{ fontSize: 22, fontWeight: 600, color: detail?.daysUntilExpire !== null && detail.daysUntilExpire <= 7 ? '#ff4d4f' : detail?.status === 'EXPIRED' ? '#ff4d4f' : '#722ed1' }}>
                  {detail?.daysUntilExpire ?? '—'}{detail?.daysUntilExpire !== null ? ' 天' : ''}
                </div>
                <div style={{ fontSize: 11, color: '#999' }}>到期：{detail?.expiresAt ? dayjs(detail.expiresAt).format('MM-DD') : '—'}</div>
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>

      <Card bordered={false} style={{ marginBottom: 16 }} styles={{ body: { padding: 16 } }}>
        <Row gutter={24}>
          <Col xs={24} md={12}>
            <Descriptions column={2} size="small" bordered>
              <Descriptions.Item label="孩子" span={2}>
                <b style={{ fontSize: 15 }}>{detail?.childName || '未填写'}</b>
                {detail?.childAge && <Tag style={{ marginLeft: 8 }}>{detail.childAge}岁</Tag>}
              </Descriptions.Item>
              <Descriptions.Item label="手机号"><a href={`tel:${detail?.phone}`}><PhoneOutlined /> {detail?.phone}</a></Descriptions.Item>
              <Descriptions.Item label="微信">{detail?.wechatId || '未绑定'}</Descriptions.Item>
              <Descriptions.Item label="订阅">{detail?.subscribedAt ? dayjs(detail.subscribedAt).format('YYYY-MM-DD') : '未订阅'}</Descriptions.Item>
              <Descriptions.Item label="到期">{detail?.expiresAt ? dayjs(detail.expiresAt).format('YYYY-MM-DD') : '—'}</Descriptions.Item>
              <Descriptions.Item label="来源" span={2}>
                {detail?.conversionSource?.name ? (
                  <><Tag>{detail.conversionSource.name}</Tag>{detail.conversionSource.channel}
                    {detail.sourceDetail && <span style={{ color: '#999', marginLeft: 8 }}>· {detail.sourceDetail}</span>}</>
                ) : '未记录'}
              </Descriptions.Item>
              <Descriptions.Item label="标签" span={2}>
                {detail?.tags ? detail.tags.split(',').map((t: string, i: number) => <Tag key={i} color="blue">{t}</Tag>) : '—'}
              </Descriptions.Item>
              <Descriptions.Item label="备注" span={2}>{detail?.remark || '暂无'}</Descriptions.Item>
            </Descriptions>
          </Col>
          <Col xs={24} md={12}>
            <div className="member-detail-section">
              <div className="section-title">
                <GiftOutlined style={{ color: '#1677ff' }} /> 会员权益
                <Button type="text" size="small" icon={<PlusOutlined />} style={{ float: 'right' }}
                  onClick={() => { setEditBenefit(null); form.resetFields(); setBenefitOpen(true); }} />
              </div>
              {!detail?.benefits?.length ? <Empty description="暂无权益" image={Empty.PRESENTED_IMAGE_SIMPLE} /> : (
                <List size="small" dataSource={detail.benefits} renderItem={(b: any) => (
                  <List.Item
                    actions={[<Button key="edit" type="link" size="small" icon={<EditOutlined />}
                      onClick={() => { setEditBenefit(b); form.setFieldsValue({ ...b, validFrom: b.validFrom ? dayjs(b.validFrom) : undefined, validUntil: b.validUntil ? dayjs(b.validUntil) : undefined }); setBenefitOpen(true); }} />]}
                    style={{ padding: '8px 0' }}
                  >
                    <List.Item.Meta
                      avatar={<div style={{ width: 36, height: 36, borderRadius: 8, background: '#f0f5ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1677ff' }}><GiftOutlined /></div>}
                      title={<Space>
                        <span style={{ fontWeight: 500 }}>{b.name}</span>
                        {!b.isActive && <Tag color="default">已失效</Tag>}
                        {b.totalCount !== null && <Tag color={b.usedCount >= b.totalCount ? 'error' : 'processing'}>已用 {b.usedCount}/{b.totalCount}</Tag>}
                      </Space>}
                      description={<div style={{ fontSize: 12, color: '#999' }}>
                        <Tag color="blue" style={{ fontSize: 11 }}>{b.benefitType}</Tag>
                        {b.validFrom && <span> {dayjs(b.validFrom).format('MM-DD')} ~ {dayjs(b.validUntil).format('MM-DD')}</span>}
                      </div>}
                    />
                  </List.Item>
                )} />
              )}
            </div>

            {detail?.todos?.length > 0 && (
              <div className="member-detail-section" style={{ marginTop: 8 }}>
                <div className="section-title">
                  <FileTextOutlined style={{ color: '#fa8c16' }} /> 待处理待办
                  <Button type="text" size="small" icon={<PlusOutlined />} style={{ float: 'right' }}
                    onClick={() => { todoForm.resetFields(); setTodoOpen(true); }} />
                </div>
                <List size="small" dataSource={detail.todos} renderItem={(t: any) => (
                  <List.Item
                    actions={[<Popconfirm key="done" title="确认完成？" onConfirm={() => completeTodo(t.id)}>
                      <Button type="link" size="small" icon={<CheckCircleOutlined />} />
                    </Popconfirm>]}
                    className={`${t.priority === 'URGENT' ? 'urgent-todo' : t.priority === 'HIGH' ? 'high-todo' : t.priority === 'MEDIUM' ? 'medium-todo' : 'low-todo'}`}
                    style={{ padding: '8px 12px', borderRadius: 6, marginBottom: 6, background: '#fafafa' }}
                  >
                    <List.Item.Meta
                      title={<Space size={6}>
                        <Tag color={todoPriorityColor[t.priority as TodoPriority]} style={{ margin: 0 }}>{todoPriorityLabel[t.priority as TodoPriority]}</Tag>
                        <Tag color={todoStatusColor[t.status as TodoStatus]} style={{ margin: 0 }}>{todoStatusLabel[t.status as TodoStatus]}</Tag>
                        <span style={{ fontWeight: 500, fontSize: 13 }}>{t.title}</span>
                      </Space>}
                      description={<div style={{ fontSize: 11, color: '#999', marginTop: 2 }}>
                        <Tag color="default" style={{ fontSize: 11 }}>{todoTypeLabel[t.type as keyof typeof todoTypeLabel]}</Tag>
                        {t.assignee && <span style={{ margin: '0 6px' }}>指派：{t.assignee.name}</span>}
                        {t.dueDate && <span style={{ color: dayjs(t.dueDate).isBefore(dayjs()) ? '#ff4d4f' : undefined }}>截止：{dayjs(t.dueDate).format('MM-DD HH:mm')}</span>}
                      </div>}
                    />
                  </List.Item>
                )} />
              </div>
            )}

            {detail?.trialCourses?.length > 0 && (
              <div className="member-detail-section" style={{ marginTop: 8 }}>
                <div className="section-title"><PlayCircleOutlined style={{ color: '#722ed1' }} /> 可试看片段</div>
                <Row gutter={[8, 8]}>
                  {detail.trialCourses.slice(0, 4).map((c: any) => (
                    <Col xs={12} sm={6} key={c.id}>
                      <Card hoverable size="small" styles={{ body: { padding: 8 } }}
                        cover={<div style={{ height: 72, background: `linear-gradient(135deg, ${['#667eea', '#f093fb', '#4facfe', '#43e97b'][c.id % 4]} 0%, ${['#764ba2', '#f5576c', '#00f2fe', '#38f9d7'][c.id % 4]} 100%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 24 }}><VideoCameraOutlined /></div>}
                      >
                        <div style={{ fontSize: 10, marginBottom: 2 }}>
                          <Tag color="blue" style={{ fontSize: 10 }}>D{c.dayIndex}</Tag>
                          <Tag color="geekblue" style={{ fontSize: 10 }}>{c.campName}</Tag>
                        </div>
                        <div style={{ fontSize: 12, fontWeight: 500, lineHeight: 1.3 }}>{c.title}</div>
                      </Card>
                    </Col>
                  ))}
                </Row>
              </div>
            )}
          </Col>
        </Row>
      </Card>

      <Card bordered={false}
        tabList={[
          { key: 'overview', label: `📋 营期总览 (${detail?.memberCamps?.length || 0})` },
          { key: 'checkins', label: `✅ 打卡记录 (${detail?.checkIns?.length || 0})` },
          { key: 'lagging', label: '🚨 掉队 & 跟进' },
          { key: 'logs', label: `📝 操作历史 (${logs.length})` }
        ]}
        activeTabKey={activeTab} onTabChange={setActiveTab}
      >
        {activeTab === 'overview' && (
          !detail?.memberCamps?.length ? <Empty description="还未参加任何营期" /> : (
            <Row gutter={[16, 16]}>
              {detail.memberCamps.map((mc: any) => {
                const campCheckIns = detail.checkIns.filter((c: any) => c.campId === mc.campId);
                return (
                  <Col xs={24} md={12} key={mc.id}>
                    <Card size="small" bordered={false} style={{ background: '#fafafa' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                        <div>
                          <a onClick={() => navigate(`/camps/${mc.campId}`)} style={{ fontWeight: 500 }}>{mc.camp.name}</a>
                          <div style={{ marginTop: 4 }}>
                            <Tag color={campStatusColor[mc.camp.status as keyof typeof campStatusColor]}>
                              {campStatusLabel[mc.camp.status as keyof typeof campStatusLabel]}
                            </Tag>
                            {mc.teacher && <Tag color="purple">{mc.teacher.name}</Tag>}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: 18, fontWeight: 600, color: '#1677ff' }}>
                            {mc.completedDays || 0}<span style={{ fontSize: 12, color: '#999' }}>/{mc.camp.totalDays}</span>
                          </div>
                        </div>
                      </div>
                      <Progress percent={mc.progress || 0} size="small" />
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 10 }}>
                        {campCheckIns.slice(0, 21).map((ci: any) => (
                          <Tooltip key={ci.id} title={`D${ci.dayIndex}: ${checkInStatusLabel[ci.status as CheckInStatus]}`}>
                            <div className={`checkin-cell ${ci.status.toLowerCase()}`} style={{ width: 24, height: 24, fontSize: 9 }}>
                              {ci.dayIndex}
                            </div>
                          </Tooltip>
                        ))}
                      </div>
                    </Card>
                  </Col>
                );
              })}
            </Row>
          )
        )}

        {activeTab === 'checkins' && (
          detail?.memberCamps?.map((mc: any) => {
            const campCheckIns = detail.checkIns.filter((c: any) => c.campId === mc.campId);
            return (
              <Card key={mc.id} size="small" bordered={false} style={{ marginBottom: 16, background: '#fafafa' }}
                title={<Space>
                  <a onClick={() => navigate(`/camps/${mc.campId}`)}>{mc.camp.name}</a>
                  <Tag color={campStatusColor[mc.camp.status as keyof typeof campStatusColor]}>
                    {campStatusLabel[mc.camp.status as keyof typeof campStatusLabel]}
                  </Tag>
                  <span style={{ color: '#999', fontSize: 12 }}>
                    完成 {campCheckIns.filter((c: any) => c.status === 'COMPLETED' || c.status === 'LATE').length}/{mc.camp.totalDays}
                  </span>
                </Space>}
              >
                <div className="checkin-grid" style={{ marginBottom: 16 }}>
                  {Array.from({ length: mc.camp.totalDays }).map((_, i) => {
                    const day = i + 1;
                    const ci = campCheckIns.find((x: any) => x.dayIndex === day);
                    const future = mc.camp.status !== 'COMPLETED' && day > mc.pastDays;
                    const cls = ci ? ci.status.toLowerCase() : future ? 'future' : 'pending';
                    return (
                      <Tooltip key={i} title={ci ? `D${day}: ${checkInStatusLabel[ci.status as CheckInStatus]}${ci.score ? ' 评分' + ci.score : ''}` : `D${day}`}>
                        <div className={`checkin-cell ${cls}`}>
                          <div style={{ fontWeight: 600 }}>{day}</div>
                          <div style={{ fontSize: 10 }}>
                            {ci?.status === 'COMPLETED' ? '✓' : ci?.status === 'LATE' ? '迟' : ci?.status === 'MISSED' ? '✗' : future ? '-' : '待'}
                          </div>
                        </div>
                      </Tooltip>
                    );
                  })}
                </div>
                <Table size="small" rowKey="id" dataSource={campCheckIns.sort((a: any, b: any) => b.dayIndex - a.dayIndex)}
                  pagination={campCheckIns.length > 20 ? { pageSize: 20 } : false}
                  columns={[
                    { title: '天数', dataIndex: 'dayIndex', width: 70, render: d => <Tag color="blue">D{d}</Tag> },
                    { title: '日期', dataIndex: 'checkInDate', width: 110, render: d => dayjs(d).format('MM-DD ddd') },
                    { title: '状态', dataIndex: 'status', width: 80, render: s => <Tag color={checkInStatusColor[s as CheckInStatus]}>{checkInStatusLabel[s as CheckInStatus]}</Tag> },
                    { title: '时间', dataIndex: 'completedAt', width: 120, render: d => d ? dayjs(d).format('MM-DD HH:mm') : '—' },
                    { title: '评分', dataIndex: 'score', width: 60 },
                    { title: '备注', dataIndex: 'remark', ellipsis: true }
                  ]}
                />
              </Card>
            );
          })
        )}

        {activeTab === 'lagging' && (
          !detail?.laggingRecords?.length ? <Empty description="暂无掉队记录，表现良好！" /> : (
            <Timeline mode="left" items={detail.laggingRecords.map((lr: any) => ({
              color: lr.followUpStatus === 'RESOLVED' ? 'green' : lr.followUpStatus === 'FOLLOWING' ? 'blue' : 'red',
              label: dayjs(lr.detectedAt).format('YYYY-MM-DD HH:mm'),
              children: (
                <Card size="small" bordered={false} style={{ background: lr.followUpStatus === 'RESOLVED' ? '#f6ffed' : '#fff2f0' }}>
                  <Space style={{ marginBottom: 6 }}>
                    <Tag color={lr.followUpStatus === 'RESOLVED' ? 'success' : lr.followUpStatus === 'FOLLOWING' ? 'processing' : 'warning'}>
                      {lr.followUpStatus === 'RESOLVED' ? '已恢复' : lr.followUpStatus === 'FOLLOWING' ? '跟进中' : '待处理'}
                    </Tag>
                    <Tag color="red">连续 {lr.lagDays} 天</Tag>
                  </Space>
                  <div style={{ fontSize: 13 }}>{lr.reason || '未填写原因'}</div>
                  {lr.followUpRemark && <div style={{ fontSize: 12, color: '#666', marginTop: 6, padding: 8, background: '#fff', borderRadius: 4 }}>💬 {lr.followUpRemark}</div>}
                  {lr.followUpResult && <div style={{ fontSize: 12, color: '#52c41a', marginTop: 4 }}>✅ {lr.followUpResult}</div>}
                </Card>
              )
            }))} />
          )
        )}

        {activeTab === 'logs' && (
          !logs?.length ? <Empty description="暂无操作记录" /> : (
            <Timeline mode="left" items={logs.slice(0, 50).map(log => ({
              color: ['CHECK_IN', 'COMPLETE'].includes(log.action) ? 'green' : ['DELETE', 'LOGOUT'].includes(log.action) ? 'gray' : 'blue',
              label: <span style={{ fontSize: 12, color: '#999' }}>{dayjs(log.createdAt).format('MM-DD HH:mm')}</span>,
              children: (
                <div style={{ fontSize: 13 }}>
                  <Space size={6}>
                    <Tag color="geekblue" style={{ fontSize: 11 }}>{log.operator?.name}</Tag>
                    <Tag color="purple" style={{ fontSize: 11 }}>{log.action}</Tag>
                    <span style={{ fontWeight: 500 }}>{log.targetName}</span>
                  </Space>
                  {log.detail && <div style={{ color: '#666', marginTop: 4, fontSize: 12 }}>{log.detail}</div>}
                </div>
              )
            }))} />
          )
        )}
      </Card>

      <Modal title={editBenefit ? '编辑权益' : '添加会员权益'} open={benefitOpen}
        onCancel={() => { setBenefitOpen(false); form.resetFields(); setEditBenefit(null); }}
        onOk={() => form.submit()} confirmLoading={submitting}>
        <Form form={form} layout="vertical" onFinish={submitBenefit}>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="benefitType" label="权益类型" rules={[{ required: true }]}>
                <Select options={[
                  { label: '课程权限', value: 'COURSE' }, { label: '直播课', value: 'LIVE' },
                  { label: '学习资料', value: 'MATERIAL' }, { label: '咨询服务', value: 'COUNSELING' },
                  { label: '优惠券', value: 'COUPON' }, { label: '其他', value: 'OTHER' }
                ]} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="name" label="权益名称" rules={[{ required: true }]}><Input /></Form.Item>
            </Col>
          </Row>
          <Form.Item name="description" label="权益说明"><Input.TextArea rows={2} /></Form.Item>
          <Row gutter={12}>
            <Col span={8}>
              <Form.Item name="totalCount" label="总次数"><InputNumber min={0} style={{ width: '100%' }} /></Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="usedCount" label="已使用" initialValue={0}><InputNumber min={0} style={{ width: '100%' }} /></Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="isActive" label="是否启用" valuePropName="checked" initialValue={true}><Switch /></Form.Item>
            </Col>
          </Row>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="validFrom" label="开始日期"><DatePicker style={{ width: '100%' }} /></Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="validUntil" label="结束日期"><DatePicker style={{ width: '100%' }} /></Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      <Modal title="新建待办" open={todoOpen}
        onCancel={() => setTodoOpen(false)} onOk={() => todoForm.submit()} confirmLoading={submitting}>
        <Form form={todoForm} layout="vertical" onFinish={submitTodo} initialValues={{ type: 'CUSTOM', priority: 'MEDIUM' }}>
          <Form.Item name="title" label="待办标题" rules={[{ required: true }]}><Input /></Form.Item>
          <Row gutter={12}>
            <Col span={8}>
              <Form.Item name="type" label="类型" rules={[{ required: true }]}>
                <Select options={[
                  { label: '跟进回访', value: 'FOLLOW_UP' }, { label: '课程过期', value: 'COURSE_EXPIRE' },
                  { label: '会员预警', value: 'MEMBER_WARNING' }, { label: '掉队学员', value: 'LAGGING_STUDENT' },
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
              <Form.Item name="dueDate" label="截止时间"><DatePicker showTime style={{ width: '100%' }} /></Form.Item>
            </Col>
          </Row>
          <Form.Item name="assigneeId" label="指派给">
            <Select allowClear placeholder="不指派则为本人" />
          </Form.Item>
          <Form.Item name="description" label="详细描述"><Input.TextArea rows={3} /></Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
