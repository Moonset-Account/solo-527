import React, { useState, useEffect } from 'react';
import {
  Card,
  Button,
  Input,
  Select,
  DatePicker,
  Table,
  Space,
  Tag,
  Empty,
  App as AntdApp,
  Typography,
  Form,
  Tabs,
  Badge,
  Avatar,
} from 'antd';
import {
  PlusOutlined,
  ExportOutlined,
  ReloadOutlined,
  SearchOutlined,
  EyeOutlined,
  EditOutlined,
  PlayCircleOutlined,
  CheckCircleOutlined,
  StopOutlined,
  RiseOutlined,
  MessageOutlined,
  UserOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { purchaseApi, supplierApi, exportApi, userApi } from '@/api/index.js';
import StatusTag from '@/components/StatusTag';
import {
  fmtNum,
  fmtMoney,
  fmtDateTime,
  fmtDate,
  parsePagination,
  priorityLabel,
} from '@/utils/format';
import {
  PURCHASE_STATUS,
  URGENT_LEVEL,
} from '@/utils/constants';
import { useAppStore, useCanWrite } from '@/store';

const { Title } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

const TAB_ITEMS = [
  { key: 'ALL', label: '全部' },
  { key: 'DRAFT', label: '草稿' },
  { key: 'PENDING_SUPPLIER', label: '待供应商' },
  { key: 'SUPPLIER_CONFIRMED', label: '已确认' },
  { key: 'PARTIAL_DELIVERED', label: '部分到货' },
  { key: 'FULLY_DELIVERED', label: '全部到货' },
  { key: 'COMPLETED', label: '已完成' },
  { key: 'CANCELLED', label: '已取消' },
];

export default function PurchaseList() {
  const { message, modal } = AntdApp.useApp();
  const navigate = useNavigate();
  const user = useAppStore((s) => s.user);
  const canWrite = useCanWrite(user);

  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0,
  });
  const [activeTab, setActiveTab] = useState('ALL');
  const [suppliers, setSuppliers] = useState([]);
  const [users, setUsers] = useState([]);
  const [form] = Form.useForm();

  const fetchSuppliers = async () => {
    try {
      const res = await supplierApi.list({ page: 1, pageSize: 100 });
      setSuppliers(res.data?.list || res.data?.records || []);
    } catch (e) {}
  };

  const fetchUsers = async () => {
    try {
      const res = await userApi.list({ page: 1, pageSize: 100 });
      setUsers(res.data?.list || res.data?.records || []);
    } catch (e) {}
  };

  const fetchData = async (page = 1, pageSize = 20, values = {}) => {
    setLoading(true);
    try {
      const params = {
        page,
        pageSize,
        ...values,
      };
      if (activeTab !== 'ALL') {
        params.status = activeTab;
      }
      if (values.dateRange && values.dateRange.length === 2) {
        params.startDate = values.dateRange[0]?.format('YYYY-MM-DD');
        params.endDate = values.dateRange[1]?.format('YYYY-MM-DD');
        delete params.dateRange;
      }
      const res = await purchaseApi.list(params);
      const list = res.data?.list || res.data?.records || [];
      setData(list);
      setPagination(parsePagination(res.data));
    } catch (e) {
      message.error(e?.message || '加载失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
    fetchUsers();
  }, []);

  useEffect(() => {
    fetchData(1, pagination.pageSize, form.getFieldsValue());
  }, [activeTab]);

  const handleTableChange = (pg) => {
    fetchData(pg.current, pg.pageSize, form.getFieldsValue());
  };

  const handleSearch = () => {
    const values = form.getFieldsValue();
    fetchData(1, pagination.pageSize, values);
  };

  const handleReset = () => {
    form.resetFields();
    fetchData(1, pagination.pageSize, {});
  };

  const handleTabChange = (key) => {
    setActiveTab(key);
  };

  const handleExport = async () => {
    try {
      const values = form.getFieldsValue();
      const params = { ...values };
      if (activeTab !== 'ALL') {
        params.status = activeTab;
      }
      if (values.dateRange && values.dateRange.length === 2) {
        params.startDate = values.dateRange[0]?.format('YYYY-MM-DD');
        params.endDate = values.dateRange[1]?.format('YYYY-MM-DD');
        delete params.dateRange;
      }
      await exportApi.purchase(params, `采购单_${Date.now()}.xlsx`);
      message.success('导出成功');
    } catch (e) {
      message.error(e?.message || '导出失败');
    }
  };

  const handleSubmit = async (record) => {
    modal.confirm({
      title: '确认提交',
      content: `确定要提交采购单 ${record.orderNo} 给供应商吗？`,
      okText: '确认提交',
      cancelText: '取消',
      onOk: async () => {
        try {
          await purchaseApi.submit(record.id);
          message.success('已提交');
          fetchData(pagination.current, pagination.pageSize, form.getFieldsValue());
        } catch (e) {
          message.error(e?.message || '操作失败');
        }
      },
    });
  };

  const handleConfirm = async (record) => {
    modal.confirm({
      title: '确认供应商已确认',
      content: `确定要将采购单 ${record.orderNo} 标记为供应商已确认吗？`,
      okText: '确认',
      cancelText: '取消',
      onOk: async () => {
        try {
          await purchaseApi.confirm(record.id);
          message.success('已确认');
          fetchData(pagination.current, pagination.pageSize, form.getFieldsValue());
        } catch (e) {
          message.error(e?.message || '操作失败');
        }
      },
    });
  };

  const handleComplete = async (record) => {
    modal.confirm({
      title: '确认完成',
      content: `确定要完成采购单 ${record.orderNo} 吗？`,
      okText: '确认',
      cancelText: '取消',
      onOk: async () => {
        try {
          await purchaseApi.setStatus(record.id, { status: 'COMPLETED' });
          message.success('已完成');
          fetchData(pagination.current, pagination.pageSize, form.getFieldsValue());
        } catch (e) {
          message.error(e?.message || '操作失败');
        }
      },
    });
  };

  const handleCancel = async (record) => {
    modal.confirm({
      title: '确认取消',
      content: `确定要取消采购单 ${record.orderNo} 吗？`,
      okText: '确认取消',
      cancelText: '返回',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await purchaseApi.cancel(record.id, { reason: '手动取消' });
          message.success('已取消');
          fetchData(pagination.current, pagination.pageSize, form.getFieldsValue());
        } catch (e) {
          message.error(e?.message || '操作失败');
        }
      },
    });
  };

  const handleGenerateFromRestock = () => {
    navigate('/restock');
    message.success('请在补货建议页面选择条目后生成采购单');
  };

  const columns = [
    {
      title: '订单号',
      dataIndex: 'orderNo',
      key: 'orderNo',
      width: 160,
      fixed: 'left',
      render: (text, record) => (
        <a onClick={() => navigate(`/purchase-orders/${record.id}`)}>{text}</a>
      ),
    },
    {
      title: '供应商',
      dataIndex: 'supplierName',
      key: 'supplierName',
      width: 180,
      ellipsis: true,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status) => <StatusTag statusKey="PURCHASE_STATUS" value={status} />,
    },
    {
      title: '紧急度',
      dataIndex: 'urgentLevel',
      key: 'urgentLevel',
      width: 100,
      render: (level) => {
        const cfg = URGENT_LEVEL[level] || URGENT_LEVEL[1];
        return <Tag color={cfg.color}>{cfg.label}</Tag>;
      },
    },
    {
      title: '总额',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      width: 120,
      align: 'right',
      render: (v) => <b>{fmtMoney(v)}</b>,
    },
    {
      title: '总量',
      dataIndex: 'totalQty',
      key: 'totalQty',
      width: 100,
      align: 'right',
      render: (v) => fmtNum(v, 2),
    },
    {
      title: '下单时间',
      dataIndex: 'orderTime',
      key: 'orderTime',
      width: 160,
      render: (v) => fmtDateTime(v) || '-',
    },
    {
      title: '要求到货',
      dataIndex: 'expectedDeliveryDate',
      key: 'expectedDeliveryDate',
      width: 120,
      render: (v) => fmtDate(v) || '-',
    },
    {
      title: '创建人',
      dataIndex: 'creatorName',
      key: 'creatorName',
      width: 100,
      render: (v) => v || '-',
    },
    {
      title: '负责人',
      dataIndex: 'assignedToName',
      key: 'assignedToName',
      width: 100,
      render: (v) => v || '-',
    },
    {
      title: '回复状态',
      dataIndex: 'replyStatus',
      key: 'replyStatus',
      width: 100,
      align: 'center',
      render: (_, record) => {
        const hasUnread = record.hasSupplierReply && !record.replyRead;
        return (
          <Badge
            status={hasUnread ? 'processing' : 'default'}
            text={
              <span style={{ color: hasUnread ? '#1677ff' : '#bfbfbf' }}>
                {record.replyCount || 0} 条
              </span>
            }
          />
        );
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 260,
      fixed: 'right',
      render: (_, record) => {
        const actions = [];
        actions.push(
          <Button
            key="view"
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/purchase-orders/${record.id}`)}
          >
            查看
          </Button>
        );
        if (canWrite) {
          if (record.status === 'DRAFT') {
            actions.push(
              <Button
                key="edit"
                type="link"
                size="small"
                icon={<EditOutlined />}
                onClick={() => navigate(`/purchase-orders/${record.id}/edit`)}
              >
                编辑
              </Button>
            );
            actions.push(
              <Button
                key="submit"
                type="link"
                size="small"
                icon={<PlayCircleOutlined />}
                onClick={() => handleSubmit(record)}
              >
                提交
              </Button>
            );
          }
          if (record.status === 'PENDING_SUPPLIER') {
            actions.push(
              <Button
                key="confirm"
                type="link"
                size="small"
                icon={<CheckCircleOutlined />}
                onClick={() => handleConfirm(record)}
              >
                供应商确认
              </Button>
            );
          }
          if (['SUPPLIER_CONFIRMED', 'PARTIAL_DELIVERED', 'FULLY_DELIVERED'].includes(record.status)) {
            actions.push(
              <Button
                key="complete"
                type="link"
                size="small"
                icon={<CheckCircleOutlined />}
                onClick={() => handleComplete(record)}
              >
                完成
              </Button>
            );
          }
          if (['DRAFT', 'PENDING_SUPPLIER'].includes(record.status)) {
            actions.push(
              <Button
                key="cancel"
                type="link"
                size="small"
                danger
                icon={<StopOutlined />}
                onClick={() => handleCancel(record)}
              >
                取消
              </Button>
            );
          }
        }
        return <Space size={4} wrap>{actions}</Space>;
      },
    },
  ];

  return (
    <div className="app-page">
      <div className="page-title">
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Title level={4} style={{ margin: 0 }}>
            采购订单
          </Title>
          <span className="sub">供应商采购协作</span>
        </div>
        <Space>
          {canWrite && (
            <>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => navigate('/purchase-orders/new')}
              >
                新增采购单
              </Button>
              <Button
                icon={<RiseOutlined />}
                onClick={handleGenerateFromRestock}
              >
                从补货建议生成
              </Button>
            </>
          )}
          <Button icon={<ExportOutlined />} onClick={handleExport}>
            导出
          </Button>
        </Space>
      </div>

      <div className="filter-card">
        <Form
          form={form}
          layout="inline"
          onFinish={handleSearch}
          style={{ flexWrap: 'wrap', gap: 10 }}
        >
          <Form.Item name="keyword" style={{ marginBottom: 8 }}>
            <Input
              placeholder="搜索单号/供应商/商品"
              prefix={<SearchOutlined />}
              allowClear
              style={{ width: 220 }}
            />
          </Form.Item>
          <Form.Item name="supplierId" style={{ marginBottom: 8 }}>
            <Select
              placeholder="供应商"
              allowClear
              style={{ width: 160 }}
              showSearch
              optionFilterProp="children"
            >
              {suppliers.map((s) => (
                <Option key={s.id} value={s.id}>
                  {s.name}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="status" style={{ marginBottom: 8 }}>
            <Select placeholder="状态" allowClear style={{ width: 140 }}>
              {Object.entries(PURCHASE_STATUS).map(([k, v]) => (
                <Option key={k} value={k}>
                  {v.label}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="urgentLevel" style={{ marginBottom: 8 }}>
            <Select placeholder="紧急度" allowClear style={{ width: 120 }}>
              {Object.entries(URGENT_LEVEL).map(([k, v]) => (
                <Option key={k} value={k}>
                  {v.label}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="dateRange" style={{ marginBottom: 8 }}>
            <RangePicker style={{ width: 260 }} />
          </Form.Item>
          <Form.Item name="assignedToId" style={{ marginBottom: 8 }}>
            <Select
              placeholder="负责人"
              allowClear
              style={{ width: 140 }}
              showSearch
              optionFilterProp="children"
            >
              {users.map((u) => (
                <Option key={u.id} value={u.id}>
                  {u.name || u.username}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item style={{ marginBottom: 8 }}>
            <Space>
              <Button type="primary" htmlType="submit">
                查询
              </Button>
              <Button onClick={handleReset} icon={<ReloadOutlined />}>
                重置
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </div>

      <Card
        style={{ padding: 0 }}
        bodyStyle={{ padding: '0 16px' }}
        styles={{ body: { padding: 0 } }}
      >
        <Tabs
          activeKey={activeTab}
          onChange={handleTabChange}
          items={TAB_ITEMS}
          style={{ marginBottom: 0 }}
        />
        <Table
          rowKey="id"
          loading={loading}
          dataSource={data}
          columns={columns}
          pagination={pagination}
          onChange={handleTableChange}
          scroll={{ x: 1600, y: 'calc(100vh - 400px)' }}
          locale={{
            emptyText: loading ? '' : <Empty description="暂无采购单" />,
          }}
          size="middle"
          rowClassName={() => 'row-hover'}
        />
      </Card>
    </div>
  );
}
