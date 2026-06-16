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
  Switch,
  Tooltip,
  InputNumber,
  Radio,
} from 'antd';
import {
  ExportOutlined,
  EditOutlined,
  EyeOutlined,
  SearchOutlined,
  ReloadOutlined,
  StockOutlined,
  ExclamationCircleOutlined,
  InboxOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { inventoryApi, batchApi, categoryApi, exportApi, batchOpApi } from '@/api/index.js';
import StatusTag from '@/components/StatusTag.jsx';
import {
  fmtNum,
  fmtDate,
  fmtDateTime,
  parsePagination,
  stockStatus,
  expiryTag,
} from '@/utils/format.js';
import { ROLE, hasRole } from '@/utils/auth.js';
import { BATCH_STATUS } from '@/utils/constants.js';

const { Search } = Input;
const { Option } = Select;
const { TextArea } = Input;

export default function List() {
  const { message, modal } = AntdApp.useApp();
  const navigate = useNavigate();
  const location = useLocation();

  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0,
  });

  const [keyword, setKeyword] = useState('');
  const [categoryId, setCategoryId] = useState();
  const [warehouseZone, setWarehouseZone] = useState();
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [categoryTree, setCategoryTree] = useState([]);

  const [expandLoading, setExpandLoading] = useState({});
  const [expandedBatches, setExpandedBatches] = useState({});

  const [adjustModalOpen, setAdjustModalOpen] = useState(false);
  const [adjustRecord, setAdjustRecord] = useState(null);
  const [adjustForm] = Form.useForm();
  const [submittingAdjust, setSubmittingAdjust] = useState(false);

  const [selectedRowKeys, setSelectedRowKeys] = useState([]);

  const [batchAdjustModalOpen, setBatchAdjustModalOpen] = useState(false);
  const [batchAdjustForm] = Form.useForm();
  const [submittingBatchAdjust, setSubmittingBatchAdjust] = useState(false);

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

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const kw = params.get('keyword');
    if (kw) setKeyword(kw);
  }, [location.search]);

  const fetchData = useCallback(
    async (page = 1, pageSize = 20) => {
      setLoading(true);
      try {
        const params = {
          page,
          pageSize,
          keyword: keyword || undefined,
          categoryId: categoryId || undefined,
          warehouseZone: warehouseZone || undefined,
          lowStock: lowStockOnly || undefined,
        };
        const res = await inventoryApi.list(params);
        const list = res.data?.list || res.data?.records || [];
        setData(list);
        setPagination(parsePagination(res.data));
      } catch (e) {
        message.error('加载失败');
      } finally {
        setLoading(false);
      }
    },
    [keyword, categoryId, warehouseZone, lowStockOnly, message]
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
    setWarehouseZone(undefined);
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

  const fetchBatches = async (inventoryId, productId) => {
    setExpandLoading((prev) => ({ ...prev, [inventoryId]: true }));
    try {
      const res = await batchApi.list({ productId, pageSize: 100 });
      const batches = res.data?.list || res.data?.records || [];
      setExpandedBatches((prev) => ({ ...prev, [inventoryId]: batches }));
    } catch (e) {
      message.error('加载批次失败');
    } finally {
      setExpandLoading((prev) => ({ ...prev, [inventoryId]: false }));
    }
  };

  const handleExpand = (expanded, record) => {
    if (expanded && !expandedBatches[record.id]) {
      fetchBatches(record.id, record.productId);
    }
  };

  const handleAdjust = (record) => {
    setAdjustRecord(record);
    adjustForm.resetFields();
    setAdjustModalOpen(true);
  };

  const submitAdjust = async () => {
    try {
      const values = await adjustForm.validateFields();
      setSubmittingAdjust(true);
      await inventoryApi.adjust(adjustRecord.id, {
        quantity: values.type === 'OUT' || values.type === 'DAMAGE' ? -Math.abs(values.quantity) : Math.abs(values.quantity),
        type: values.type,
        reason: values.reason,
      });
      message.success('库存调整成功');
      setAdjustModalOpen(false);
      fetchData(pagination.current, pagination.pageSize);
    } catch (e) {
      message.error('调整失败');
    } finally {
      setSubmittingAdjust(false);
    }
  };

  const handleBatchAdjust = () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请先选择库存记录');
      return;
    }
    batchAdjustForm.resetFields();
    setBatchAdjustModalOpen(true);
  };

  const submitBatchAdjust = async () => {
    try {
      const values = await batchAdjustForm.validateFields();
      setSubmittingBatchAdjust(true);
      await inventoryApi.batchAdjust({
        ids: selectedRowKeys,
        quantity: values.type === 'OUT' || values.type === 'DAMAGE' ? -Math.abs(values.quantity) : Math.abs(values.quantity),
        type: values.type,
        reason: values.reason,
      });
      message.success('批量调整成功');
      setBatchAdjustModalOpen(false);
      setSelectedRowKeys([]);
      fetchData(pagination.current, pagination.pageSize);
    } catch (e) {
      message.error('批量调整失败');
    } finally {
      setSubmittingBatchAdjust(false);
    }
  };

  const handleExport = async () => {
    try {
      await exportApi.inventory({
        keyword,
        categoryId,
        warehouseZone,
        lowStock: lowStockOnly,
      });
      message.success('导出成功');
    } catch (e) {
      message.error('导出失败');
    }
  };

  const handleStocktake = () => {
    modal.confirm({
      title: '确认盘点',
      content: '确定要开始盘点吗？',
      onOk: async () => {
        try {
          await batchOpApi.preview({
            opType: 'BATCH_UPDATE_BATCH_STATUS',
            filters: { status: 'NORMAL' },
          });
          message.success('已生成盘点预单，请在批量操作中确认');
        } catch (e) {
          message.error('操作失败');
        }
      },
    });
  };

  const viewBatches = (record) => {
    navigate(`/inventory/batches?keyword=${encodeURIComponent(record.sku || '')}`);
  };

  const batchColumns = [
    { title: '批次号', dataIndex: 'batchNo', width: 140 },
    {
      title: '数量',
      dataIndex: 'quantity',
      width: 100,
      render: (v) => fmtNum(v),
    },
    {
      title: '剩余',
      dataIndex: 'remaining',
      width: 100,
      render: (v) => fmtNum(v),
    },
    {
      title: '生产日期',
      dataIndex: 'productionDate',
      width: 110,
      render: (v) => fmtDate(v),
    },
    {
      title: '到期日期',
      dataIndex: 'expiryDate',
      width: 110,
      render: (v) => {
        const tag = expiryTag(v);
        return (
          <span>
            {fmtDate(v)}
            {tag?.label && <Tag color={tag.color} style={{ marginLeft: 6 }}>{tag.label}</Tag>}
          </span>
        );
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (s) => <StatusTag statusKey="BATCH_STATUS" value={s} />,
    },
    {
      title: '操作',
      key: 'actions',
      width: 100,
      render: (_, record) => (
        <Button
          type="link"
          size="small"
          icon={<EyeOutlined />}
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/inventory/batches?keyword=${encodeURIComponent(record.batchNo || '')}`);
          }}
        >
          查看
        </Button>
      ),
    },
  ];

  const columns = [
    {
      title: 'SKU',
      dataIndex: 'sku',
      width: 130,
      fixed: 'left',
      render: (text) => <code style={{ fontSize: 12 }}>{text}</code>,
    },
    {
      title: '商品名称',
      dataIndex: 'productName',
      width: 180,
      fixed: 'left',
      render: (text) => text || '-',
    },
    {
      title: '分类',
      dataIndex: 'categoryName',
      width: 100,
      render: (text) => text || '-',
    },
    {
      title: '库区',
      dataIndex: 'warehouseZone',
      width: 100,
      render: (text) => text || '-',
    },
    {
      title: '库位',
      dataIndex: 'location',
      width: 100,
      render: (text) => text || '-',
    },
    {
      title: '总库存',
      dataIndex: 'totalStock',
      width: 110,
      render: (v, record) => (
        <span style={{ fontWeight: 500 }}>
          {fmtNum(v)}
          {record.unit && <span style={{ color: '#8c8c8c', fontWeight: 400, fontSize: 12 }}> {record.unit}</span>}
        </span>
      ),
    },
    {
      title: '可用库存',
      dataIndex: 'availableStock',
      width: 100,
      render: (v) => <span style={{ color: '#52c41a' }}>{fmtNum(v)}</span>,
    },
    {
      title: '预留',
      dataIndex: 'reservedStock',
      width: 80,
      render: (v) => <span style={{ color: '#faad14' }}>{fmtNum(v)}</span>,
    },
    {
      title: '报损',
      dataIndex: 'damagedStock',
      width: 80,
      render: (v) => <span style={{ color: '#ff4d4f' }}>{fmtNum(v)}</span>,
    },
    {
      title: '最低库存',
      dataIndex: 'minStock',
      width: 100,
      render: (v) => fmtNum(v),
    },
    {
      title: '库存状态',
      dataIndex: 'status',
      width: 110,
      render: (_, record) => {
        const s = stockStatus(record.availableStock, record.minStock);
        return <Tag color={s.color} icon={<ExclamationCircleOutlined />}>{s.label}</Tag>;
      },
    },
    {
      title: '最近盘点',
      dataIndex: 'lastStocktakeAt',
      width: 150,
      render: (v) => (v ? fmtDateTime(v) : '未盘点'),
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
            icon={<EditOutlined />}
            onClick={() => handleAdjust(record)}
          >
            调整库存
          </Button>
          <Button
            type="link"
            size="small"
            icon={<InboxOutlined />}
            onClick={() => viewBatches(record)}
          >
            查看批次
          </Button>
        </Space>
      ),
    },
  ];

  const rowSelection = {
    selectedRowKeys,
    onChange: (keys) => setSelectedRowKeys(keys),
  };

  const expandable = {
    expandedRowRender: (record) => {
      const batches = expandedBatches[record.id] || [];
      const loading = expandLoading[record.id];
      return (
        <Table
          rowKey="id"
          columns={batchColumns}
          dataSource={batches}
          loading={loading}
          pagination={false}
          size="small"
          locale={{ emptyText: '暂无批次数据' }}
        />
      );
    },
    onExpand: handleExpand,
    expandIconColumnIndex: 1,
  };

  return (
    <div className="app-page">
      <div className="page-title">
        <h2>实时库存</h2>
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
              placeholder="搜索 SKU/商品名称"
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
              style={{ width: 160 }}
              value={categoryId}
              onChange={setCategoryId}
              options={categoryOptions}
            />
            <Input
              placeholder="库区"
              allowClear
              style={{ width: 120 }}
              value={warehouseZone}
              onChange={(e) => setWarehouseZone(e.target.value)}
              onPressEnter={handleSearch}
            />
            <Space>
              <span style={{ color: '#8c8c8c', fontSize: 13 }}>只看低库存：</span>
              <Switch
                size="small"
                checked={lowStockOnly}
                onChange={setLowStockOnly}
              />
            </Space>
            <Button icon={<ReloadOutlined />} onClick={handleReset}>
              重置
            </Button>
          </Space>

          <Space>
            <Button
              icon={<StockOutlined />}
              onClick={handleStocktake}
            >
              盘点
            </Button>
            <Button
              icon={<EditOutlined />}
              onClick={handleBatchAdjust}
              disabled={selectedRowKeys.length === 0}
            >
              批量调整
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
        expandable={expandable}
        scroll={{ x: 1500 }}
        size="middle"
      />

      <Modal
        title="库存调整"
        open={adjustModalOpen}
        onCancel={() => setAdjustModalOpen(false)}
        onOk={submitAdjust}
        confirmLoading={submittingAdjust}
        okText="确认调整"
        destroyOnHidden
        width={480}
      >
        {adjustRecord && (
          <div style={{ marginBottom: 16, padding: 12, background: '#f5f7fa', borderRadius: 6 }}>
            <div style={{ color: '#8c8c8c', fontSize: 13, marginBottom: 4 }}>当前商品</div>
            <div style={{ fontWeight: 500 }}>{adjustRecord.productName}</div>
            <div style={{ color: '#8c8c8c', fontSize: 12 }}>
              SKU：{adjustRecord.sku} · 当前库存：{fmtNum(adjustRecord.totalStock)}
            </div>
          </div>
        )}
        <Form form={adjustForm} layout="vertical">
          <Form.Item
            name="type"
            label="调整类型"
            rules={[{ required: true, message: '请选择调整类型' }]}
            initialValue="IN"
          >
            <Radio.Group>
              <Radio value="IN">入库（+）</Radio>
              <Radio value="OUT">出库（-）</Radio>
              <Radio value="DAMAGE">报损（-）</Radio>
              <Radio value="CHECK">盘点</Radio>
            </Radio.Group>
          </Form.Item>
          <Form.Item
            name="quantity"
            label="调整数量"
            rules={[{ required: true, message: '请输入数量' }]}
          >
            <InputNumber min={0} style={{ width: '100%' }} placeholder="请输入调整数量" />
          </Form.Item>
          <Form.Item name="reason" label="调整原因">
            <TextArea rows={3} placeholder="请输入调整原因" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={`批量调整（${selectedRowKeys.length} 条记录）`}
        open={batchAdjustModalOpen}
        onCancel={() => setBatchAdjustModalOpen(false)}
        onOk={submitBatchAdjust}
        confirmLoading={submittingBatchAdjust}
        okText="确认调整"
        destroyOnHidden
        width={480}
      >
        <Form form={batchAdjustForm} layout="vertical">
          <Form.Item
            name="type"
            label="调整类型"
            rules={[{ required: true, message: '请选择调整类型' }]}
            initialValue="IN"
          >
            <Radio.Group>
              <Radio value="IN">入库（+）</Radio>
              <Radio value="OUT">出库（-）</Radio>
              <Radio value="DAMAGE">报损（-）</Radio>
              <Radio value="CHECK">盘点</Radio>
            </Radio.Group>
          </Form.Item>
          <Form.Item
            name="quantity"
            label="调整数量"
            rules={[{ required: true, message: '请输入数量' }]}
          >
            <InputNumber min={0} style={{ width: '100%' }} placeholder="请输入调整数量" />
          </Form.Item>
          <Form.Item name="reason" label="调整原因">
            <TextArea rows={3} placeholder="请输入调整原因" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
