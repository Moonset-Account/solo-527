import React, { useEffect, useState } from 'react';
import {
  Table, Button, Space, Tag, Input, Select, Modal, Form,
  InputNumber, message, Drawer, Card, Row, Col, Tabs, Divider
} from 'antd';
import {
  PlusOutlined, SearchOutlined, EyeOutlined, CheckCircleOutlined,
  DownloadOutlined, WarningOutlined, ShoppingCartOutlined, UnorderedListOutlined
} from '@ant-design/icons';
import api from '../services/api';
import dayjs from 'dayjs';
import ReactECharts from 'echarts-for-react';

const CATEGORY_MAP = {
  structure: '结构材料',
  decoration: '装饰材料',
  electrical: '电气材料',
  plumbing: '水暖材料',
  hardware: '五金配件',
  chemical: '化工材料',
  other: '其他',
};

const Materials = () => {
  const [activeTab, setActiveTab] = useState('materials');
  const [materials, setMaterials] = useState([]);
  const [usages, setUsages] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [lists, setLists] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [currentDetail, setCurrentDetail] = useState(null);
  const [detailVisible, setDetailVisible] = useState(false);
  const [costReport, setCostReport] = useState(null);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState();
  const [form] = Form.useForm();

  useEffect(() => {
    if (activeTab === 'materials') loadMaterials();
    else if (activeTab === 'usages') loadUsages();
    else if (activeTab === 'purchases') loadPurchases();
    else if (activeTab === 'lists') loadLists();
    else if (activeTab === 'report') loadCostReport();
  }, [activeTab, search, categoryFilter]);

  const loadMaterials = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (categoryFilter) params.category = categoryFilter;
      const res = await api.get('/materials/', { params });
      setMaterials(res.data.results || res.data);
    } finally { setLoading(false); }
  };

  const loadUsages = async () => {
    setLoading(true);
    try {
      const res = await api.get('/materials/usages/');
      setUsages(res.data.results || res.data);
    } finally { setLoading(false); }
  };

  const loadPurchases = async () => {
    setLoading(true);
    try {
      const res = await api.get('/materials/purchases/');
      setPurchases(res.data.results || res.data);
    } finally { setLoading(false); }
  };

  const loadLists = async () => {
    setLoading(true);
    try {
      const res = await api.get('/materials/lists/');
      setLists(res.data.results || res.data);
    } finally { setLoading(false); }
  };

  const loadCostReport = async () => {
    setLoading(true);
    try {
      const res = await api.get('/materials/cost_report/');
      setCostReport(res.data);
    } finally { setLoading(false); }
  };

  const handleAdd = () => {
    form.resetFields();
    setModalVisible(true);
  };

  const handleSubmit = async (values) => {
    try {
      await api.post('/materials/', values);
      message.success('创建成功');
      setModalVisible(false);
      loadMaterials();
    } catch (err) { message.error('保存失败'); }
  };

  const handleUsageStatus = async (id, action) => {
    try {
      await api.post(`/materials/usages/${id}/${action}/`);
      message.success('操作成功');
      loadUsages();
    } catch (err) { message.error('操作失败'); }
  };

  const handleViewList = async (r) => {
    try {
      const res = await api.get(`/materials/lists/${r.id}/`);
      setCurrentDetail(res.data);
      setDetailVisible(true);
    } catch (err) { message.error('加载失败'); }
  };

  const materialColumns = [
    { title: '编码', dataIndex: 'code', key: 'code' },
    { title: '名称', dataIndex: 'name', key: 'name' },
    { title: '分类', dataIndex: 'category_display', key: 'cat' },
    { title: '规格', dataIndex: 'specification', key: 'spec' },
    { title: '品牌', dataIndex: 'brand', key: 'brand' },
    { title: '单位', dataIndex: 'unit', key: 'unit' },
    { title: '参考单价', dataIndex: 'unit_price', key: 'price', render: v => `¥${v}` },
    {
      title: '库存', dataIndex: 'stock_quantity', key: 'stock',
      render: (v) => v < 10 ? <span className="text-danger"><WarningOutlined /> {v}</span> : v
    },
    {
      title: '状态', dataIndex: 'is_active', key: 'active',
      render: v => v ? <Tag color="green">启用</Tag> : <Tag color="default">停用</Tag>
    },
  ];

  const usageColumns = [
    { title: '项目', dataIndex: 'project_name', key: 'proj' },
    { title: '材料', dataIndex: 'material_name', key: 'mat' },
    { title: '数量', dataIndex: 'quantity', key: 'qty' },
    { title: '单价', dataIndex: 'unit_price', key: 'price', render: v => `¥${v}` },
    { title: '总金额', dataIndex: 'total_amount', key: 'amt', render: v => `¥${v?.toLocaleString()}` },
    { title: '用途', dataIndex: 'purpose', key: 'purpose' },
    {
      title: '状态', dataIndex: 'status_display', key: 'status',
      render: (v, r) => {
        const colors = { pending: 'orange', approved: 'green', rejected: 'red' };
        return <Tag color={colors[r.status]}>{v}</Tag>;
      }
    },
    { title: '申请人', dataIndex: 'requested_by_name', key: 'req' },
    { title: '时间', dataIndex: 'created_at', key: 'time', render: v => dayjs(v).format('MM-DD HH:mm') },
    {
      title: '操作', key: 'act', render: (_, r) => r.status === 'pending' && (
        <Space>
          <Button size="small" type="primary" onClick={() => handleUsageStatus(r.id, 'approve')}>批准</Button>
          <Button size="small" danger onClick={() => handleUsageStatus(r.id, 'reject')}>拒绝</Button>
        </Space>
      )
    }
  ];

  const purchaseColumns = [
    { title: '供应商', dataIndex: 'supplier', key: 'supplier' },
    { title: '项目', dataIndex: 'project_name', key: 'proj', render: v => v || '-' },
    { title: '总金额', dataIndex: 'total_amount', key: 'amt', render: v => `¥${v?.toLocaleString()}` },
    { title: '采购日期', dataIndex: 'purchase_date', key: 'date' },
    { title: '发票号', dataIndex: 'invoice_no', key: 'inv' },
    { title: '创建人', dataIndex: 'created_by_name', key: 'user' },
  ];

  const listColumns = [
    { title: '项目', dataIndex: 'project_name', key: 'proj' },
    { title: '清单名称', dataIndex: 'name', key: 'name' },
    { title: '明细数', dataIndex: 'item_count', key: 'cnt' },
    { title: '总金额', dataIndex: 'total_amount', key: 'amt', render: v => `¥${v?.toLocaleString()}` },
    {
      title: '状态', dataIndex: 'is_approved', key: 'status',
      render: v => v ? <Tag color="green">已确认</Tag> : <Tag color="orange">待确认</Tag>
    },
    { title: '创建人', dataIndex: 'created_by_name', key: 'user' },
    {
      title: '操作', key: 'act', render: (_, r) => (
        <Button size="small" icon={<EyeOutlined />} onClick={() => handleViewList(r)}>查看</Button>
      )
    }
  ];

  const categoryChartOption = costReport ? {
    tooltip: { trigger: 'item' },
    series: [{
      type: 'pie',
      radius: ['40%', '70%'],
      data: Object.entries(costReport.by_category || {}).map(([k, v]) => ({
        name: CATEGORY_MAP[k] || k, value: v
      })),
    }],
  } : {};

  return (
    <div className="page-container">
      <div className="page-header">
        <h2 className="page-title">材料管理</h2>
        {activeTab === 'materials' && <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>新建材料</Button>}
      </div>

      <Card>
        <Tabs activeKey={activeTab} onChange={setActiveTab}
          items={[
            {
              key: 'materials', label: <span><ShoppingCartOutlined />材料库</span>,
              children: (
                <div>
                  <div className="filter-bar">
                    <Input placeholder="搜索编码/名称/规格" prefix={<SearchOutlined />} value={search} onChange={(e) => setSearch(e.target.value)} style={{ width: 250 }} allowClear />
                    <Select placeholder="分类" value={categoryFilter} onChange={setCategoryFilter} allowClear style={{ width: 150 }}
                      options={Object.entries(CATEGORY_MAP).map(([v, l]) => ({ value: v, label: l }))}
                    />
                    <Button onClick={loadMaterials}>刷新</Button>
                  </div>
                  <Table columns={materialColumns} dataSource={materials} rowKey="id" loading={loading} pagination={{ pageSize: 10 }} />
                </div>
              )
            },
            {
              key: 'usages', label: <span><UnorderedListOutlined />领用记录</span>,
              children: <Table columns={usageColumns} dataSource={usages} rowKey="id" loading={loading} pagination={{ pageSize: 10 }} />
            },
            {
              key: 'purchases', label: <span><DownloadOutlined />采购记录</span>,
              children: <Table columns={purchaseColumns} dataSource={purchases} rowKey="id" loading={loading} pagination={{ pageSize: 10 }} />
            },
            {
              key: 'lists', label: <span><UnorderedListOutlined />材料清单</span>,
              children: <Table columns={listColumns} dataSource={lists} rowKey="id" loading={loading} pagination={{ pageSize: 10 }} />
            },
            {
              key: 'report', label: <span><EyeOutlined />成本报表</span>,
              children: costReport ? (
                <Row gutter={16}>
                  <Col xs={24} md={12}>
                    <Card title="分类占比">
                      <ReactECharts option={categoryChartOption} style={{ height: 350 }} />
                    </Card>
                  </Col>
                  <Col xs={24} md={12}>
                    <Card title={`总支出: ¥${costReport.total?.toLocaleString()}`}>
                      <div className="stat-card">
                        <div className="stat-value text-primary">¥{costReport.total?.toLocaleString()}</div>
                        <div className="stat-label">累计材料成本</div>
                      </div>
                      <Divider />
                      <h4>Top 5 材料消耗</h4>
                      <Table
                        size="small"
                        dataSource={costReport.by_material?.slice(0, 5) || []}
                        pagination={false}
                        columns={[
                          { title: '材料名称', dataIndex: 'name', key: 'name' },
                          { title: '数量', dataIndex: 'quantity', key: 'qty' },
                          { title: '金额', dataIndex: 'amount', key: 'amt', render: v => `¥${v?.toLocaleString()}` },
                        ]}
                      />
                    </Card>
                  </Col>
                </Row>
              ) : null
            },
          ]}
        />
      </Card>

      <Modal title="新建材料" open={modalVisible} onCancel={() => setModalVisible(false)} onOk={() => form.submit()} width={600}>
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="code" label="材料编码" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="name" label="材料名称" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="category" label="分类" rules={[{ required: true }]}>
                <Select options={Object.entries(CATEGORY_MAP).map(([v, l]) => ({ value: v, label: l }))} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="unit" label="单位" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="unit_price" label="参考单价" initialValue={0}>
                <InputNumber style={{ width: '100%' }} min={0} precision={2} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="specification" label="规格型号">
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="brand" label="品牌">
                <Input />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item name="stock_quantity" label="初始库存" initialValue={0}>
                <InputNumber style={{ width: '100%' }} min={0} precision={2} />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item name="description" label="描述">
                <Input.TextArea rows={2} />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      <Drawer title="材料清单详情" width={720} open={detailVisible} onClose={() => setDetailVisible(false)}>
        {currentDetail && (
          <div>
            <Card size="small" title="清单信息" style={{ marginBottom: 16 }}>
              <Row gutter={16}>
                <Col span={12}><div className="detail-label">项目</div><div className="detail-value">{currentDetail.project_name}</div></Col>
                <Col span={12}><div className="detail-label">清单名称</div><div className="detail-value">{currentDetail.name}</div></Col>
                <Col span={8}><div className="detail-label">明细数</div><div className="detail-value">{currentDetail.items?.length || 0}</div></Col>
                <Col span={8}><div className="detail-label">总金额</div><div className="detail-value text-primary" style={{ fontWeight: 600 }}>¥{currentDetail.total_amount?.toLocaleString()}</div></Col>
                <Col span={8}>
                  <div className="detail-label">状态</div>
                  <div className="detail-value">
                    {currentDetail.is_approved ? <Tag color="green">已确认</Tag> : <Tag color="orange">待确认</Tag>}
                  </div>
                </Col>
              </Row>
            </Card>
            <Table
              size="small"
              dataSource={currentDetail.items || []}
              rowKey="id"
              pagination={false}
              columns={[
                { title: '材料名称', dataIndex: 'material_name', key: 'name' },
                { title: '规格', dataIndex: 'specification', key: 'spec' },
                { title: '单位', dataIndex: 'unit', key: 'unit' },
                { title: '数量', dataIndex: 'quantity', key: 'qty' },
                { title: '单价', dataIndex: 'unit_price', key: 'price', render: v => `¥${v}` },
                { title: '金额', dataIndex: 'total_amount', key: 'amt', render: v => `¥${v?.toLocaleString()}` },
                { title: '备注', dataIndex: 'remark', key: 'remark' },
              ]}
            />
          </div>
        )}
      </Drawer>
    </div>
  );
};

export default Materials;
