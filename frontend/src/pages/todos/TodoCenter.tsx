import { useEffect, useState } from 'react';
import {
  Card, Row, Col, Statistic, Tag, Table, Button, Space, Select,
  Input, Modal, Form, DatePicker, message, Drawer, Descriptions,
  Progress, Tabs, Avatar, Popconfirm, Badge, Tooltip, Empty, Divider
} from 'antd';
import {
  FileTextOutlined, PlusOutlined, CheckCircleOutlined, ClockCircleOutlined,
  EditOutlined, DeleteOutlined, UserOutlined, EyeOutlined, TeamOutlined,
  SearchOutlined, FilterOutlined, WarningOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { todoApi, userApi } from '../../services/api';
import dayjs from 'dayjs';
import {
  todoPriorityColor, todoPriorityLabel, todoStatusColor, todoStatusLabel,
  todoTypeLabel, memberLevelColor, memberLevelLabel
} from '../../types';
import type { TodoPriority, TodoStatus } from '../../types';
import type { ColumnsType } from 'antd/es/table';

export default function TodoCenter() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [board, setBoard] = useState<any>(null);
  const [data, setData] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 15 });
  const [filters, setFilters] = useState<any>({
    status: undefined, priority: undefined, type: undefined,
    assigneeId: undefined, overdue: undefined, myOnly: false
  });
  const [teachers, setTeachers] = useState<any[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editData, setEditData] = useState<any>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detail, setDetail] = useState<any>(null);
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadData();
    loadUsers();
  }, [pagination.current, pagination.pageSize, filters]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [boardRes, listRes] = await Promise.all([
        todoApi.boardStats({ myOnly: filters.myOnly }),
        todoApi.list({
          page: pagination.current, pageSize: pagination.pageSize, ...filters
        })
      ]);
      setBoard(boardRes);
      setData(listRes.list);
      setTotal(listRes.total);
    } finally { setLoading(false); }
  };

  const loadUsers = async () => {
    try {
      const res = await userApi.list({ pageSize: 200 });
      setTeachers(res.list);
    } catch {}
  };

  const statusCounts: Record<string, number> = {};
  board?.byStatus?.forEach((s: any) => { statusCounts[s.status] = s._count; });
  const pending = statusCounts['PENDING'] || 0;
  const inProgress = statusCounts['IN_PROGRESS'] || 0;
  const completed = statusCounts['COMPLETED'] || 0;
  const totalTodos = pending + inProgress + completed;

  const openCreate = () => {
    setEditData(null);
    form.resetFields();
    setModalOpen(true);
  };

  const openEdit = (todo: any) => {
    setEditData(todo);
    form.setFieldsValue({
      ...todo,
      dueDate: todo.dueDate ? dayjs(todo.dueDate) : undefined
    });
    setModalOpen(true);
  };

  const openDetail = async (todo: any) => {
    try {
      const res = await todoApi.detail(todo.id);
      setDetail(res);
      setDetailOpen(true);
    } catch {}
  };

  const handleSubmit = async (values: any) => {
    try {
      setSubmitting(true);
      const data = { ...values, dueDate: values.dueDate?.toDate() };
      if (editData) {
        await todoApi.update(editData.id, data);
        message.success('更新成功');
      } else {
        await todoApi.create(data);
        message.success('创建成功');
      }
      setModalOpen(false);
      form.resetFields();
      setEditData(null);
      loadData();
    } finally { setSubmitting(false); }
  };

  const handleComplete = async (todo: any) => {
    try {
      await todoApi.update(todo.id, { status: 'COMPLETED' });
      message.success('已完成');
      loadData();
    } catch {}
  };

  const handleDelete = async (todo: any) => {
    await todoApi.delete(todo.id);
    message.success('已删除');
    loadData();
  };

  const columns: ColumnsType<any> = [
    {
      title: '优先级',
      dataIndex: 'priority',
      width: 90,
      fixed: 'left',
      render: p => <Tag color={todoPriorityColor[p as TodoPriority]} style={{ width: 50, textAlign: 'center' }}>{todoPriorityLabel[p as TodoPriority]}</Tag>,
      sorter: (a, b) => ['URGENT', 'HIGH', 'MEDIUM', 'LOW'].indexOf(a.priority) - ['URGENT', 'HIGH', 'MEDIUM', 'LOW'].indexOf(b.priority)
    },
    {
      title: '标题',
      dataIndex: 'title',
      render: (t, r) => (
        <div>
          <a onClick={() => openDetail(r)} style={{ fontWeight: 500 }}>{t}</a>
          {r.isOverdue && r.status !== 'COMPLETED' && (
            <Badge color="red" text={<span style={{ fontSize: 11, color: '#ff4d4f' }}> 已过期</span>} />
          )}
        </div>
      )
    },
    {
      title: '类型',
      dataIndex: 'type',
      width: 100,
      render: t => <Tag>{todoTypeLabel[t as keyof typeof todoTypeLabel]}</Tag>
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: s => <Tag color={todoStatusColor[s as TodoStatus]}>{todoStatusLabel[s as TodoStatus]}</Tag>
    },
    {
      title: '关联会员',
      dataIndex: 'member',
      width: 140,
      render: m => m ? (
        <a onClick={() => navigate(`/members/${m.id}`)} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Avatar size={24} style={{ backgroundColor: '#1677ff' }}>{m.name.charAt(0)}</Avatar>
          <span>{m.name}</span>
          <Tag color={memberLevelColor[m.level as keyof typeof memberLevelColor]} style={{ fontSize: 10 }}>
            {memberLevelLabel[m.level as keyof typeof memberLevelLabel]}
          </Tag>
        </a>
      ) : <Tag color="default">无</Tag>
    },
    {
      title: '指派人',
      dataIndex: 'assignee',
      width: 100,
      render: a => a ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Avatar size={22} style={{ backgroundColor: '#52c41a', width: 22, height: 22, fontSize: 12 }}>
            {a.name.charAt(0)}
          </Avatar>
          <span style={{ fontSize: 12 }}>{a.name}</span>
        </div>
      ) : <Tag color="default">待指派</Tag>
    },
    {
      title: '截止时间',
      dataIndex: 'dueDate',
      width: 150,
      render: (d, r) => d ? (
        <div>
          <div style={{ color: r.isOverdue && r.status !== 'COMPLETED' ? '#ff4d4f' : undefined, fontWeight: r.isOverdue && r.status !== 'COMPLETED' ? 500 : undefined }}>
            {dayjs(d).format('YYYY-MM-DD HH:mm')}
          </div>
          <div style={{ fontSize: 11, color: '#999' }}>
            {r.status === 'COMPLETED' ? '已完成' : dayjs(d).fromNow()}
          </div>
        </div>
      ) : <Tag color="default">无截止</Tag>
    },
    {
      title: '操作',
      key: 'op',
      width: 180,
      fixed: 'right',
      render: (_, r) => (
        <Space size="small">
          {r.status !== 'COMPLETED' && (
            <Button type="link" size="small" icon={<CheckCircleOutlined />} onClick={() => handleComplete(r)}>
              完成
            </Button>
          )}
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => openDetail(r)}>详情</Button>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => openEdit(r)}>编辑</Button>
          <Popconfirm title="确认删除？" onConfirm={() => handleDelete(r)}>
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
        </Space>
      )
    }
  ];

  const StatBox = ({ icon, label, value, color, bg, onClick, sub }: any) => (
    <Card hoverable size="small" bordered={false} style={{ background: bg, cursor: onClick ? 'pointer' : undefined }} onClick={onClick} styles={{ body: { padding: 14 } }}>
      <Row align="middle" gutter={12}>
        <Col span={6}><div style={{ width: 40, height: 40, borderRadius: 10, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, color }}>{icon}</div></Col>
        <Col span={18}>
          <div style={{ color: '#666', fontSize: 12 }}>{label}</div>
          <div style={{ fontSize: 24, fontWeight: 600, color, lineHeight: 1.2, marginTop: 2 }}>{value}</div>
          {sub && <div style={{ fontSize: 11, color: '#999' }}>{sub}</div>}
        </Col>
      </Row>
    </Card>
  );

  return (
    <div>
      <div className="page-header">
        <h2>待办中心</h2>
        <Space>
          <Tag color="geekblue">共 {totalTodos} 件</Tag>
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>新建待办</Button>
        </Space>
      </div>

      <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={12} md={4}>
          <StatBox icon={<ClockCircleOutlined />} label="待处理" value={pending} color="#d48806"
            bg="linear-gradient(135deg, #fffbe6, #fff1b8)"
            onClick={() => setFilters({ ...filters, status: 'PENDING' })} />
        </Col>
        <Col xs={24} sm={12} md={4}>
          <StatBox icon={<FileTextOutlined />} label="处理中" value={inProgress} color="#0958d9"
            bg="linear-gradient(135deg, #e6f4ff, #bae0ff)"
            onClick={() => setFilters({ ...filters, status: 'IN_PROGRESS' })} />
        </Col>
        <Col xs={24} sm={12} md={4}>
          <StatBox icon={<CheckCircleOutlined />} label="已完成" value={completed} color="#389e0d"
            bg="linear-gradient(135deg, #f6ffed, #b7eb8f)"
            onClick={() => setFilters({ ...filters, status: 'COMPLETED' })} />
        </Col>
        <Col xs={24} sm={12} md={4}>
          <StatBox icon={<WarningOutlined />} label="已过期" value={board?.overdueCount || 0} color="#cf1322"
            bg="linear-gradient(135deg, #fff2f0, #ffccc7)"
            onClick={() => setFilters({ ...filters, overdue: true })} />
        </Col>
        <Col xs={24} sm={12} md={4}>
          <StatBox icon={<UserOutlined />} label="今日到期" value={board?.todayDue || 0} color="#722ed1"
            bg="linear-gradient(135deg, #f9f0ff, #efdbff)" />
        </Col>
        <Col xs={24} sm={12} md={4}>
          <Card size="small" bordered={false} styles={{ body: { padding: 14 } }}>
            <div style={{ color: '#666', fontSize: 12, marginBottom: 6 }}>完成率</div>
            <Progress
              type="dashboard"
              percent={totalTodos > 0 ? Math.round(completed / totalTodos * 100) : 0}
              size={72}
              format={p => `${p}%`}
              style={{ margin: '0 auto', display: 'block' }}
            />
          </Card>
        </Col>
      </Row>

      <Card bordered={false}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
          <Space wrap>
            <Input allowClear prefix={<SearchOutlined />} placeholder="搜索标题/描述" style={{ width: 220 }}
              value={filters.keyword} onChange={e => setFilters({ ...filters, keyword: e.target.value })} />
            <Select allowClear placeholder="状态" style={{ width: 130 }} value={filters.status}
              onChange={v => setFilters({ ...filters, status: v })}
              options={[
                { label: '待处理', value: 'PENDING' },
                { label: '处理中', value: 'IN_PROGRESS' },
                { label: '已完成', value: 'COMPLETED' },
                { label: '已取消', value: 'CANCELLED' }
              ]} />
            <Select allowClear placeholder="优先级" style={{ width: 110 }} value={filters.priority}
              onChange={v => setFilters({ ...filters, priority: v })}
              options={[
                { label: '紧急', value: 'URGENT' },
                { label: '高', value: 'HIGH' },
                { label: '中', value: 'MEDIUM' },
                { label: '低', value: 'LOW' }
              ]} />
            <Select allowClear placeholder="类型" style={{ width: 130 }} value={filters.type}
              onChange={v => setFilters({ ...filters, type: v })}
              options={Object.entries(todoTypeLabel).map(([v, l]) => ({ label: l, value: v }))} />
            <Select allowClear placeholder="指派人" style={{ width: 140 }} value={filters.assigneeId}
              onChange={v => setFilters({ ...filters, assigneeId: v })}
              options={teachers.map(u => ({ label: u.name, value: u.id }))} />
          </Space>
          <Space>
            <Button type={filters.myOnly ? 'primary' : 'default'} icon={<UserOutlined />}
              onClick={() => setFilters({ ...filters, myOnly: !filters.myOnly })}>
              仅看我的
            </Button>
            <Button type={filters.overdue ? 'primary' : 'default'} danger={filters.overdue} icon={<WarningOutlined />}
              onClick={() => setFilters({ ...filters, overdue: !filters.overdue })}>
              只看过期
            </Button>
            <Tooltip title="清除筛选">
              <Button icon={<FilterOutlined />} onClick={() => setFilters({ status: undefined, priority: undefined, type: undefined, assigneeId: undefined, overdue: undefined, myOnly: false, keyword: '' })}>
                重置
              </Button>
            </Tooltip>
          </Space>
        </div>

        <Table
          rowKey="id"
          loading={loading}
          columns={columns}
          dataSource={data}
          rowClassName={r => {
            if (r.status === 'COMPLETED') return '';
            if (r.priority === 'URGENT') return 'urgent-todo';
            if (r.priority === 'HIGH') return 'high-todo';
            if (r.priority === 'MEDIUM') return 'medium-todo';
            return 'low-todo';
          }}
          pagination={{
            ...pagination, total, showSizeChanger: true, showQuickJumper: true,
            showTotal: t => `共 ${t} 条待办`,
            onChange: (p, ps) => setPagination({ current: p, pageSize: ps })
          }}
          scroll={{ x: 1200 }}
        />
      </Card>

      <Modal title={editData ? '编辑待办' : '新建待办'} open={modalOpen} width={600}
        onCancel={() => { setModalOpen(false); form.resetFields(); setEditData(null); }}
        onOk={() => form.submit()} confirmLoading={submitting}>
        <Form form={form} layout="vertical" onFinish={handleSubmit}
          initialValues={{ type: 'CUSTOM', priority: 'MEDIUM', status: 'PENDING' }}>
          <Form.Item name="title" label="标题" rules={[{ required: true, message: '请输入标题' }]}>
            <Input maxLength={200} showCount />
          </Form.Item>
          <Row gutter={12}>
            <Col span={8}>
              <Form.Item name="type" label="类型" rules={[{ required: true }]}>
                <Select options={Object.entries(todoTypeLabel).map(([v, l]) => ({ label: l, value: v }))} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="priority" label="优先级" rules={[{ required: true }]}>
                <Select options={Object.entries(todoPriorityLabel).map(([v, l]) => ({ label: l, value: v }))} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="status" label="状态" rules={[{ required: true }]}>
                <Select options={Object.entries(todoStatusLabel).map(([v, l]) => ({ label: l, value: v }))} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="assigneeId" label="指派给">
                <Select allowClear placeholder="不指派则为创建人"
                  options={teachers.map(u => ({ label: u.name, value: u.id }))} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="dueDate" label="截止时间">
                <DatePicker showTime style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="description" label="详细描述">
            <Input.TextArea rows={4} maxLength={2000} showCount />
          </Form.Item>
          {editData?.status === 'COMPLETED' && (
            <Form.Item name="completedNote" label="完成备注">
              <Input.TextArea rows={2} placeholder="完成情况说明" />
            </Form.Item>
          )}
        </Form>
      </Modal>

      <Drawer title="待办详情" open={detailOpen} onClose={() => setDetailOpen(false)} width={560}>
        {detail && (
          <div>
            <Space style={{ marginBottom: 16 }} wrap>
              <Tag color={todoPriorityColor[detail.priority as TodoPriority]}>
                优先级：{todoPriorityLabel[detail.priority as TodoPriority]}
              </Tag>
              <Tag color={todoStatusColor[detail.status as TodoStatus]}>
                状态：{todoStatusLabel[detail.status as TodoStatus]}
              </Tag>
              <Tag>{todoTypeLabel[detail.type as keyof typeof todoTypeLabel]}</Tag>
              {detail.isOverdue && detail.status !== 'COMPLETED' && <Tag color="error">已过期</Tag>}
            </Space>

            <h3 style={{ marginTop: 0, marginBottom: 8 }}>{detail.title}</h3>
            {detail.description && <p style={{ color: '#666', whiteSpace: 'pre-wrap' }}>{detail.description}</p>}

            <Divider />

            <Descriptions column={1} size="small" bordered>
              <Descriptions.Item label="创建人">{detail.creator?.name || '—'}</Descriptions.Item>
              <Descriptions.Item label="指派人">
                {detail.assignee ? (
                  <Space>
                    <Avatar size={24} style={{ backgroundColor: '#52c41a' }}>{detail.assignee.name.charAt(0)}</Avatar>
                    {detail.assignee.name}
                    <Tag color={detail.assignee.role === 'ADMIN' ? 'red' : 'blue'}>{detail.assignee.role}</Tag>
                  </Space>
                ) : '—'}
              </Descriptions.Item>
              <Descriptions.Item label="关联会员">
                {detail.member ? (
                  <a onClick={() => navigate(`/members/${detail.member.id}`)}>
                    <Avatar size={22} style={{ backgroundColor: '#1677ff' }}>{detail.member.name.charAt(0)}</Avatar>
                    <span style={{ marginLeft: 6 }}>{detail.member.name}</span>
                    <Tag color={memberLevelColor[detail.member.level as keyof typeof memberLevelColor]} style={{ marginLeft: 6, fontSize: 10 }}>
                      {memberLevelLabel[detail.member.level as keyof typeof memberLevelLabel]}
                    </Tag>
                    <span style={{ marginLeft: 6, color: '#999', fontSize: 11 }}>{detail.member.phone}</span>
                  </a>
                ) : '—'}
              </Descriptions.Item>
              <Descriptions.Item label="截止时间">
                {detail.dueDate ? (
                  <span style={{ color: detail.isOverdue && detail.status !== 'COMPLETED' ? '#ff4d4f' : undefined }}>
                    {dayjs(detail.dueDate).format('YYYY-MM-DD HH:mm')}
                    <span style={{ marginLeft: 8, fontSize: 11, color: '#999' }}>
                      {detail.status === 'COMPLETED' ? '已完成' : dayjs(detail.dueDate).fromNow()}
                    </span>
                  </span>
                ) : '—'}
              </Descriptions.Item>
              <Descriptions.Item label="完成时间">
                {detail.completedAt ? dayjs(detail.completedAt).format('YYYY-MM-DD HH:mm') : '—'}
              </Descriptions.Item>
              {detail.completedNote && <Descriptions.Item label="完成备注">{detail.completedNote}</Descriptions.Item>}
              <Descriptions.Item label="创建时间">{dayjs(detail.createdAt).format('YYYY-MM-DD HH:mm')}</Descriptions.Item>
            </Descriptions>

            <Divider />

            <Space>
              {detail.status !== 'COMPLETED' && (
                <Button type="primary" icon={<CheckCircleOutlined />} onClick={() => handleComplete(detail)}>
                  标记完成
                </Button>
              )}
              <Button icon={<EditOutlined />} onClick={() => openEdit(detail)}>编辑</Button>
              {detail.member && (
                <Button icon={<TeamOutlined />} onClick={() => navigate(`/members/${detail.member.id}`)}>查看会员</Button>
              )}
            </Space>
          </div>
        )}
      </Drawer>
    </div>
  );
}
