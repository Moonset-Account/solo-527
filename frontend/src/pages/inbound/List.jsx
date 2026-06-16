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
} from 'antd';
import {
  PlusOutlined,
  ScanOutlined,
  ExportOutlined,
  ReloadOutlined,
  SearchOutlined,
  EyeOutlined,
  PlayCircleOutlined,
  CheckCircleOutlined,
  StopOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { inboundApi, supplierApi, exportApi } from '@/api/index.js';
import StatusTag from '@/components/StatusTag';
import { fmtNum, fmtDateTime, parsePagination } from '@/utils/format';
import { INBOUND_STATUS } from '@/utils/constants';
import { useAppStore, useCanWrite } from '@/store';

const { Title } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

const TAB_KEYS = ['ALL', 'PENDING', 'QC_PENDING', 'QC_PASSED', 'COMPLETED', 'CANCELLED'];

const TAB_ITEMS = [
  { key: 'ALL', label: '全部' },
  { key: 'PENDING', label: '待收货' },
  { key: 'QC_PENDING', label: '待质检' },
  { key: 'QC_PASSED', label: '质检通过' },
  { key: 'COMPLETED', label: '已完成' },
  { key: 'CANCELLED', label: '已取消' },
];

export default function InboundList() {
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
  const [form] = Form.useForm();

  const fetchSuppliers = async () => {
    try {
      const res = await supplierApi.list({ page: 1, pageSize: 100 });
      setSuppliers(res.data?.list || res.data?.records || []);
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
      const res = await inboundApi.list(params);
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
      await exportApi.inbound(params, `入库单_${Date.now()}.xlsx`);
      message.success('导出成功');
    } catch (e) {
      message.error(e?.message || '导出失败');
    }
  };

  const handleStartQC = async (record) => {
    modal.confirm({
      title: '确认开始质检',
      content: `确定要对入库单 ${record.orderNo} 开始质检吗？`,
      okText: '确认',
      cancelText: '取消',
      onOk: async () => {
        try {
          await inboundApi.setStatus(record.id, { status: 'QC_PENDING' });
          message.success('已开始质检');
          fetchData(pagination.current, pagination.pageSize, form.getFieldsValue());
        } catch (e) {
          message.error(e?.message || '操作失败');
        }
      },
    });
  };

  const handleComplete = async (record) => {
    modal.confirm({
      title: '确认完成入库',
      content: `确定要完成入库单 ${record.orderNo} 吗？`,
      okText: '确认',
      cancelText: '取消',
      onOk: async () => {
        try {
          await inboundApi.complete(record.id);
          message.success('入库已完成');
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
      content: `确定要取消入库单 ${record.orderNo} 吗？`,
      okText: '确认取消',
      cancelText: '返回',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await inboundApi.setStatus(record.id, { status: 'CANCELLED' });
          message.success('已取消');
          fetchData(pagination.current, pagination.pageSize, form.getFieldsValue());
        } catch (e) {
          message.error(e?.message || '操作失败');
        }
      },
    });
  };

  const columns = [
    {
      title: '入库单号',
      dataIndex: 'orderNo',
      key: 'orderNo',
      width: 160,
      fixed: 'left',
      render: (text, record) => (
        <a onClick={() => navigate(`/inbound-orders/${record.id}`)}>{text}</a>
      ),
    },
    {
      title: '关联PO',
      dataIndex: 'purchaseOrderNo',
      key: 'purchaseOrderNo',
      width: 140,
      render: (text) => text || '-',
    },
    {
      title: '供应商',
      dataIndex: 'supplierName',
      key: 'supplierName',
      width: 160,
      ellipsis: true,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => <StatusTag statusKey="INBOUND_STATUS" value={status} />,
    },
    {
      title: '到货时间',
      dataIndex: 'arrivalTime',
      key: 'arrivalTime',
      width: 160,
      render: (v) => fmtDateTime(v),
    },
    {
      title: '总量(kg)',
      dataIndex: 'totalQty',
      key: 'totalQty',
      width: 100,
      align: 'right',
      render: (v) => fmtNum(v, 2),
    },
    {
      title: '合格量',
      dataIndex: 'passedQty',
      key: 'passedQty',
      width: 100,
      align: 'right',
      render: (v) => <span style={{ color: '#52c41a' }}>{fmtNum(v, 2)}</span>,
    },
    {
      title: '不合格量',
      dataIndex: 'rejectedQty',
      key: 'rejectedQty',
      width: 100,
      align: 'right',
      render: (v) => <span style={{ color: '#ff4d4f' }}>{fmtNum(v, 2)}</span>,
    },
    {
      title: '司机',
      dataIndex: 'driverName',
      key: 'driverName',
      width: 100,
      render: (v) => v || '-',
    },
    {
      title: '温度(°C)',
      dataIndex: 'temperature',
      key: 'temperature',
      width: 100,
      align: 'center',
      render: (v) => (v !== null && v !== undefined ? v : '-'),
    },
    {
      title: '创建人',
      dataIndex: 'creatorName',
      key: 'creatorName',
      width: 100,
      render: (v) => v || '-',
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
      render: (v) => fmtDateTime(v),
    },
    {
      title: '操作',
      key: 'action',
      width: 220,
      fixed: 'right',
      render: (_, record) => {
        const actions = [];
        actions.push(
          <Button
            key="view"
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/inbound-orders/${record.id}`)}
          >
            查看
          </Button>
        );
        if (canWrite) {
          if (record.status === 'PENDING') {
            actions.push(
              <Button
                key="qc"
                type="link"
                size="small"
                icon={<PlayCircleOutlined />}
                onClick={() => handleStartQC(record)}
              >
                开始质检
              </Button>
            );
          }
          if (record.status === 'QC_PASSED') {
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
          if (['PENDING', 'QC_PENDING'].includes(record.status)) {
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
        return <Space size={4}>{actions}</Space>;
      },
    },
  ];

  return (
    <div className="app-page">
      <div className="page-title">
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Title level={4} style={{ margin: 0 }}>
            入库单管理
          </Title>
          <span className="sub">生鲜收货质检入库</span>
        </div>
        <Space>
          {canWrite && (
            <>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => navigate('/inbound/scan')}
              >
                新建入库
              </Button>
              <Button
                icon={<ScanOutlined />}
                onClick={() => navigate('/inbound/scan')}
              >
                扫码入库
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
              placeholder="搜索单号/供应商"
              prefix={<SearchOutlined />}
              allowClear
              style={{ width: 200 }}
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
              {Object.entries(INBOUND_STATUS).map(([k, v]) => (
                <Option key={k} value={k}>
                  {v.label}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="purchaseOrderId" style={{ marginBottom: 8 }}>
            <Input placeholder="PO单号" allowClear style={{ width: 160 }} />
          </Form.Item>
          <Form.Item name="dateRange" style={{ marginBottom: 8 }}>
            <RangePicker style={{ width: 260 }} />
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
          scroll={{ x: 1400, y: 'calc(100vh - 380px)' }}
          locale={{
            emptyText: loading ? '' : <Empty description="暂无入库单" />,
          }}
          size="middle"
          rowClassName={() => 'row-hover'}
        />
      </Card>
    </div>
  );
}
