import React, { useState, useEffect, useCallback } from 'react';
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
  DatePicker,
  Tooltip,
  InputNumber,
} from 'antd';
import {
  ExportOutlined,
  EditOutlined,
  EyeOutlined,
  SearchOutlined,
  ReloadOutlined,
  WarningOutlined,
  DeleteOutlined,
  ExclamationCircleOutlined,
  FolderOpenOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { batchApi, exportApi, exceptionApi } from '@/api/index.js';
import StatusTag from '@/components/StatusTag.jsx';
import {
  fmtNum,
  fmtDate,
  fmtDateTime,
  parsePagination,
  expiryTag,
} from '@/utils/format.js';
import { ROLE, hasRole } from '@/utils/auth.js';
import { BATCH_STATUS, QC_STATUS, BATCH_OP_TYPES } from '@/utils/constants.js';

const { Search } = Input;
const { Option } = Select;
const { RangePicker } = DatePicker;
const { TextArea } = Input;

export default function Batches() {
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
  const [productId, setProductId] = useState();
  const [supplierId, setSupplierId] = useState();
  const [status, setStatus] = useState();
  const [qcStatus, setQcStatus] = useState();
  const [warehouseZone, setWarehouseZone] = useState();
  const [productionDateRange, setProductionDateRange] = useState(null);
  const [expiryDateRange, setExpiryDateRange] = useState(null);

  const [selectedRowKeys, setSelectedRowKeys] = useState([]);

  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [statusRecord, setStatusRecord] = useState(null);
  const [statusForm] = Form.useForm();
  const [submittingStatus, setSubmittingStatus] = useState(false);

  const [batchStatusModalOpen, setBatchStatusModalOpen] = useState(false);
  const [batchStatusForm] = Form.useForm();
  const [submittingBatchStatus, setSubmittingBatchStatus] = useState(false);

  const [exceptionModalOpen, setExceptionModalOpen] = useState(false);
  const [exceptionRecord, setExceptionRecord] = useState(null);
  const [exceptionForm] = Form.useForm();
  const [submittingException, setSubmittingException] = useState(false);

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
          productId: productId || undefined,
          supplierId: supplierId || undefined,
          status: status || undefined,
          qcStatus: qcStatus || undefined,
          warehouseZone: warehouseZone || undefined,
          productionStart: productionDateRange?.[0]?.format('YYYY-MM-DD'),
          productionEnd: productionDateRange?.[1]?.format('YYYY-MM-DD'),
          expiryStart: expiryDateRange?.[0]?.format('YYYY-MM-DD'),
          expiryEnd: expiryDateRange?.[1]?.format('YYYY-MM-DD'),
        };
        const res = await batchApi.list(params);
        const list = res.data?.list || res.data?.records || [];
        setData(list);
        setPagination(parsePagination(res.data));
      } catch (e) {
        message.error('加载失败');
      } finally {
        setLoading(false);
      }
    },
    [keyword, productId, supplierId, status, qcStatus, warehouseZone, productionDateRange, expiryDateRange, message]
  );

  useEffect(() => {
    fetchData(pagination.current, pagination.pageSize);
  }, [fetchData]);

  const handleSearch = () => {
    setPagination((p) => ({ ...p, current: 1 }));
  };

  const handleReset = () => {
    setKeyword('');
    setProductId(undefined);
    setSupplierId(undefined);
    setStatus(undefined);
    setQcStatus(undefined);
    setWarehouseZone(undefined);
    setProductionDateRange(null);
    setExpiryDateRange(null);
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

  const handleViewDetail = (record) => {
    navigate(`/inventory/batches/${record.id}`);
  };

  const handleAdjustStatus = (record) => {
    setStatusRecord(record);
    statusForm.resetFields();
    statusForm.setFieldsValue({ status: record.status });
    setStatusModalOpen(true);
  };

  const submitStatus = async () => {
    try {
      const values = await statusForm.validateFields();
      setSubmittingStatus(true);
      await batchApi.adjustStatus(statusRecord.id, {
        status: values.status,
        reason: values.reason,
      });
      message.success('状态调整成功');
      setStatusModalOpen(false);
      fetchData(pagination.current, pagination.pageSize);
    } catch (e) {
      message.error('操作失败');
    } finally {
      setSubmittingStatus(false);
    }
  };

  const handleBatchStatus = () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请先选择批次');
      return;
    }
    batchStatusForm.resetFields();
    setBatchStatusModalOpen(true);
  };

  const submitBatchStatus = async () => {
    try {
      const values = await batchStatusForm.validateFields();
      setSubmittingBatchStatus(true);
      await Promise.all(
        selectedRowKeys.map((id) =>
          batchApi.adjustStatus(id, { status: values.status, reason: values.reason })
        )
      );
      message.success('批量状态修改成功');
      setBatchStatusModalOpen(false);
      setSelectedRowKeys([]);
      fetchData(pagination.current, pagination.pageSize);
    } catch (e) {
      message.error('操作失败');
    } finally {
      setSubmittingBatchStatus(false);
    }
  };

  const handleCreateException = (record) => {
    setExceptionRecord(record);
    exceptionForm.resetFields();
    setExceptionModalOpen(true);
  };

  const submitException = async () => {
    try {
      const values = await exceptionForm.validateFields();
      setSubmittingException(true);
      await exceptionApi.create({
        batchId: exceptionRecord.id,
        type: values.type,
        description: values.description,
        priority: values.priority,
      });
      message.success('异常创建成功');
      setExceptionModalOpen(false);
      fetchData(pagination.current, pagination.pageSize);
    } catch (e) {
      message.error('创建失败');
    } finally {
      setSubmittingException(false);
    }
  };

  const handleBatchException = () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请先选择批次');
      return;
    }
    modal.confirm({
      title: '批量生成异常',
      content: `确定要为选中的 ${selectedRowKeys.length} 个批次生成异常吗？`,
      onOk: async () => {
        try {
          await Promise.all(
            selectedRowKeys.map((id) =>
              exceptionApi.create({
                batchId: id,
                type: 'NEAR_EXPIRY',
                description: '批量生成的效期异常',
                priority: 2,
              })
            )
          );
          message.success('批量异常生成成功');
          setSelectedRowKeys([]);
          fetchData(pagination.current, pagination.pageSize);
        } catch (e) {
          message.error('操作失败');
        }
      },
    });
  };

  const handleDamage = (record) => {
    modal.confirm({
      title: '确认报损',
      content: `确定要对批次「${record.batchNo}」进行报损吗？`,
      okType: 'danger',
      onOk: async () => {
        try {
          await batchApi.adjustStatus(record.id, {
            status: 'DAMAGED',
            reason: '手动报损',
          });
          message.success('报损成功');
          fetchData(pagination.current, pagination.pageSize);
        } catch (e) {
          message.error('操作失败');
        }
      },
    });
  };

  const handleExport = async () => {
    try {
      await exportApi.batches({
        keyword,
        productId,
        supplierId,
        status,
        qcStatus,
        warehouseZone,
      });
      message.success('导出成功');
    } catch (e) {
      message.error('导出失败');
    }
  };

  const columns = [
    {
      title: '批次号',
      dataIndex: 'batchNo',
      width: 160,
      fixed: 'left',
      render: (text, record) => (
        <a onClick={() => handleViewDetail(record)} style={{ fontWeight: 500 }}>
          {text}
        </a>
      ),
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
      render: (text) => text || '-',
    },
    {
      title: '供应商',
      dataIndex: 'supplierName',
      width: 140,
      render: (text) => text || '-',
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
      width: 160,
      render: (v) => {
        const tag = expiryTag(v);
        return (
          <div>
            <div>{fmtDate(v)}</div>
            {tag?.label && <Tag color={tag.color}>{tag.label}</Tag>}
          </div>
        );
      },
    },
    {
      title: '总数量',
      dataIndex: 'quantity',
      width: 100,
      render: (v) => <span style={{ fontWeight: 500 }}>{fmtNum(v)}</span>,
    },
    {
      title: '剩余数量',
      dataIndex: 'remaining',
      width: 100,
      render: (v) => fmtNum(v),
    },
    {
      title: '锁定数量',
      dataIndex: 'locked',
      width: 100,
      render: (v) => <span style={{ color: '#faad14' }}>{fmtNum(v)}</span>,
    },
    {
      title: '入库日期',
      dataIndex: 'inboundDate',
      width: 110,
      render: (v) => fmtDate(v),
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (s) => <StatusTag statusKey="BATCH_STATUS" value={s} />,
    },
    {
      title: '质检状态',
      dataIndex: 'qcStatus',
      width: 100,
      render: (s) => <StatusTag statusKey="QC_STATUS" value={s} />,
    },
    {
      title: '操作',
      key: 'actions',
      width: 220,
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
            onClick={() => handleAdjustStatus(record)}
          >
            调整状态
          </Button>
          <Tooltip title="生成异常">
            <Button
              type="link"
              size="small"
              icon={<WarningOutlined />}
              onClick={() => handleCreateException(record)}
            >
              异常
            </Button>
          </Tooltip>
          {record.status !== 'DAMAGED' && (
            <Tooltip title="报损">
              <Button
                type="link"
                size="small"
                danger
                icon={<DeleteOutlined />}
                onClick={() => handleDamage(record)}
              >
                报损
              </Button>
            </Tooltip>
          )}
        </Space>
      ),
    },
  ];

  const rowSelection = {
    selectedRowKeys,
    onChange: (keys) => setSelectedRowKeys(keys),
  };

  const statusOptions = Object.entries(BATCH_STATUS).map(([key, val]) => ({
    value: key,
    label: val.label,
  }));

  const qcStatusOptions = Object.entries(QC_STATUS).map(([key, val]) => ({
    value: key,
    label: val.label,
  }));

  return (
    <div className="app-page">
      <div className="page-title">
        <h2>批次管理</h2>
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
              placeholder="搜索批次号/SKU/商品名"
              allowClear
              enterButton={<SearchOutlined />}
              style={{ width: 260 }}
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onSearch={handleSearch}
            />
            <Input
              placeholder="商品ID"
              allowClear
              style={{ width: 110 }}
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              onPressEnter={handleSearch}
            />
            <Input
              placeholder="供应商ID"
              allowClear
              style={{ width: 110 }}
              value={supplierId}
              onChange={(e) => setSupplierId(e.target.value)}
              onPressEnter={handleSearch}
            />
            <Select
              placeholder="批次状态"
              allowClear
              style={{ width: 110 }}
              value={status}
              onChange={setStatus}
              options={statusOptions}
            />
            <Select
              placeholder="质检状态"
              allowClear
              style={{ width: 110 }}
              value={qcStatus}
              onChange={setQcStatus}
              options={qcStatusOptions}
            />
            <Input
              placeholder="库区"
              allowClear
              style={{ width: 100 }}
              value={warehouseZone}
              onChange={(e) => setWarehouseZone(e.target.value)}
              onPressEnter={handleSearch}
            />
            <RangePicker
              placeholder={['生产开始', '生产结束']}
              style={{ width: 240 }}
              value={productionDateRange}
              onChange={setProductionDateRange}
            />
            <RangePicker
              placeholder={['到期开始', '到期结束']}
              style={{ width: 240 }}
              value={expiryDateRange}
              onChange={setExpiryDateRange}
            />
            <Button icon={<ReloadOutlined />} onClick={handleReset}>
              重置
            </Button>
          </Space>

          <Space>
            <Button
              icon={<ExclamationCircleOutlined />}
              onClick={handleBatchException}
              disabled={selectedRowKeys.length === 0}
            >
              批量生成异常
            </Button>
            <Button
              icon={<EditOutlined />}
              onClick={handleBatchStatus}
              disabled={selectedRowKeys.length === 0}
            >
              批量修改状态
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
        scroll={{ x: 1800 }}
        size="middle"
      />

      <Modal
        title="调整批次状态"
        open={statusModalOpen}
        onCancel={() => setStatusModalOpen(false)}
        onOk={submitStatus}
        confirmLoading={submittingStatus}
        okText="确认调整"
        destroyOnHidden
        width={480}
      >
        {statusRecord && (
          <div style={{ marginBottom: 16, padding: 12, background: '#f5f7fa', borderRadius: 6 }}>
            <div style={{ color: '#8c8c8c', fontSize: 13, marginBottom: 4 }}>当前批次</div>
            <div style={{ fontWeight: 500 }}>{statusRecord.batchNo}</div>
            <div style={{ color: '#8c8c8c', fontSize: 12 }}>
              {statusRecord.productName} · 当前状态：
              <StatusTag statusKey="BATCH_STATUS" value={statusRecord.status} />
            </div>
          </div>
        )}
        <Form form={statusForm} layout="vertical">
          <Form.Item
            name="status"
            label="目标状态"
            rules={[{ required: true, message: '请选择状态' }]}
          >
            <Select options={statusOptions} />
          </Form.Item>
          <Form.Item name="reason" label="调整原因">
            <TextArea rows={3} placeholder="请输入调整原因" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={`批量修改状态（${selectedRowKeys.length} 个批次）`}
        open={batchStatusModalOpen}
        onCancel={() => setBatchStatusModalOpen(false)}
        onOk={submitBatchStatus}
        confirmLoading={submittingBatchStatus}
        okText="确认修改"
        destroyOnHidden
        width={480}
      >
        <Form form={batchStatusForm} layout="vertical">
          <Form.Item
            name="status"
            label="目标状态"
            rules={[{ required: true, message: '请选择状态' }]}
          >
            <Select options={statusOptions} />
          </Form.Item>
          <Form.Item name="reason" label="调整原因">
            <TextArea rows={3} placeholder="请输入调整原因" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="生成异常工单"
        open={exceptionModalOpen}
        onCancel={() => setExceptionModalOpen(false)}
        onOk={submitException}
        confirmLoading={submittingException}
        okText="创建异常"
        destroyOnHidden
        width={480}
      >
        {exceptionRecord && (
          <div style={{ marginBottom: 16, padding: 12, background: '#fff7e6', borderRadius: 6 }}>
            <div style={{ color: '#8c8c8c', fontSize: 13, marginBottom: 4 }}>批次</div>
            <div style={{ fontWeight: 500, color: '#fa8c16' }}>{exceptionRecord.batchNo}</div>
            <div style={{ color: '#8c8c8c', fontSize: 12 }}>
              {exceptionRecord.productName} · 剩余 {fmtNum(exceptionRecord.remaining)}
            </div>
          </div>
        )}
        <Form form={exceptionForm} layout="vertical">
          <Form.Item
            name="type"
            label="异常类型"
            rules={[{ required: true, message: '请选择类型' }]}
            initialValue="NEAR_EXPIRY"
          >
            <Select>
              <Option value="NEAR_EXPIRY">效期临近</Option>
              <Option value="EXPIRED">已过期</Option>
              <Option value="INVENTORY_MISMATCH">库存差异</Option>
              <Option value="BATCH_ERROR">批次错误</Option>
              <Option value="OTHER">其他</Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="priority"
            label="优先级"
            rules={[{ required: true, message: '请选择优先级' }]}
            initialValue={2}
          >
            <Select>
              <Option value={1}>低</Option>
              <Option value={2}>中</Option>
              <Option value={3}>高</Option>
              <Option value={4}>紧急</Option>
            </Select>
          </Form.Item>
          <Form.Item name="description" label="问题描述">
            <TextArea rows={3} placeholder="请详细描述异常情况" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
