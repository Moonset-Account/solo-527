import React, { useEffect, useState } from 'react';
import {
  Table, Button, Space, Tag, Input, Select, Modal, Form,
  message, Drawer, Card, Row, Col, Divider, Radio, Image, List, Upload
} from 'antd';
import {
  PlusOutlined, SearchOutlined, EyeOutlined, CheckCircleOutlined,
  WarningOutlined, UploadOutlined
} from '@ant-design/icons';
import api from '../services/api';
import dayjs from 'dayjs';

const TYPE_MAP = {
  daily: '日常巡检',
  stage: '分阶段验收',
  final: '竣工验收',
  safety: '安全检查',
  quality: '质量检查',
};

const RESULT_MAP = {
  pass: { text: '合格', color: 'green' },
  fail: { text: '不合格', color: 'red' },
  pending: { text: '待整改', color: 'orange' },
};

const Inspections = () => {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [detailVisible, setDetailVisible] = useState(false);
  const [current, setCurrent] = useState(null);
  const [resultModalVisible, setResultModalVisible] = useState(false);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState();
  const [resultFilter, setResultFilter] = useState();
  const [projects, setProjects] = useState([]);
  const [form] = Form.useForm();
  const [resultForm] = Form.useForm();

  useEffect(() => {
    loadData();
    loadProjects();
  }, [search, typeFilter, resultFilter]);

  const loadData = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (typeFilter) params.type = typeFilter;
      if (resultFilter) params.result = resultFilter;
      const res = await api.get('/inspections/', { params });
      setList(res.data.results || res.data);
    } finally { setLoading(false); }
  };

  const loadProjects = async () => {
    const res = await api.get('/projects/?page_size=100');
    setProjects(res.data.results || res.data);
  };

  const handleAdd = () => {
    form.resetFields();
    setModalVisible(true);
  };

  const handleSubmit = async (values) => {
    try {
      await api.post('/inspections/', {
        ...values,
        inspection_date: values.inspection_date ? values.inspection_date.format() : dayjs().format(),
      });
      message.success('创建成功');
      setModalVisible(false);
      loadData();
    } catch (err) { message.error('保存失败'); }
  };

  const handleView = async (r) => {
    try {
      const res = await api.get(`/inspections/${r.id}/`);
      setCurrent(res.data);
      setDetailVisible(true);
    } catch (err) { message.error('加载失败'); }
  };

  const handleRectified = async (r) => {
    try {
      await api.post(`/inspections/${r.id}/mark_rectified/`);
      message.success('已标记整改完成');
      loadData();
    } catch (err) { message.error('操作失败'); }
  };

  const columns = [
    { title: '项目', dataIndex: 'project_name', key: 'proj' },
    { title: '类型', dataIndex: 'type_display', key: 'type' },
    { title: '标题', dataIndex: 'title', key: 'title' },
    { title: '位置', dataIndex: 'location', key: 'loc' },
    { title: '检查人', dataIndex: 'inspector_name', key: 'inspector' },
    {
      title: '结果', dataIndex: 'result', key: 'result',
      render: (v, r) => {
        const cfg = RESULT_MAP[v] || RESULT_MAP.pending;
        return <Tag color={cfg.color}>{r.result_display}</Tag>;
      }
    },
    {
      title: '整改', dataIndex: 'rectification_required', key: 'rect',
      render: (v, r) => v && !r.rectified_at ? (
        <Space>
          <Tag color="orange">待整改</Tag>
          {r.rectification_deadline && <span className="text-danger">{dayjs(r.rectification_deadline).format('MM-DD')}</span>}
        </Space>
      ) : r.rectified_at ? <Tag color="green">已整改</Tag> : null
    },
    { title: '不合格项', dataIndex: 'fail_count', key: 'fail',
      render: (v) => v > 0 ? <span className="text-danger">{v}</span> : <span className="text-success">0</span>
    },
    { title: '照片', dataIndex: 'photo_count', key: 'photos' },
    { title: '检查时间', dataIndex: 'inspection_date', key: 'date', render: v => dayjs(v).format('MM-DD HH:mm') },
    {
      title: '操作', key: 'act', render: (_, r) => (
        <Space size="small">
          <Button size="small" icon={<EyeOutlined />} onClick={() => handleView(r)}>查看</Button>
          {r.rectification_required && !r.rectified_at && (
            <Button size="small" type="primary" icon={<CheckCircleOutlined />} onClick={() => handleRectified(r)}>
              标记整改
            </Button>
          )}
        </Space>
      )
    }
  ];

  return (
    <div className="page-container">
      <div className="page-header">
        <h2 className="page-title">巡检验收</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>新建巡检</Button>
      </div>

      <Card>
        <div className="filter-bar">
          <Input placeholder="搜索标题/项目/位置" prefix={<SearchOutlined />} value={search} onChange={(e) => setSearch(e.target.value)} style={{ width: 250 }} allowClear />
          <Select placeholder="类型" value={typeFilter} onChange={setTypeFilter} allowClear style={{ width: 150 }}
            options={Object.entries(TYPE_MAP).map(([v, l]) => ({ value: v, label: l }))}
          />
          <Select placeholder="结果" value={resultFilter} onChange={setResultFilter} allowClear style={{ width: 150 }}
            options={Object.entries(RESULT_MAP).map(([v, cfg]) => ({ value: v, label: cfg.text }))}
          />
          <Button onClick={loadData}>刷新</Button>
        </div>
        <Table columns={columns} dataSource={list} rowKey="id" loading={loading} pagination={{ pageSize: 10 }} />
      </Card>

      <Modal title="新建巡检" open={modalVisible} onCancel={() => setModalVisible(false)} onOk={() => form.submit()} width={600}>
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Row gutter={16}>
            <Col span={24}>
              <Form.Item name="project" label="项目" rules={[{ required: true }]}>
                <Select showSearch optionFilterProp="label" options={projects.map(p => ({ value: p.id, label: `${p.code} - ${p.name}` }))} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="type" label="检查类型" rules={[{ required: true }]}>
                <Select options={Object.entries(TYPE_MAP).map(([v, l]) => ({ value: v, label: l }))} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="title" label="检查标题" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item name="location" label="检查位置">
                <Input />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item name="description" label="检查说明">
                <Input.TextArea rows={3} />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      <Drawer title="巡检详情" width={800} open={detailVisible} onClose={() => setDetailVisible(false)}>
        {current && (
          <div>
            <Card size="small" title="基本信息" style={{ marginBottom: 16 }}>
              <Row gutter={16}>
                <Col span={12}><div className="detail-label">项目</div><div className="detail-value">{current.project_name}</div></Col>
                <Col span={12}><div className="detail-label">类型</div><div className="detail-value">{current.type_display}</div></Col>
                <Col span={12}><div className="detail-label">标题</div><div className="detail-value">{current.title}</div></Col>
                <Col span={12}><div className="detail-label">位置</div><div className="detail-value">{current.location || '-'}</div></Col>
                <Col span={12}><div className="detail-label">检查人</div><div className="detail-value">{current.inspector_name || '-'}</div></Col>
                <Col span={12}>
                  <div className="detail-label">结果</div>
                  <div className="detail-value">
                    <Tag color={RESULT_MAP[current.result]?.color}>{current.result_display}</Tag>
                  </div>
                </Col>
                <Col span={24}><div className="detail-label">描述</div><div className="detail-value">{current.description || '-'}</div></Col>
              </Row>
            </Card>

            <Divider>检查项</Divider>
            <Table
              size="small"
              dataSource={current.items || []}
              rowKey="id"
              pagination={false}
              columns={[
                { title: '检查项', dataIndex: 'name', key: 'name' },
                { title: '标准', dataIndex: 'standard', key: 'std' },
                {
                  title: '结果', dataIndex: 'result', key: 'result',
                  render: (v, r) => {
                    const colorMap = { pass: 'green', fail: 'red', na: 'default' };
                    return <Tag color={colorMap[v]}>{r.result_display}</Tag>;
                  }
                },
                { title: '问题描述', dataIndex: 'description', key: 'desc' },
              ]}
            />

            <Divider>现场照片</Divider>
            <div className="photo-grid">
              {current.photos?.map(p => (
                <div key={p.id} className="photo-item">
                  <Image src={p.image} />
                  <div className="photo-info">
                    {p.is_issue && <Tag color="red" style={{ marginRight: 4 }}>问题</Tag>}
                    {p.title || '无标题'}
                  </div>
                </div>
              ))}
              {(!current.photos || current.photos.length === 0) && <div style={{ color: '#999' }}>暂无照片</div>}
            </div>

            {current.rectification_required && (
              <>
                <Divider>整改信息</Divider>
                <Row gutter={16}>
                  <Col span={12}>
                    <div className="detail-label">整改期限</div>
                    <div className="detail-value">{current.rectification_deadline ? dayjs(current.rectification_deadline).format('YYYY-MM-DD') : '-'}</div>
                  </Col>
                  <Col span={12}>
                    <div className="detail-label">整改人</div>
                    <div className="detail-value">{current.rectified_by_name || '-'}</div>
                  </Col>
                  <Col span={24}>
                    <div className="detail-label">整改说明</div>
                    <div className="detail-value">{current.rectification_note || '-'}</div>
                  </Col>
                </Row>
              </>
            )}
          </div>
        )}
      </Drawer>
    </div>
  );
};

export default Inspections;
