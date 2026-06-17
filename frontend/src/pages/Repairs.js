import React, { useEffect, useState } from 'react';
import {
  Table, Button, Space, Tag, Input, Select, Modal, Form,
  InputNumber, message, Drawer, Card, Row, Col, Divider, Rate, Image, List
} from 'antd';
import {
  PlusOutlined, SearchOutlined, EyeOutlined, CheckCircleOutlined,
  UserAddOutlined, CloseCircleOutlined
} from '@ant-design/icons';
import api from '../services/api';
import dayjs from 'dayjs';

const STATUS_MAP = {
  pending: { text: '待处理', color: 'orange' },
  assigned: { text: '已派单', color: 'blue' },
  in_progress: { text: '处理中', color: 'processing' },
  completed: { text: '已完成', color: 'green' },
  cancelled: { text: '已取消', color: 'default' },
};

const PRIORITY_MAP = {
  low: { text: '低', color: 'green' },
  medium: { text: '中', color: 'orange' },
  high: { text: '高', color: 'red' },
  urgent: { text: '紧急', color: 'magenta' },
};

const CATEGORY_MAP = {
  water: '水电',
  decoration: '装修',
  structure: '结构',
  appliance: '设备',
  other: '其他',
};

const Repairs = () => {
  const [list, setList] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [detailVisible, setDetailVisible] = useState(false);
  const [assignModalVisible, setAssignModalVisible] = useState(false);
  const [completeModalVisible, setCompleteModalVisible] = useState(false);
  const [current, setCurrent] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState();
  const [categoryFilter, setCategoryFilter] = useState();
  const [priorityFilter, setPriorityFilter] = useState();
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [form] = Form.useForm();
  const [assignForm] = Form.useForm();
  const [completeForm] = Form.useForm();

  useEffect(() => {
    loadData();
    loadProjects();
    loadUsers();
    loadStats();
  }, [search, statusFilter, categoryFilter, priorityFilter]);

  const loadData = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      if (categoryFilter) params.category = categoryFilter;
      if (priorityFilter) params.priority = priorityFilter;
      const res = await api.get('/repairs/', { params });
      setList(res.data.results || res.data);
    } finally { setLoading(false); }
  };

  const loadStats = async () => {
    try {
      const res = await api.get('/repairs/statistics/');
      setStats(res.data);
    } catch (e) { console.error(e); }
  };

  const loadProjects = async () => {
    const res = await api.get('/projects/?page_size=100');
    setProjects(res.data.results || res.data);
  };

  const loadUsers = async () => {
    const res = await api.get('/users/');
    setUsers(res.data.results || res.data);
  };

  const handleAdd = () => {
    form.resetFields();
    setModalVisible(true);
  };

  const handleSubmit = async (values) => {
    try {
      await api.post('/repairs/', values);
      message.success('创建成功');
      setModalVisible(false);
      loadData();
      loadStats();
    } catch (err) { message.error('保存失败'); }
  };

  const handleView = async (r) => {
    try {
      const res = await api.get(`/repairs/${r.id}/`);
      setCurrent(res.data);
      setDetailVisible(true);
    } catch (err) { message.error('加载失败'); }
  };

  const handleAssign = (r) => {
    setCurrent(r);
    assignForm.resetFields();
    setAssignModalVisible(true);
  };

  const handleAssignSubmit = async (values) => {
    try {
      await api.post(`/repairs/${current.id}/assign/`, values);
      message.success('派单成功');
      setAssignModalVisible(false);
      loadData();
      loadStats();
    } catch (err) { message.error('派单失败'); }
  };

  const handleStart = async (r) => {
    try {
      await api.post(`/repairs/${r.id}/start/`);
      message.success('已开始处理');
      loadData();
      loadStats();
    } catch (err) { message.error('操作失败'); }
  };

  const handleComplete = (r) => {
    setCurrent(r);
    completeForm.resetFields();
    setCompleteModalVisible(true);
  };

  const handleCompleteSubmit = async (values) => {
    try {
      await api.post(`/repairs/${current.id}/complete/`, values);
      message.success('处理完成');
      setCompleteModalVisible(false);
      loadData();
      loadStats();
      handleView({ id: current.id });
    } catch (err) { message.error('操作失败'); }
  };

  const columns = [
    { title: '单号', dataIndex: 'code', key: 'code' },
    { title: '项目', dataIndex: 'project_name', key: 'proj' },
    { title: '标题', dataIndex: 'title', key: 'title' },
    { title: '类型', dataIndex: 'category_display', key: 'cat' },
    {
      title: '优先级', dataIndex: 'priority', key: 'priority',
      render: (v, r) => <Tag color={PRIORITY_MAP[v]?.color}>{r.priority_display}</Tag>
    },
    {
      title: '状态', dataIndex: 'status', key: 'status',
      render: (v, r) => <Tag color={STATUS_MAP[v]?.color}>{r.status_display}</Tag>
    },
    { title: '报修人', dataIndex: 'reporter_name', key: 'reporter' },
    { title: '电话', dataIndex: 'reporter_phone', key: 'phone' },
    { title: '处理人', dataIndex: 'assigned_to_name', key: 'assignee', render: v => v || '-' },
    { title: '总费用', dataIndex: 'total_cost', key: 'cost', render: v => v ? `¥${v}` : '-' },
    { title: '创建时间', dataIndex: 'created_at', key: 'time', render: v => dayjs(v).format('MM-DD HH:mm') },
    {
      title: '操作', key: 'act', render: (_, r) => (
        <Space size="small">
          <Button size="small" icon={<EyeOutlined />} onClick={() => handleView(r)}>详情</Button>
          {r.status === 'pending' && (
            <Button size="small" type="primary" icon={<UserAddOutlined />} onClick={() => handleAssign(r)}>派单</Button>
          )}
          {r.status === 'assigned' && (
            <Button size="small" icon={<CheckCircleOutlined />} onClick={() => handleStart(r)}>开始</Button>
          )}
          {r.status === 'in_progress' && (
            <Button size="small" type="primary" onClick={() => handleComplete(r)}>完成</Button>
          )}
        </Space>
      )
    }
  ];

  return (
    <div className="page-container">
      <div className="page-header">
        <h2 className="page-title">售后报修</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>新建报修</Button>
      </div>

      {stats && (
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col xs={12} md={6}>
            <Card size="small"><Statistic title="总工单" value={stats.total} /></Card>
          </Col>
          <Col xs={12} md={6}>
            <Card size="small"><Statistic title="待处理" value={stats.by_status?.pending || 0} valueStyle={{ color: '#faad14' }} /></Card>
          </Col>
          <Col xs={12} md={6}>
            <Card size="small"><Statistic title="处理中" value={stats.by_status?.in_progress || 0} valueStyle={{ color: '#1677ff' }} /></Card>
          </Col>
          <Col xs={12} md={6}>
            <Card size="small"><Statistic title="已完成" value={stats.by_status?.completed || 0} valueStyle={{ color: '#52c41a' }} /></Card>
          </Col>
        </Row>
      )}

      <Card>
        <div className="filter-bar">
          <Input placeholder="搜索单号/标题/客户" prefix={<SearchOutlined />} value={search} onChange={(e) => setSearch(e.target.value)} style={{ width: 250 }} allowClear />
          <Select placeholder="状态" value={statusFilter} onChange={setStatusFilter} allowClear style={{ width: 130 }}
            options={Object.entries(STATUS_MAP).map(([v, cfg]) => ({ value: v, label: cfg.text }))}
          />
          <Select placeholder="类型" value={categoryFilter} onChange={setCategoryFilter} allowClear style={{ width: 130 }}
            options={Object.entries(CATEGORY_MAP).map(([v, l]) => ({ value: v, label: l }))}
          />
          <Select placeholder="优先级" value={priorityFilter} onChange={setPriorityFilter} allowClear style={{ width: 130 }}
            options={Object.entries(PRIORITY_MAP).map(([v, cfg]) => ({ value: v, label: cfg.text }))}
          />
          <Button onClick={loadData}>刷新</Button>
        </div>
        <Table columns={columns} dataSource={list} rowKey="id" loading={loading} pagination={{ pageSize: 10 }} />
      </Card>

      <Modal title="新建报修单" open={modalVisible} onCancel={() => setModalVisible(false)} onOk={() => form.submit()} width={600}>
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Row gutter={16}>
            <Col span={24}>
              <Form.Item name="project" label="项目" rules={[{ required: true }]}>
                <Select showSearch optionFilterProp="label" options={projects.map(p => ({ value: p.id, label: `${p.code} - ${p.name}` }))} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="title" label="报修标题" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="category" label="报修类型" rules={[{ required: true }]}>
                <Select options={Object.entries(CATEGORY_MAP).map(([v, l]) => ({ value: v, label: l }))} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="priority" label="优先级" initialValue="medium">
                <Select options={Object.entries(PRIORITY_MAP).map(([v, cfg]) => ({ value: v, label: cfg.text }))} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="location" label="报修位置">
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="reporter_name" label="报修人姓名" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="reporter_phone" label="报修人电话" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item name="description" label="问题描述" rules={[{ required: true }]}>
                <Input.TextArea rows={4} />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      <Modal title="派单" open={assignModalVisible} onCancel={() => setAssignModalVisible(false)} onOk={() => assignForm.submit()}>
        <Form form={assignForm} layout="vertical" onFinish={handleAssignSubmit}>
          <Form.Item name="assigned_to" label="选择处理人" rules={[{ required: true }]}>
            <Select showSearch optionFilterProp="label" options={users.map(u => ({ value: u.id, label: `${u.full_name || u.email} (${u.role_display})` }))} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal title="完成处理" open={completeModalVisible} onCancel={() => setCompleteModalVisible(false)} onOk={() => completeForm.submit()} width={500}>
        <Form form={completeForm} layout="vertical" onFinish={handleCompleteSubmit}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="material_cost" label="材料费用" initialValue={0}>
                <InputNumber style={{ width: '100%' }} min={0} precision={2} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="labor_cost" label="人工费用" initialValue={0}>
                <InputNumber style={{ width: '100%' }} min={0} precision={2} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="resolution" label="处理方案" rules={[{ required: true }]}>
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item name="client_feedback" label="客户反馈">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item name="satisfaction" label="客户满意度">
            <Rate />
          </Form.Item>
        </Form>
      </Modal>

      <Drawer title="报修单详情" width={720} open={detailVisible} onClose={() => setDetailVisible(false)}>
        {current && (
          <div>
            <Card size="small" title="基本信息" style={{ marginBottom: 16 }}>
              <Row gutter={16}>
                <Col span={12}><div className="detail-label">单号</div><div className="detail-value">{current.code}</div></Col>
                <Col span={12}><div className="detail-label">状态</div><div className="detail-value"><Tag color={STATUS_MAP[current.status]?.color}>{current.status_display}</Tag></div></Col>
                <Col span={12}><div className="detail-label">项目</div><div className="detail-value">{current.project_name}</div></Col>
                <Col span={12}><div className="detail-label">类型</div><div className="detail-value">{current.category_display}</div></Col>
                <Col span={12}><div className="detail-label">优先级</div><div className="detail-value"><Tag color={PRIORITY_MAP[current.priority]?.color}>{current.priority_display}</Tag></div></Col>
                <Col span={12}><div className="detail-label">位置</div><div className="detail-value">{current.location}</div></Col>
                <Col span={12}><div className="detail-label">报修人</div><div className="detail-value">{current.reporter_name} ({current.reporter_phone})</div></Col>
                <Col span={12}><div className="detail-label">处理人</div><div className="detail-value">{current.assigned_to_name || '-'}</div></Col>
              </Row>
            </Card>

            <Card size="small" title="问题描述" style={{ marginBottom: 16 }}>
              <p style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{current.description}</p>
            </Card>

            <Divider>照片</Divider>
            <div className="photo-grid">
              {current.photos?.map(p => (
                <div key={p.id} className="photo-item">
                  <Image src={p.image} />
                  <div className="photo-info">{p.title || '无标题'}</div>
                </div>
              ))}
              {(!current.photos || current.photos.length === 0) && <div style={{ color: '#999' }}>暂无照片</div>}
            </div>

            {current.status === 'completed' && (
              <>
                <Divider>处理结果</Divider>
                <Row gutter={16}>
                  <Col span={8}><div className="detail-label">材料费</div><div className="detail-value">¥{current.material_cost}</div></Col>
                  <Col span={8}><div className="detail-label">人工费</div><div className="detail-value">¥{current.labor_cost}</div></Col>
                  <Col span={8}><div className="detail-label">总费用</div><div className="detail-value text-primary" style={{ fontWeight: 600 }}>¥{current.total_cost}</div></Col>
                  <Col span={24}><div className="detail-label">处理方案</div><div className="detail-value" style={{ whiteSpace: 'pre-wrap' }}>{current.resolution}</div></Col>
                  {current.client_feedback && (
                    <Col span={24}><div className="detail-label">客户反馈</div><div className="detail-value" style={{ whiteSpace: 'pre-wrap' }}>{current.client_feedback}</div></Col>
                  )}
                  {current.satisfaction && (
                    <Col span={24}><div className="detail-label">满意度</div><div className="detail-value"><Rate disabled value={current.satisfaction} /></div></Col>
                  )}
                </Row>
              </>
            )}

            <Divider>处理记录</Divider>
            <List
              dataSource={current.notes || []}
              renderItem={(n) => (
                <List.Item>
                  <List.Item.Meta
                    title={n.created_by_name}
                    description={dayjs(n.created_at).format('YYYY-MM-DD HH:mm')}
                  />
                  <div>{n.content}</div>
                </List.Item>
              )}
            />
          </div>
        )}
      </Drawer>
    </div>
  );
};

import { Statistic } from 'antd';
export default Repairs;
