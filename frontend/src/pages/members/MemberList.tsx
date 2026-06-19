import { useEffect, useState } from 'react';
import {
  Card,
  Table,
  Tag,
  Button,
  Input,
  Space,
  Select,
  Avatar,
  Badge,
  Modal,
  Form,
  DatePicker,
  Drawer,
  message,
  Tooltip,
  Popover,
  Progress,
  Empty,
} from 'antd';
import {
  SearchOutlined,
  PlusOutlined,
  PhoneOutlined,
  UserOutlined,
  EditOutlined,
  EyeOutlined,
  WarningOutlined,
  ClockCircleOutlined,
  CalendarOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useNavigate } from 'react-router-dom';
import { memberApi, conversionApi } from '../../services/api';
import dayjs from 'dayjs';
import {
  memberLevelColor, memberLevelLabel,
  memberStatusColor, memberStatusLabel,
} from '../../types';
import type { MemberLevel, MemberStatus, ConversionChannel } from '../../types';

export default function MemberList() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [summary, setSummary] = useState<any>(null);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10 });
  const [filters, setFilters] = useState({
    keyword: '',
    level: undefined as MemberLevel | undefined,
    status: undefined as MemberStatus | undefined,
    isLagging: undefined as string | undefined,
    sourceId: undefined as number | undefined,
    expiringSoon: false,
  });
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editData, setEditData] = useState<any>(null);
  const [sources, setSources] = useState<any[]>([]);
  const [createForm] = Form.useForm();
  const [editForm] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [expirePreviewOpen, setExpirePreviewOpen] = useState(false);

  useEffect(() => {
    loadData();
    loadSources();
    loadSummary();
  }, [pagination.current, pagination.pageSize, filters]);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await memberApi.list({
        page: pagination.current,
        pageSize: pagination.pageSize,
        ...filters,
      });
      setData(res.list);
      setTotal(res.total);
    } finally {
      setLoading(false);
    }
  };

  const loadSummary = async () => {
    try {
      const res = await memberApi.summary();
      setSummary(res);
    } catch {}
  };

  const loadSources = async () => {
    try {
      const res = await conversionApi.sources({ isActive: true });
      setSources(res);
    } catch {}
  };

  const columns: ColumnsType<any> = [
    {
      title: '会员信息',
      dataIndex: 'name',
      width: 260,
      render: (t, r) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Badge dot status={r.status === 'ACTIVE' ? (r.isLagging ? 'error' : 'success') : 'default'}>
            <Avatar style={{ backgroundColor: '#1677ff' }} icon={<UserOutlined />} />
          </Badge>
          <div style={{ minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              <a onClick={() => navigate(`/members/${r.id}`)} style={{ fontWeight: 500 }}>{t}</a>
              {r.isLagging && <span className="tag-lagging">掉队{r.laggingDays}天</span>}
              {r.daysUntilExpire !== null && r.daysUntilExpire <= 7 && r.status === 'ACTIVE' && (
                <span className="tag-expiring">{r.daysUntilExpire}天内到期</span>
              )}
            </div>
            <div style={{ color: '#999', fontSize: 12, marginTop: 2 }}>
              <PhoneOutlined style={{ marginRight: 4 }} />{r.phone}
              {r.childName && <span style={{ margin: '0 8px' }}>👶 {r.childName}{r.childAge && `(${r.childAge}岁)`}</span>}
            </div>
          </div>
        </div>
      ),
    },
    {
      title: '等级',
      dataIndex: 'level',
      width: 100,
      render: (l) => <Tag color={memberLevelColor[l as MemberLevel]}>{memberLevelLabel[l as MemberLevel]}</Tag>,
      filters: [
        { text: '体验会员', value: 'TRIAL' },
        { text: '基础会员', value: 'BASIC' },
        { text: '高级会员', value: 'PREMIUM' },
        { text: 'VIP会员', value: 'VIP' },
      ],
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 90,
      render: (s, r) => {
        const color = memberStatusColor[s as MemberStatus];
        const label = memberStatusLabel[s as MemberStatus];
        if (s === 'ACTIVE' && r.daysUntilExpire !== null && r.daysUntilExpire <= 7) {
          return (
            <Popover
              content={
                <div style={{ width: 220 }}>
                  <div style={{ marginBottom: 8 }}><b>⚠ 会员即将到期</b></div>
                  <div style={{ fontSize: 12, color: '#666', marginBottom: 8 }}>
                    {r.daysUntilExpire === 0 ? '今天到期' : `还剩 ${r.daysUntilExpire} 天到期`}
                    <div>到期时间：{dayjs(r.expiresAt).format('YYYY-MM-DD')}</div>
                  </div>
                  <Button type="primary" size="small" block onClick={() => navigate(`/members/${r.id}`)}>
                    立即跟进
                  </Button>
                </div>
              }
              title="到期提醒"
            >
              <Tag color="warning">即将到期</Tag>
            </Popover>
          );
        }
        return <Tag color={color}>{label}</Tag>;
      },
    },
    {
      title: '打卡情况',
      width: 180,
      render: (_: any, r) => (
        <div>
          <div style={{ display: 'flex', gap: 10, fontSize: 12, marginBottom: 2 }}>
            <span>累计 <b>{r.totalCheckInDays}</b> 天</span>
            <span>连续 <b style={{ color: r.continuousDays > 5 ? '#52c41a' : '#999' }}>{r.continuousDays}</b> 天</span>
          </div>
          {r.lastCheckInAt ? (
            <Tooltip title={dayjs(r.lastCheckInAt).format('YYYY-MM-DD HH:mm')}>
              <div style={{ color: '#999', fontSize: 12 }}>
                <CalendarOutlined style={{ marginRight: 4 }} />
                {dayjs(r.lastCheckInAt).fromNow()}
                {r.isLagging && <span style={{ color: '#ff4d4f', marginLeft: 6 }}>⚠ 需跟进</span>}
              </div>
            </Tooltip>
          ) : (
            <Tag color="default" style={{ fontSize: 12 }}>未打卡</Tag>
          )}
        </div>
      ),
    },
    {
      title: '转化来源',
      dataIndex: ['conversionSource', 'name'],
      width: 120,
      render: (t, r) => (
        <div>
          <Tag>{t || '未记录'}</Tag>
          {r.sourceDetail && <div style={{ fontSize: 11, color: '#999' }}>{r.sourceDetail}</div>}
        </div>
      ),
    },
    {
      title: '到期时间',
      dataIndex: 'expiresAt',
      width: 140,
      render: (d, r) => d ? (
        <div>
          <div>{dayjs(d).format('YYYY-MM-DD')}</div>
          {r.status === 'ACTIVE' && (
            <div style={{ fontSize: 11, color: r.daysUntilExpire <= 7 ? '#faad14' : '#999' }}>
              {r.daysUntilExpire === 0 ? '今日到期' : `剩${r.daysUntilExpire}天`}
            </div>
          )}
        </div>
      ) : <Tag color="default">未开通</Tag>,
    },
    {
      title: '操作',
      key: 'op',
      width: 160,
      fixed: 'right',
      render: (_: any, r) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => navigate(`/members/${r.id}`)}>
            详情
          </Button>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => openEdit(r)}>
            编辑
          </Button>
        </Space>
      ),
    },
  ];

  const openEdit = (record: any) => {
    setEditData(record);
    editForm.setFieldsValue({
      ...record,
      subscribedAt: record.subscribedAt ? dayjs(record.subscribedAt) : undefined,
      expiresAt: record.expiresAt ? dayjs(record.expiresAt) : undefined,
    });
    setEditOpen(true);
  };

  const handleCreate = async (values: any) => {
    try {
      setSubmitting(true);
      await memberApi.create({
        ...values,
        subscribedAt: values.subscribedAt?.toDate(),
        expiresAt: values.expiresAt?.toDate(),
      });
      message.success('创建成功');
      setCreateOpen(false);
      createForm.resetFields();
      loadData();
      loadSummary();
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = async (values: any) => {
    try {
      setSubmitting(true);
      await memberApi.update(editData.id, {
        ...values,
        subscribedAt: values.subscribedAt?.toDate ? values.subscribedAt.toDate() : values.subscribedAt,
        expiresAt: values.expiresAt?.toDate ? values.expiresAt.toDate() : values.expiresAt,
      });
      message.success('更新成功');
      setEditOpen(false);
      editForm.resetFields();
      loadData();
      loadSummary();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <h2>会员管理</h2>
          {summary && (
            <Space size={8} wrap>
              <Tag color="blue">总数 {summary.total}</Tag>
              <Tag color="success">活跃 {summary.active}</Tag>
              <Tag color="warning" onClick={() => setExpirePreviewOpen(true)} style={{ cursor: 'pointer' }}>
                <ClockCircleOutlined /> 即将到期 {summary.expiring}
              </Tag>
              <Tag color="error">
                <WarningOutlined /> 掉队 {summary.lagging}
              </Tag>
              <Tag color="geekblue">今日新增 {summary.todayNew}</Tag>
              <Tag color="purple">今日打卡 {summary.todayCheckIn}</Tag>
            </Space>
          )}
        </div>
        <Space>
          <Input
            allowClear
            prefix={<SearchOutlined />}
            placeholder="搜索姓名/手机号/孩子名"
            style={{ width: 240 }}
            value={filters.keyword}
            onChange={(e) => setFilters({ ...filters, keyword: e.target.value })}
          />
          <Select
            allowClear
            placeholder="会员等级"
            style={{ width: 120 }}
            value={filters.level}
            onChange={(v) => setFilters({ ...filters, level: v })}
            options={[
              { label: '体验', value: 'TRIAL' },
              { label: '基础', value: 'BASIC' },
              { label: '高级', value: 'PREMIUM' },
              { label: 'VIP', value: 'VIP' },
            ]}
          />
          <Select
            allowClear
            placeholder="转化来源"
            style={{ width: 140 }}
            value={filters.sourceId}
            onChange={(v) => setFilters({ ...filters, sourceId: v })}
            options={sources.map((s) => ({ label: s.name, value: s.id }))}
          />
          <Select
            allowClear
            placeholder="特殊筛选"
            style={{ width: 140 }}
            value={filters.isLagging === undefined ? (filters.expiringSoon ? 'expiring' : undefined) : filters.isLagging}
            onChange={(v) => {
              if (v === 'expiring') setFilters({ ...filters, isLagging: undefined, expiringSoon: true });
              else if (v === 'true' || v === 'false') setFilters({ ...filters, isLagging: v, expiringSoon: false });
              else setFilters({ ...filters, isLagging: undefined, expiringSoon: false });
            }}
            options={[
              { label: '仅显示掉队', value: 'true' },
              { label: '即将到期', value: 'expiring' },
              { label: '非掉队', value: 'false' },
            ]}
          />
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateOpen(true)}>
            新增会员
          </Button>
        </Space>
      </div>

      <Card bordered={false}>
        <Table
          rowKey="id"
          loading={loading}
          columns={columns}
          dataSource={data}
          pagination={{
            ...pagination,
            total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (t) => `共 ${t} 位会员`,
          }}
          onChange={(p) => setPagination({ current: p.current!, pageSize: p.pageSize! })}
          scroll={{ x: 1200 }}
        />
      </Card>

      <Modal
        title="新增会员"
        open={createOpen}
        onCancel={() => setCreateOpen(false)}
        onOk={() => createForm.submit()}
        confirmLoading={submitting}
        width={560}
      >
        <Form form={createForm} layout="vertical" onFinish={handleCreate} initialValues={{ level: 'TRIAL', status: 'ACTIVE' }}>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="name" label="家长姓名" rules={[{ required: true, message: '请输入姓名' }]}>
                <Input placeholder="请输入家长姓名" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="phone" label="手机号" rules={[{ required: true, message: '请输入手机号' }]}>
                <Input placeholder="请输入手机号" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="childName" label="孩子姓名">
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="childAge" label="孩子年龄">
                <Input type="number" min={0} max={18} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="level" label="会员等级" rules={[{ required: true }]}>
                <Select options={[
                  { label: '体验会员', value: 'TRIAL' },
                  { label: '基础会员', value: 'BASIC' },
                  { label: '高级会员', value: 'PREMIUM' },
                  { label: 'VIP会员', value: 'VIP' },
                ]} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="status" label="状态" rules={[{ required: true }]}>
                <Select options={[
                  { label: '正常', value: 'ACTIVE' },
                  { label: '已过期', value: 'EXPIRED' },
                  { label: '已冻结', value: 'FROZEN' },
                ]} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="conversionSourceId" label="转化来源">
                <Select allowClear options={sources.map((s) => ({ label: s.name, value: s.id }))} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="sourceDetail" label="来源备注">
                <Input placeholder="如：XX团长推荐" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="subscribedAt" label="订阅时间">
                <DatePicker style={{ width: '100%' }} showTime />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="expiresAt" label="到期时间">
                <DatePicker style={{ width: '100%' }} showTime />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="tags" label="标签">
            <Input placeholder="多个标签用逗号分隔，如：高意向,待续费" />
          </Form.Item>
          <Form.Item name="remark" label="备注">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="编辑会员"
        open={editOpen}
        onCancel={() => setEditOpen(false)}
        onOk={() => editForm.submit()}
        confirmLoading={submitting}
        width={560}
      >
        <Form form={editForm} layout="vertical" onFinish={handleEdit}>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="name" label="家长姓名" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="phone" label="手机号" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="childName" label="孩子姓名">
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="childAge" label="孩子年龄">
                <Input type="number" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="level" label="会员等级" rules={[{ required: true }]}>
                <Select options={[
                  { label: '体验会员', value: 'TRIAL' },
                  { label: '基础会员', value: 'BASIC' },
                  { label: '高级会员', value: 'PREMIUM' },
                  { label: 'VIP会员', value: 'VIP' },
                ]} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="status" label="状态" rules={[{ required: true }]}>
                <Select options={[
                  { label: '正常', value: 'ACTIVE' },
                  { label: '已过期', value: 'EXPIRED' },
                  { label: '已冻结', value: 'FROZEN' },
                  { label: '已取消', value: 'CANCELLED' },
                ]} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="conversionSourceId" label="转化来源">
                <Select allowClear options={sources.map((s) => ({ label: s.name, value: s.id }))} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="sourceDetail" label="来源备注">
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="subscribedAt" label="订阅时间">
                <DatePicker style={{ width: '100%' }} showTime />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="expiresAt" label="到期时间">
                <DatePicker style={{ width: '100%' }} showTime />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="tags" label="标签">
            <Input />
          </Form.Item>
          <Form.Item name="remark" label="备注">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>

      <Drawer
        title="即将到期会员"
        open={expirePreviewOpen}
        onClose={() => setExpirePreviewOpen(false)}
        width={480}
      >
        <Empty description="请在上方筛选栏选择「即将到期」查看完整列表" style={{ padding: 40 }} />
        <Button type="primary" block onClick={() => {
          setFilters({ ...filters, expiringSoon: true, isLagging: undefined });
          setExpirePreviewOpen(false);
        }}>
          去筛选
        </Button>
      </Drawer>
    </div>
  );
}

import { Row, Col } from 'antd';
