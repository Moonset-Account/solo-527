import React, { useState, useEffect, useCallback } from 'react';
import {
  Table,
  Button,
  Input,
  Select,
  Space,
  Progress,
  Modal,
  Form,
  Rate,
  InputNumber,
  App as AntdApp,
  Tooltip,
  Tag,
} from 'antd';
import {
  PlusOutlined,
  StarOutlined,
  ExportOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  StopOutlined,
  PlayCircleOutlined,
  SearchOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { supplierApi, exportApi } from '@/api/index.js';
import StatusTag from '@/components/StatusTag.jsx';
import {
  fmtNum,
  fmtPct,
  fmtDate,
  parsePagination,
  levelLabel,
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
  const [status, setStatus] = useState();
  const [level, setLevel] = useState();
  const [category, setCategory] = useState();

  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [rateModalOpen, setRateModalOpen] = useState(false);
  const [rateForm] = Form.useForm();
  const [ratingSupplier, setRatingSupplier] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [batchRateOpen, setBatchRateOpen] = useState(false);

  const fetchData = useCallback(async (page = 1, pageSize = 20) => {
    setLoading(true);
    try {
      const params = {
        page,
        pageSize,
        keyword: keyword || undefined,
        status: status || undefined,
        level: level || undefined,
        category: category || undefined,
      };
      const res = await supplierApi.list(params);
      const list = res.data?.list || res.data?.records || [];
      setData(list);
      setPagination(parsePagination(res.data));
    } catch (e) {
      message.error('加载失败');
    } finally {
      setLoading(false);
    }
  }, [keyword, status, level, category, message]);

  useEffect(() => {
    fetchData(pagination.current, pagination.pageSize);
  }, [fetchData]);

  const handleSearch = () => {
    setPagination((p) => ({ ...p, current: 1 }));
  };

  const handleReset = () => {
    setKeyword('');
    setStatus(undefined);
    setLevel(undefined);
    setCategory(undefined);
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

  const handleRate = (record) => {
    setRatingSupplier(record);
    rateForm.resetFields();
    setRateModalOpen(true);
  };

  const handleBatchRate = () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请先选择供应商');
      return;
    }
    rateForm.resetFields();
    setBatchRateOpen(true);
  };

  const submitRate = async () => {
    try {
      const values = await rateForm.validateFields();
      setSubmitting(true);
      if (ratingSupplier) {
        await supplierApi.rate(ratingSupplier.id, values);
        message.success('评分成功');
      } else if (selectedRowKeys.length > 0) {
        await Promise.all(
          selectedRowKeys.map((id) => supplierApi.rate(id, values))
        );
        message.success('批量评分成功');
      }
      setRateModalOpen(false);
      setBatchRateOpen(false);
      setRatingSupplier(null);
      fetchData(pagination.current, pagination.pageSize);
    } catch (e) {
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = (record) => {
    const nextStatus = record.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    modal.confirm({
      title: nextStatus === 'INACTIVE' ? '确认停用' : '确认启用',
      content: `确定要${nextStatus === 'INACTIVE' ? '停用' : '启用'}供应商「${record.name}」吗？`,
      onOk: async () => {
        try {
          await supplierApi.update(record.id, { status: nextStatus });
          message.success('操作成功');
          fetchData(pagination.current, pagination.pageSize);
        } catch (e) {
          message.error('操作失败');
        }
      },
    });
  };

  const handleDelete = (record) => {
    modal.confirm({
      title: '确认删除',
      content: `确定要删除供应商「${record.name}」吗？删除后不可恢复。`,
      okType: 'danger',
      onOk: async () => {
        try {
          await supplierApi.remove(record.id);
          message.success('删除成功');
          fetchData(pagination.current, pagination.pageSize);
        } catch (e) {
          message.error('删除失败');
        }
      },
    });
  };

  const handleExport = async () => {
    try {
      await exportApi.suppliers?.({ keyword, status, level, category });
      message.success('导出成功');
    } catch (e) {
      message.error('导出失败');
    }
  };

  const getRatingColor = (score) => {
    const s = Number(score) || 0;
    if (s >= 4.5) return '#52c41a';
    if (s >= 3.5) return '#1677ff';
    if (s >= 2.5) return '#faad14';
    if (s >= 1.5) return '#fa8c16';
    return '#ff4d4f';
  };

  const getRateColor = (rate) => {
    const r = Number(rate) || 0;
    if (r >= 95) return '#52c41a';
    if (r >= 85) return '#1677ff';
    if (r >= 70) return '#faad14';
    return '#ff4d4f';
  };

  const columns = [
    {
      title: '编号',
      dataIndex: 'code',
      width: 100,
      fixed: 'left',
    },
    {
      title: '供应商名称',
      dataIndex: 'name',
      width: 180,
      fixed: 'left',
      render: (text, record) => (
        <a
          onClick={() => navigate(`/suppliers/${record.id}`)}
          style={{ fontWeight: 500 }}
        >
          {text}
        </a>
      ),
    },
    {
      title: '联系人',
      dataIndex: 'contactName',
      width: 100,
      render: (text, record) => (
        <div>
          <div>{text || '-'}</div>
          {record.contactPhone && (
            <div style={{ color: '#8c8c8c', fontSize: 12 }}>
              {record.contactPhone}
            </div>
          )}
        </div>
      ),
    },
    {
      title: '分类',
      dataIndex: 'category',
      width: 100,
      render: (text) => text || '-',
    },
    {
      title: '等级',
      dataIndex: 'level',
      width: 120,
      render: (lv) => (
        <span style={{ color: '#faad14', fontSize: 14, letterSpacing: 1 }}>
          {levelLabel(lv)}
        </span>
      ),
    },
    {
      title: '综合评分',
      dataIndex: 'rating',
      width: 160,
      render: (score, record) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Progress
            type="circle"
            size={48}
            percent={((Number(score) || 0) / 5) * 100}
            format={() => (score ? score.toFixed(1) : '-')}
            strokeColor={getRatingColor(score)}
            trailColor="#f0f0f0"
          />
          <div style={{ fontSize: 12, color: '#8c8c8c' }}>
            <div>共 {record.ratingCount || 0} 次评分</div>
          </div>
        </div>
      ),
    },
    {
      title: '准时率',
      dataIndex: 'onTimeRate',
      width: 140,
      render: (rate) => (
        <div>
          <Progress
            percent={Number(rate) || 0}
            size="small"
            strokeColor={getRateColor(rate)}
            format={(p) => fmtPct(p)}
          />
        </div>
      ),
    },
    {
      title: '合格率',
      dataIndex: 'passRate',
      width: 140,
      render: (rate) => (
        <div>
          <Progress
            percent={Number(rate) || 0}
            size="small"
            strokeColor={getRateColor(rate)}
            format={(p) => fmtPct(p)}
          />
        </div>
      ),
    },
    {
      title: '订单数',
      dataIndex: 'orderCount',
      width: 90,
      render: (v) => fmtNum(v),
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 90,
      render: (status) => (
        <StatusTag
          statusKey="PURCHASE_STATUS"
          value={status === 'ACTIVE' ? 'COMPLETED' : 'CANCELLED'}
        />
      ),
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
            onClick={() => navigate(`/suppliers/${record.id}`)}
          >
            详情
          </Button>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => navigate(`/suppliers/${record.id}/edit`)}
          >
            编辑
          </Button>
          <Tooltip title="发起评分">
            <Button
              type="link"
              size="small"
              icon={<StarOutlined />}
              onClick={() => handleRate(record)}
            >
              评分
            </Button>
          </Tooltip>
          <Tooltip title={record.status === 'ACTIVE' ? '停用' : '启用'}>
            <Button
              type="link"
              size="small"
              danger={record.status === 'ACTIVE'}
              icon={
                record.status === 'ACTIVE' ? (
                  <StopOutlined />
                ) : (
                  <PlayCircleOutlined />
                )
              }
              onClick={() => handleToggleStatus(record)}
            >
              {record.status === 'ACTIVE' ? '停用' : '启用'}
            </Button>
          </Tooltip>
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

  return (
    <div className="app-page">
      <div className="page-title">
        <h2>供应商管理</h2>
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
              placeholder="搜索供应商名称/编号/联系人"
              allowClear
              enterButton={<SearchOutlined />}
              style={{ width: 280 }}
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onSearch={handleSearch}
            />
            <Select
              placeholder="状态"
              allowClear
              style={{ width: 120 }}
              value={status}
              onChange={setStatus}
            >
              <Option value="ACTIVE">启用中</Option>
              <Option value="INACTIVE">已停用</Option>
            </Select>
            <Select
              placeholder="等级"
              allowClear
              style={{ width: 120 }}
              value={level}
              onChange={setLevel}
            >
              <Option value={5}>★★★★★</Option>
              <Option value={4}>★★★★</Option>
              <Option value={3}>★★★</Option>
              <Option value={2}>★★</Option>
              <Option value={1}>★</Option>
            </Select>
            <Input
              placeholder="分类"
              allowClear
              style={{ width: 140 }}
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              onPressEnter={handleSearch}
            />
            <Button icon={<ReloadOutlined />} onClick={handleReset}>
              重置
            </Button>
          </Space>

          <Space>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => navigate('/suppliers/new')}
            >
              新增供应商
            </Button>
            <Button
              icon={<StarOutlined />}
              onClick={handleBatchRate}
              disabled={selectedRowKeys.length === 0}
            >
              批量评分
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
        scroll={{ x: 1400 }}
        size="middle"
      />

      <Modal
        title={
          ratingSupplier
            ? `对「${ratingSupplier.name}」评分`
            : `批量评分（${selectedRowKeys.length} 家）`
        }
        open={rateModalOpen || batchRateOpen}
        onCancel={() => {
          setRateModalOpen(false);
          setBatchRateOpen(false);
          setRatingSupplier(null);
        }}
        onOk={submitRate}
        confirmLoading={submitting}
        okText="提交评分"
        destroyOnHidden
      >
        <Form form={rateForm} layout="vertical" style={{ marginTop: 12 }}>
          <Form.Item
            name="overallScore"
            label="综合评分"
            rules={[{ required: true, message: '请评分' }]}
          >
            <Rate allowHalf style={{ fontSize: 24 }} />
          </Form.Item>
          <Form.Item
            name="onTimeScore"
            label="准时性"
            rules={[{ required: true, message: '请评分' }]}
          >
            <Rate allowHalf />
          </Form.Item>
          <Form.Item
            name="qualityScore"
            label="质量"
            rules={[{ required: true, message: '请评分' }]}
          >
            <Rate allowHalf />
          </Form.Item>
          <Form.Item
            name="quantityScore"
            label="数量准确性"
            rules={[{ required: true, message: '请评分' }]}
          >
            <Rate allowHalf />
          </Form.Item>
          <Form.Item
            name="docScore"
            label="单据规范"
            rules={[{ required: true, message: '请评分' }]}
          >
            <Rate allowHalf />
          </Form.Item>
          <Form.Item name="comment" label="评语">
            <Input.TextArea rows={3} placeholder="可选，填写评价内容" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
