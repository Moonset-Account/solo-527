import { useEffect, useState, useMemo } from 'react';
import {
  Card,
  Select,
  Row,
  Col,
  Input,
  Table,
  Tag,
  Avatar,
  Button,
  Space,
  Tooltip,
  Modal,
  DatePicker,
  InputNumber,
  Form,
  message,
  Progress,
  Statistic,
  Divider,
  Badge,
  List,
  Result,
} from 'antd';
import {
  SearchOutlined,
  CalendarOutlined,
  TeamOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  EditOutlined,
  CheckOutlined,
  PlayCircleOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { campApi, checkInApi, courseApi } from '../../services/api';
import dayjs from 'dayjs';
import {
  checkInStatusColor, checkInStatusLabel,
  memberLevelColor, memberLevelLabel,
  campStatusLabel,
} from '../../types';
import { useSearchParams } from 'react-router-dom';

export default function CheckInDesk() {
  const [searchParams] = useSearchParams();
  const urlCampId = searchParams.get('campId');
  const [loading, setLoading] = useState(true);
  const [camps, setCamps] = useState<any[]>([]);
  const [selectedCamp, setSelectedCamp] = useState<number | null>(null);
  const [campDetail, setCampDetail] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [memberTotal, setMemberTotal] = useState(0);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10 });
  const [filters, setFilters] = useState({ keyword: '', status: undefined as string | undefined });
  const [dailyStats, setDailyStats] = useState<any[]>([]);
  const [checkInModalOpen, setCheckInModalOpen] = useState(false);
  const [selectedMemberCamp, setSelectedMemberCamp] = useState<any>(null);
  const [checkInDetail, setCheckInDetail] = useState<any>(null);
  const [checkInForm] = Form.useForm();
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editCheckIn, setEditCheckIn] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadCamps();
  }, []);

  useEffect(() => {
    if (camps.length > 0 && urlCampId) {
      setSelectedCamp(Number(urlCampId));
    } else if (camps.length > 0 && !selectedCamp) {
      setSelectedCamp(camps[0].id);
    }
  }, [camps, urlCampId]);

  useEffect(() => {
    if (selectedCamp) {
      loadData();
    }
  }, [selectedCamp, pagination.current, pagination.pageSize, filters]);

  const loadCamps = async () => {
    try {
      const res = await campApi.active();
      setCamps(res);
    } catch {}
  };

  const loadData = async () => {
    if (!selectedCamp) return;
    try {
      setLoading(true);
      const [detail, memberRes, stats, coursesRes] = await Promise.all([
        campApi.detail(selectedCamp),
        campApi.members(selectedCamp, {
          page: pagination.current,
          pageSize: pagination.pageSize,
        }),
        checkInApi.dailyStats({ campId: selectedCamp, days: 14 }),
        courseApi.list({ campId: selectedCamp }),
      ]);
      setCampDetail(detail);
      setMembers(memberRes.list);
      setMemberTotal(memberRes.total);
      setDailyStats(stats);
    } finally {
      setLoading(false);
    }
  };

  const summary = useMemo(() => {
    if (!campDetail) return null;
    const totalDays = campDetail.totalDays;
    const pastDays = Math.min(dayjs().diff(dayjs(campDetail.startDate), 'day') + 1, totalDays);
    const today = dailyStats[dailyStats.length - 1];
    return {
      totalDays,
      pastDays,
      todayCompleted: today?.completed || 0,
      todayLate: today?.late || 0,
      todayMissed: today?.missed || 0,
    };
  }, [campDetail, dailyStats]);

  const openCheckIn = async (memberCamp: any) => {
    setSelectedMemberCamp(memberCamp);
    try {
      const detail = await checkInApi.memberCampDetail(memberCamp.id);
      setCheckInDetail(detail);
      checkInForm.setFieldsValue({
        dayIndex: summary?.pastDays || 1,
      });
      setCheckInModalOpen(true);
    } catch {}
  };

  const handleCheckIn = async (values: any) => {
    try {
      setSubmitting(true);
      await checkInApi.create({
        memberCampId: selectedMemberCamp.id,
        ...values,
      });
      message.success('打卡成功');
      setCheckInModalOpen(false);
      checkInForm.resetFields();
      loadData();
    } finally {
      setSubmitting(false);
    }
  };

  const openEdit = (checkIn: any) => {
    setEditCheckIn(checkIn);
    checkInForm.setFieldsValue({
      ...checkIn,
    });
    setEditModalOpen(true);
  };

  const handleEdit = async (values: any) => {
    try {
      setSubmitting(true);
      await checkInApi.update(editCheckIn.id, values);
      message.success('更新成功');
      setEditModalOpen(false);
      checkInForm.resetFields();
      loadData();
    } finally {
      setSubmitting(false);
    }
  };

  const runBatchMissed = () => {
    Modal.confirm({
      title: '批量检查未打卡',
      content: '将扫描所有已过期的打卡日，标记未打卡学员并检测掉队情况。建议每天运行一次。',
      okText: '开始处理',
      onOk: async () => {
        const res: any = await checkInApi.batchMissed({ campId: selectedCamp });
        message.success(`处理完成：${res.updated} 条记录，涉及 ${res.processedMembers} 名学员`);
        loadData();
      },
    });
  };

  const columns: ColumnsType<any> = [
    {
      title: '学员',
      dataIndex: 'name',
      render: (t, r) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Badge
            dot
            status={r.isLagging ? 'error' : r.continuousDays > 5 ? 'success' : 'warning'}
          >
            <Avatar style={{ backgroundColor: '#1677ff' }}>
              {t.charAt(0)}
            </Avatar>
          </Badge>
          <div>
            <div style={{ fontWeight: 500 }}>{t}</div>
            <div style={{ color: '#999', fontSize: 12 }}>
              {r.childName} {r.childAge && `· ${r.childAge}岁`} · {r.phone}
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
      title: '打卡进度',
      width: 220,
      render: (_: any, r) => {
        const completed = r.completedCheckInCount || 0;
        const past = summary?.pastDays || 0;
        const rate = past > 0 ? Math.round(completed / past * 100) : 0;
        return (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 2 }}>
              <span>{completed}/{past} 天</span>
              <span style={{ color: rate >= 80 ? '#52c41a' : rate >= 50 ? '#faad14' : '#ff4d4f' }}>
                {rate}%
              </span>
            </div>
            <Progress
              percent={rate}
              size="small"
              showInfo={false}
              status={rate >= 80 ? 'success' : rate >= 50 ? 'active' : 'exception'}
            />
            <div style={{ color: '#999', fontSize: 11, marginTop: 2 }}>
              连续打卡 {r.continuousDays} 天
              {r.isLagging && <span style={{ color: '#ff4d4f', marginLeft: 6 }}>⚠ 掉队{r.laggingDays}天</span>}
            </div>
          </div>
        );
      },
    },
    {
      title: '最近打卡',
      dataIndex: 'lastCheckInAt',
      width: 120,
      render: (d, r) => (
        r.status === 'EXPIRED' ? (
          <Tag color="error">会员已过期</Tag>
        ) : d ? (
          <span>
            {dayjs(d).diff(dayjs(), 'day') === 0 ? '今天' : dayjs(d).diff(dayjs(), 'day') === -1 ? '昨天' : dayjs(d).format('MM-DD')}
          </span>
        ) : (
          <Tag color="default">未打卡</Tag>
        )
      ),
    },
    {
      title: '状态',
      width: 100,
      render: (_: any, r) => {
        if (r.isLagging) return <Tag color="error">掉队中</Tag>;
        if (!r.lastCheckInAt) return <Tag color="warning">待首打卡</Tag>;
        const days = dayjs().diff(dayjs(r.lastCheckInAt), 'day');
        if (days === 0) return <Tag color="success">今日已打</Tag>;
        if (days === 1) return <Tag color="processing">昨日已打</Tag>;
        return <Tag color="warning">{days}天前</Tag>;
      },
    },
    {
      title: '操作',
      key: 'op',
      width: 180,
      fixed: 'right',
      render: (_: any, r) => (
        <Space size="small">
          <Button type="primary" size="small" icon={<CheckOutlined />} onClick={() => openCheckIn(r)}>
            打卡
          </Button>
          <Button size="small" icon={<EditOutlined />} onClick={() => openCheckIn(r)}>
            查看
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div className="page-header">
        <h2>打卡台</h2>
        <Space>
          <Select
            style={{ width: 260 }}
            placeholder="选择营期"
            value={selectedCamp}
            onChange={setSelectedCamp}
            options={camps.map((c) => ({
              label: `${c.name}（${campStatusLabel[c.status as keyof typeof campStatusLabel]}）`,
              value: c.id,
            }))}
          />
          <Button icon={<ExclamationCircleOutlined />} onClick={runBatchMissed}>
            批量检查未打卡
          </Button>
        </Space>
      </div>

      {campDetail && summary && (
        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          <Col xs={24} sm={12} md={6}>
            <Card bordered={false}>
              <Statistic
                title={<span><CalendarOutlined /> 营期进度</span>}
                value={summary.pastDays}
                suffix={`/ ${summary.totalDays}`}
                valueStyle={{ fontSize: 22 }}
              />
              <Progress percent={Math.round(summary.pastDays / summary.totalDays * 100)} size="small" />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card bordered={false} style={{ background: 'linear-gradient(135deg, #f6ffed 0%, #d9f7be 100%)' }}>
              <Statistic
                title={<span><CheckCircleOutlined style={{ color: '#52c41a' }} /> 今日已打卡</span>}
                value={summary.todayCompleted}
                suffix="人"
                valueStyle={{ fontSize: 22, color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card bordered={false} style={{ background: 'linear-gradient(135deg, #fff7e6 0%, #ffe7ba 100%)' }}>
              <Statistic
                title={<span><ClockCircleOutlined style={{ color: '#fa8c16' }} /> 今日补卡</span>}
                value={summary.todayLate}
                suffix="人"
                valueStyle={{ fontSize: 22, color: '#fa8c16' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card bordered={false} style={{ background: 'linear-gradient(135deg, #fff2f0 0%, #ffccc7 100%)' }}>
              <Statistic
                title={<span><CloseCircleOutlined style={{ color: '#ff4d4f' }} /> 今日缺卡</span>}
                value={summary.todayMissed}
                suffix="人"
                valueStyle={{ fontSize: 22, color: '#ff4d4f' }}
              />
            </Card>
          </Col>
        </Row>
      )}

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <Card bordered={false}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, alignItems: 'center' }}>
              <Input
                allowClear
                style={{ width: 260 }}
                prefix={<SearchOutlined />}
                placeholder="搜索学员姓名/手机号"
                value={filters.keyword}
                onChange={(e) => setFilters({ ...filters, keyword: e.target.value })}
              />
              <Space>
                <Select
                  allowClear
                  style={{ width: 140 }}
                  placeholder="打卡状态"
                  value={filters.status}
                  onChange={(v) => setFilters({ ...filters, status: v })}
                  options={[
                    { label: '已完成', value: 'COMPLETED' },
                    { label: '待打卡', value: 'PENDING' },
                    { label: '掉队', value: 'LAGGING' },
                    { label: '已过期', value: 'EXPIRED' },
                  ]}
                />
                <Tag icon={<TeamOutlined />} color="blue">
                  {memberTotal} 名学员
                </Tag>
              </Space>
            </div>

            <Table
              rowKey="id"
              loading={loading}
              columns={columns}
              dataSource={members}
              pagination={{
                ...pagination,
                total: memberTotal,
                showSizeChanger: true,
                onChange: (p, ps) => setPagination({ current: p, pageSize: ps }),
              }}
              scroll={{ x: 900 }}
            />
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card
            title="最近14天打卡趋势"
            bordered={false}
            size="small"
            styles={{ body: { padding: 12 } }}
          >
            {dailyStats.length === 0 ? (
              <Result status="info" title="暂无数据" subTitle="营期还未开始" />
            ) : (
              <List
                size="small"
                dataSource={dailyStats.slice().reverse()}
                renderItem={(d: any) => (
                  <List.Item style={{ padding: '8px 0' }}>
                    <div style={{ width: '100%' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 12 }}>
                        <span style={{ fontWeight: 500 }}>
                          {dayjs(d.date).format('MM/DD')} {dayjs(d.date).format('ddd')}
                        </span>
                        <span>
                          <Tag color="success">{d.completed}</Tag>
                          <Tag color="warning">{d.late}</Tag>
                          <Tag color="error">{d.missed}</Tag>
                          <Tag color="blue">{d.effectiveRate}%</Tag>
                        </span>
                      </div>
                      <Progress
                        percent={d.effectiveRate}
                        size="small"
                        showInfo={false}
                        status={d.effectiveRate >= 80 ? 'success' : d.effectiveRate >= 50 ? 'active' : 'exception'}
                      />
                    </div>
                  </List.Item>
                )}
              />
            )}
            <Divider style={{ margin: '12px 0' }} />
            <div style={{ fontSize: 12, color: '#999', display: 'flex', gap: 12, justifyContent: 'center' }}>
              <span><Tag color="success">完成</Tag></span>
              <span><Tag color="warning">补卡</Tag></span>
              <span><Tag color="error">缺卡</Tag></span>
              <span><Tag color="blue">有效率</Tag></span>
            </div>
          </Card>
        </Col>
      </Row>

      <Modal
        title={
          <div>
            <span style={{ marginRight: 8 }}>打卡 - {selectedMemberCamp?.name}</span>
            {selectedMemberCamp?.childName && (
              <Tag style={{ marginLeft: 8 }}>{selectedMemberCamp.childName}</Tag>
            )}
          </div>
        }
        open={checkInModalOpen}
        onCancel={() => { setCheckInModalOpen(false); checkInForm.resetFields(); }}
        onOk={() => checkInForm.submit()}
        confirmLoading={submitting}
        width={640}
        destroyOnClose
      >
        {checkInDetail && (
          <>
            <Descriptions column={3} size="small" bordered style={{ marginBottom: 16 }}>
              <Descriptions.Item label="累计打卡">{checkInDetail.summary.completedCount} 天</Descriptions.Item>
              <Descriptions.Item label="缺卡">{checkInDetail.summary.missedCount} 天</Descriptions.Item>
              <Descriptions.Item label="完成率">{checkInDetail.summary.completionRate}%</Descriptions.Item>
            </Descriptions>

            <Divider orientation="left" plain style={{ margin: '8px 0 12px' }}>打卡日历</Divider>
            <div className="checkin-grid" style={{ marginBottom: 16 }}>
              {checkInDetail.checkIns.map((c: any) => (
                <Tooltip key={c.id} title={`第${c.dayIndex}天：${checkInStatusLabel[c.status as keyof typeof checkInStatusLabel]}${c.score ? ` · 评分${c.score}` : ''}`}>
                  <div className={`checkin-cell ${c.status.toLowerCase()}`}>
                    <div style={{ fontWeight: 600 }}>D{c.dayIndex}</div>
                    <div style={{ fontSize: 10, marginTop: 2 }}>
                      {c.status === 'COMPLETED' ? '✓' : c.status === 'LATE' ? '迟' : c.status === 'MISSED' ? '✗' : '待'}
                    </div>
                  </div>
                </Tooltip>
              ))}
              {Array.from({ length: Math.max(0, (checkInDetail.summary.totalDays || 0) - checkInDetail.checkIns.length) }).map((_, i) => {
                const d = checkInDetail.checkIns.length + i + 1;
                const isToday = d === checkInDetail.summary.pastDays;
                return (
                  <Tooltip key={i} title={`第${d}天${isToday ? ' · 今日待打卡' : ''}`}>
                    <div className={`checkin-cell ${d > (checkInDetail.summary.pastDays || 0) ? 'future' : 'pending'}`}
                         style={isToday ? { borderColor: '#1677ff', borderWidth: 2 } : {}}>
                      <div style={{ fontWeight: 600 }}>D{d}</div>
                      <div style={{ fontSize: 10, marginTop: 2 }}>{isToday ? '今日' : '-'}</div>
                    </div>
                  </Tooltip>
                );
              })}
            </div>

            <Divider orientation="left" plain style={{ margin: '8px 0 12px' }}>新增打卡</Divider>
            <Form form={checkInForm} layout="vertical" onFinish={handleCheckIn}>
              <Row gutter={12}>
                <Col span={8}>
                  <Form.Item
                    name="dayIndex"
                    label="打卡天数"
                    rules={[{ required: true, message: '请选择天数' }]}
                  >
                    <Select
                      options={Array.from(
                        { length: (checkInDetail.summary.pastDays || 0) },
                        (_, i) => ({ label: `第 ${i + 1} 天${i + 1 === checkInDetail.summary.pastDays ? '（今日）' : ''}`, value: i + 1 })
                      )}
                    />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name="score" label="评分（可选）">
                    <InputNumber min={0} max={100} style={{ width: '100%' }} placeholder="0-100分" />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name="status" label="状态" initialValue="COMPLETED">
                    <Select options={[
                      { label: '正常打卡', value: 'COMPLETED' },
                      { label: '补卡（迟到）', value: 'LATE' },
                    ]} />
                  </Form.Item>
                </Col>
              </Row>
              <Form.Item name="remark" label="备注">
                <Input.TextArea rows={2} placeholder="如：家长反馈学习很认真..." maxLength={200} showCount />
              </Form.Item>
              <Row gutter={12}>
                <Col span={12}>
                  <Form.Item name="homeworkUrl" label="作业链接">
                    <Input placeholder="作业文件/图片链接" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="mediaUrl" label="打卡媒体">
                    <Input placeholder="照片/视频链接" />
                  </Form.Item>
                </Col>
              </Row>
            </Form>
          </>
        )}
      </Modal>
    </div>
  );
}

import { Descriptions } from 'antd';
