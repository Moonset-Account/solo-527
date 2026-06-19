import { useEffect, useState } from 'react';
import {
  Card, Row, Col, Statistic, Tag, Table, Button, Space, Select, Modal,
  Form, Input, message, Drawer, Descriptions, Avatar, List, Empty,
  Divider, Alert, Checkbox, Popconfirm, Badge, Timeline, Tooltip, DatePicker
} from 'antd';
import {
  WarningOutlined, UserOutlined, PhoneOutlined, CalendarOutlined,
  EyeOutlined, FileTextOutlined, CheckCircleOutlined, EditOutlined,
  TeamOutlined, SearchOutlined, PlusOutlined, RocketOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { laggingApi, todoApi, campApi } from '../../services/api';
import dayjs from 'dayjs';
import {
  memberLevelColor, memberLevelLabel, campStatusColor, campStatusLabel,
  todoPriorityColor, todoPriorityLabel, todoStatusColor, todoStatusLabel
} from '../../types';
import type { ColumnsType } from 'antd/es/table';

export default function LaggingStudents() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 20 });
  const [filters, setFilters] = useState<any>({ status: undefined, campId: undefined });
  const [camps, setCamps] = useState<any[]>([]);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detail, setDetail] = useState<any>(null);
  const [todoOpen, setTodoOpen] = useState(false);
  const [batchOpen, setBatchOpen] = useState(false);
  const [selectedRows, setSelectedRows] = useState<any[]>([]);
  const [todoForm] = Form.useForm();
  const [batchForm] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [activeRecord, setActiveRecord] = useState<any>(null);

  useEffect(() => { loadCamps(); }, []);
  useEffect(() => { loadData(); }, [pagination.current, pagination.pageSize, filters]);

  const loadCamps = async () => {
    try {
      const res = await campApi.active();
      setCamps(res);
    } catch {}
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await laggingApi.list({
        page: pagination.current, pageSize: pagination.pageSize, ...filters
      });
      setData(res.list);
      setTotal(res.total);
    } finally { setLoading(false); }
  };

  const openDetail = async (record: any) => {
    try {
      const res = await laggingApi.detail(record.id);
      setDetail(res);
      setDetailOpen(true);
    } catch {}
  };

  const handleResolve = async (record: any, remark?: string) => {
    try {
      await laggingApi.update(record.id, {
        resolved: true,
        followUpResult: remark || '已恢复打卡',
        followUpRemark: remark
      });
      message.success('已标记为恢复');
      loadData();
      if (detail?.id === record.id) setDetailOpen(false);
    } catch {}
  };

  const handleFollowUp = async (record: any, values: any) => {
    try {
      setSubmitting(true);
      if (values.createTodo) {
        await laggingApi.createTodo(record.id, {
          title: values.title || `跟进掉队学员：${record.member?.name}`,
          description: values.remark || `连续${record.lagDays}天未打卡，跟进沟通`,
          priority: values.priority || 'HIGH',
          dueDate: values.dueDate?.toDate()
        });
      } else {
        await laggingApi.update(record.id, {
          followUpStatus: 'FOLLOWING',
          followUpRemark: values.remark
        });
      }
      message.success('操作成功');
      setBatchOpen(false);
      setTodoOpen(false);
      batchForm.resetFields();
      todoForm.resetFields();
      loadData();
    } finally { setSubmitting(false); }
  };

  const handleBatchFollow = async () => {
    try {
      setSubmitting(true);
      const values = await batchForm.validateFields();
      await laggingApi.batchFollow({
        ids: selectedRows.map(r => r.id),
        followUpRemark: values.remark,
        followUpStatus: values.status,
        createTodo: values.createTodo
      });
      message.success(`批量处理了 ${selectedRows.length} 名学员`);
      setBatchOpen(false);
      setSelectedRows([]);
      batchForm.resetFields();
      loadData();
    } finally { setSubmitting(false); }
  };

  const columns: ColumnsType<any> = [
    {
      title: '学员',
      dataIndex: 'member',
      width: 220,
      fixed: 'left',
      render: (m, r) => m && (
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <Badge dot status="error" offset={[0, 2]}>
            <Avatar style={{ backgroundColor: '#ff4d4f' }} onClick={() => navigate(`/members/${m.id}`)}>
              {m.name.charAt(0)}
            </Avatar>
          </Badge>
          <div style={{ minWidth: 0 }}>
            <div>
              <a onClick={() => navigate(`/members/${m.id}`)} style={{ fontWeight: 500 }}>{m.name}</a>
              <Tag color={memberLevelColor[m.level as keyof typeof memberLevelColor]} style={{ marginLeft: 6, fontSize: 11 }}>
                {memberLevelLabel[m.level as keyof typeof memberLevelLabel]}
              </Tag>
            </div>
            <div style={{ fontSize: 11, color: '#999', marginTop: 2 }}>
              <PhoneOutlined /> {m.phone}
              {m.childName && <span style={{ marginLeft: 6 }}>👶 {m.childName}</span>}
            </div>
          </div>
        </div>
      )
    },
    {
      title: '连续缺卡',
      dataIndex: 'lagDays',
      width: 100,
      render: d => (
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 22, fontWeight: 600, color: d >= 5 ? '#ff4d4f' : d >= 3 ? '#fa8c16' : '#faad14' }}>
            {d}<span style={{ fontSize: 12 }}>天</span>
          </div>
        </div>
      ),
      sorter: (a, b) => a.lagDays - b.lagDays
    },
    {
      title: '上次打卡',
      dataIndex: 'lastCheckInAt',
      width: 130,
      render: d => d ? (
        <div>
          <div>{dayjs(d).format('MM-DD HH:mm')}</div>
          <div style={{ fontSize: 11, color: '#ff4d4f' }}>{dayjs(d).fromNow()}</div>
        </div>
      ) : <Tag color="default">从未打卡</Tag>
    },
    {
      title: '跟进状态',
      dataIndex: 'followUpStatus',
      width: 100,
      render: s => (
        <Tag color={s === 'RESOLVED' ? 'success' : s === 'FOLLOWING' ? 'processing' : s === 'FOLLOWED_UP' ? 'blue' : 'warning'}>
          {s === 'RESOLVED' ? '已恢复' : s === 'FOLLOWING' ? '跟进中' : s === 'FOLLOWED_UP' ? '已联系' : '待处理'}
        </Tag>
      ),
      filters: [
        { text: '待处理', value: 'PENDING' },
        { text: '跟进中', value: 'FOLLOWING' },
        { text: '已联系', value: 'FOLLOWED_UP' },
        { text: '已恢复', value: 'RESOLVED' }
      ]
    },
    {
      title: '检测原因',
      dataIndex: 'reason',
      ellipsis: true,
      render: t => t || '系统检测连续未打卡'
    },
    {
      title: '累计',
      width: 150,
      render: (_, r) => r.member && (
        <div style={{ display: 'flex', gap: 12 }}>
          <Tooltip title="累计打卡天数">
            <div><CalendarOutlined style={{ color: '#52c41a' }} /> {r.member.totalCheckInDays}</div>
          </Tooltip>
          <Tooltip title="连续打卡天数">
            <div>🔥 {r.member.continuousDays || 0}</div>
          </Tooltip>
        </div>
      )
    },
    {
      title: '待办',
      width: 130,
      render: (_, r) => (
        <Space direction="vertical" size={4}>
          {r.todos?.slice(0, 2).map((t: any) => (
            <Tag key={t.id} color={todoPriorityColor[t.priority as keyof typeof todoPriorityColor]} style={{ margin: 0, fontSize: 11 }}>
              {todoPriorityLabel[t.priority as keyof typeof todoPriorityLabel]}
              {t.assignee?.name && <span style={{ marginLeft: 4, color: '#999' }}>·{t.assignee.name}</span>}
            </Tag>
          ))}
          {!r.todos?.length && <Tag color="default">无</Tag>}
        </Space>
      )
    },
    {
      title: '操作',
      key: 'op',
      width: 220,
      fixed: 'right',
      render: (_, r) => (
        <Space size="small" wrap>
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => openDetail(r)}>详情</Button>
          <Button type="link" size="small" icon={<FileTextOutlined />} onClick={() => { setActiveRecord(r); todoForm.resetFields(); todoForm.setFieldsValue({ priority: 'HIGH' }); setTodoOpen(true); }}>建待办</Button>
          {r.followUpStatus !== 'RESOLVED' && (
            <Popconfirm title="确认已恢复打卡？" onConfirm={() => handleResolve(r)}
              description="标记后将自动清除掉队状态">
              <Button type="link" size="small" icon={<CheckCircleOutlined />} style={{ color: '#52c41a' }}>恢复</Button>
            </Popconfirm>
          )}
        </Space>
      )
    }
  ];

  const StatBox = ({ icon, label, value, color, bg, sub }: any) => (
    <Card size="small" bordered={false} style={{ background: bg }} styles={{ body: { padding: 14 } }}>
      <Row align="middle" gutter={12}>
        <Col span={6}><div style={{ width: 44, height: 44, borderRadius: 12, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, color }}>{icon}</div></Col>
        <Col span={18}>
          <div style={{ color: '#666', fontSize: 12 }}>{label}</div>
          <div style={{ fontSize: 26, fontWeight: 600, color, lineHeight: 1.2, marginTop: 2 }}>{value}</div>
          {sub && <div style={{ fontSize: 11, color: '#999' }}>{sub}</div>}
        </Col>
      </Row>
    </Card>
  );

  const statusCounts: Record<string, number> = {};
  data?.forEach?.((r: any) => { statusCounts[r.followUpStatus] = (statusCounts[r.followUpStatus] || 0) + 1; });

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 style={{ margin: 0 }}>
            掉队学员管理
            <Tag color="error" style={{ marginLeft: 12 }}>
              <WarningOutlined /> 共 {total} 人需关注
            </Tag>
          </h2>
          <div style={{ color: '#999', fontSize: 13, marginTop: 4 }}>
            系统自动检测连续缺卡学员，运营人员跟进沟通后可手动标记恢复
          </div>
        </div>
        <Space>
          {selectedRows.length > 0 && (
            <Button type="primary" icon={<TeamOutlined />} onClick={() => { batchForm.resetFields(); setBatchOpen(true); }}>
              批量跟进 {selectedRows.length} 人
            </Button>
          )}
          <Alert type="info" showIcon message="建议：每天上午统一查看掉队情况，优先跟进连续缺卡5天以上的学员" />
        </Space>
      </div>

      <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={12} md={6}>
          <StatBox icon={<WarningOutlined />} label="全部掉队" value={total} suffix="人" color="#ff4d4f"
            bg="linear-gradient(135deg, #fff2f0, #ffccc7)" />
        </Col>
        <Col xs={24} sm={12} md={6}>
          <StatBox icon={<UserOutlined />} label="待处理" value={statusCounts['PENDING'] || 0} suffix="人" color="#d48806"
            bg="linear-gradient(135deg, #fffbe6, #fff1b8)" />
        </Col>
        <Col xs={24} sm={12} md={6}>
          <StatBox icon={<EditOutlined />} label="跟进中" value={statusCounts['FOLLOWING'] || (statusCounts['FOLLOWED_UP'] || 0)} suffix="人" color="#0958d9"
            bg="linear-gradient(135deg, #e6f4ff, #bae0ff)" />
        </Col>
        <Col xs={24} sm={12} md={6}>
          <StatBox icon={<RocketOutlined />} label="已恢复" value={statusCounts['RESOLVED'] || 0} suffix="人" color="#389e0d"
            bg="linear-gradient(135deg, #f6ffed, #b7eb8f)" />
        </Col>
      </Row>

      <Card bordered={false}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
          <Space>
            <Select allowClear placeholder="所属营期" style={{ width: 240 }} value={filters.campId}
              onChange={v => setFilters({ ...filters, campId: v })}
              options={camps.map(c => ({ label: `${c.name}（${campStatusLabel[c.status as keyof typeof campStatusLabel]}）`, value: c.id }))} />
            <Select allowClear placeholder="跟进状态" style={{ width: 140 }} value={filters.status}
              onChange={v => setFilters({ ...filters, status: v })}
              options={[
                { label: '待处理', value: 'PENDING' },
                { label: '跟进中', value: 'FOLLOWING' },
                { label: '已联系', value: 'FOLLOWED_UP' },
                { label: '已恢复', value: 'RESOLVED' }
              ]} />
          </Space>
          <Space>
            <Input allowClear prefix={<SearchOutlined />} placeholder="搜索姓名/手机号" style={{ width: 200 }} />
          </Space>
        </div>

        <Table
          rowKey="id"
          loading={loading}
          columns={columns}
          dataSource={data}
          rowSelection={{
            selectedRowKeys: selectedRows.map(r => r.id),
            onChange: (_, rows) => setSelectedRows(rows)
          }}
          pagination={{
            ...pagination, total, showSizeChanger: true, showQuickJumper: true,
            showTotal: t => `共 ${t} 名掉队学员`,
            onChange: (p, ps) => setPagination({ current: p, pageSize: ps })
          }}
          scroll={{ x: 1300 }}
        />
      </Card>

      <Drawer title="掉队详情" open={detailOpen} onClose={() => setDetailOpen(false)} width={640}>
        {detail && (
          <div>
            <Alert
              type={detail.followUpStatus === 'RESOLVED' ? 'success' : 'error'}
              showIcon
              message={
                detail.followUpStatus === 'RESOLVED'
                  ? `学员已恢复打卡，恢复时间：${detail.resolvedAt ? dayjs(detail.resolvedAt).format('MM-DD HH:mm') : '—'}`
                  : `已连续缺卡 ${detail.lagDays} 天，上次打卡：${detail.lastCheckInAt ? dayjs(detail.lastCheckInAt).fromNow() : '从未'}`
              }
              style={{ marginBottom: 16 }}
            />

            <Card size="small" style={{ marginBottom: 16 }}>
              <Row gutter={16}>
                <Col>
                  <Avatar size={56} style={{ backgroundColor: '#ff4d4f' }}>
                    {detail.member?.name?.charAt(0)}
                  </Avatar>
                </Col>
                <Col flex="auto">
                  <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>
                    {detail.member?.name}
                    <Tag color={memberLevelColor[detail.member?.level as keyof typeof memberLevelColor]} style={{ marginLeft: 8 }}>
                      {memberLevelLabel[detail.member?.level as keyof typeof memberLevelLabel]}
                    </Tag>
                    {detail.member?.childName && <Tag style={{ marginLeft: 6 }}>👶 {detail.member.childName}{detail.member.childAge && `(${detail.member.childAge}岁)`}</Tag>}
                  </div>
                  <div style={{ color: '#666', marginBottom: 4 }}>
                    <PhoneOutlined /> <a href={`tel:${detail.member?.phone}`}>{detail.member?.phone}</a>
                  </div>
                  <Space>
                    <Button size="small" type="primary" onClick={() => navigate(`/members/${detail.member?.id}`)}>
                      完整档案
                    </Button>
                    <Button size="small">拨打电话</Button>
                    <Button size="small">发送微信</Button>
                  </Space>
                </Col>
              </Row>
            </Card>

            <Descriptions column={2} size="small" bordered style={{ marginBottom: 16 }}>
              <Descriptions.Item label="检测时间">{dayjs(detail.detectedAt).format('YYYY-MM-DD HH:mm')}</Descriptions.Item>
              <Descriptions.Item label="连续缺卡"><span style={{ color: '#ff4d4f', fontWeight: 600 }}>{detail.lagDays} 天</span></Descriptions.Item>
              <Descriptions.Item label="原因">{detail.reason || '系统检测'}</Descriptions.Item>
              <Descriptions.Item label="跟进状态">
                <Tag color={detail.followUpStatus === 'RESOLVED' ? 'success' : detail.followUpStatus === 'FOLLOWING' ? 'processing' : 'warning'}>
                  {detail.followUpStatus === 'RESOLVED' ? '已恢复' : detail.followUpStatus}
                </Tag>
              </Descriptions.Item>
              {detail.lastFollowedAt && (
                <Descriptions.Item label="上次跟进" span={2}>{dayjs(detail.lastFollowedAt).format('YYYY-MM-DD HH:mm')}</Descriptions.Item>
              )}
              {detail.followUpRemark && (
                <Descriptions.Item label="跟进备注" span={2}>{detail.followUpRemark}</Descriptions.Item>
              )}
              {detail.followUpResult && (
                <Descriptions.Item label="处理结果" span={2}>{detail.followUpResult}</Descriptions.Item>
              )}
            </Descriptions>

            <Divider orientation="left" plain style={{ margin: '8px 0 12px' }}>跟进待办 ({detail.todos?.length || 0})</Divider>
            {!detail.todos?.length ? <Empty description="暂无待办，可点击下方按钮创建" image={Empty.PRESENTED_IMAGE_SIMPLE} /> : (
              <List size="small" dataSource={detail.todos}
                renderItem={(t: any) => (
                  <List.Item>
                    <List.Item.Meta
                      avatar={<div style={{ width: 32, height: 32, borderRadius: 8, background: '#fff7e6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><FileTextOutlined /></div>}
                      title={<Space>
                        <Tag color={todoPriorityColor[t.priority as keyof typeof todoPriorityColor]} style={{ margin: 0, fontSize: 11 }}>
                          {todoPriorityLabel[t.priority as keyof typeof todoPriorityLabel]}
                        </Tag>
                        <Tag color={todoStatusColor[t.status as keyof typeof todoStatusColor]} style={{ margin: 0, fontSize: 11 }}>
                          {todoStatusLabel[t.status as keyof typeof todoStatusLabel]}
                        </Tag>
                        <span style={{ fontWeight: 500 }}>{t.title}</span>
                      </Space>}
                      description={
                        <div style={{ fontSize: 12, color: '#666' }}>
                          {t.creator?.name} 创建
                          {t.assignee?.name && <span style={{ margin: '0 8px' }}>指派给：{t.assignee.name}</span>}
                          {t.dueDate && <span>截止：{dayjs(t.dueDate).format('MM-DD HH:mm')}</span>}
                        </div>
                      }
                    />
                  </List.Item>
                )}
              />
            )}

            <Divider style={{ margin: '16px 0' }} />

            <Space>
              <Button type="primary" icon={<FileTextOutlined />} onClick={() => { setActiveRecord(detail); todoForm.resetFields(); todoForm.setFieldsValue({ priority: 'HIGH' }); setTodoOpen(true); }}>
                创建跟进待办
              </Button>
              {detail.followUpStatus !== 'RESOLVED' && (
                <Popconfirm title="确认该学员已恢复打卡？" onConfirm={() => handleResolve(detail)}>
                  <Button icon={<CheckCircleOutlined />} style={{ color: '#52c41a' }}>标记恢复</Button>
                </Popconfirm>
              )}
            </Space>
          </div>
        )}
      </Drawer>

      <Modal title={activeRecord ? '创建跟进待办' : '批量跟进'}
        open={todoOpen || batchOpen}
        onCancel={() => { setTodoOpen(false); setBatchOpen(false); }}
        onOk={activeRecord ? () => todoForm.submit() : handleBatchFollow}
        confirmLoading={submitting}
        width={batchOpen ? undefined : 560}
      >
        {batchOpen ? (
          <Form form={batchForm} layout="vertical" initialValues={{ status: 'FOLLOWING', createTodo: true, priority: 'HIGH' }}>
            <Alert type="info" showIcon message={`将处理 ${selectedRows.length} 名学员`} style={{ marginBottom: 16 }} />
            <Form.Item label="跟进备注" name="remark">
              <Input.TextArea rows={3} placeholder="跟进沟通内容简要说明，如：已电话联系，家长反馈孩子近期生病请假" />
            </Form.Item>
            <Row gutter={12}>
              <Col span={12}>
                <Form.Item label="更新状态为" name="status" rules={[{ required: true }]}>
                  <Select options={[
                    { label: '跟进中', value: 'FOLLOWING' },
                    { label: '已联系', value: 'FOLLOWED_UP' },
                    { label: '已恢复', value: 'RESOLVED' }
                  ]} />
                </Form.Item>
              </Col>
            </Row>
            <Form.Item name="createTodo" valuePropName="checked">
              <Checkbox>同时为每位学员创建跟进待办（推荐）</Checkbox>
            </Form.Item>
          </Form>
        ) : (
          <Form form={todoForm} layout="vertical" initialValues={{ priority: 'HIGH' }}
            onFinish={(v) => handleFollowUp(activeRecord, { ...v, createTodo: true })}>
            <Form.Item name="title" label="待办标题">
              <Input placeholder={`跟进掉队学员：${activeRecord?.member?.name || ''}`} />
            </Form.Item>
            <Row gutter={12}>
              <Col span={12}>
                <Form.Item name="priority" label="优先级" rules={[{ required: true }]}>
                  <Select options={Object.entries(todoPriorityLabel).map(([v, l]) => ({ label: l, value: v }))} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="dueDate" label="截止时间">
                  <DatePicker showTime style={{ width: '100%' }} />
                </Form.Item>
              </Col>
            </Row>
            <Form.Item name="remark" label="跟进备注">
              <Input.TextArea rows={3} placeholder="跟进沟通内容简要说明" />
            </Form.Item>
            <Alert type="info" showIcon message="创建后学员状态将自动更新为「跟进中」" />
          </Form>
        )}
      </Modal>
    </div>
  );
}
