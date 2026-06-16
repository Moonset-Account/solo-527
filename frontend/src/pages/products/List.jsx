import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Table,
  Button,
  Input,
  Select,
  Space,
  Modal,
  Form,
  App as AntdApp,
  Tag,
  Tooltip,
  Divider,
  Row,
  Col,
  Statistic,
  Empty,
} from 'antd';
import {
  PlusOutlined,
  ExportOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  BarcodeOutlined,
  SearchOutlined,
  ReloadOutlined,
  StockOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { productApi, categoryApi, inventoryApi, exportApi } from '@/api/index.js';
import StatusTag from '@/components/StatusTag.jsx';
import {
  fmtMoney,
  fmtNum,
  fmtDate,
  parsePagination,
  stockStatus,
} from '@/utils/format.js';
import { ROLE, hasRole } from '@/utils/auth.js';

const { Search } = Input;
const { Option } = Select;

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
  const [categoryId, setCategoryId] = useState();
  const [supplierId, setSupplierId] = useState();
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [categoryTree, setCategoryTree] = useState([]);

  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [detailData, setDetailData] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [barcodeModalOpen, setBarcodeModalOpen] = useState(false);
  const [barcodeInput, setBarcodeInput] = useState('');

  const [priceModalOpen, setPriceModalOpen] = useState(false);
  const [priceForm] = Form.useForm();
  const [submittingPrice, setSubmittingPrice] = useState(false);

  const fetchCategoryTree = useCallback(async () => {
    try {
      const res = await categoryApi.tree();
      setCategoryTree(res.data || []);
    } catch (e) {}
  }, []);

  useEffect(() => {
    fetchCategoryTree();
  }, [fetchCategoryTree]);

  const flattenCategories = (tree, level = 0) => {
    let result = [];
    tree.forEach((item) => {
      result.push({ ...item, level });
      if (item.children?.length) {
        result = result.concat(flattenCategories(item.children, level + 1));
      }
    });
    return result;
  };

  const categoryOptions = useMemo(() => {
    const flat = flattenCategories(categoryTree);
    return flat.map((item) => ({
      value: item.id,
      label: `${'　'.repeat(item.level)}${item.name}`,
    }));
  }, [categoryTree]);

  const fetchData = useCallback(
    async (page = 1, pageSize = 20) => {
      setLoading(true);
      try {
        const params = {
          page,
          pageSize,
          keyword: keyword || undefined,
          categoryId: categoryId || undefined,
          supplierId: supplierId || undefined,
          lowStock: lowStockOnly || undefined,
        };
        const res = await productApi.list(params);
        const list = res.data?.list || res.data?.records || [];
        setData(list);
        setPagination(parsePagination(res.data));
      } catch (e) {
        message.error('加载失败');
      } finally {
        setLoading(false);
      }
    },
    [keyword, categoryId, supplierId, lowStockOnly, message]
  );

  useEffect(() => {
    fetchData(pagination.current, pagination.pageSize);
  }, [fetchData]);

  const handleSearch = () => {
    setPagination((p) => ({ ...p, current: 1 }));
  };

  const handleReset = () => {
    setKeyword('');
    setCategoryId(undefined);
    setSupplierId(undefined);
    setLowStockOnly(false);
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
    setDetailModalOpen(true);
    setDetailLoading(true);
    try {
      const [detailRes, inventoryRes] = await Promise.all([
        productApi.detail(record.id),
        inventoryApi.list({ productId: record.id, pageSize: 100 }),
      ]);
      setDetailData({
        ...detailRes.data,
        inventoryList: inventoryRes.data?.list || inventoryRes.data?.records || [],
      });
    } catch (e) {
      message.error('加载详情失败');
    } finally {
      setDetailLoading(false);
    }
  };

  const handleDelete = (record) => {
    modal.confirm({
      title: '确认删除',
      content: `确定要删除商品「${record.name}」吗？删除后不可恢复。`,
      okType: 'danger',
      onOk: async () => {
        try {
          await productApi.remove(record.id);
          message.success('删除成功');
          fetchData(pagination.current, pagination.pageSize);
        } catch (e) {
          message.error('删除失败');
        }
      },
    });
  };

  const handleBarcodeSearch = async () => {
    if (!barcodeInput.trim()) {
      message.warning('请输入条码');
      return;
    }
    try {
      const res = await productApi.byBarcode(barcodeInput.trim());
      if (res.data) {
        setBarcodeModalOpen(false);
        handleViewDetail(res.data);
      } else {
        message.warning('未找到该条码对应的商品');
      }
    } catch (e) {
      message.error('搜索失败');
    }
  };

  const handleBatchPrice = () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请先选择商品');
      return;
    }
    priceForm.resetFields();
    setPriceModalOpen(true);
  };

  const submitBatchPrice = async () => {
    try {
      const values = await priceForm.validateFields();
      setSubmittingPrice(true);
      await Promise.all(
        selectedRowKeys.map((id) => productApi.update(id, { price: values.price }))
      );
      message.success('批量改价成功');
      setPriceModalOpen(false);
      fetchData(pagination.current, pagination.pageSize);
    } catch (e) {
      message.error('操作失败');
    } finally {
      setSubmittingPrice(false);
    }
  };

  const handleExport = async () => {
    try {
      await exportApi.products?.({
        keyword,
        categoryId,
        supplierId,
        lowStock: lowStockOnly,
      });
      message.success('导出成功');
    } catch (e) {
      message.error('导出失败');
    }
  };

  const goToInventory = (record) => {
    navigate(`/inventory?keyword=${encodeURIComponent(record.sku || '')}`);
  };

  const columns = [
    {
      title: 'SKU',
      dataIndex: 'sku',
      width: 140,
      fixed: 'left',
      render: (text) => <code style={{ background: '#f5f5f5', padding: '2px 6px', borderRadius: 4, fontSize: 12 }}>{text}</code>,
    },
    {
      title: '条码',
      dataIndex: 'barcode',
      width: 140,
      render: (text) => text || '-',
    },
    {
      title: '商品名称',
      dataIndex: 'name',
      width: 180,
      fixed: 'left',
      render: (text, record) => (
        <a onClick={() => handleViewDetail(record)} style={{ fontWeight: 500 }}>
          {text}
        </a>
      ),
    },
    {
      title: '分类',
      dataIndex: 'categoryName',
      width: 120,
      render: (text) => text || '-',
    },
    {
      title: '规格',
      dataIndex: 'spec',
      width: 100,
      render: (text) => text || '-',
    },
    {
      title: '单位',
      dataIndex: 'unit',
      width: 80,
      render: (text) => text || '-',
    },
    {
      title: '默认价',
      dataIndex: 'price',
      width: 100,
      render: (v) => <span style={{ color: '#fa8c16', fontWeight: 500 }}>{fmtMoney(v)}</span>,
    },
    {
      title: '效期天数',
      dataIndex: 'shelfLifeDays',
      width: 100,
      render: (v) => (v ? `${v} 天` : '-'),
    },
    {
      title: '预警天数',
      dataIndex: 'warningDays',
      width: 100,
      render: (v) => (v ? `${v} 天` : '-'),
    },
    {
      title: '最低库存',
      dataIndex: 'minStock',
      width: 100,
      render: (v) => fmtNum(v),
    },
    {
      title: '当前库存',
      dataIndex: 'stock',
      width: 110,
      render: (v, record) => {
        const status = stockStatus(v, record.minStock);
        return (
          <a onClick={() => goToInventory(record)} style={{ color: status.color, fontWeight: 500 }}>
            {fmtNum(v)}
          </a>
        );
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 90,
      render: (s) => (
        <Tag color={s === 'ACTIVE' ? 'green' : 'default'}>
          {s === 'ACTIVE' ? '在售' : '停售'}
        </Tag>
      ),
    },
    {
      title: '操作',
      key: 'actions',
      width: 180,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetail(record)}
          >
            详情
          </Button>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => navigate(`/products/${record.id}/edit`)}
          >
            编辑
          </Button>
          {hasRole(ROLE.SUPER_ADMIN) && (
            <Button
              type="link"
              size="small"
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleDelete(record)}
            >
              删除
            </Button>
          )}
        </Space>
      ),
    },
  ];

  const rowSelection = {
    selectedRowKeys,
    onChange: (keys) => setSelectedRowKeys(keys),
  };

  const batchColumns = [
    { title: '批次号', dataIndex: 'batchNo', width: 140 },
    { title: '库区', dataIndex: 'warehouseZone', width: 100 },
    { title: '数量', dataIndex: 'quantity', width: 100, render: (v) => fmtNum(v) },
    {
      title: '生产日期',
      dataIndex: 'productionDate',
      width: 120,
      render: (v) => fmtDate(v),
    },
    {
      title: '到期日期',
      dataIndex: 'expiryDate',
      width: 120,
      render: (v) => fmtDate(v),
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (s) => <StatusTag statusKey="BATCH_STATUS" value={s} />,
    },
  ];

  return (
    <div className="app-page">
      <div className="page-title">
        <h2>商品管理</h2>
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
              placeholder="搜索 SKU/名称/条码"
              allowClear
              enterButton={<SearchOutlined />}
              style={{ width: 280 }}
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onSearch={handleSearch}
            />
            <Select
              placeholder="选择分类"
              allowClear
              showSearch
              optionFilterProp="label"
              style={{ width: 180 }}
              value={categoryId}
              onChange={setCategoryId}
              options={categoryOptions}
            />
            <Input
              placeholder="供应商ID"
              allowClear
              style={{ width: 140 }}
              value={supplierId}
              onChange={(e) => setSupplierId(e.target.value)}
              onPressEnter={handleSearch}
            />
            <Space>
              <span style={{ color: '#8c8c8c', fontSize: 13 }}>只看低库存：</span>
              <input
                type="checkbox"
                checked={lowStockOnly}
                onChange={(e) => setLowStockOnly(e.target.checked)}
                style={{ width: 16, height: 16 }}
              />
            </Space>
            <Button icon={<ReloadOutlined />} onClick={handleReset}>
              重置
            </Button>
          </Space>

          <Space>
            <Button icon={<BarcodeOutlined />} onClick={() => setBarcodeModalOpen(true)}>
              条码搜索
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => navigate('/products/new')}
            >
              新增商品
            </Button>
            <Button
              icon={<EditOutlined />}
              onClick={handleBatchPrice}
              disabled={selectedRowKeys.length === 0}
            >
              批量改价
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
        scroll={{ x: 1500 }}
        size="middle"
        onRow={(record) => ({
          onClick: () => handleViewDetail(record),
          style: { cursor: 'pointer' },
        })}
      />

      <Modal
        title="商品详情"
        open={detailModalOpen}
        onCancel={() => setDetailModalOpen(false)}
        footer={null}
        width={800}
        destroyOnHidden
      >
        {detailLoading ? (
          <div style={{ textAlign: 'center', padding: 40 }}>加载中...</div>
        ) : detailData ? (
          <div>
            <div style={{ display: 'flex', gap: 24, marginBottom: 16 }}>
              <div
                style={{
                  width: 120,
                  height: 120,
                  background: '#f5f5f5',
                  borderRadius: 8,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 40,
                  color: '#bfbfbf',
                }}
              >
                <StockOutlined />
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ margin: '0 0 8px', fontSize: 18 }}>{detailData.name}</h3>
                <div style={{ color: '#8c8c8c', marginBottom: 8 }}>
                  SKU：<code>{detailData.sku}</code>
                  {detailData.barcode && <span style={{ marginLeft: 16 }}>条码：{detailData.barcode}</span>}
                </div>
                <div style={{ color: '#fa8c16', fontSize: 22, fontWeight: 600 }}>
                  {fmtMoney(detailData.price)}
                </div>
              </div>
            </div>

            <Divider style={{ margin: '12px 0' }} />

            <Row gutter={16}>
              <Col span={8}>
                <Statistic title="分类" value={detailData.categoryName || '-'} />
              </Col>
              <Col span={8}>
                <Statistic title="规格" value={detailData.spec || '-'} />
              </Col>
              <Col span={8}>
                <Statistic title="单位" value={detailData.unit || '-'} />
              </Col>
              <Col span={8}>
                <Statistic title="效期天数" value={detailData.shelfLifeDays || 0} suffix="天" />
              </Col>
              <Col span={8}>
                <Statistic title="预警天数" value={detailData.warningDays || 0} suffix="天" />
              </Col>
              <Col span={8}>
                <Statistic title="最低库存" value={detailData.minStock || 0} />
              </Col>
            </Row>

            {detailData.description && (
              <>
                <Divider style={{ margin: '12px 0' }} />
                <div>
                  <div style={{ color: '#8c8c8c', marginBottom: 4 }}>商品描述</div>
                  <div>{detailData.description}</div>
                </div>
              </>
            )}

            <Divider style={{ margin: '16px 0' }} />

            <h4 style={{ marginBottom: 12 }}>库存分布</h4>
            {detailData.inventoryList?.length > 0 ? (
              <Table
                rowKey="id"
                columns={[
                  { title: '库区', dataIndex: 'warehouseZone', width: 100 },
                  { title: '库位', dataIndex: 'location', width: 100 },
                  {
                    title: '总库存',
                    dataIndex: 'totalStock',
                    width: 100,
                    render: (v) => fmtNum(v),
                  },
                  {
                    title: '可用库存',
                    dataIndex: 'availableStock',
                    width: 100,
                    render: (v) => fmtNum(v),
                  },
                  {
                    title: '预留',
                    dataIndex: 'reservedStock',
                    width: 80,
                    render: (v) => fmtNum(v),
                  },
                  {
                    title: '库存状态',
                    dataIndex: 'status',
                    width: 100,
                    render: (_, record) => {
                      const s = stockStatus(record.availableStock, record.minStock);
                      return <Tag color={s.color}>{s.label}</Tag>;
                    },
                  },
                ]}
                dataSource={detailData.inventoryList}
                pagination={false}
                size="small"
              />
            ) : (
              <Empty description="暂无库存记录" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            )}
          </div>
        ) : null}
      </Modal>

      <Modal
        title="条码搜索"
        open={barcodeModalOpen}
        onCancel={() => setBarcodeModalOpen(false)}
        onOk={handleBarcodeSearch}
        okText="搜索"
        destroyOnHidden
      >
        <Input
          placeholder="请输入商品条码"
          value={barcodeInput}
          onChange={(e) => setBarcodeInput(e.target.value)}
          onPressEnter={handleBarcodeSearch}
          autoFocus
        />
      </Modal>

      <Modal
        title={`批量改价（${selectedRowKeys.length} 个商品）`}
        open={priceModalOpen}
        onCancel={() => setPriceModalOpen(false)}
        onOk={submitBatchPrice}
        confirmLoading={submittingPrice}
        okText="确认修改"
        destroyOnHidden
      >
        <Form form={priceForm} layout="vertical" style={{ marginTop: 12 }}>
          <Form.Item
            name="price"
            label="新价格（元）"
            rules={[
              { required: true, message: '请输入价格' },
              { type: 'number', min: 0, message: '价格不能为负' },
            ]}
          >
            <Input type="number" placeholder="请输入新价格" step="0.01" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
