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
} from 'antd';
import {
  ExportOutlined,
  EyeOutlined,
  SearchOutlined,
  ReloadOutlined,
  WarningOutlined,
  BellOutlined,
  CheckCircleOutlined,
  SwapOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  AlertOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { batchApi, exportApi, exceptionApi } from '@/api/index.js';
import StatusTag from '@/components/StatusTag.jsx';
import {
  fmtNum,
  fmtDate,
  fmtDateTime,
  parsePagination,
  expiryTag,
  daysUntil,
} from '@/utils/format.js';
import { ROLE, hasRole } from '@/utils/auth.js';

const { Search } = Input;
const { Option } = Select;
const { TextArea } = Input;

const EXPIRE_GROUPS = [
  { key: 'expired', label: '已过期', days: -9999, color: 'red', icon: <WarningOutlined /> },
  { key: '1day', label: '1天内', days: 1, color: 'red', icon: <ExclamationCircleOutlined /> },
  { key: '7days', label: '7天内', days: 7, color: 'orange', icon: <AlertOutlined /> },
  { key: '15days', label: '15天内', days: 15, color: 'orange', icon: <ClockCircleOutlined /> },
  { key: '30days', label: '30天内', days: 30, color: 'blue', icon: <FileTextOutlined /> },
];

export default function NearExpiry() {
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
  const [supplierId, setSupplierId] = useState();
  const [productId, setProductId] = useState();
  const [activeGroup, setActiveGroup] = useState('7days');

  const [stats, setStats] = useState({
    expired: { count: 0, batches: 0 },
    '1day': { count: 0, batches: 0 },
    '7days': { count: 0, batches: 0 },
    '15days': { count: 0, batches: 0 },
    '30days': { count: 0, batches: 0 },
  });

  const [notifyModalOpen, setNotifyModalOpen] = useState(false);
  const [notifyRecord, setNotifyRecord] = useState(null);
  const [notifyForm] = Form.useForm();
  const [submittingNotify, setSubmittingNotify] = useState(false);

  const [exceptionModalOpen, setExceptionModalOpen] = useState(false);
  const [exceptionRecord, setExceptionRecord] = useState(null);
  const [exceptionForm] = Form.useForm();
  const [submittingException, setSubmittingException] = useState(false);

  const fetchStats = useCallback(async () => {
    try {
      const [nearRes, expiredRes] = await Promise.all([
        batchApi.nearExpiry({ pageSize: 1000 }),
        batchApi.expired({ pageSize: 1000 }),
      ]);
      const nearList = nearRes.data?.list || nearRes.data?.records || [];
      const expiredList = expiredRes.data?.list || expiredRes.data?.records || [];

      const calcStats = (list, maxDays) => {
        const filtered = list.filter((item) => {
          const days = daysUntil(item.expiryDate);
          return days !== null && days <= maxDays;
        });
        return {
          count: filtered.reduce((sum, item) => sum + (item.remaining || 0), 0),
          batches: filtered.length,
        };
      };

      setStats({
        expired: {
          count: expiredList.reduce((sum, item) => sum + (item.remaining || 0), 0),
          batches: expiredList.length,
        },
        '1day': calcStats(nearList, 1),
        '7days': calcStats(nearList, 7),
        '15days': calcStats(nearList, 15),
        '30days': calcStats(nearList, 30),
      });
    } catch (e) {}
  }, []);

  const fetchData = useCallback(
    async (page = 1, pageSize = 20) => {
      setLoading(true);
      try {
        const group = EXPIRE_GROUPS.find((g) => g.key === activeGroup);
        const params = {
          page,
          pageSize,
          keyword: keyword || undefined,
          supplierId: supplierId || undefined,
          productId: productId || undefined,
        };

        let res;
        if (activeGroup === 'expired') {
          res = await batchApi.expired(params);
        } else {
          params.days = group?.days || 30;
          res = await batchApi.nearExpiry(params);
        }

        const list = res.data?.list || res.data?.records || [];
        setData(list);
        setPagination(parsePagination(res.data));
      } catch (e) {
        message.error('加载失败');
      } finally {
        setLoading(false);
      }
    },
    [keyword, supplierId, productId, activeGroup, message]
  );

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    fetchData(pagination.current, pagination.pageSize);
  }, [fetchData]);

  const handleSearch = () => {
    setPagination((p) => ({ ...p, current: 1 }));
  };

  const handleReset = () => {
    setKeyword('');
    setSupplierId(undefined);
    setProductId(undefined);
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

  const handleGroupClick = (key) => {
    setActiveGroup(key);
    setPagination((p) => ({ ...p, current: 1 }));
  };

  const handleCreateException = (record) => {
    setExceptionRecord(record);
    exceptionForm.resetFields();
    exceptionForm.setFieldsValue({
      type: activeGroup === 'expired' ? 'EXPIRED' : 'NEAR_EXPIRY',
      priority: activeGroup === 'expired' ? 4 : 3,
    });
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
      fetchStats();
    } catch (e) {
      message.error('创建失败');
    } finally {
      setSubmittingException(false);
    }
  };

  const handleNotifySupplier = (record) => {
    setNotifyRecord(record);
    notifyForm.resetFields();
    setNotifyModalOpen(true);
  };

  const submitNotify = async () => {
    try {
      const values = await notifyForm.validateFields();
      setSubmittingNotify(true);
      message.success('通知已发送');
      setNotifyModalOpen(false);
    } catch (e) {
      message.error('发送失败');
    } finally {
      setSubmittingNotify(false);
    }
  };

  const handleMarkProcessed = (record) => {
    modal.confirm({
      title: '标记已处理',
      content: `确定要将批次「${record.batchNo}」标记为已处理吗？`,
      onOk: async () => {
        try {
          await batchApi.adjustStatus(record.id, {
            status: 'NEAR_EXPIRY',
            reason: '已处理临期提醒',
          });
          message.success('已标记为已处理');
          fetchData(pagination.current, pagination.pageSize);
          fetchStats();
        } catch (e) {
          message.error('操作失败');
        }
      },
    });
  };

  const handleTransfer = (record) => {
    message.info('调拨功能开发中...');
  };

  const handleExport = async () => {
    try {
      await exportApi.batches({
        keyword,
        supplierId,
        productId,
        nearExpiryOnly: true,
      });
      message.success('导出成功');
    } catch (e) {
      message.error('导出失败');
    }
  };

  const getDaysTag = (expiryDate) => {
    const days = daysUntil(expiryDate);
    if (days === null) return { label: '-', color: 'default' };
    if (days < 0) return { label: `已过期${Math.abs(days)}天`, color: 'red' };
    if (days === 0) return { label: '今日到期', color: 'red' };
    if (days <= 1) return { label: `${days}天`, color: 'red' };
    if (days <= 7) return { label: `${days}天`, color: 'orange' };
    if (days <= 15) return { label: `${days}天`, color: 'gold' };
    return { label: `${days}天`, color: 'blue' };
  };

  const columns = [
    {
      title: '批次号',
      dataIndex: 'batchNo',
      width: 160,
      fixed: 'left',
      render: (text, record) => (
        <a onClick={() => navigate(`/inventory/batches/${record.id}`)} style={{ fontWeight: 500 }}>
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
      width: 160,
      render: (text) => text || '-',
    },
    {
      title: '供应商',
      dataIndex: 'supplierName',
      width: 140,
      render: (text) => text || '-',
    },
    {
      title: '剩余数量',
      dataIndex: 'remaining',
      width: 110,
      render: (v) => <span style={{ fontWeight: 500 }}>{fmtNum(v)}</span>,
    },
    {
      title: '到期日',
      dataIndex: 'expiryDate',
      width: 120,
      render: (v) => fmtDate(v),
    },
    {
      title: '剩余天数',
      dataIndex: 'expiryDate',
      width: 120,
      render: (v) => {
        const tag = getDaysTag(v);
        return <Tag color={tag.color} style={{ fontWeight: 600 }}>{tag.label}</Tag>;
      },
    },
    {
      title: '入库时间',
      dataIndex: 'inboundDate',
      width: 150,
      render: (v) => fmtDateTime(v),
    },
    {
      title: '关联PO',
      dataIndex: 'purchaseOrderCode',
      width: 130,
      render: (text, record) =>
        text ? (
          <a onClick={() => navigate(`/purchase-orders/${record.purchaseOrderId}`)}>
            {text}
          </a>
        ) : (
          '-'
        ),
    },
    {
      title: '操作',
      key: 'actions',
      width: 260,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="创建异常">
            <Button
              type="link"
              size="small"
              icon={<WarningOutlined />}
              onClick={() => handleCreateException(record)}
            >
              异常
            </Button>
          </Tooltip>
          <Tooltip title="通知供应商">
            <Button
              type="link"
              size="small"
              icon={<BellOutlined />}
              onClick={() => handleNotifySupplier(record)}
            >
              通知
            </Button>
          </Tooltip>
          <Tooltip title="标记已处理">
            <Button
              type="link"
              size="small"
              icon={<CheckCircleOutlined />}
              onClick={() => handleMarkProcessed(record)}
            >
              已处理
            </Button>
          </Tooltip>
          <Tooltip title="调拨">
            <Button
              type="link"
              size="small"
              icon={<SwapOutlined />}
              onClick={() => handleTransfer(record)}
            >
              调拨
            </Button>
          </Tooltip>
        </Space>
      ),
    },
  ];

  const activeGroupInfo = EXPIRE_GROUPS.find((g) => g.key === activeGroup);

  return (
    <div className="app-page">
      <div className="page-title">
        <div>
          <h2 style={{ marginBottom: 4 }}>效期预警</h2>
          <div className="sub">按剩余天数分组，快速处理临期商品</div>
        </div>
      </div>

      <div className="stat-cards" style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}>
        {EXPIRE_GROUPS.map((group) => {
          const isActive = activeGroup === group.key;
          const stat = stats[group.key] || { count: 0, batches: 0 };
          return (
            <Card
              key={group.key}
              hoverable
              onClick={() => handleGroupClick(group.key)}
              style={{
                cursor: 'pointer',
                border: isActive ? `2px solid ${group.color === 'red' ? '#ff4d4f' : group.color === 'orange' ? '#fa8c16' : '#1677ff'}` : 'none',
                boxShadow: isActive ? '0 4px 12px rgba(0,0,0,0.1)' : '0 1px 3px rgba(0,0,0,0.04)',
              }}
              bodyStyle={{ padding: '14px 16px' }}
            >
              <div className="top">
                <div>
                  <div className="label" style={{ color: isActive ? group.color === 'red' ? '#ff4d4f' : group.color === 'orange' ? '#fa8c16' : '#1677ff' : '#8c8c8c' }}>
                    {group.label}
                  </div>
                  <div className="value" style={{ color: group.color === 'red' ? '#ff4d4f' : group.color === 'orange' ? '#fa8c16' : '#1677ff' }}>
                    {fmtNum(stat.count)}
                    <span className="unit">件</span>
                  </div>
                  <div style={{ fontSize: 12, color: '#8c8c8c' }}>
                    {stat.batches} 个批次
                  </div>
                </div>
                <div
                  className={`icon-box ${group.color}`}
                  style={{
                    background: group.color === 'red'
                      ? 'linear-gradient(135deg, #ff4d4f, #ffa39e)'
                      : group.color === 'orange'
                      ? 'linear-gradient(135deg, #fa8c16, #ffd591)'
                      : 'linear-gradient(135deg, #1677ff, #69b1ff)',
                  }}
                >
                  {group.icon}
                </div>
              </div>
            </Card>
          );
        })}
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
              style={{ width: 120 }}
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              onPressEnter={handleSearch}
            />
            <Input
              placeholder="供应商ID"
              allowClear
              style={{ width: 120 }}
              value={supplierId}
              onChange={(e) => setSupplierId(e.target.value)}
              onPressEnter={handleSearch}
            />
            <Tag color={activeGroupInfo?.color || 'blue'}>
              当前筛选：{activeGroupInfo?.label || '全部'}
            </Tag>
            <Button icon={<ReloadOutlined />} onClick={handleReset}>
              重置
            </Button>
          </Space>

          <Space>
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
        onChange={handleTableChange}
        scroll={{ x: 1500 }}
        size="middle"
      />

      <Modal
        title="创建异常工单"
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
          >
            <Select>
              <Option value="NEAR_EXPIRY">效期临近</Option>
              <Option value="EXPIRED">已过期</Option>
              <Option value="OTHER">其他</Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="priority"
            label="优先级"
            rules={[{ required: true, message: '请选择优先级' }]}
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

      <Modal
        title="通知供应商"
        open={notifyModalOpen}
        onCancel={() => setNotifyModalOpen(false)}
        onOk={submitNotify}
        confirmLoading={submittingNotify}
        okText="发送通知"
        destroyOnHidden
        width={480}
      >
        {notifyRecord && (
          <div style={{ marginBottom: 16, padding: 12, background: '#e6f4ff', borderRadius: 6 }}>
            <div style={{ color: '#8c8c8c', fontSize: 13, marginBottom: 4 }}>供应商</div>
            <div style={{ fontWeight: 500 }}>{notifyRecord.supplierName || '-'}</div>
            <div style={{ color: '#8c8c8c', fontSize: 12 }}>
              批次：{notifyRecord.batchNo}
            </div>
          </div>
        )}
        <Form form={notifyForm} layout="vertical">
          <Form.Item
            name="message"
            label="通知内容"
            rules={[{ required: true, message: '请输入通知内容' }]}
            initialValue="您好，您的货品即将到期，请及时处理。"
          >
            <TextArea rows={4} placeholder="请输入通知内容" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
