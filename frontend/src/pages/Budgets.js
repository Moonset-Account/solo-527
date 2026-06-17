import React, { useEffect, useState } from 'react';
import {
  Table, Button, Space, Tag, Input, Select, Modal, Form,
  InputNumber, message, Drawer, Card, Row, Col, Divider, Progress, Alert
} from 'antd';
import {
  PlusOutlined, SearchOutlined, EditOutlined, EyeOutlined,
  DownloadOutlined, PlusSquareOutlined, CopyOutlined, CheckCircleOutlined, WarningOutlined, DownloadOutlined as DownloadOutlined2
} from '@ant-design/icons';
import api from '../services/api';
import dayjs from 'dayjs';

const Budgets = () => {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [detailVisible, setDetailVisible] = useState(false);
  const [current, setCurrent] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [itemModalVisible, setItemModalVisible] = useState(false);
  const [changeModalVisible, setChangeModalVisible] = useState(false);
  const [editing, setEditing] = useState(null);
  const [projects, setProjects] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState();
  const [form] = Form.useForm();
  const [itemForm] = Form.useForm();
  const [changeForm] = Form.useForm();

  useEffect(() => {
    loadData();
    loadProjects();
  }, [search, statusFilter]);

  const loadData = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      const res = await api.get('/budgets/', { params });
      setList(res.data.results || res.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const loadProjects = async () => {
    const res = await api.get('/projects/?page_size=100');
    setProjects(res.data.results || res.data);
  };

  const handleAdd = () => {
    setEditing(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleSubmit = async (values) => {
    try {
      if (editing) {
        await api.patch(`/budgets/${editing.id}/`, values);
        message.success('更新成功');
      } else {
        await api.post('/budgets/', values);
        message.success('创建成功');
      }
      setModalVisible(false);
      loadData();
    } catch (err) { message.error('保存失败'); }
  };

  const handleView = async (r) => {
    try {
      const res = await api.get(`/budgets/${r.id}/`);
      setCurrent(res.data);
      setDetailVisible(true);
    } catch (err) { message.error('加载失败'); }
  };

  const handleStatus = async (r, action) => {
    try {
      await api.post(`/budgets/${r.id}/${action}/`);
      message.success('操作成功');
      loadData();
    } catch (err) { message.error('操作失败'); }
  };

  const handleNewVersion = async (r) => {
    try {
      await api.post(`/budgets/${r.id}/create_new_version/`);
      message.success('新版本创建成功');
      loadData();
    } catch (err) { message.error('操作失败'); }
  };

  const handleAddItem = () => {
    itemForm.resetFields();
    setItemModalVisible(true);
  };

  const handleItemSubmit = async (values) => {
    try {
      await api.post(`/budgets/${current.id}/add_item/`, values);
      message.success('添加成功');
      setItemModalVisible(false);
      handleView({ id: current.id });
      loadData();
    } catch (err) { message.error('添加失败'); }
  };

  const handleAddChange = () => {
    changeForm.resetFields();
    setChangeModalVisible(true);
  };

  const handleChangeSubmit = async (values) => {
    try {
      await api.post('/budgets/changes/', { ...values, budget: current.id });
      message.success('添加成功');
      setChangeModalVisible(false);
      handleView({ id: current.id });
      loadData();
    } catch (err) { message.error('添加失败'); }
  };

  const handleConfirmChange = async (changeId, action) => {
    try {
      await api.post(`/budgets/changes/${changeId}/${action}/`);
      message.success('操作成功');
      handleView({ id: current.id });
    } catch (err) { message.error('操作失败'); }
  };

  const handleResolveWarning = async (warningId) => {
    try {
      await api.post(`/budgets/warnings/${warningId}/resolve/`);
      message.success('已处理');
      handleView({ id: current.id });
    } catch (err) { message.error('操作失败'); }
  };

  const columns = [
    { title: '项目', dataIndex: 'project_name', key: 'project_name' },
    { title: '版本', dataIndex: 'version', key: 'version', render: (v, r) => (
      <Space>{v}{r.is_current && <Tag color="green">当前</Tag>}</Space>
    )},
    { title: '名称', dataIndex: 'name', key: 'name' },
    { title: '预算总额', dataIndex: 'total_amount', key: 'total_amount', render: v => `¥${v?.toLocaleString()`,
    },
    { title: '材料', dataIndex: 'material_cost', key: 'material_cost', render: v => `¥${v?.toLocaleString()`,
    },
    { title: '人工', dataIndex: 'labor_cost', key: 'labor_cost', render: v => `¥${v?.toLocaleString()`,
    },
    {
      title: '状态', dataIndex: 'status', key: 'status', render: (v, r) => {
        const colors = { draft: 'default', submitted: 'processing', approved: 'success', rejected: 'error' };
        return <Tag color={colors[v]}>{r.status_display}</Tag>;
      }
    },
    { title: '创建时间', dataIndex: 'created_at', key: 'created_at', render: v => dayjs(v).format('YYYY-MM-DD') },
    {
      title: '操作', key: 'action', render: (_, r) => (
        <Space size="small">
          <Button size="small" icon={<EyeOutlined />} onClick={() => handleView(r)}>详情</Button>
          <Button size="small" icon={<DownloadOutlined />} onClick={() => window.open(`/api/budgets/${r.id}/export_excel/`, '_blank')}>导出</Button>
          {r.status === 'draft' && <Button size="small" icon={<CheckCircleOutlined />} onClick={() => handleStatus(r, 'submit')}>提交</Button>}
          {r.status === 'submitted' && (
            <Space direction="vertical" size="small">
              <Button size="small" type="primary" icon={<CheckCircleOutlined />} onClick={() => handleStatus(r, 'approve')}>审批</Button>
            </Space>
          )}
          <Button size="small" icon={<CopyOutlined />} onClick={() => handleNewVersion(r)}>新版本</Button>
        </Space>
      )
    }
  ];

  return (
    <div className="page-container">
      <div className="page-header">
        <h2 className="page-title">预算管理</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>新建预算</Button>
      </div>

      <Card>
        <div className="filter-bar">
          <Input placeholder="搜索" prefix={<SearchOutlined />} value={search} onChange={(e) => setSearch(e.target.value)} style={{ width: 250 }} allowClear />
          <Select placeholder="状态" value={statusFilter} onChange={setStatusFilter} allowClear style={{ width: 150 }}
            options={[
              { value: 'draft', label: '草稿' },
              { value: 'submitted', label: '已提交' },
              { value: 'approved', label: '已批准' },
              { value: 'rejected', label: '已驳回' },
            ]}
          />
          <Button onClick={loadData}>刷新</Button>
        </div>
        <Table columns={columns} dataSource={list} rowKey="id" loading={loading} pagination={{ pageSize: 10 }} />
      </Card>

      <Modal title={editing ? '编辑预算' : '新建预算'} open={modalVisible} onCancel={() => setModalVisible(false)} onOk={() => form.submit()} width={600}>
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="project" label="项目" rules={[{ required: true }]}>
                <Select showSearch optionFilterProp="label" options={projects.map(p => ({ value: p.id, label: `${p.code} - ${p.name}` }))} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="version" label="版本号" initialValue="v1.0" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item name="name" label="预算名称" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="material_cost" label="材料成本" initialValue={0}>
                <InputNumber style={{ width: '100%' }} min={0} precision={2} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="labor_cost" label="人工成本" initialValue={0}>
                <InputNumber style={{ width: '100%' }} min={0} precision={2} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="equipment_cost" label="设备成本" initialValue={0}>
                <InputNumber style={{ width: '100%' }} min={0} precision={2} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="other_cost" label="其他成本" initialValue={0}>
                <InputNumber style={{ width: '100%' }} min={0} precision={2} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="warning_threshold" label="预警阈值(%)" initialValue={10}>
                <InputNumber style={{ width: '100%' }} min={0} max={100} precision={2} />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item name="description" label="说明">
                <Input.TextArea rows={3} />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      <Drawer
        title="预算详情"
        width={900}
        open={detailVisible}
        onClose={() => setDetailVisible(false)}
        extra={
          <Space>
            {current?.status === 'draft' && (
              <Space>
                <Button icon={<PlusSquareOutlined />} onClick={handleAddItem}>添加明细</Button>
                <Button icon={<PlusOutlined />} onClick={handleAddChange}>申请变更</Button>
              </Space>
            )}
          </Space>
        }
      >
        {current && (
          <div>
            {current.warnings?.filter(w => !w.is_resolved)?.length > 0 && (
              <Alert
                message={`有 ${current.warnings.filter(w => !w.is_resolved).length} 条未处理预警`}
                type="warning"
                showIcon
                style={{ marginBottom: 16 }}
              />
            )}

            <Divider>基本信息</Divider>
            <Row gutter={16}>
              <Col span={12}>
                <div className="detail-label">项目</div>
                <div className="detail-value">{current.project_name}</div>
              </Col>
              <Col span={12}>
                <div className="detail-label">版本 {current.version}{current.is_current && <Tag color="green">当前</Tag>}</div>
                <div className="detail-value">{current.name}</div>
              </Col>
              <Col span={8}>
                <div className="detail-label">材料成本</div>
                <div className="detail-value">¥{current.material_cost?.toLocaleString()}</div>
              </Col>
              <Col span={8}>
                <div className="detail-label">人工成本</div>
                <div className="detail-value">¥{current.labor_cost?.toLocaleString()}</div>
              </Col>
              <Col span={8}>
                <div className="detail-label">预算总额</div>
                <div className="detail-value text-primary" style={{ fontSize: 16, fontWeight: 600 }}>¥{current.total_amount?.toLocaleString()}</div>
              </Col>
            </Row>

            <Divider>预算明细</Divider>
            <Table
              size="small"
              dataSource={current.items || []}
              rowKey="id"
              pagination={false}
              columns={[
                { title: '类别', dataIndex: 'category_display', key: 'cat' },
                { title: '项目名称', dataIndex: 'name', key: 'name' },
                { title: '规格', dataIndex: 'specification', key: 'spec' },
                { title: '单位', dataIndex: 'unit', key: 'unit' },
                { title: '数量', dataIndex: 'quantity', key: 'qty' },
                { title: '单价', dataIndex: 'unit_price', key: 'price', render: v => `¥${v}` },
                { title: '金额', dataIndex: 'amount', key: 'amt', render: v => `¥${v?.toLocaleString()}` },
              ]}
            />

            <Divider>变更记录</Divider>
            <Table
              size="small"
              dataSource={current.changes || []}
              rowKey="id"
              pagination={false}
              columns={[
                { title: '类型', dataIndex: 'type_display', key: 'type',
                  render: (v, r) => <Tag color={r.type === 'addition' ? 'red' : 'green'}>{v}</Tag>
                },
                { title: '名称', dataIndex: 'name', key: 'name' },
                { title: '金额', dataIndex: 'amount', key: 'amount', render: v => `¥${v?.toLocaleString()}` },
                { title: '状态', dataIndex: 'status_display', key: 'status' },
                { title: '申请人', dataIndex: 'requested_by_name', key: 'req' },
                {
                  title: '操作', key: 'act', render: (_, r) => r.status === 'pending' && (
                    <Space>
                      <Button size="small" type="primary" onClick={() => handleConfirmChange(r.id, 'confirm')}>确认</Button>
                      <Button size="small" danger onClick={() => handleConfirmChange(r.id, 'reject')}>拒绝</Button>
                    </Space>
                  )
                }
              ]}
            />

            <Divider>预警信息</Divider>
            {current.warnings?.length ? (
              <div>
                {current.warnings.map(w => (
                  <Alert
                key={w.id}
                type={w.level === 'danger' ? 'error' : 'warning'}
                showIcon
                message={
                  <Space>
                    <strong>{w.title}</strong>
                    {!w.is_resolved ? (
                      <Button size="small" onClick={() => handleResolveWarning(w.id)}>标记已处理</Button>
                  ) : <Tag color="green">已处理</Tag>}
                  </Space>
                }
                description={<div>{w.message}<div style={{ color: '#999', fontSize: 12, marginTop: 4 }}>{w.created_at}</div></div>}
                style={{ marginBottom: 8 }}
              />
            ))}
            </div>
          ) : <div style={{ color: '#999' }}>暂无预警</div>}
          </div>
        )}
      </Drawer>

      <Modal title="添加预算明细" open={itemModalVisible} onCancel={() => setItemModalVisible(false)} onOk={() => itemForm.submit()} width={500}>
        <Form form={itemForm} layout="vertical" onFinish={handleItemSubmit}>
          <Form.Item name="category" label="类别" rules={[{ required: true }]}>
            <Select options={[
              { value: 'material', label: '材料' },
              { value: 'labor', label: '人工' },
              { value: 'equipment', label: '设备' },
              { value: 'other', label: '其他' },
            ]} />
          </Form.Item>
          <Form.Item name="name" label="项目名称" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="specification" label="规格">
                <Input />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="unit" label="单位">
                <Input />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="sort_order" label="排序" initialValue={0}>
                <InputNumber style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="quantity" label="数量" rules={[{ required: true }]}>
                <InputNumber style={{ width: '100%' }} min={0} precision={2} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="unit_price" label="单价" rules={[{ required: true }]}>
                <InputNumber style={{ width: '100%' }} min={0} precision={2} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="remark" label="备注">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal title="申请预算变更" open={changeModalVisible} onCancel={() => setChangeModalVisible(false)} onOk={() => changeForm.submit()} width={500}>
        <Form form={changeForm} layout="vertical" onFinish={handleChangeSubmit}>
          <Form.Item name="type" label="类型" rules={[{ required: true }]}>
            <Select options={[
              { value: 'addition', label: '增项' },
              { value: 'deduction', label: '减项' },
            ]} />
          </Form.Item>
          <Form.Item name="name" label="变更名称" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="amount" label="变更金额" rules={[{ required: true }]}>
            <InputNumber style={{ width: '100%' }} min={0} precision={2} />
          </Form.Item>
          <Form.Item name="description" label="变更说明" rules={[{ required: true }]}>
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Budgets;
