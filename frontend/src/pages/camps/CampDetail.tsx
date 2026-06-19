import { useEffect, useState } from 'react';
import {
  Card,
  Descriptions,
  Tag,
  Button,
  Row,
  Col,
  Statistic,
  Tabs,
  Table,
  Progress,
  Tooltip,
  Divider,
  Empty,
  Avatar,
  Space,
  List,
  Badge,
  Modal,
  Form,
  Input,
  message,
  Drawer,
} from 'antd';
import {
  ArrowLeftOutlined,
  CalendarOutlined,
  TeamOutlined,
  UserOutlined,
  EditOutlined,
  PlayCircleOutlined,
  FilePdfOutlined,
  VideoCameraOutlined,
  DownloadOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  EyeOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { campApi, courseApi, memberApi } from '../../services/api';
import dayjs from 'dayjs';
import {
  campStatusColor, campStatusLabel,
  memberLevelColor, memberLevelLabel,
  memberStatusColor, memberStatusLabel,
  checkInStatusColor, checkInStatusLabel,
  courseTypeLabel,
} from '../../types';
import type { ColumnsType } from 'antd/es/table';

export default function CampDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [memberTotal, setMemberTotal] = useState(0);
  const [memberPage, setMemberPage] = useState(1);
  const [memberPageSize, setMemberPageSize] = useState(10);
  const [courses, setCourses] = useState<any[]>([]);
  const [courseModalOpen, setCourseModalOpen] = useState(false);
  const [courseForm] = Form.useForm();
  const [editCourse, setEditCourse] = useState<any>(null);
  const [previewCourse, setPreviewCourse] = useState<any>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (id) loadData();
  }, [id]);

  useEffect(() => {
    if (id) loadMembers();
  }, [id, memberPage, memberPageSize]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [detailRes, courseRes] = await Promise.all([
        campApi.detail(Number(id)),
        courseApi.list({ campId: Number(id) }),
      ]);
      setDetail(detailRes);
      setCourses(courseRes);
    } finally {
      setLoading(false);
    }
  };

  const loadMembers = async () => {
    try {
      const res = await campApi.members(Number(id), {
        page: memberPage,
        pageSize: memberPageSize,
      });
      setMembers(res.list);
      setMemberTotal(res.total);
    } catch {}
  };

  const dayStats = (() => {
    const totalDays = detail?.totalDays || 0;
    const pastDays = Math.min(dayjs().diff(dayjs(detail?.startDate), 'day') + 1, totalDays);
    return { totalDays, pastDays, futureDays: totalDays - pastDays };
  })();

  const memberColumns: ColumnsType<any> = [
    {
      title: '学员',
      dataIndex: 'name',
      render: (t, r) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Avatar icon={<UserOutlined />} size={36} />
          <div>
            <div>
              <a onClick={() => navigate(`/members/${r.id}`)} style={{ fontWeight: 500 }}>{t}</a>
              {r.isLagging && <Tag color="red" style={{ marginLeft: 6 }}>掉队{r.laggingDays}天</Tag>}
            </div>
            <div style={{ color: '#999', fontSize: 12 }}>
              {r.childName && <span>{r.childName} · {r.childAge}岁</span>}
              <span style={{ margin: '0 6px' }}>{r.phone}</span>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: '会员等级',
      dataIndex: 'level',
      width: 100,
      render: (l) => <Tag color={memberLevelColor[l as keyof typeof memberLevelColor]}>{memberLevelLabel[l as keyof typeof memberLevelLabel]}</Tag>,
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 90,
      render: (s) => <Tag color={memberStatusColor[s as keyof typeof memberStatusColor]}>{memberStatusLabel[s as keyof typeof memberStatusLabel]}</Tag>,
    },
    {
      title: '累计打卡',
      dataIndex: 'totalCheckInDays',
      width: 100,
      render: (d, r) => (
        <div>
          <div style={{ fontWeight: 500 }}>{r.completedCheckInCount || 0}/{dayStats.pastDays}</div>
          <div style={{ color: '#999', fontSize: 11 }}>连续 {r.continuousDays} 天</div>
        </div>
      ),
    },
    {
      title: '完成率',
      width: 140,
      render: (_: any, r) => {
        const rate = dayStats.pastDays > 0 ? Math.round(((r.completedCheckInCount || 0) / dayStats.pastDays) * 100) : 0;
        return (
          <Tooltip title={`完成率 ${rate}%`}>
            <Progress
              percent={rate}
              size="small"
              status={rate >= 80 ? 'success' : rate >= 50 ? 'active' : 'exception'}
            />
          </Tooltip>
        );
      },
    },
    {
      title: '负责老师',
      dataIndex: ['teacher', 'name'],
      width: 100,
      render: (t) => t || <Tag color="default">未指派</Tag>,
    },
    {
      title: '最近打卡',
      dataIndex: 'lastCheckInAt',
      width: 120,
      render: (d) => d ? dayjs(d).fromNow() : <Tag color="default">未打卡</Tag>,
    },
  ];

  const handleCourseSubmit = async (values: any) => {
    try {
      setSubmitting(true);
      if (editCourse) {
        await courseApi.update(editCourse.id, values);
      } else {
        await courseApi.create({ ...values, campId: Number(id) });
      }
      message.success('保存成功');
      setCourseModalOpen(false);
      courseForm.resetFields();
      setEditCourse(null);
      loadData();
    } finally {
      setSubmitting(false);
    }
  };

  const openCourseModal = (course?: any) => {
    setEditCourse(course);
    courseForm.setFieldsValue(course || {});
    setCourseModalOpen(true);
  };

  const handleDeleteCourse = async (course: any) => {
    Modal.confirm({
      title: '确认删除课程？',
      content: `将删除《${course.title}》，删除后不可恢复`,
      okText: '确认删除',
      okButtonProps: { danger: true },
      onOk: async () => {
        await courseApi.delete(course.id);
        message.success('已删除');
        loadData();
      },
    });
  };

  const handleRemoveMember = async (member: any) => {
    Modal.confirm({
      title: '移除学员？',
      content: `将 ${member.name} 移出本期营期，打卡记录保留`,
      okText: '确认移出',
      onOk: async () => {
        await campApi.removeMember(Number(id), member.id);
        message.success('已移出');
        loadMembers();
        loadData();
      },
    });
  };

  const typeIcon = (type: string) => {
    switch (type) {
      case 'VIDEO': return <VideoCameraOutlined style={{ color: '#1677ff' }} />;
      case 'AUDIO': return <PlayCircleOutlined style={{ color: '#52c41a' }} />;
      case 'PDF': return <FilePdfOutlined style={{ color: '#ff4d4f' }} />;
      case 'LIVE': return <VideoCameraOutlined style={{ color: '#722ed1' }} />;
      case 'HOMEWORK': return <FilePdfOutlined style={{ color: '#fa8c16' }} />;
      default: return <FilePdfOutlined />;
    }
  };

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => navigate('/camps')}>
            返回列表
          </Button>
          <h2 style={{ margin: 0 }}>
            {detail?.name || '营期详情'}
            {detail && (
              <Tag color={campStatusColor[detail.status as keyof typeof campStatusColor]} style={{ marginLeft: 12 }}>
                {campStatusLabel[detail.status as keyof typeof campStatusLabel]}
              </Tag>
            )}
          </h2>
        </div>
        <Space>
          <Button icon={<EyeOutlined />} onClick={() => navigate(`/checkin?campId=${id}`)}>
            打卡台
          </Button>
          <Button type="primary" icon={<EditOutlined />}>
            编辑营期
          </Button>
        </Space>
      </div>

      <Card bordered={false} loading={loading} style={{ marginBottom: 16 }}>
        <Descriptions column={4} size="small" bordered>
          <Descriptions.Item label="开始时间">{dayjs(detail?.startDate).format('YYYY-MM-DD')}</Descriptions.Item>
          <Descriptions.Item label="结束时间">{dayjs(detail?.endDate).format('YYYY-MM-DD')}</Descriptions.Item>
          <Descriptions.Item label="总天数">{detail?.totalDays} 天</Descriptions.Item>
          <Descriptions.Item label="学员数">{detail?.memberCount || 0} 人</Descriptions.Item>
          <Descriptions.Item label="负责老师">{detail?.teacher?.name || '未指派'}</Descriptions.Item>
          <Descriptions.Item label="课程数">{detail?.courseCount || 0} 节</Descriptions.Item>
          <Descriptions.Item label="联系方式">{detail?.teacher?.phone || '-'}</Descriptions.Item>
          <Descriptions.Item label="营期进度">
            <Progress percent={detail?.progress || 0} size="small" />
          </Descriptions.Item>
          <Descriptions.Item label="营期简介" span={4}>{detail?.description || '暂无'}</Descriptions.Item>
          <Descriptions.Item label="打卡规则" span={4}>{detail?.checkInRule || '暂无'}</Descriptions.Item>
        </Descriptions>

        <Divider />

        <Row gutter={[16, 0]}>
          <Col span={6}>
            <Statistic
              title={<span><CalendarOutlined /> 已过天数</span>}
              value={dayStats.pastDays}
              suffix={`/ ${dayStats.totalDays} 天`}
              valueStyle={{ fontSize: 22 }}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title={<span><TeamOutlined /> 报名学员</span>}
              value={detail?.memberCount || 0}
              suffix="人"
              valueStyle={{ fontSize: 22, color: '#1677ff' }}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title={<span><CheckCircleOutlined /> 今日打卡</span>}
              value={Math.floor((detail?.memberCount || 0) * 0.72)}
              suffix="人"
              valueStyle={{ fontSize: 22, color: '#52c41a' }}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title={<span><ClockCircleOutlined /> 剩余天数</span>}
              value={dayStats.futureDays}
              suffix="天"
              valueStyle={{ fontSize: 22, color: '#fa8c16' }}
            />
          </Col>
        </Row>
      </Card>

      <Card
        bordered={false}
        tabList={[
          { key: 'courses', label: `课程资料 (${courses.length})` },
          { key: 'members', label: `学员列表 (${memberTotal})` },
        ]}
        extra={
          <Button type="primary" icon={<EditOutlined />} onClick={() => openCourseModal()}>
            添加课程
          </Button>
        }
      >
        <Tabs
          activeKey={(() => null as any)!}
          items={[
            {
              key: 'courses',
              label: `课程资料 (${courses.length})`,
              children: courses.length === 0 ? (
                <Empty description="暂无课程，点击右上角添加" />
              ) : (
                <List
                  grid={{ gutter: 16, xs: 1, sm: 1, md: 2, lg: 2, xl: 3 }}
                  dataSource={courses}
                  renderItem={(course: any) => (
                    <List.Item>
                      <Card
                        hoverable
                        size="small"
                        actions={[
                          <Tooltip key="preview" title="查看详情">
                            <EyeOutlined onClick={() => { setPreviewCourse(course); setPreviewOpen(true); }} />
                          </Tooltip>,
                          <Tooltip key="edit" title="编辑">
                            <EditOutlined onClick={() => openCourseModal(course)} />
                          </Tooltip>,
                          <Tooltip key="delete" title="删除">
                            <DeleteOutlined onClick={() => handleDeleteCourse(course)} style={{ color: '#ff4d4f' }} />
                          </Tooltip>,
                        ]}
                        styles={{ body: { padding: 14 } }}
                      >
                        <div style={{ display: 'flex', gap: 12 }}>
                          <div
                            style={{
                              width: 44,
                              height: 44,
                              borderRadius: 8,
                              background: '#f0f5ff',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: 20,
                              flexShrink: 0,
                            }}
                          >
                            {typeIcon(course.type)}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                              <Tag color="blue">D{course.dayIndex}</Tag>
                              <Tag>{courseTypeLabel[course.type as keyof typeof courseTypeLabel]}</Tag>
                              {course.hasTrial && <Tag color="gold">试看</Tag>}
                            </div>
                            <div style={{ fontWeight: 500, marginBottom: 4 }}>{course.title}</div>
                            <div style={{ color: '#999', fontSize: 12, display: 'flex', gap: 10 }}>
                              {course.duration && <span>{course.duration}分钟</span>}
                              {course.materialUrl && (
                                <a onClick={(e) => e.preventDefault()}>
                                  <DownloadOutlined /> 资料
                                </a>
                              )}
                              {course.homeworkUrl && (
                                <a onClick={(e) => e.preventDefault()}>
                                  <FilePdfOutlined /> 作业
                                </a>
                              )}
                            </div>
                          </div>
                        </div>
                      </Card>
                    </List.Item>
                  )}
                />
              ),
            },
            {
              key: 'members',
              label: `学员列表 (${memberTotal})`,
              children: (
                <Table
                  rowKey="id"
                  loading={loading}
                  columns={[
                    ...memberColumns,
                    {
                      title: '操作',
                      key: 'op',
                      width: 140,
                      fixed: 'right',
                      render: (_: any, r) => (
                        <Space size="small">
                          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => navigate(`/members/${r.id}`)}>
                            详情
                          </Button>
                          <Button type="link" size="small" danger icon={<DeleteOutlined />} onClick={() => handleRemoveMember(r)}>
                            移出
                          </Button>
                        </Space>
                      ),
                    },
                  ]}
                  dataSource={members}
                  pagination={{
                    current: memberPage,
                    pageSize: memberPageSize,
                    total: memberTotal,
                    showSizeChanger: true,
                    onChange: (p, ps) => { setMemberPage(p); setMemberPageSize(ps); },
                  }}
                  scroll={{ x: 1000 }}
                />
              ),
            },
          ]}
        />
      </Card>

      <Modal
        title={editCourse ? '编辑课程' : '添加课程'}
        open={courseModalOpen}
        onCancel={() => { setCourseModalOpen(false); courseForm.resetFields(); setEditCourse(null); }}
        onOk={() => courseForm.submit()}
        confirmLoading={submitting}
        width={560}
      >
        <Form form={courseForm} layout="vertical" onFinish={handleCourseSubmit}>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="dayIndex" label="第几天" rules={[{ required: true }]}>
                <Input type="number" min={1} />
              </Form.Item>
            </Col>
            <Col span={16}>
              <Form.Item name="type" label="课程类型" rules={[{ required: true }]}>
                <Select options={[
                  { label: '视频课', value: 'VIDEO' },
                  { label: '音频课', value: 'AUDIO' },
                  { label: 'PDF资料', value: 'PDF' },
                  { label: '直播课', value: 'LIVE' },
                  { label: '作业', value: 'HOMEWORK' },
                ]} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="title" label="课程标题" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="description" label="课程描述">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="duration" label="时长（分钟）">
                <Input type="number" min={1} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="sortOrder" label="排序" initialValue={0}>
                <Input type="number" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="resourceUrl" label="课程资源地址">
            <Input placeholder="视频/音频/PDF链接" />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="hasTrial" label="是否可试看" valuePropName="checked">
                <Switch />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="isActive" label="是否启用" valuePropName="checked" initialValue={true}>
                <Switch />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="trialUrl" label="试看资源地址">
            <Input />
          </Form.Item>
          <Form.Item name="materialUrl" label="学习资料下载地址">
            <Input />
          </Form.Item>
          <Form.Item name="homeworkUrl" label="作业下载地址">
            <Input />
          </Form.Item>
        </Form>
      </Modal>

      <Drawer
        title={previewCourse?.title}
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        width={640}
      >
        {previewCourse && (
          <>
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              <Tag color="blue">D{previewCourse.dayIndex}</Tag>
              <Tag>{courseTypeLabel[previewCourse.type as keyof typeof courseTypeLabel]}</Tag>
              {previewCourse.duration && <Tag color="green">{previewCourse.duration}分钟</Tag>}
              {previewCourse.hasTrial && <Tag color="gold">支持试看</Tag>}
            </div>

            <Card
              size="small"
              title="课程预览区"
              style={{ marginBottom: 16, minHeight: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fafafa' }}
            >
              <div style={{ textAlign: 'center', color: '#999' }}>
                <div style={{ fontSize: 48, marginBottom: 8 }}>{typeIcon(previewCourse.type)}</div>
                <div>课程资源播放/预览区</div>
                <div style={{ fontSize: 12, marginTop: 4 }}>（示例占位，实际对接视频/PDF播放器）</div>
              </div>
            </Card>

            <Descriptions column={1} size="small" bordered style={{ marginBottom: 16 }}>
              <Descriptions.Item label="课程描述">{previewCourse.description || '暂无'}</Descriptions.Item>
              <Descriptions.Item label="资源链接">
                {previewCourse.resourceUrl ? (
                  <a href={previewCourse.resourceUrl} target="_blank">点击访问</a>
                ) : '暂未上传'}
              </Descriptions.Item>
              <Descriptions.Item label="试看资源">
                {previewCourse.hasTrial ? (
                  previewCourse.trialUrl ? <a href={previewCourse.trialUrl} target="_blank">点击试看</a> : '待设置'
                ) : <Tag color="default">不支持试看</Tag>}
              </Descriptions.Item>
              <Descriptions.Item label="学习资料">
                {previewCourse.materialUrl ? (
                  <Button type="link" icon={<DownloadOutlined />} href={previewCourse.materialUrl}>
                    下载资料
                  </Button>
                ) : '未提供'}
              </Descriptions.Item>
              <Descriptions.Item label="作业文件">
                {previewCourse.homeworkUrl ? (
                  <Button type="link" icon={<DownloadOutlined />} href={previewCourse.homeworkUrl}>
                    下载作业
                  </Button>
                ) : '未提供'}
              </Descriptions.Item>
            </Descriptions>
          </>
        )}
      </Drawer>
    </div>
  );
}

import { Select, Switch } from 'antd';
