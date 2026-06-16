import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Table,
  Card,
  Button,
  Select,
  DatePicker,
  Tag,
  Space,
  Modal,
  Form,
  Input,
  message,
  Popconfirm,
  Drawer,
  Descriptions,
  Row,
  Col,
  Statistic,
  Avatar,
  List,
  Empty,
} from 'antd';
import {
  PlusOutlined,
  CheckOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { todosApi, TodoListItem, campsApi, usersApi, membersApi } from '../services/api';
import { todoStatusMap, todoPriorityMap, todoTypeMap, campStatusMap, formatDate } from '../lib/constants';

const TodosPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [filters, setFilters] = useState<any>({});
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTodo, setEditingTodo] = useState<TodoListItem | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detail, setDetail] = useState<TodoListItem | null>(null);
  const [form] = Form.useForm();

  const { data: camps } = useQuery({
    queryKey: ['camps', 'all'],
    queryFn: () => campsApi.list({ pageSize: 100, page: 1 }),
  });

  const { data: operators } = useQuery({
    queryKey: ['users', 'operators'],
    queryFn: usersApi.listOperators,
  });

  const { data: members } = useQuery({
    queryKey: ['members', 'all-small'],
    queryFn: () => membersApi.list({ pageSize: 200, page: 1 }),
  });

  const { data: stats } = useQuery({
    queryKey: ['todos', 'stats'],
    queryFn: () => todosApi.getStats(),
  });

  const { data: overdue } = useQuery({
    queryKey: ['todos', 'overdue'],
    queryFn: () => todosApi.getOverdue(),
  });

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['todos', page, pageSize, filters],
    queryFn: () => todosApi.list({ page, pageSize, ...filters }),
  });

  const mutation = useMutation({
    mutationFn: (d: any) => {
      const data = { ...d };
      if (data.dueDate) data.dueDate = data.dueDate.toISOString();
      if (editingTodo) {
        return todosApi.update(editingTodo.id, data);
      }
      return todosApi.create(data);
    },
    onSuccess: () => {
      message.success(editingTodo ? '待办已更新' : '待办已创建');
      setModalOpen(false);
      setEditingTodo(null);
      form.resetFields();
      queryClient.invalidateQueries({ queryKey: ['todos'] });
    },
  });

  const completeMutation = useMutation({
    mutationFn: (id: string) => todosApi.complete(id),
    onSuccess: () => {
      message.success('已标记完成');
      queryClient.invalidateQueries({ queryKey: ['todos'] });
      queryClient.invalidateQueries({ queryKey: ['todos', 'stats'] });
    },
  });

  const openDetail = async (id: string) => {
    try {
      const d = await todosApi.get(id);
      setDetail(d);
      setDetailOpen(true);
    } catch (e: any) {
      message.error(e.message);
    }
  };

  const handleSearch = (values: any) => {
    const newFilters: any = {};
    if (values.status) newFilters.status = values.status;
    if (values.priority) newFilters.priority = values.priority;
    if (values.type) newFilters.type = values.type;
    if (values.assigneeId) newFilters.assigneeId = values.assigneeId;
    if (values.campId) newFilters.campId = values.campId;
    if (values.createdRange) {
      newFilters.createdStart = values.createdRange[0]?.toISOString();
      newFilters.createdEnd = values.createdRange[1]?.toISOString();
    }
    if (values.dueBefore) newFilters.dueBefore = values.dueBefore.toISOString();
    setFilters(newFilters);
    setPage(1);
  };

  const columns: ColumnsType<TodoListItem> = [
    {
      title: '待办事项',
      key: 'title',
      width: 300,
      render: (_, r) => {
        const type = todoTypeMap[r.type] || {};
        const priority = todoPriorityMap[r.priority] || {};
        const isOverdue = r.dueDate && r.status !== 'completed' && new Date(r.dueDate) < new Date();
        return (
          <div>
            <Space style={{ marginBottom: 4 }} wrap>
              <span>{type.icon}</span>
              <span
                style={{ fontWeight: 500, cursor: 'pointer', color: isOverdue ? '#ff4d4f' : undefined }}
                onClick={() => openDetail(r.id)}
              >
                {r.title}
                {isOverdue && <WarningOutlined style={{ color: '#ff4d4f', marginLeft: 4 }} />}
              </span>
              <Tag color={priority.color as any} style={{ margin: 0 }}>
                {priority.label}
              </Tag>
            </Space>
            <div style={{ color: '#999', fontSize: 12 }}>
              {type.label} · {r.campName || r.memberName || '通用任务'}
            </div>
          </div>
        );
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (s) => {
        const map = todoStatusMap[s] || {};
        return <Tag color={map.color as any}>{map.label}</Tag>;
      },
    },
    {
      title: '处理人',
      dataIndex: 'assigneeName',
      width: 100,
      render: (n) => n || '—',
    },
    {
      title: '关联会员',
      width: 140,
      render: (_, r) => (r.memberNo ? <Tag>{r.memberNo}</Tag> : '—'),
    },
    {
      title: '截止时间',
      dataIndex: 'dueDate',
      width: 160,
      render: (d, r) => {
        if (!d) return '—';
        const isOverdue = r.status !== 'completed' && new Date(d) < new Date();
        return (
          <span style={{ color: isOverdue ? '#ff4d4f' : undefined }}>
            {formatDate(d)}
            {isOverdue && ' (已逾期)'}
          </span>
        );
      },
    },
    {
      title: '创建人/时间',
      width: 160,
      render: (_, r) => (
        <div>
          <div>{r.creatorName || '—'}</div>
          <div style={{ color: '#999', fontSize: 12 }}>{formatDate(r.createdAt, 'MM-DD HH:mm')}</div>
        </div>
      ),
    },
    {
      title: '操作',
      key: 'actions',
      width: 220,
      fixed: 'right',
      render: (_, r) => (
        <Space>
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => openDetail(r.id)}>
            详情
          </Button>
          {r.status !== 'completed' && r.status !== 'cancelled' && (
            <Button type="link" size="small" icon={<CheckOutlined />} onClick={() => completeMutation.mutate(r.id)}>
              完成
            </Button>
          )}
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => {
              setEditingTodo(r);
              form.setFieldsValue({
                ...r,
                dueDate: r.dueDate ? undefined : undefined,
              });
              setModalOpen(true);
            }}
          >
            编辑
          </Button>
          <Popconfirm title="确定删除？" onConfirm={() => todosApi.remove(r.id).then(() => { message.success('已删除'); queryClient.invalidateQueries({ queryKey: ['todos'] }); })}>
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={12} md={6}>
          <Card size="small" className="stat-card">
            <Statistic title="待办总数" value={stats?.total || 0} />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card size="small" className="stat-card">
            <Statistic title="待处理" value={stats?.pending || 0} valueStyle={{ color: '#FA8C16' }} />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card size="small" className="stat-card">
            <Statistic title="处理中" value={stats?.inProgress || 0} valueStyle={{ color: '#1890ff' }} />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card size="small" className="stat-card">
            <Statistic
              title={<span><WarningOutlined style={{ color: '#ff4d4f' }} /> 已逾期</span>}
              value={stats?.overdue || 0}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
      </Row>

      {overdue && overdue.length > 0 && (
        <Card
          size="small"
          title={<span style={{ color: '#ff4d4f' }}><WarningOutlined /> 逾期提醒（{overdue.length}）</span>}
          style={{ marginBottom: 16, border: '1px solid #ffa39e', background: '#fff1f0' }}
        >
          <List
            size="small"
            dataSource={overdue.slice(0, 5)}
            renderItem={(item: any) => (
              <List.Item
                actions={[
                  <Button type="link" size="small" onClick={() => openDetail(item.id)}>
                    去处理
                  </Button>,
                ]}
              >
                <List.Item.Meta
                  title={
                    <Space>
                      <WarningOutlined style={{ color: '#ff4d4f' }} />
                      <span style={{ color: '#cf1322', fontWeight: 500 }}>{item.title}</span>
                    </Space>
                  }
                  description={
                    <span>
                      {item.assigneeName ? `处理人：${item.assigneeName} · ` : ''}
                      截止：{formatDate(item.dueDate, 'MM-DD HH:mm')}
                    </span>
                  }
                />
              </List.Item>
            )}
          />
        </Card>
      )}

      <div className="filter-bar">
        <Form layout="inline" onFinish={handleSearch} initialValues={filters}>
          <div className="filter-row">
            <Form.Item name="status">
              <Select allowClear placeholder="状态" style={{ width: 120 }} options={Object.entries(todoStatusMap).map(([v, l]) => ({ value: v, label: l.label }))} />
            </Form.Item>
            <Form.Item name="priority">
              <Select allowClear placeholder="优先级" style={{ width: 120 }} options={Object.entries(todoPriorityMap).map(([v, l]) => ({ value: v, label: l.label }))} />
            </Form.Item>
            <Form.Item name="type">
              <Select allowClear placeholder="类型" style={{ width: 140 }} options={Object.entries(todoTypeMap).map(([v, l]) => ({ value: v, label: `${l.icon} ${l.label}` }))} />
            </Form.Item>
            <Form.Item name="assigneeId">
              <Select allowClear placeholder="处理人" style={{ width: 120 }} options={operators?.map((o) => ({ value: o.id, label: o.name }))} />
            </Form.Item>
            <Form.Item name="campId">
              <Select allowClear placeholder="关联营期" style={{ width: 180 }} options={camps?.items?.map((c: any) => ({ value: c.id, label: c.name }))} />
            </Form.Item>
            <Form.Item name="createdRange">
              <DatePicker.RangePicker placeholder={['创建起', '止']} style={{ width: 240 }} />
            </Form.Item>
            <Form.Item>
              <Space>
                <Button type="primary" htmlType="submit">查询</Button>
                <Button onClick={() => { setFilters({}); refetch(); }}>重置</Button>
              </Space>
            </Form.Item>
          </div>
        </Form>
      </div>

      <Card
        title={`待办列表（${data?.total || 0}）`}
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => {
            setEditingTodo(null);
            form.resetFields();
            form.setFieldsValue({ priority: 'medium', status: 'pending', type: 'custom' });
            setModalOpen(true);
          }}>
            新建待办
          </Button>
        }
      >
        <Table<TodoListItem>
          rowKey="id"
          loading={isLoading}
          columns={columns}
          dataSource={data?.items}
          pagination={{
            current: page,
            pageSize,
            total: data?.total || 0,
            showSizeChanger: true,
            showQuickJumper: true,
            onChange: (p, ps) => { setPage(p); setPageSize(ps); },
            showTotal: (t) => `共 ${t} 条`,
          }}
          scroll={{ x: 1300 }}
        />
      </Card>

      <Modal
        title={editingTodo ? '编辑待办' : '新建待办'}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        footer={null}
        width={560}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={(v) => mutation.mutate(v)}>
          <Form.Item label="标题" name="title" rules={[{ required: true }]}>
            <Input maxLength={300} placeholder="输入待办事项标题" />
          </Form.Item>
          <Form.Item label="详情描述" name="description">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="类型" name="type" rules={[{ required: true }]}>
                <Select options={Object.entries(todoTypeMap).map(([v, l]) => ({ value: v, label: `${l.icon} ${l.label}` }))} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="优先级" name="priority" rules={[{ required: true }]}>
                <Select options={Object.entries(todoPriorityMap).map(([v, l]) => ({ value: v, label: l.label }))} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="状态" name="status" rules={[{ required: true }]}>
                <Select options={Object.entries(todoStatusMap).map(([v, l]) => ({ value: v, label: l.label }))} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="截止时间" name="dueDate">
                <DatePicker showTime style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="处理人" name="assigneeId">
                <Select allowClear options={operators?.map((o) => ({ value: o.id, label: o.name }))} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="关联营期" name="campId">
                <Select allowClear options={camps?.items?.map((c: any) => ({ value: c.id, label: c.name }))} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item label="关联会员" name="memberId">
            <Select
              allowClear
              showSearch
              optionFilterProp="label"
              placeholder="搜索会员号或姓名"
              options={members?.items?.map((m: any) => ({
                value: m.id,
                label: `${m.userName}（${m.memberNo}）`,
              }))}
            />
          </Form.Item>
          <Form.Item style={{ marginTop: 16, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setModalOpen(false)}>取消</Button>
              <Button type="primary" htmlType="submit" loading={mutation.isPending}>
                {editingTodo ? '保存' : '创建'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Drawer title="待办详情" width={520} open={detailOpen} onClose={() => setDetailOpen(false)}>
        {detail ? (
          <div>
            <div style={{ marginBottom: 16, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <Tag color={(todoTypeMap[detail.type] || {}).color as any}>
                {(todoTypeMap[detail.type] || {}).icon} {(todoTypeMap[detail.type] || {}).label}
              </Tag>
              <Tag color={(todoPriorityMap[detail.priority] || {}).color as any}>
                优先级：{(todoPriorityMap[detail.priority] || {}).label}
              </Tag>
              <Tag color={(todoStatusMap[detail.status] || {}).color as any}>
                {(todoStatusMap[detail.status] || {}).label}
              </Tag>
            </div>
            <h3 style={{ marginBottom: 12 }}>{detail.title}</h3>
            {detail.description && (
              <Card size="small" style={{ marginBottom: 16, whiteSpace: 'pre-wrap' }}>
                {detail.description}
              </Card>
            )}
            <Descriptions column={1} size="small">
              <Descriptions.Item label="处理人">{detail.assigneeName || '—'}</Descriptions.Item>
              <Descriptions.Item label="创建人">{detail.creatorName || '—'}</Descriptions.Item>
              {detail.completedAt && (
                <Descriptions.Item label="完成人">{detail.completerName || '—'}</Descriptions.Item>
              )}
              <Descriptions.Item label="关联营期">{detail.campName || '—'}</Descriptions.Item>
              {detail.memberNo && (
                <Descriptions.Item label="关联会员">
                  {detail.memberName}（{detail.memberNo}）
                  {detail.memberPhone && ` · ${detail.memberPhone}`}
                </Descriptions.Item>
              )}
              <Descriptions.Item label="截止时间">
                {detail.dueDate ? formatDate(detail.dueDate) : '—'}
              </Descriptions.Item>
              {detail.completedAt && (
                <Descriptions.Item label="完成时间">{formatDate(detail.completedAt)}</Descriptions.Item>
              )}
              <Descriptions.Item label="创建时间">{formatDate(detail.createdAt)}</Descriptions.Item>
              <Descriptions.Item label="更新时间">{formatDate(detail.updatedAt)}</Descriptions.Item>
            </Descriptions>
            {detail.status !== 'completed' && detail.status !== 'cancelled' && (
              <Button type="primary" block style={{ marginTop: 16 }} onClick={() => completeMutation.mutate(detail.id)}>
                <CheckOutlined /> 标记完成
              </Button>
            )}
          </div>
        ) : (
          <Empty />
        )}
      </Drawer>
    </div>
  );
};

export default TodosPage;
