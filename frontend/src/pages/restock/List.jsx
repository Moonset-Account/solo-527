import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Table,
  Button,
  Input,
  Select,
  Space,
  Card,
  App as AntdApp,
  Tag,
  Tooltip,
  Modal,
  Form,
  Drawer,
  Statistic,
  Row,
  Col,
  Divider,
  InputNumber,
  Switch,
  DatePicker,
  Empty,
} from 'antd';
import {
  ExportOutlined,
  EyeOutlined,
  SearchOutlined,
  ReloadOutlined,
  PlusOutlined,
  ShoppingCartOutlined,
  StopOutlined,
  EditOutlined,
  ClockCircleOutlined,
  StockOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  InfoCircleOutlined,
  RiseOutlined,
  FallOutlined,
  HistoryOutlined,
  ThunderboltOutlined,
  DeleteOutlined,
  AppstoreOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { restockApi, productApi, supplierApi, purchaseApi, exportApi } from '@/api/index.js';
import StatusTag from '@/components/StatusTag.jsx';
import {
  fmtMoney,
  fmtNum,
  fmtDate,
  fmtDateTime,
  parsePagination,
  stockStatus,
  priorityLabel,
} from '@/utils/format.js';
import { ROLE, hasRole } from '@/utils/auth.js';

const { Search } = Input;
const { Option } = Select;
const { RangePicker } = DatePicker;
const { TextArea } = Input;

const RESTOCK_STATUS = {
  PENDING: { label: '待处理', color: 'processing' },
  PURCHASED: { label: '已生成采购', color: 'success' },
  IGNORED: { label: '已忽略', color: 'default' },
};

export default function List() {
  const { message, modal } = AntdApp.useApp();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0,
  });

  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState();
  const [onlyPending, setOnlyPending] = useState(false);
  const [categoryId, setCategoryId] = useState();
  const [dateRange, setDateRange] = useState(null);

  const [selectedRowKeys, setSelectedRowKeys] = useState([]);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerRecord, setDrawerRecord] = useState(null);
  const [drawerLoading, setDrawerLoading] = useState(false);
  const [similarProducts, setSimilarProducts] = useState([]);
  const [priceHistory, setPriceHistory] = useState([]);

  const [purchaseModalOpen, setPurchaseModalOpen] = useState(false);
  const [purchaseRecord, setPurchaseRecord] = useState(null);
  const [purchaseForm] = Form.useForm();
  const [submittingPurchase, setSubmittingPurchase] = useState(false);

  const [editQtyModalOpen, setEditQtyModalOpen] = useState(false);
  const [editQtyRecord, setEditQtyRecord] = useState(null);
  const [editQtyForm] = Form.useForm();
  const [submittingEditQty, setSubmittingEditQty] = useState(false);

  const [generating, setGenerating] = useState(false);

  const [kpiData, setKpiData] = useState({
    pendingCount: 0,
    totalAmount: 0,
    canPurchaseCount: 0,
  });

  const fetchKpi = useCallback(async () => {
    try {
      const res = await restockApi.list({ pageSize: 1000, status: 'PENDING' });
      const list = res.data?.list || res.data?.records || [];
      const totalAmount = list.reduce((sum, item) => sum + (item.suggestedQty || 0) * (item.unitPrice || 0), 0);
      const canPurchase = list.filter((item) => item.defaultSupplierId);
      setKpiData({
        pendingCount: list.length,
        totalAmount,
        canPurchaseCount: canPurchase.length,
      });
    } catch (e) {}
  }, []);

  const fetchData = useCallback(
    async (page = 1, pageSize = 20) => {
      setLoading(true);
      try {
        const params = {
          page,
          pageSize,
          keyword: keyword || undefined,
          status: onlyPending ? 'PENDING' : status || undefined,
          categoryId: categoryId || undefined,
          startDate: dateRange?.[0]?.format('YYYY-MM-DD'),
          endDate: dateRange?.[1]?.format('YYYY-MM-DD'),
        };
        const res = await restockApi.list(params);
        const list = res.data?.list || res.data?.records || [];
        setData(list);
        setPagination(parsePagination(res.data));
      } catch (e) {
        message.error('加载失败');
      } finally {
        setLoading(false);
      }
    },
    [keyword, status, onlyPending, categoryId, dateRange, message]
  );

  useEffect(() => {
    fetchKpi();
    fetchData(pagination.current, pagination.pageSize);
  }, [fetchData, fetchKpi]);

  const handleSearch = () => {
    setPagination((p) => ({ ...p, current: 1 }));
  };

  const handleReset = () => {
    setKeyword('');
    setStatus(undefined);
    setOnlyPending(false);
    setCategoryId(undefined);
    setDateRange(null);
    setPagination((p) => ({ ...p, current: 1 }));
  };

  const handleTableChange = (pg) => {
    setPagination({
      current: pg.current,
      pageSize: pg.pageSize,
      total: pg.total,
    });
    fetchData(pg.current, pg.pageSize);
  };

  const handleViewDetail = async (record) => {
    setDrawerRecord(record);
    setDrawerOpen(true);
    setDrawerLoading(true);
    try {
      const [productRes, purchaseRes] = await Promise.all([
        productApi.list({ categoryId: record.categoryId, pageSize: 6 }),
        purchaseApi.list({ productId: record.productId, pageSize: 10 }),
      ]);
      setSimilarProducts(productRes.data?.list?.filter?.((p) => p.id !== record.productId)?.slice(0, 5) || []);
      setPriceHistory(purchaseRes.data?.list || []);
    } catch (e) {
    } finally {
      setDrawerLoading(false);
    }
  };

  const handleGenerate = async () => {
    modal.confirm({
      title: '生成补货建议',
      content: '确定要立即生成补货建议吗？系统将根据当前库存、安全库存和日均销量计算建议补货量。',
      onOk: async () => {
        setGenerating(true);
        try {
          await restockApi.generate();
          message.success('补货建议生成成功');
          fetchKpi();
          fetchData(pagination.current, pagination.pageSize);
        } catch (e) {
          message.error('生成失败');
        } finally {
          setGenerating(false);
        }
      },
    });
  };

  const handleCreatePurchase = (record) => {
    setPurchaseRecord(record);
    purchaseForm.resetFields();
    purchaseForm.setFieldsValue({
      supplierId: record.defaultSupplierId,
      quantity: record.suggestedQty,
      mergeSame: true,
    });
    setPurchaseModalOpen(true);
  };

  const submitPurchase = async () => {
    try {
      const values = await purchaseForm.validateFields();
      setSubmittingPurchase(true);
      await restockApi.action(purchaseRecord.id, {
        action: 'PURCHASE',
        supplierId: values.supplierId,
        quantity: values.quantity,
        mergeSame: values.mergeSame,
      });
      message.success('采购单生成成功');
      setPurchaseModalOpen(false);
      fetchKpi();
      fetchData(pagination.current, pagination.pageSize);
    } catch (e) {
      message.error('生成失败');
    } finally {
      setSubmittingPurchase(false);
    }
  };

  const handleBatchPurchase = () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请先选择补货建议');
      return;
    }
    const pendingItems = data.filter((item) => selectedRowKeys.includes(item.id) && item.status === 'PENDING');
    if (pendingItems.length === 0) {
      message.warning('选中的建议中没有待处理的');
      return;
    }
    modal.confirm({
      title: '批量生成采购单',
      content: `确定要为选中的 ${pendingItems.length} 条建议生成采购单吗？`,
      onOk: async () => {
        try {
          await Promise.all(
            pendingItems.map((item) =>
              restockApi.action(item.id, { action: 'PURCHASE', quantity: item.suggestedQty })
            )
          );
          message.success('批量生成成功');
          setSelectedRowKeys([]);
          fetchKpi();
          fetchData(pagination.current, pagination.pageSize);
        } catch (e) {
          message.error('部分生成失败');
        }
      },
    });
  };

  const handleIgnore = (record) => {
    modal.confirm({
      title: '忽略建议',
      content: `确定要忽略「${record.productName}」的补货建议吗？`,
      onOk: async () => {
        try {
          await restockApi.action(record.id, { action: 'IGNORE' });
          message.success('已忽略');
          fetchKpi();
          fetchData(pagination.current, pagination.pageSize);
        } catch (e) {
          message.error('操作失败');
        }
      },
    });
  };

  const handleBatchIgnore = () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请先选择补货建议');
      return;
    }
    modal.confirm({
      title: '批量忽略',
      content: `确定要忽略选中的 ${selectedRowKeys.length} 条补货建议吗？`,
      onOk: async () => {
        try {
          await Promise.all(
            selectedRowKeys.map((id) => restockApi.action(id, { action: 'IGNORE' }))
          );
          message.success('批量忽略成功');
          setSelectedRowKeys([]);
          fetchKpi();
          fetchData(pagination.current, pagination.pageSize);
        } catch (e) {
          message.error('部分操作失败');
        }
      },
    });
  };

  const handleEditQty = (record) => {
    setEditQtyRecord(record);
    editQtyForm.resetFields();
    editQtyForm.setFieldsValue({ quantity: record.suggestedQty });
    setEditQtyModalOpen(true);
  };

  const submitEditQty = async () => {
    try {
      const values = await editQtyForm.validateFields();
      setSubmittingEditQty(true);
      await restockApi.action(editQtyRecord.id, {
        action: 'UPDATE_QTY',
        quantity: values.quantity,
        reason: values.reason,
      });
      message.success('数量已更新');
      setEditQtyModalOpen(false);
      fetchKpi();
      fetchData(pagination.current, pagination.pageSize);
    } catch (e) {
      message.error('操作失败');
    } finally {
      setSubmittingEditQty(false);
    }
  };

  const handleExport = async () => {
    try {
      message.info('导出功能开发中...');
    } catch (e) {
      message.error('导出失败');
    }
  };

  const columns = [
    {
      title: '生成时间',
      dataIndex: 'createdAt',
      width: 160,
      render: (v) => fmtDateTime(v),
    },
    {
      title: 'SKU',
      dataIndex: 'sku',
      width: 120,
      render: (text) => <code style={{ fontSize: 12 }}>{text}</code>,
    },
    {
      title: '商品名称',
      dataIndex: 'productName',
      width: 180,
      render: (text, record) => (
        <a onClick={() => handleViewDetail(record)} style={{ fontWeight: 500 }}>
          {text}
        </a>
      ),
    },
    {
      title: '当前库存',
      dataIndex: 'currentStock',
      width: 100,
      render: (v, record) => {
        const s = stockStatus(v, record.safetyStock);
        return <span style={{ color: s.color, fontWeight: 500 }}>{fmtNum(v)}</span>;
      },
    },
    {
      title: '安全库存',
      dataIndex: 'safetyStock',
      width: 100,
      render: (v) => fmtNum(v),
    },
    {
      title: '缺口量',
      dataIndex: 'gapQty',
      width: 100,
      render: (v) => <span style={{ color: '#ff4d4f', fontWeight: 500 }}>{fmtNum(v)}</span>,
    },
    {
      title: '建议补货量',
      dataIndex: 'suggestedQty',
      width: 120,
      render: (v) => (
        <span style={{ color: '#1677ff', fontWeight: 600, fontSize: 15 }}>{fmtNum(v)}</span>
      ),
    },
    {
      title: '日均用量',
      dataIndex: 'dailyUsage',
      width: 100,
      render: (v) => `${fmtNum(v)}/天`,
    },
    {
      title: 'Lead Time',
      dataIndex: 'leadTimeDays',
      width: 100,
      render: (v) => (v ? `${v} 天` : '-'),
    },
    {
      title: '默认供应商',
      dataIndex: 'defaultSupplierName',
      width: 140,
      render: (text) => text || '-',
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 110,
      render: (s) => {
        const cfg = RESTOCK_STATUS[s];
        return cfg ? <Tag color={cfg.color}>{cfg.label}</Tag> : <Tag>{s}</Tag>;
      },
    },
    {
      title: '操作',
      key: 'actions',
      width: 240,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<InfoCircleOutlined />}
            onClick={() => handleViewDetail(record)}
          >
            详情
          </Button>
          {record.status === 'PENDING' && (
            <>
              <Button
                type="link"
                size="small"
                icon={<EditOutlined />}
                onClick={() => handleEditQty(record)}
              >
                改数量
              </Button>
              <Button
                type="link"
                size="small"
                icon={<ShoppingCartOutlined />}
                onClick={() => handleCreatePurchase(record)}
                disabled={!record.defaultSupplierId}
              >
                生成采购
              </Button>
              <Button
                type="link"
                size="small"
                icon={<StopOutlined />}
                onClick={() => handleIgnore(record)}
              >
                忽略
              </Button>
            </>
          )}
        </Space>
      ),
    },
  ];

  const rowSelection = {
    selectedRowKeys,
    onChange: (keys) => setSelectedRowKeys(keys),
    getCheckboxProps: (record) => ({
      disabled: record.status !== 'PENDING',
    }),
  };

  const statusOptions = Object.entries(RESTOCK_STATUS).map(([key, val]) => ({
    value: key,
    label: val.label,
  }));

  return (
    <div className="app-page">
      <div className="page-title">
        <h2>补货建议</h2>
      </div>

      <div className="stat-cards" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        <Card bodyStyle={{ padding: '14px 16px' }}>
          <div className="top">
            <div>
              <div className="label">
                <ClockCircleOutlined style={{ marginRight: 4 }} />
                待处理建议
              </div>
              <div className="value" style={{ color: '#1677ff' }}>
                {fmtNum(kpiData.pendingCount)}
                <span className="unit">条</span>
              </div>
            </div>
            <div className="icon-box blue">
              <StockOutlined />
            </div>
          </div>
        </Card>
        <Card bodyStyle={{ padding: '14px 16px' }}>
          <div className="top">
            <div>
              <div className="label">
                <RiseOutlined style={{ marginRight: 4 }} />
                建议补货总金额
              </div>
              <div className="value" style={{ color: '#52c41a' }}>
                {fmtMoney(kpiData.totalAmount)}
              </div>
            </div>
            <div className="icon-box green">
              <ShoppingCartOutlined />
            </div>
          </div>
        </Card>
        <Card bodyStyle={{ padding: '14px 16px' }}>
          <div className="top">
            <div>
              <div className="label">
                <CheckCircleOutlined style={{ marginRight: 4 }} />
                可直接生成采购单
              </div>
              <div className="value" style={{ color: '#fa8c16' }}>
                {fmtNum(kpiData.canPurchaseCount)}
                <span className="unit">条</span>
              </div>
            </div>
            <div className="icon-box orange">
              <ThunderboltOutlined />
            </div>
          </div>
        </Card>
      </div>

      <div className="filter-card">
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          <Space wrap size="middle">
            <Search
              placeholder="搜索 SKU/商品名"
              allowClear
              enterButton={<SearchOutlined />}
              style={{ width: 260 }}
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onSearch={handleSearch}
            />
            <Select
              placeholder="状态"
              allowClear
              style={{ width: 130 }}
              value={status}
              onChange={setStatus}
              options={statusOptions}
              disabled={onlyPending}
            />
            <Space>
              <span style={{ color: '#8c8c8c', fontSize: 13 }}>只看未生成：</span>
              <Switch size="small" checked={onlyPending} onChange={setOnlyPending} />
            </Space>
            <Input
              placeholder="分类ID"
              allowClear
              style={{ width: 110 }}
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              onPressEnter={handleSearch}
            />
            <RangePicker
              placeholder={['开始', '结束']}
              style={{ width: 240 }}
              value={dateRange}
              onChange={setDateRange}
            />
            <Button icon={<ReloadOutlined />} onClick={handleReset}>
              重置
            </Button>
          </Space>

          <Space>
            <Button
              type="primary"
              icon={<ThunderboltOutlined />}
              loading={generating}
              onClick={handleGenerate}
            >
              立即生成建议
            </Button>
            <Button
              icon={<ShoppingCartOutlined />}
              onClick={handleBatchPurchase}
              disabled={selectedRowKeys.length === 0}
            >
              批量生成采购单
            </Button>
            <Button
              icon={<StopOutlined />}
              onClick={handleBatchIgnore}
              disabled={selectedRowKeys.length === 0}
            >
              批量忽略
            </Button>
            <Button icon={<ExportOutlined />} onClick={handleExport}>
              导出
            </Button>
          </Space>
        </div>
      </div>

      <Table
        rowKey="id"
        columns={columns}
        dataSource={data}
        loading={loading}
        pagination={{
          ...pagination,
          showTotal: (t) => `共 ${t} 条`,
          showSizeChanger: true,
          showQuickJumper: true,
        }}
        rowSelection={rowSelection}
        onChange={handleTableChange}
        scroll={{ x: 1600 }}
        size="middle"
        onRow={(record) => ({
          onClick: () => handleViewDetail(record),
          style: { cursor: 'pointer' },
        })}
      />

      <Drawer
        title="补货建议详情"
        placement="right"
        width={520}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        loading={drawerLoading}
      >
        {drawerRecord && (
          <div>
            <div style={{ marginBottom: 16 }}>
              <h3 style={{ margin: '0 0 8px', fontSize: 18 }}>{drawerRecord.productName}</h3>
              <div style={{ color: '#8c8c8c', fontSize: 13 }}>
                SKU：<code>{drawerRecord.sku}</code>
                <Tag
                  color={RESTOCK_STATUS[drawerRecord.status]?.color}
                  style={{ marginLeft: 12 }}
                >
                  {RESTOCK_STATUS[drawerRecord.status]?.label}
                </Tag>
              </div>
            </div>

            <Card size="small" style={{ marginBottom: 12 }} title="库存与补货">
              <Row gutter={[16, 12]}>
                <Col span={12}>
                  <Statistic title="当前库存" value={drawerRecord.currentStock} valueStyle={{ color: '#1677ff' }} />
                </Col>
                <Col span={12}>
                  <Statistic title="安全库存" value={drawerRecord.safetyStock} />
                </Col>
                <Col span={12}>
                  <Statistic
                    title="缺口量"
                    value={drawerRecord.gapQty}
                    valueStyle={{ color: '#ff4d4f' }}
                  />
                </Col>
                <Col span={12}>
                  <Statistic
                    title="建议补货量"
                    value={drawerRecord.suggestedQty}
                    valueStyle={{ color: '#52c41a' }}
                  />
                </Col>
                <Col span={12}>
                  <Statistic title="日均用量" value={drawerRecord.dailyUsage} suffix="/天" />
                </Col>
                <Col span={12}>
                  <Statistic title="Lead Time" value={drawerRecord.leadTimeDays || 0} suffix="天" />
                </Col>
              </Row>
            </Card>

            <Card size="small" style={{ marginBottom: 12 }} title="供应商信息">
              <div className="info-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                <div className="info-item">
                  <span className="k">默认供应商：</span>
                  <span className="v">{drawerRecord.defaultSupplierName || '-'}</span>
                </div>
                <div className="info-item">
                  <span className="k">参考单价：</span>
                  <span className="v">{fmtMoney(drawerRecord.unitPrice)}</span>
                </div>
              </div>
            </Card>

            <Divider style={{ margin: '12px 0' }} />

            <div style={{ marginBottom: 8 }}>
              <h4 style={{ margin: 0 }}>同类商品</h4>
            </div>
            {similarProducts.length > 0 ? (
              <List
                size="small"
                dataSource={similarProducts}
                renderItem={(item) => (
                  <List.Item
                    actions={[
                      <Button type="link" size="small" onClick={() => navigate(`/products`)}>
                        查看
                      </Button>,
                    ]}
                  >
                    <List.Item.Meta
                      title={item.name}
                      description={
                        <span style={{ color: '#fa8c16' }}>{fmtMoney(item.price)}</span>
                      }
                    />
                  </List.Item>
                )}
              />
            ) : (
              <Empty description="暂无同类商品" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            )}

            <Divider style={{ margin: '12px 0' }} />

            <div style={{ marginBottom: 8 }}>
              <h4 style={{ margin: 0 }}>
                <HistoryOutlined style={{ marginRight: 4 }} />
                历史采购价
              </h4>
            </div>
            {priceHistory.length > 0 ? (
              <List
                size="small"
                dataSource={priceHistory}
                renderItem={(item) => (
                  <List.Item>
                    <List.Item.Meta
                      title={item.code}
                      description={
                        <span style={{ color: '#8c8c8c', fontSize: 12 }}>
                          {fmtDate(item.orderDate)} · {item.supplierName}
                        </span>
                      }
                    />
                    <div style={{ color: '#fa8c16', fontWeight: 500 }}>
                      {fmtMoney(item.totalAmount)}
                    </div>
                  </List.Item>
                )}
              />
            ) : (
              <Empty description="暂无采购记录" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            )}

            {drawerRecord.status === 'PENDING' && (
              <div style={{ marginTop: 20, display: 'flex', gap: 8 }}>
                <Button
                  type="primary"
                  block
                  icon={<ShoppingCartOutlined />}
                  onClick={() => {
                    setDrawerOpen(false);
                    handleCreatePurchase(drawerRecord);
                  }}
                  disabled={!drawerRecord.defaultSupplierId}
                >
                  生成采购单
                </Button>
                <Button
                  block
                  icon={<StopOutlined />}
                  onClick={() => {
                    setDrawerOpen(false);
                    handleIgnore(drawerRecord);
                  }}
                >
                  忽略
                </Button>
              </div>
            )}
          </div>
        )}
      </Drawer>

      <Modal
        title="生成采购单"
        open={purchaseModalOpen}
        onCancel={() => setPurchaseModalOpen(false)}
        onOk={submitPurchase}
        confirmLoading={submittingPurchase}
        okText="确认生成"
        destroyOnHidden
        width={480}
      >
        {purchaseRecord && (
          <div style={{ marginBottom: 16, padding: 12, background: '#f5f7fa', borderRadius: 6 }}>
            <div style={{ color: '#8c8c8c', fontSize: 13, marginBottom: 4 }}>商品</div>
            <div style={{ fontWeight: 500 }}>{purchaseRecord.productName}</div>
            <div style={{ color: '#8c8c8c', fontSize: 12 }}>
              建议补货量：{fmtNum(purchaseRecord.suggestedQty)} · 参考价：{fmtMoney(purchaseRecord.unitPrice)}
            </div>
          </div>
        )}
        <Form form={purchaseForm} layout="vertical">
          <Form.Item
            name="supplierId"
            label="供应商"
            rules={[{ required: true, message: '请选择供应商' }]}
          >
            <Select placeholder="请选择供应商">
              {purchaseRecord?.defaultSupplierId && (
                <Option value={purchaseRecord.defaultSupplierId}>
                  {purchaseRecord.defaultSupplierName || '默认供应商'}
                </Option>
              )}
            </Select>
          </Form.Item>
          <Form.Item
            name="quantity"
            label="采购数量"
            rules={[{ required: true, message: '请输入数量' }]}
          >
            <InputNumber min={1} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="mergeSame" label="合并同供应商" valuePropName="checked">
            <Switch defaultChecked />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="修改补货数量"
        open={editQtyModalOpen}
        onCancel={() => setEditQtyModalOpen(false)}
        onOk={submitEditQty}
        confirmLoading={submittingEditQty}
        okText="确认修改"
        destroyOnHidden
        width={420}
      >
        {editQtyRecord && (
          <div style={{ marginBottom: 16, padding: 12, background: '#e6f4ff', borderRadius: 6 }}>
            <div style={{ color: '#8c8c8c', fontSize: 13, marginBottom: 4 }}>当前建议</div>
            <div style={{ fontWeight: 500 }}>{editQtyRecord.productName}</div>
            <div style={{ color: '#1677ff', fontSize: 16, fontWeight: 600 }}>
              {fmtNum(editQtyRecord.suggestedQty)} 件
            </div>
          </div>
        )}
        <Form form={editQtyForm} layout="vertical">
          <Form.Item
            name="quantity"
            label="新的补货数量"
            rules={[{ required: true, message: '请输入数量' }]}
          >
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="reason" label="修改原因">
            <TextArea rows={2} placeholder="可选" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
