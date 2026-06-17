import React, { useEffect, useState } from 'react';
import {
  Table, Button, Space, Tag, Input, Select, Modal, Form,
  InputNumber, message, Drawer, Descriptions, Card, Row, Col, List, Divider, Popconfirm
} from 'antd';
import {
  PlusOutlined, SearchOutlined, EditOutlined, EyeOutlined,
  CheckCircleOutlined, CloseCircleOutlined, CopyOutlined, PlusSquareOutlined
} from '@ant-design/icons';
import api from '../services/api';
import dayjs from 'dayjs';

const Quotations = () => {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [detailVisible, setDetailVisible] = useState(false);
  const [current, setCurrent] = useState(null);
  const [editing, setEditing] = useState(null);
  const [extraModalVisible, setExtraModalVisible] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState();
  const [projects, setProjects] = useState([]);
  const [form] = Form.useForm();
  const [extraForm] = Form.useForm();

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
      const res = await api.get('/quotations/', { params });
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
        await api.patch(`/quotations/${editing.id}/`, values);
        message.success('更新成功');
      } else {
        await api.post('/quotations/', values);
        message.success('创建成功');
      }
      setModalVisible(false);
      loadData();
    } catch (err) { message.error('保存失败'); }
  };

  const handleView = async (r) => {
    try {
      const res = await api.get(`/quotations/${r.id}/`);
      setCurrent(res.data);
      setDetailVisible(true);
    } catch (err) { message.error('加载失败'); }
  };

  const handleStatus = async (r, action) => {
    try {
      await api.post(`/quotations/${r.id}/${action}/`);
      message.success('操作成功');
      loadData();
    } catch (err) { message.error('操作失败'); }
  };

  const handleNewVersion = async (r) => {
    try {
      await api.post(`/quotations/${r.id}/create_new_version/`);
      message.success('新版本创建成功');
      loadData();
    } catch (err) { message.error('操作失败'); }
  };

  const handleAddExtra = () => {
    extraForm.resetFields();
    setExtraModalVisible(true);
  };

  const handleExtraSubmit = async (values) => {
    try {
      await api.post(`/quotations/${current.id}/add_extra/`, values);
      message.success('增项添加成功');
      setExtraModalVisible(false);
      handleView({ id: current.id });
      loadData();
    } catch (err) { message.error('添加失败'); }
  };

  const handleConfirmExtra = async (extraId) => {
    try {
      await api.post(`/quotations/${current.id}/confirm_extra/`, { extra_id: extraId });
      message.success('确认成功');
      handleView({ id: current.id });
    } catch (err) { message.error('确认失败'); }
  };

  const columns = [
    { title: '项目', dataIndex: 'project_name', key: 'project_name' },
    { title: '版本', dataIndex: 'version', key: 'version', render: (v, r) => (
      <Space>{v}{r.is_current && <Tag color="green">当前</Tag>}</Space>
    )},
    { title: '报价标题', dataIndex: 'title', key: 'title' },
    { title: '报价总额', dataIndex: 'total_amount', key: 'total_amount', render: (v) => `¥${v?.toLocaleString()}` },
    { title: '材料', dataIndex: 'material_cost', key: 'material_cost', render: (v) => `¥${v?.toLocaleString()}` },
    { title: '人工', dataIndex: 'labor_cost', key: 'labor_cost', render: (v) => `¥${v?.toLocaleString()}` },
    { title: '增项数', dataIndex: 'extra_count', key: 'extra_count' },
    {
      title: '状态', dataIndex: 'status', key: 'status', render: (v, r) => {
        const colors = { draft: 'default', submitted: 'processing', confirmed: 'success', rejected: 'error', expired: 'default' };
        return <Tag color={colors[v]}>{r.status_display}</Tag>;
      }
    },
    { title: '创建时间', dataIndex: 'created_at', key: 'created_at', render: (v) => dayjs(v).format('YYYY-MM-DD') },
    {
      title: '操作', key: 'action', render: (_, r) => (
        <Space size="small">
          <Button size="small" icon={<EyeOutlined />} onClick={() => handleView(r)}>查看</Button>
          {r.status === 'draft' && <Button size="small" icon={<CheckCircleOutlined />} onClick={() => handleStatus(r, 'submit')}>提交</Button>}
          {(r.status === 'draft' || r.status === 'submitted') && (
            <Button size="small" type="primary" icon={<CheckCircleOutlined />} onClick={() => handleStatus(r, 'confirm')}>确认报价</Button>
          )}
          <Button size="small" icon={<CopyOutlined />} onClick={() => handleNewVersion(r)}>新版本</Button>
        </Space>
      )
    }
  ];

  return (
    <div className="page-container">
      <div className="page-header">
        <h2 className="page-title">报价管理</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>新建报价</Button>
      </div>

      <Card>
        <div className="filter-bar">
          <Input placeholder="搜索标题/项目" prefix={<SearchOutlined />} value={search} onChange={(e) => setSearch(e.target.value)} style={{ width: 250 }} allowClear />
          <Select placeholder="状态" value={statusFilter} onChange={setStatusFilter} allowClear style={{ width: 150 }}
            options={[
              { value: 'draft', label: '草稿' },
              { value: 'submitted', label: '已提交' },
              { value: 'confirmed', label: '已确认' },
              { value: 'rejected', label: '已拒绝' },
            ]}
          />
          <Button onClick={loadData}>刷新</Button>
        </div>
        <Table columns={columns} dataSource={list} rowKey="id" loading={loading} pagination={{ pageSize: 10 }} />
      </Card>

      <Modal title={editing ? '编辑报价' : '新建报价'} open={modalVisible} onCancel={() => setModalVisible(false)} onOk={() => form.submit()} width={600}>
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
              <Form.Item name="title" label="报价标题" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="material_cost" label="材料费" initialValue={0}>
                <InputNumber style={{ width: '100%' }} min={0} precision={2} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="labor_cost" label="人工费" initialValue={0}>
                <InputNumber style={{ width: '100%' }} min={0} precision={2} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="equipment_cost" label="设备费" initialValue={0}>
                <InputNumber style={{ width: '100%' }} min={0} precision={2} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="management_fee" label="管理费" initialValue={0}>
                <InputNumber style={{ width: '100%' }} min={0} precision={2} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="profit" label="利润" initialValue={0}>
                <InputNumber style={{ width: '100%' }} min={0} precision={2} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="tax" label="税金" initialValue={0}>
                <InputNumber style={{ width: '100%' }} min={0} precision={2} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="discount" label="优惠金额" initialValue={0}>
                <InputNumber style={{ width: '100%' }} min={0} precision={2} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="valid_days" label="有效期(天)" initialValue={30}>
                <InputNumber style={{ width: '100%' }} min={1} />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item name="remark" label="备注">
                <Input.TextArea rows={2} />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      <Drawer title="报价详情" width={800} open={detailVisible} onClose={() => setDetailVisible(false)}
        extra={
          <Space>
            {current?.status === 'draft' && <Button icon={<PlusSquareOutlined />} type="primary" onClick={handleAddExtra}>添加增项</Button>}
          </Space>
        }
      >
        {current && (
          <div>
            <Descriptions title="基本信息" column={2} bordered size="small">
              <Descriptions.Item label="项目">{current.project_name}</Descriptions.Item>
              <Descriptions.Item label="版本">{current.version}{current.is_current && <Tag color="green">当前</Tag>}</Descriptions.Item>
              <Descriptions.Item label="标题" span={2}>{current.title}</Descriptions.Item>
              <Descriptions.Item label="材料费">¥{current.material_cost?.toLocaleString()}</Descriptions.Item>
              <Descriptions.Item label="人工费">¥{current.labor_cost?.toLocaleString()}</Descriptions.Item>
              <Descriptions.Item label="设备费">¥{current.equipment_cost?.toLocaleString()}</Descriptions.Item>
              <Descriptions.Item label="管理费">¥{current.management_fee?.toLocaleString()}</Descriptions.Item>
              <Descriptions.Item label="利润">¥{current.profit?.toLocaleString()}</Descriptions.Item>
              <Descriptions.Item label="税金">¥{current.tax?.toLocaleString()}</Descriptions.Item>
              <Descriptions.Item label="优惠">¥{current.discount?.toLocaleString()}</Descriptions.Item>
              <Descriptions.Item label="报价总额" span={2}>
                <span style={{ fontSize: 18, fontWeight: 600, color: '#1677ff' }}>¥{current.total_amount?.toLocaleString()}</span>
              </Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag>{current.status_display}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="创建人">{current.created_by_name}</Descriptions.Item>
            </Descriptions>

            <Divider>报价明细</Divider>
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
                { title: '小计', dataIndex: 'amount', key: 'amt', render: v => `¥${v?.toLocaleString()}` },
              ]}
            />

            <Divider>报价增项</Divider>
            <Card size="small" title={`增项列表 (${current.extras?.length || 0})`}>
              <List
                dataSource={current.extras || []}
                renderItem={(e) => (
                  <List.Item
                    actions={[
                      !e.is_confirmed && current.status === 'draft' ? (
                        <Button size="small" type="primary" icon={<CheckCircleOutlined />} onClick={() => handleConfirmExtra(e.id)}>
                          确认
                        </Button>
                      ) : null
                    ].filter(Boolean)}
                  >
                    <List.Item.Meta
                      title={
                        <Space>
                          {e.name}
                          {e.is_confirmed ? <Tag color="green">已确认</Tag> : <Tag color="orange">待确认</Tag>}
                          <span className="text-danger" style={{ fontWeight: 600 }}>¥{e.amount?.toLocaleString()}</span>
                        </Space>
                      }
                      description={
                        <div>
                          <div><strong>说明:</strong> {e.description}</div>
                          {e.reason && <div><strong>原因:</strong> {e.reason}</div>}
                          <div style={{ color: '#999', fontSize: 12 }}>
                            提出人: {e.created_by_name} · {dayjs(e.created_at).format('YYYY-MM-DD HH:mm')}
                          </div>
                        </div>
                      }
                    />
                  </List.Item>
                )}
              />
            </Card>
          </div>
        )}
      </Drawer>

      <Modal title="添加增项" open={extraModalVisible} onCancel={() => setExtraModalVisible(false)} onOk={() => extraForm.submit()}>
        <Form form={extraForm} layout="vertical" onFinish={handleExtraSubmit}>
          <Form.Item name="name" label="增项名称" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="amount" label="增项金额" rules={[{ required: true }]}>
            <InputNumber style={{ width: '100%' }} min={0} precision={2} />
          </Form.Item>
          <Form.Item name="description" label="增项说明" rules={[{ required: true }]}>
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item name="reason" label="增项原因">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Quotations;
